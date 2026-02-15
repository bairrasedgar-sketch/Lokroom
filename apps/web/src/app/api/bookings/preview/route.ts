// apps/web/src/app/api/bookings/preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { inferRegion, type Currency } from "@/lib/fees";
import { buildClientFeeBreakdown } from "@/lib/bookingFees";
import { requireAuth } from "@/lib/auth-helpers";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// 🔒 VALIDATION: Schéma Zod pour la preview de réservation
const bookingPreviewSchema = z.object({
  listingId: z.string().min(1, "listingId requis"),
  startDate: z.string().min(1, "startDate requis"),
  endDate: z.string().min(1, "endDate requis"),
});

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
  try {
    // 🔒 RATE LIMITING: 30 req/min pour éviter abus
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`booking-preview:${ip}`, 30, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives. Réessayez dans une minute." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // 🔒 PROTECTION: Vérifier authentification
    try {
      await requireAuth();
    } catch (error) {
      logger.warn("Unauthorized booking preview attempt", {
        ip,
        userAgent: req.headers.get("user-agent"),
      });
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    // 🔒 VALIDATION: Valider les inputs avec Zod
    let body: z.infer<typeof bookingPreviewSchema>;
    try {
      body = bookingPreviewSchema.parse(await req.json());
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }

    const { listingId, startDate, endDate } = body;

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
  } catch (error) {
    logger.error("POST /api/bookings/preview error", { error });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
