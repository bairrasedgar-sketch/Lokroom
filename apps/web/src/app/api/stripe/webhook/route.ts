// apps/web/src/app/api/stripe/webhook/route.ts
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
    const raw = await req.text();
    event = stripe.webhooks.constructEvent(raw, sig, whsec);
  } catch (e: unknown) {
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as { message?: unknown }).message)
        : "unknown_error";

    console.error("Stripe webhook signature error:", msg);

    return NextResponse.json(
      { error: `invalid_signature: ${msg}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // ------------------------------------
      // 💳 PAYMENT INTENT SUCCEEDED
      // ------------------------------------
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent & {
          charges?: { data: Stripe.Charge[] };
        };

        const md = (pi.metadata ?? {}) as Record<string, string>;
        const bookingId = md.bookingId;
        const hostUserId = md.hostUserId;

        if (!bookingId || !hostUserId) {
          // pas assez d’infos → on ignore l’event
          break;
        }

        await prisma.$transaction(async (tx) => {
          const booking = await tx.booking.findUnique({
            where: { id: bookingId },
            select: {
              id: true,
              totalPrice: true,
              currency: true,
              status: true,
              stripePaymentIntentId: true,
              stripeChargeId: true,

              hostFeeCents: true,
              guestFeeCents: true,
              taxOnGuestFeeCents: true,
              stripeFeeEstimateCents: true,
            },
          });

          if (!booking) return;

          const alreadyConfirmed =
            booking.status === "CONFIRMED" &&
            !!booking.stripePaymentIntentId &&
            !!booking.stripeChargeId;

          const latestCharge =
            pi.charges?.data?.[pi.charges.data.length - 1] ?? null;
          const stripeChargeId = latestCharge?.id ?? booking.stripeChargeId ?? null;

          // idempotent : si déjà confirmé → on met juste à jour les IDs
          if (alreadyConfirmed) {
            await tx.booking.update({
              where: { id: bookingId },
              data: {
                stripePaymentIntentId: booking.stripePaymentIntentId ?? pi.id,
                stripeChargeId,
              },
            });
            return;
          }

          const priceCents = Math.round(booking.totalPrice * 100);

          const hostFeeFromDb = booking.hostFeeCents ?? 0;
          const hostFeeFromMeta = Number(md.fee_host_cents || "0");
          const hostFeeCents =
            hostFeeFromDb > 0 ? hostFeeFromDb : hostFeeFromMeta;

          const payoutToHostCents = Math.max(0, priceCents - hostFeeCents);

          const guestFeeFromMeta = Number(md.fee_guest_cents || "0");
          const taxGuestFromMeta = Number(md.tax_guest_cents || "0");
          const stripeEstimateFromMeta = Number(
            md.stripe_fee_estimate_cents || "0"
          );

          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: "CONFIRMED",
              stripePaymentIntentId: pi.id,
              stripeChargeId,
              hostFeeCents: booking.hostFeeCents ?? hostFeeCents,
              guestFeeCents: booking.guestFeeCents ?? guestFeeFromMeta,
              taxOnGuestFeeCents:
                booking.taxOnGuestFeeCents ?? taxGuestFromMeta,
              stripeFeeEstimateCents:
                booking.stripeFeeEstimateCents ?? stripeEstimateFromMeta,
            },
          });

          if (payoutToHostCents > 0) {
            await tx.wallet.upsert({
              where: { hostId: hostUserId },
              update: {
                balanceCents: { increment: payoutToHostCents },
              },
              create: {
                hostId: hostUserId,
                balanceCents: payoutToHostCents,
              },
            });

            await tx.walletLedger.create({
              data: {
                hostId: hostUserId,
                deltaCents: payoutToHostCents,
                reason: `booking_credit:${bookingId}`,
                bookingId,
              },
            });
          }
        });

        break;
      }

      // ------------------------------------
      // ♻️ CHARGE REFUNDED
      // ------------------------------------
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        const piIdRaw = charge.payment_intent;
        if (!piIdRaw) {
          break;
        }

        const paymentIntentId =
          typeof piIdRaw === "string" ? piIdRaw : piIdRaw.id;

        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        const md = (pi.metadata ?? {}) as Record<string, string>;

        const bookingId = md.bookingId;
        const hostUserId = md.hostUserId;

        if (!bookingId || !hostUserId) break;

        const refundedTotalCents = charge.amount_refunded ?? 0;

        await prisma.$transaction(async (tx) => {
          const booking = await tx.booking.findUnique({
            where: { id: bookingId },
            select: {
              id: true,
              totalPrice: true,
              refundAmountCents: true,
              status: true,
              cancelledAt: true,
            },
          });

          if (!booking) return;

          const priceCents = Math.round(booking.totalPrice * 100);
          const alreadyRecorded = booking.refundAmountCents ?? 0;

          const newRefundPart = Math.max(
            0,
            refundedTotalCents - alreadyRecorded
          );

          if (newRefundPart <= 0) {
            await tx.booking.update({
              where: { id: bookingId },
              data: {
                refundAmountCents: refundedTotalCents,
              },
            });
            return;
          }

          const hostFeeCents = Number(md.fee_host_cents || "0");
          const hostShareCents = Math.max(0, priceCents - hostFeeCents);

          const proportionalHostDebit =
            priceCents > 0
              ? Math.round((hostShareCents * newRefundPart) / priceCents)
              : 0;

          let appliedHostDebit = 0;

          if (proportionalHostDebit > 0) {
            const wallet = await tx.wallet.findUnique({
              where: { hostId: hostUserId },
              select: { balanceCents: true },
            });

            if (wallet && wallet.balanceCents > 0) {
              appliedHostDebit = Math.min(
                wallet.balanceCents,
                proportionalHostDebit
              );

              if (appliedHostDebit > 0) {
                await tx.wallet.update({
                  where: { hostId: hostUserId },
                  data: {
                    balanceCents: {
                      decrement: appliedHostDebit,
                    },
                  },
                });

                await tx.walletLedger.create({
                  data: {
                    hostId: hostUserId,
                    deltaCents: -appliedHostDebit,
                    reason: `refund_booking:${bookingId}`,
                    bookingId,
                  },
                });
              }
            }
          }

          const isFullyRefunded = refundedTotalCents >= priceCents;

          await tx.booking.update({
            where: { id: bookingId },
            data: {
              refundAmountCents: refundedTotalCents,
              status: isFullyRefunded ? "CANCELLED" : booking.status,
              cancelledAt: isFullyRefunded
                ? booking.cancelledAt ?? new Date()
                : booking.cancelledAt,
            },
          });
        });

        break;
      }

      // ------------------------------------
      // 🧾 ACCOUNT / KYC EVENTS
      // ------------------------------------
      case "account.updated":
      case "account.external_account.created":
      case "account.external_account.updated": {
        const acc = event.data.object as Stripe.Account;
        const currently_due = acc.requirements?.currently_due ?? [];

        const kycStatus =
          currently_due.length === 0 ? "complete" : "incomplete";
        const payoutsEnabled = acc.payouts_enabled === true;

        await prisma.hostProfile.updateMany({
          where: { stripeAccountId: acc.id },
          data: { kycStatus, payoutsEnabled },
        });
        break;
      }

      default:
        // on ignore les autres events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("webhook error:", e);
    return NextResponse.json({ error: "webhook_failed" }, { status: 500 });
  }
}
