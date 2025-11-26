// apps/web/src/app/api/bookings/refund/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/api-auth";
import { evaluateCancellationPolicy } from "@/lib/cancellation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/bookings/refund
 *
 * Body JSON :
 * {
 *   "bookingId": string,
 *   "reason"?: string
 * }
 *
 * ➜ Annulation d’une réservation PAYÉE (status CONFIRMED).
 *   - Vérifie que l’utilisateur est bien guest ou host
 *   - Applique la politique d’annulation Lok'Room
 *   - Crée un refund Stripe (partiel ou total)
 *   - Marque qui a annulé + date d’annulation
 *   - Le webhook `charge.refunded` s’occupe d’ajuster :
 *       - refundAmountCents
 *       - status (CANCELLED si full refund)
 *       - wallet host / ledger
 */
export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        bookingId?: string;
        reason?: string;
      }
    | null;

  if (!body?.bookingId) {
    return NextResponse.json(
      { error: "MISSING_BOOKING_ID" },
      { status: 400 },
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: body.bookingId },
    include: {
      listing: {
        select: { ownerId: true },
      },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "BOOKING_NOT_FOUND" },
      { status: 404 },
    );
  }

  const isGuest = booking.guestId === me.id;
  const isHost = booking.listing.ownerId === me.id;

  if (!isGuest && !isHost) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (booking.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: "BOOKING_NOT_CONFIRMED" },
      { status: 400 },
    );
  }

  if (!booking.stripePaymentIntentId) {
    return NextResponse.json(
      { error: "NO_PAYMENT_INTENT" },
      { status: 400 },
    );
  }

  const priceCents = Math.round(booking.totalPrice * 100);
  const alreadyRefunded = booking.refundAmountCents ?? 0;

  // Full refund déjà fait ?
  if (alreadyRefunded >= priceCents && priceCents > 0) {
    return NextResponse.json(
      { error: "ALREADY_REFUNDED" },
      { status: 400 },
    );
  }

  // Rôle (impacte la politique d’annulation)
  const role = isHost ? ("host" as const) : ("guest" as const);

  const now = new Date();

  const decision = evaluateCancellationPolicy({
    role,
    now,
    startDate: booking.startDate,
    totalPriceCents: priceCents,
  });

  if (!decision.allowed || decision.refundAmountCents <= 0) {
    return NextResponse.json(
      {
        error: "cancellation_not_allowed",
        reasonCode: decision.reasonCode,
        message: decision.message,
      },
      { status: 400 },
    );
  }

  const reason = body.reason ?? "";

  // On récupère le PaymentIntent directement par son ID (plus propre que la Search API)
  const pi = await stripe.paymentIntents.retrieve(
    booking.stripePaymentIntentId,
  );

  const totalChargeCents =
    typeof pi.amount === "number" ? pi.amount : decision.refundAmountCents;

  // Ratio basé sur le prix de base (même logique que ton ancienne version)
  const priceBasedRatio =
    priceCents > 0 ? decision.refundAmountCents / priceCents : 1;

  // Montant théorique à rembourser sur le CHARGE (base + frais)
  const desiredRefundOnCharge = Math.round(totalChargeCents * priceBasedRatio);

  // On ne rembourse jamais plus que ce qui reste à rembourser
  const remainingRefundableOnCharge = Math.max(
    0,
    totalChargeCents - alreadyRefunded,
  );

  const amountToRefund = Math.max(
    1,
    Math.min(desiredRefundOnCharge, remainingRefundableOnCharge),
  );

  if (amountToRefund <= 0) {
    return NextResponse.json(
      { error: "NOTHING_TO_REFUND" },
      { status: 400 },
    );
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: pi.id,
      amount: amountToRefund,
      reason: "requested_by_customer",
      metadata: {
        bookingId: booking.id,
        requestedBy: role,
        userId: me.id,
        policyCode: decision.reasonCode,
        refundRatio: priceBasedRatio.toString(),
        customReason: reason,
      },
    });

    // On marque qui a demandé l’annulation + date
    const cancelAt = booking.cancelledAt ?? now;
    const cancelBy = booking.cancelledByUserId ?? me.id;

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        cancelledAt: cancelAt,
        cancelledByUserId: cancelBy,
      },
    });

    // Le webhook `charge.refunded` fera le reste (status + wallet…)
    return NextResponse.json({
      refundId: refund.id,
      status: refund.status,
      policy: {
        role,
        reasonCode: decision.reasonCode,
        message: decision.message,
        refundRatio: priceBasedRatio,
        refundAmountCents: amountToRefund,
      },
    });
  } catch (e: any) {
    const msg = e?.raw?.message || e?.message || "refund_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
