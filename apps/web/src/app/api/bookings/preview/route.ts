// apps/web/src/app/api/bookings/preview/route.ts
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { inferRegion, type Currency } from "@/lib/fees";
import { buildClientFeeBreakdown } from "@/lib/bookingFees";
import { requireAuth } from "@/lib/auth-helpers";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings/preview
 *
 * Body JSON :
 * {
 *   "listingId": string,
 *   "startDate": string (ISO ou "YYYY-MM-DD"),
 *   "endDate":   string (ISO ou "YYYY-MM-DD")
 * }
 *
 * → ne crée PAS de réservation.
 * → renvoie juste le détail des prix (base + frais + taxes + total)
 *   pour afficher dans le checkout façon Airbnb.
 *
 * 🔒 PROTECTION: Requiert authentification pour éviter abus/scraping
 */
export async function POST(req: NextRequest) {
  // 🔒 PROTECTION: Vérifier authentification
  try {
    await requireAuth();
  } catch (error) {
    logger.warn("Unauthorized booking preview attempt", {
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      userAgent: req.headers.get("user-agent"),
    });
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Authentication required" },
      { status: 401 }
    );
  }
  let body: {
    listingId?: string;
    startDate?: string;
    endDate?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { listingId, startDate, endDate } = body;

  if (!listingId || !startDate || !endDate) {
    return NextResponse.json(
      { error: "MISSING_FIELDS", details: "listingId, startDate, endDate" },
      { status: 400 },
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "INVALID_DATES" }, { status: 400 });
  }

  if (end <= start) {
    return NextResponse.json(
      { error: "END_BEFORE_START" },
      { status: 400 },
    );
  }

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const nights = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / MS_PER_DAY),
  );

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      price: true,
      currency: true,
      country: true,
      province: true,
    },
  });

  if (!listing) {
    return NextResponse.json(
      { error: "LISTING_NOT_FOUND" },
      { status: 404 },
    );
  }

  const currency = listing.currency as Currency;

  const region = inferRegion({
    currency,
    country: listing.country,
    provinceCode: listing.province,
  });

  const breakdown = buildClientFeeBreakdown({
    nights,
    pricePerNight: listing.price,
    currency,
    region,
  });

  // On ne renvoie que la partie attendue par BookingForm
  return NextResponse.json({
    listing: {
      id: listing.id,
      title: listing.title,
      pricePerNight: listing.price,
      currency: listing.currency,
    },
    nights,
    // on renvoie les strings brutes reçues (plus simple pour le front)
    checkIn: startDate,
    checkOut: endDate,
    breakdown: {
      currency: breakdown.currency,
      nights: breakdown.nights,
      basePriceCents: breakdown.basePriceCents,
      lines: breakdown.lines,
    },
  });
}
