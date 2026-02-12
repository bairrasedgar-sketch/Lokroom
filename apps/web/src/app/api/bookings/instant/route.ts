// apps/web/src/app/api/bookings/instant/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyFeesToBooking } from "@/lib/bookingFees";
import { logger } from "@/lib/logger";
import {
  checkInstantBookEligibility,
  processInstantBooking,
  sendInstantBookNotifications,
} from "@/lib/instant-book";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysDiff(d1: Date, d2: Date): number {
  const ms = d2.getTime() - d1.getTime();
  return Math.ceil(ms / MS_PER_DAY);
}

type BookingStatusLiteral = "PENDING" | "CONFIRMED" | "CANCELLED";

/**
 * POST /api/bookings/instant
 *
 * Crée une réservation instantanée (Instant Book).
 * La réservation est confirmée immédiatement si le guest est éligible.
 *
 * Body JSON:
 * {
 *   "listingId": string,
 *   "startDate": string (ISO ou "YYYY-MM-DD"),
 *   "endDate": string (ISO ou "YYYY-MM-DD"),
 *   "paymentMethodId": string (Stripe PaymentMethod ID)
 * }
 *
 * Flow:
 * 1. Vérifie l'auth et le KYC
 * 2. Vérifie l'éligibilité instant book
 * 3. Vérifie les disponibilités
 * 4. Crée la réservation avec statut CONFIRMED
 * 5. Crée le PaymentIntent Stripe
 * 6. Traite la réservation (conversation, message auto, blocage calendrier)
 * 7. Envoie les notifications
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, identityStatus: true, email: true, name: true },
  });

  if (!me) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  // Vérification KYC obligatoire
  if (me.identityStatus !== "VERIFIED") {
    return NextResponse.json(
      {
        error: "KYC_REQUIRED",
        message: "Vous devez vérifier votre identité avant de réserver.",
        identityStatus: me.identityStatus,
      },
      { status: 403 }
    );
  }

  // Parser le body
  let body: {
    listingId?: string;
    startDate?: string;
    endDate?: string;
    paymentMethodId?: string;
    guests?: number | { adults?: number; children?: number; infants?: number };
    pricingMode?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { listingId, startDate: startDateStr, endDate: endDateStr, paymentMethodId, guests, pricingMode: requestedPricingMode } = body;

  if (!listingId || !startDateStr || !endDateStr) {
    return NextResponse.json(
      { error: "MISSING_FIELDS", message: "listingId, startDate et endDate sont requis" },
      { status: 400 }
    );
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const nights = daysDiff(startDate, endDate);
  if (nights <= 0) {
    return NextResponse.json({ error: "INVALID_DATES" }, { status: 400 });
  }

  // Récupérer l'annonce
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      price: true,
      currency: true,
      ownerId: true,
      country: true,
      province: true,
      pricingMode: true,
      isInstantBook: true,
      instantBookSettings: true,
      // Contraintes de capacité et durée
      maxGuests: true,
      minNights: true,
      maxNights: true,
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "LISTING_NOT_FOUND" }, { status: 404 });
  }

  // Vérifier que l'annonce accepte instant book
  if (!listing.isInstantBook) {
    return NextResponse.json(
      { error: "INSTANT_BOOK_NOT_ENABLED", message: "Cette annonce n'accepte pas les réservations instantanées" },
      { status: 400 }
    );
  }

  // Empêcher de réserver sa propre annonce
  if (listing.ownerId === me.id) {
    return NextResponse.json(
      { error: "CANNOT_BOOK_OWN_LISTING" },
      { status: 400 }
    );
  }

  // Validation du nombre de voyageurs (si fourni et si le listing a une limite)
  const totalGuests = guests !== undefined
    ? (typeof guests === 'number' ? guests : (guests.adults || 0) + (guests.children || 0) + (guests.infants || 0))
    : 0;

  if (totalGuests > 0 && listing.maxGuests !== null && totalGuests > listing.maxGuests) {
    return NextResponse.json(
      {
        error: "GUESTS_EXCEED_CAPACITY",
        message: `Le nombre de voyageurs (${totalGuests}) dépasse la capacité maximale (${listing.maxGuests})`,
        maxGuests: listing.maxGuests,
        requestedGuests: totalGuests,
      },
      { status: 400 }
    );
  }

  // Validation du pricingMode (si fourni, doit correspondre au listing)
  // Le listing peut être DAILY, HOURLY ou BOTH
  // Si BOTH, on accepte DAILY ou HOURLY
  // Sinon, on doit matcher exactement
  if (requestedPricingMode) {
    const listingMode = listing.pricingMode;
    const isValidMode =
      listingMode === "BOTH" ||
      listingMode === requestedPricingMode;

    if (!isValidMode) {
      return NextResponse.json(
        {
          error: "INVALID_PRICING_MODE",
          message: `Le mode de tarification demandé (${requestedPricingMode}) ne correspond pas au listing (${listingMode})`,
          listingPricingMode: listingMode,
          requestedPricingMode,
        },
        { status: 400 }
      );
    }
  }

  // Validation du séjour minimum
  if (listing.minNights !== null && nights < listing.minNights) {
    return NextResponse.json(
      {
        error: "MINIMUM_STAY_NOT_MET",
        message: `Le séjour minimum est de ${listing.minNights} nuit(s), vous avez demandé ${nights} nuit(s)`,
        minimumStay: listing.minNights,
        requestedNights: nights,
      },
      { status: 400 }
    );
  }

  // Validation du séjour maximum
  if (listing.maxNights !== null && nights > listing.maxNights) {
    return NextResponse.json(
      {
        error: "MAXIMUM_STAY_EXCEEDED",
        message: `Le séjour maximum est de ${listing.maxNights} nuit(s), vous avez demandé ${nights} nuit(s)`,
        maximumStay: listing.maxNights,
        requestedNights: nights,
      },
      { status: 400 }
    );
  }

  // Vérifier l'éligibilité instant book
  const eligibility = await checkInstantBookEligibility(
    me.id,
    listingId,
    startDate,
    endDate
  );

  if (!eligibility.eligible) {
    return NextResponse.json(
      {
        error: "NOT_ELIGIBLE_FOR_INSTANT_BOOK",
        message: "Vous n'êtes pas éligible à la réservation instantanée",
        reasons: eligibility.reasons,
        criteria: eligibility.criteria,
      },
      { status: 403 }
    );
  }

  // Province obligatoire pour les listings CAD au Canada
  if (
    listing.currency === "CAD" &&
    (listing.country?.toLowerCase() === "canada" ||
      listing.country?.toLowerCase() === "ca") &&
    !listing.province
  ) {
    return NextResponse.json(
      { error: "PROVINCE_REQUIRED" },
      { status: 400 }
    );
  }

  // Calculer le prix total
  const totalPrice = listing.price * nights;

  // 🔒 SÉCURITÉ : Transaction atomique pour éviter les race conditions
  // Vérifie les chevauchements et crée la réservation de manière atomique
  let booking;
  try {
    booking = await prisma.$transaction(async (tx) => {
      // Vérifier les chevauchements dans la transaction
      const overlapping = await tx.booking.findFirst({
        where: {
          listingId: listing.id,
          status: { in: ["CONFIRMED", "PENDING"] as BookingStatusLiteral[] },
          startDate: { lt: endDate },
          endDate: { gt: startDate },
        },
        select: { id: true },
      });

      if (overlapping) {
        throw new Error("DATES_NOT_AVAILABLE");
      }

      // Créer la réservation avec statut PENDING (sera confirmée après paiement)
      return await tx.booking.create({
        data: {
          listingId: listing.id,
          guestId: me.id,
          startDate,
          endDate,
          totalPrice,
          currency: listing.currency,
          status: "PENDING", // Reste PENDING jusqu'au paiement réussi
          pricingMode: listing.pricingMode,
        },
        select: {
          id: true,
          listingId: true,
          guestId: true,
          startDate: true,
          endDate: true,
          totalPrice: true,
          currency: true,
          status: true,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DATES_NOT_AVAILABLE") {
      return NextResponse.json(
        { error: "DATES_NOT_AVAILABLE" },
        { status: 409 }
      );
    }
    throw error;
  }

  // Appliquer les frais Lok'Room
  const { fees, hostUserId } = await applyFeesToBooking(booking.id);

  // Créer le PaymentIntent Stripe si paymentMethodId fourni
  let paymentIntent: Stripe.PaymentIntent | null = null;
  let clientSecret: string | null = null;

  if (paymentMethodId) {
    try {
      // Calculer le montant total en centimes (base + frais guest)
      const totalAmountCents = Math.round(totalPrice * 100) + fees.guestFeeCents + fees.taxOnGuestFeeCents;

      paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmountCents,
        currency: listing.currency.toLowerCase(),
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        metadata: {
          bookingId: booking.id,
          listingId: listing.id,
          guestId: me.id,
          hostId: hostUserId,
          instantBook: "true",
        },
      });

      clientSecret = paymentIntent.client_secret;

      // Mettre à jour la réservation avec le PaymentIntent
      await prisma.booking.update({
        where: { id: booking.id },
        data: { stripePaymentIntentId: paymentIntent.id },
      });
    } catch (stripeError) {
      logger.error("[InstantBook] Stripe error:", stripeError);
      // Annuler la réservation si le paiement échoue
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json(
        {
          error: "PAYMENT_FAILED",
          message: stripeError instanceof Error ? stripeError.message : "Erreur de paiement",
        },
        { status: 400 }
      );
    }
  }

  // Traiter la réservation (conversation, message auto, blocage calendrier)
  // SEULEMENT si le paiement a été effectué avec succès
  let processResult: { success: boolean; conversation?: unknown; error?: string } = { success: false };

  if (paymentIntent && paymentIntent.status === "succeeded") {
    // Mettre à jour le statut à CONFIRMED après paiement réussi
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED" },
    });

    processResult = await processInstantBooking(booking.id);

    if (!processResult.success) {
      logger.error("[InstantBook] Process error:", processResult.error);
    }

    // Envoyer les notifications SEULEMENT après paiement réussi
    try {
      await sendInstantBookNotifications(booking.id);
    } catch (notifError) {
      logger.error("[InstantBook] Notification error:", notifError);
    }
  }

  return NextResponse.json({
    success: true,
    booking: {
      id: booking.id,
      status: booking.status,
      totalPrice: booking.totalPrice,
      currency: booking.currency,
      startDate: booking.startDate,
      endDate: booking.endDate,
    },
    fees,
    nights,
    hostUserId,
    conversation: processResult.conversation,
    payment: paymentIntent
      ? {
          id: paymentIntent.id,
          status: paymentIntent.status,
          clientSecret,
        }
      : null,
  });
}
