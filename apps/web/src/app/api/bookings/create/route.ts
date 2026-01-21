// apps/web/src/app/api/bookings/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyFeesToBooking } from "@/lib/bookingFees";
import { createBookingSchema, validateRequestBody } from "@/lib/validations";

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

  const { listingId, startDate, endDate } = validation.data;

  const start = new Date(startDate);
  const end = new Date(endDate);

  const nights = daysDiff(start, end);
  if (nights <= 0) {
    return NextResponse.json({ error: "INVALID_NIGHTS" }, { status: 400 });
  }

  // On récupère l’annonce
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      price: true,
      currency: true,
      ownerId: true,
      country: true,
      province: true,
      // 👇 IMPORTANT : on récupère aussi le pricingMode
      pricingMode: true,
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

  // Chevauchement (PENDING/CONFIRMED) sur cette annonce
  const overlapping = await prisma.booking.findFirst({
    where: {
      listingId: listing.id,
      status: { in: ["CONFIRMED", "PENDING"] as BookingStatusLiteral[] },
      startDate: { lt: end },
      endDate: { gt: start },
    },
    select: { id: true },
  });

  if (overlapping) {
    return NextResponse.json(
      { error: "DATES_NOT_AVAILABLE" },
      { status: 409 },
    );
  }

  // Prix total de la réservation (hors frais Lok'Room)
  const totalPrice = listing.price * nights;

  // Idempotence applicative : si on a déjà une PENDING identique, on la réutilise
  const existing = await prisma.booking.findFirst({
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

  const booking =
    existing ??
    (await prisma.booking.create({
      data: {
        listingId: listing.id,
        guestId: me.id,
        startDate: start,
        endDate: end,
        totalPrice,
        currency: listing.currency,
        status: "PENDING",
        // 👇 CHAMP MANQUANT QUI FAISAIT PLANTER LE BUILD
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
    }));

  // Applique les frais Lok'Room et met à jour la booking
  const { fees, hostUserId } = await applyFeesToBooking(booking.id);

  return NextResponse.json({
    booking,
    fees,
    hostUserId,
    nights,
  });
}
