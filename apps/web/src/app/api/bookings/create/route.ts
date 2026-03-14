// apps/web/src/app/api/bookings/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyFeesToBooking } from "@/lib/bookingFees";
import { createBookingSchema, validateRequestBody } from "@/lib/validations";
import { apiRateLimiter, withRateLimitAuth } from "@/lib/security/rate-limit";
import { captureException } from "@/lib/sentry/utils";

export const dynamic = "force-dynamic";

type BookingStatusLiteral = "PENDING" | "CONFIRMED" | "CANCELLED";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysDiff(d1: Date, d2: Date): number {
  const ms = d2.getTime() - d1.getTime();
  return Math.ceil(ms / MS_PER_DAY);
}

/**
 * POST /api/bookings/create
 *
 * Body JSON :
 * {
 *   "listingId": string,
 *   "startDate": string (ISO ou "YYYY-MM-DD"),
 *   "endDate":   string (ISO ou "YYYY-MM-DD")
 * }
 *
 * - Vérifie l'auth
 * - Vérifie que l'annonce existe
 * - Empêche de réserver sa propre annonce
 * - Vérifie la province pour les listings CA/CAD
 * - Vérifie les chevauchements de dates (PENDING + CONFIRMED)
 * - Calcule le nombre de nuits
 * - Calcule totalPrice = listing.price * nuits
 * - Crée la Booking (status PENDING) ou réutilise une PENDING identique
 * - Applique les frais Lok'Room (host/guest/taxes/stripe/platformNet)
 * - Retourne booking + fees + hostUserId + nights
 */
export async function POST(req: NextRequest) {
  // 🔒 SÉCURITÉ : Rate limiting avec user ID (impossible à contourner avec VPN)
  const rateLimitResult = await withRateLimitAuth(req, apiRateLimiter);
  if (rateLimitResult instanceof NextResponse) {
    return rateLimitResult;
  }

  // Récupérer la session (déjà récupérée par withRateLimitAuth, mais on la récupère à nouveau pour la validation)
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, identityStatus: true },
  });

  if (!me) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  // 🔐 SÉCURITÉ : Vérification KYC obligatoire pour créer une réservation
  if (me.identityStatus !== "VERIFIED") {
    return NextResponse.json(
      {
        error: "KYC_REQUIRED",
        message: "Vous devez vérifier votre identité avant de réserver. Rendez-vous dans les paramètres de votre compte.",
        identityStatus: me.identityStatus,
      },
      { status: 403 }
    );
  }

  // Validation Zod du body
  const validation = await validateRequestBody(req, createBookingSchema);
  if (!validation.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: validation.error },
      { status: validation.status },
    );
  }

  const { listingId, startDate, endDate, pricingMode: requestedPricingMode, guests } = validation.data;

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Vérifier que la date de début n'est pas dans le passé (comparaison en UTC)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startUTC = new Date(start);
  startUTC.setUTCHours(0, 0, 0, 0);

  if (startUTC < today) {
    return NextResponse.json({ error: "INVALID_DATES" }, { status: 400 });
  }

  const nights = daysDiff(start, end);
  if (nights <= 0) {
    return NextResponse.json({ error: "INVALID_NIGHTS" }, { status: 400 });
  }

  // On récupère l'annonce
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
      // 👇 IMPORTANT : on récupère aussi le pricingMode
      pricingMode: true,
      // 👇 Contraintes de capacité et durée
      maxGuests: true,
      minNights: true,
      maxNights: true,
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "LISTING_NOT_FOUND" }, { status: 404 });
  }

  // Empêcher de réserver sa propre annonce
  if (listing.ownerId === me.id) {
    return NextResponse.json(
      { error: "CANNOT_BOOK_OWN_LISTING" },
      { status: 400 },
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
      { status: 400 },
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
        { status: 400 },
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
      { status: 400 },
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
      { status: 400 },
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
      {
        error: "PROVINCE_REQUIRED",
        details:
          "Province is required for Canadian listings (QC/ON/BC/AB/NB/NS/NL/PE).",
      },
      { status: 400 },
    );
  }

  // Prix total de la réservation (hors frais Lok'Room)
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
          startDate: { lt: end },
          endDate: { gt: start },
        },
        select: { id: true },
      });

      if (overlapping) {
        throw new Error("DATES_NOT_AVAILABLE");
      }

      // Idempotence applicative : si on a déjà une PENDING identique, on la réutilise
      const existing = await tx.booking.findFirst({
        where: {
          guestId: me.id,
          listingId: listing.id,
          startDate: start,
          endDate: end,
          status: "PENDING",
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

      if (existing) {
        return existing;
      }

      // Créer la réservation dans la transaction
      return await tx.booking.create({
        data: {
          listingId: listing.id,
          guestId: me.id,
          startDate: start,
          endDate: end,
          totalPrice,
          currency: listing.currency,
          status: "PENDING",
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
        { status: 409 },
      );
    }
    throw error;
  }

  // Applique les frais Lok'Room et met à jour la booking
  try {
    const { fees, hostUserId } = await applyFeesToBooking(booking.id);

    return NextResponse.json({
      booking,
      fees,
      hostUserId,
      nights,
    });
  } catch (e) {
    captureException(e as Error, { route: "bookings/create", bookingId: booking.id });
    return NextResponse.json({ error: "FEES_CALCULATION_FAILED" }, { status: 500 });
  }
}
