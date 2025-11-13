import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !whsec) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const raw = await req.text(); // corps brut requis
    event = stripe.webhooks.constructEvent(raw, sig, whsec);
  } catch (e: any) {
    return NextResponse.json(
      { error: `invalid_signature: ${e.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const md = (pi.metadata ?? {}) as Record<string, string>;

        const bookingId  = md.bookingId;
        const hostUserId = md.hostUserId;

        if (!bookingId || !hostUserId) break;

        // On récupère le "price" (base) depuis la booking
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { totalPrice: true },
        });
        if (!booking) break;

        const priceCents  = Math.round(booking.totalPrice * 100);
        const hostFeeCents = Number(md.fee_host_cents || "0");
        const payoutToHostCents = Math.max(0, priceCents - hostFeeCents);

        // Confirme la booking
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "CONFIRMED" },
        });

        // Créditer le wallet hôte (payout = prix - hostFee)
        await prisma.$transaction(async (tx) => {
          await tx.wallet.upsert({
            where: { hostId: hostUserId },
            update: { balanceCents: { increment: payoutToHostCents } },
            create: { hostId: hostUserId, balanceCents: payoutToHostCents },
          });

          await tx.walletLedger.create({
            data: {
              hostId: hostUserId,
              deltaCents: payoutToHostCents,
              reason: `booking_credit:${bookingId}`,
              bookingId,
            },
          });
        });

        break;
      }

      case "account.updated":
      case "account.external_account.created":
      case "account.external_account.updated": {
        const acc = event.data.object as Stripe.Account;
        const currently_due = acc.requirements?.currently_due ?? [];
        const kycStatus = currently_due.length === 0 ? "complete" : "incomplete";
        const payoutsEnabled = acc.payouts_enabled === true;

        await prisma.hostProfile.updateMany({
          where: { stripeAccountId: acc.id },
          data: { kycStatus, payoutsEnabled },
        });
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("webhook error:", e);
    return NextResponse.json({ error: "webhook_failed" }, { status: 500 });
  }
}
