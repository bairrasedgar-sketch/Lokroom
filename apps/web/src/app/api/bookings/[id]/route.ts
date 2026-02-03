// apps/web/src/app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-auth";
import { jsonError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

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
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const me = await getCurrentUser();
  if (!me) {
    return jsonError("unauthorized", 401);
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
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
}

/**
 * PATCH /api/bookings/:id
 *
 * Body: { action: "cancel" }
 *
 * ➜ Utilisé pour annuler une réservation NON PAYÉE (PENDING).
 *    Pour une réservation CONFIRMED, il faut passer par
 *    POST /api/bookings/refund (règles d’annulation + remboursement Stripe).
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const me = await getCurrentUser();
  if (!me) {
    return jsonError("unauthorized", 401);
  }

  const body = (await req.json().catch(() => null)) as
    | { action?: string }
    | null;

  const action = body?.action;

  if (action !== "cancel") {
    return jsonError("Unsupported action", 400);
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
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
}
