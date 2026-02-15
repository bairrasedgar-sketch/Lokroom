// apps/web/src/app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-auth";
import { jsonError } from "@/lib/api-error";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// 🔒 VALIDATION: Schémas Zod
const bookingIdSchema = z.string().min(1, "bookingId requis");
const cancelActionSchema = z.object({
  action: z.literal("cancel"),
});

type RouteParams = {
  params: { id: string };
};

/**
 * GET /api/bookings/:id
 *
 * Renvoie une réservation :
 * - si je suis le guest (voyageur)
 * - ou si je suis l'hôte de l'annonce
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // 🔒 RATE LIMITING: 30 req/min
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`booking-get:${ip}`, 30, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const me = await getCurrentUser();
    if (!me) {
      return jsonError("unauthorized", 401);
    }

    // 🔒 VALIDATION: Valider le bookingId
    let bookingId: string;
    try {
      bookingId = bookingIdSchema.parse(params.id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", details: error.errors },
          { status: 400 }
        );
      }
      return jsonError("Invalid booking ID", 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            ownerId: true,
            city: true,
            country: true,
            addressFull: true,
            images: { select: { id: true, url: true }, take: 1, orderBy: { position: "asc" } },
            owner: {
              select: {
                id: true,
                name: true,
                profile: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        conversations: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!booking) {
      return jsonError("Booking not found", 404);
    }

    const isGuest = booking.guestId === me.id;
    const isHost = booking.listing.ownerId === me.id;

    if (!isGuest && !isHost) {
      return jsonError("Forbidden", 403);
    }

    return NextResponse.json({ booking });
  } catch (error) {
    logger.error("GET /api/bookings/[id] error", { error, bookingId: params.id });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings/:id
 *
 * Body: { action: "cancel" }
 *
 * ➜ Utilisé pour annuler une réservation NON PAYÉE (PENDING).
 *    Pour une réservation CONFIRMED, il faut passer par
 *    POST /api/bookings/refund (règles d'annulation + remboursement Stripe).
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    // 🔒 RATE LIMITING: 10 req/min pour les annulations
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`booking-cancel:${ip}`, 10, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const me = await getCurrentUser();
    if (!me) {
      return jsonError("unauthorized", 401);
    }

    // 🔒 VALIDATION: Valider le bookingId
    let bookingId: string;
    try {
      bookingId = bookingIdSchema.parse(params.id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", details: error.errors },
          { status: 400 }
        );
      }
      return jsonError("Invalid booking ID", 400);
    }

    // 🔒 VALIDATION: Valider le body
    let body: z.infer<typeof cancelActionSchema>;
    try {
      body = cancelActionSchema.parse(await req.json());
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", details: error.errors },
          { status: 400 }
        );
      }
      return jsonError("Invalid request body", 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          select: { id: true, ownerId: true },
        },
      },
    });

    if (!booking) {
      return jsonError("Booking not found", 404);
    }

    const isGuest = booking.guestId === me.id;
    const isHost = booking.listing.ownerId === me.id;

    if (!isGuest && !isHost) {
      return jsonError("Forbidden", 403);
    }

    if (booking.status === "CANCELLED") {
      return jsonError("Booking already cancelled", 400);
    }

    // 🔒 Si la réservation est confirmée (payée), on force à passer
    // par l'endpoint de refund (qui applique les règles + Stripe).
    if (booking.status === "CONFIRMED") {
      return jsonError(
        "booking_confirmed_use_refund_endpoint",
        400,
      );
    }

    // Règle simple : on interdit l'annulation si la réservation est déjà terminée
    const now = new Date();
    if (booking.endDate < now) {
      return jsonError("Cannot cancel a past booking", 400);
    }

    // Ici on considère surtout les bookings PENDING (non payées)
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({ booking: updated });
  } catch (error) {
    logger.error("PATCH /api/bookings/[id] error", { error, bookingId: params.id });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
