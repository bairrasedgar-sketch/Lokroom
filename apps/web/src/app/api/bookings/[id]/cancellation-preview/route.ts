// apps/web/src/app/api/bookings/[id]/cancellation-preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { evaluateCancellationPolicy } from "@/lib/cancellation";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: { id: string };
};

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true },
  });

  return user;
}

/**
 * GET /api/bookings/:id/cancellation-preview
 *
 * ➜ Ne fait AUCUNE action Stripe.
 *    Renvoie seulement :
 *    - si l'annulation est autorisée ou non
 *    - le ratio de remboursement
 *    - le montant remboursé / pénalité côté guest (en cents)
 *
 * Utilisation côté front :
 *   const res = await fetch(`/api/bookings/${bookingId}/cancellation-preview`);
 *   => afficher une modale "vous serez remboursé X €, frais Y €"
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          ownerId: true,
          currency: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isGuest = booking.guestId === me.id;
  const isHost = booking.listing.ownerId === me.id;

  if (!isGuest && !isHost) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Pour l’instant, on ne fait des refunds que pour les bookings payées
  if (booking.status !== "CONFIRMED") {
    return NextResponse.json(
      {
        error: "booking_not_confirmed",
        message:
          "Cette réservation n'est pas encore payée. L'annulation ne déclenchera pas de remboursement.",
        booking: {
          id: booking.id,
          status: booking.status,
        },
      },
      { status: 400 }
    );
  }

  const role = isHost ? "host" : ("guest" as const);
  const now = new Date();
  const totalPriceCents = Math.round(booking.totalPrice * 100);

  const decision = evaluateCancellationPolicy({
    role,
    now,
    startDate: booking.startDate,
    endDate: booking.endDate,
    totalPriceCents,
    currency: booking.currency,
  });

  return NextResponse.json({
    allowed: decision.allowed,
    role,
    booking: {
      id: booking.id,
      status: booking.status,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPriceCents,
      currency: booking.currency,
      listing: {
        id: booking.listing.id,
        title: booking.listing.title,
      },
    },
    policy: {
      reasonCode: decision.reasonCode,
      message: decision.message,
      refundRatio: decision.refundRatio, // 0..1
      refundAmountCents: decision.refundAmountCents,
      serviceFeeRetainedCents: decision.serviceFeeRetainedCents,
      hostPayoutCents: decision.hostPayoutCents,
      guestPenaltyCents: decision.guestPenaltyCents,
      policyType: decision.policyType,
    },
  });
}
