// apps/web/src/app/api/bookings/instant/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyFeesToBooking } from "@/lib/bookingFees";
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
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { listingId, startDate: startDateStr, endDate: endDateStr, paymentMethodId } = body;

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

  // Vérifier les chevauchements de dates
  const overlapping = await prisma.booking.findFirst({
    where: {
      listingId: listing.id,
      status: { in: ["CONFIRMED", "PENDING"] as BookingStatusLiteral[] },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
    select: { id: true },
  });

  if (overlapping) {
    return NextResponse.json(
      { error: "DATES_NOT_AVAILABLE" },
      { status: 409 }
    );
  }

  // Calculer le prix total
  const totalPrice = listing.price * nights;

  // Créer la réservation avec statut CONFIRMED directement
  const booking = await prisma.booking.create({
    data: {
      listingId: listing.id,
      guestId: me.id,
      startDate,
      endDate,
      totalPrice,
      currency: listing.currency,
      status: "CONFIRMED", // Instant book = confirmé immédiatement
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
      console.error("[InstantBook] Stripe error:", stripeError);
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
  const processResult = await processInstantBooking(booking.id);

  if (!processResult.success) {
    console.error("[InstantBook] Process error:", processResult.error);
    // La réservation est déjà créée, on continue quand même
  }

  // Envoyer les notifications
  try {
    await sendInstantBookNotifications(booking.id);
  } catch (notifError) {
    console.error("[InstantBook] Notification error:", notifError);
    // On ne bloque pas si les notifications échouent
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
