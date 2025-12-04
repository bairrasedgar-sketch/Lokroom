// apps/web/src/app/api/stripe/webhook/route.ts
/**
 * Webhook Stripe sécurisé avec :
 * - Vérification de signature
 * - Idempotence via base de données (protection contre les événements dupliqués)
 * - Validation des montants contre la base de données
 * - Logging sécurisé
 */
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { securityLog } from "@/lib/security";

export const dynamic = "force-dynamic";

// Map d'idempotence en mémoire (fallback si table StripeEvent n'existe pas)
// NOTE: Une fois la migration Prisma effectuée avec `npx prisma migrate dev`,
// ce fallback ne sera plus utilisé et l'idempotence sera persistée en BDD.
const processedEventsMemory = new Map<string, { processedAt: number }>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

// Nettoyage périodique de la map mémoire
setInterval(() => {
  const cutoff = Date.now() - IDEMPOTENCY_TTL_MS;
  for (const [key, value] of processedEventsMemory.entries()) {
    if (value.processedAt < cutoff) {
      processedEventsMemory.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Vérifie si un événement a déjà été traité (idempotence)
 * Essaie d'abord la BDD, puis fallback sur la mémoire
 */
async function checkAndMarkEventProcessed(eventId: string, eventType: string): Promise<boolean> {
  // Essai avec la table StripeEvent si elle existe
  try {
    await prisma.stripeEvent.create({
      data: {
        id: eventId,
        type: eventType,
      },
    });
    return false; // Événement pas encore traité
  } catch (error) {
    // Vérifier si c'est une violation de contrainte unique (événement déjà traité)
    if (
      error instanceof Error &&
      (error.message.includes("Unique constraint") ||
       error.message.includes("duplicate key"))
    ) {
      return true; // Déjà traité
    }

    // Si la table n'existe pas, fallback sur la mémoire
    if (
      error instanceof Error &&
      (error.message.includes("does not exist") ||
       error.message.includes("stripeEvent"))
    ) {
      // Fallback: utiliser la Map en mémoire
      if (processedEventsMemory.has(eventId)) {
        return true;
      }
      processedEventsMemory.set(eventId, { processedAt: Date.now() });
      return false;
    }

    // Autre erreur - on continue quand même (mieux traiter deux fois que pas du tout)
    console.warn("[Webhook] Erreur vérification idempotence:", error);
    return false;
  }
}

/**
 * Nettoyage périodique des événements anciens (plus de 7 jours)
 */
async function cleanupOldEvents(): Promise<void> {
  // 1% de chance de déclencher le nettoyage à chaque appel
  if (Math.random() > 0.01) return;

  try {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await prisma.stripeEvent.deleteMany({
      where: {
        processedAt: { lt: cutoffDate },
      },
    });
  } catch {
    // Ignore les erreurs de nettoyage (table peut ne pas exister)
  }
}

/**
 * Valide que le montant payé correspond au booking
 */
async function validatePaymentAmount(
  bookingId: string,
  amountPaidCents: number
): Promise<{ valid: boolean; expectedCents: number; booking: Prisma.BookingGetPayload<{ select: { id: true; totalPrice: true; guestFeeCents: true; currency: true } }> | null }> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      totalPrice: true,
      guestFeeCents: true,
      currency: true,
    },
  });

  if (!booking) {
    return { valid: false, expectedCents: 0, booking: null };
  }

  // Le montant attendu = prix total + frais guest
  const baseCents = Math.round(booking.totalPrice * 100);
  const guestFeeCents = booking.guestFeeCents ?? 0;
  const expectedCents = baseCents + guestFeeCents;

  // Tolérance de 1% pour les erreurs d'arrondi
  const tolerance = Math.max(1, Math.round(expectedCents * 0.01));
  const valid = Math.abs(amountPaidCents - expectedCents) <= tolerance;

  return { valid, expectedCents, booking };
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !whsec) {
    securityLog("security", "webhook_missing_signature");
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  let rawBody: string;

  try {
    rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, whsec);
  } catch (e: unknown) {
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as { message?: unknown }).message)
        : "unknown_error";

    securityLog("security", "webhook_invalid_signature", undefined, { error: msg });

    return NextResponse.json(
      { error: `invalid_signature: ${msg}` },
      { status: 400 }
    );
  }

  // Vérification d'idempotence via base de données
  const alreadyProcessed = await checkAndMarkEventProcessed(event.id, event.type);
  if (alreadyProcessed) {
    securityLog("info", "webhook_duplicate_event", undefined, { eventId: event.id });
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Nettoyage occasionnel des anciens événements
  void cleanupOldEvents();

  try {
    // ==========================================================
    // 1) Switch principal : paiements / remboursements / account
    // ==========================================================
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent & {
          charges?: { data: Stripe.Charge[] };
        };

        const md = (pi.metadata ?? {}) as Record<string, string>;
        const bookingId = md.bookingId;
        const hostUserId = md.hostUserId;

        if (!bookingId || !hostUserId) {
          securityLog("warn", "webhook_missing_metadata", undefined, {
            eventId: event.id,
            hasBookingId: !!bookingId,
            hasHostUserId: !!hostUserId,
          });
          break;
        }

        // SÉCURITÉ : Valider le montant payé contre la base de données
        const validation = await validatePaymentAmount(bookingId, pi.amount);
        if (!validation.valid) {
          securityLog("security", "webhook_amount_mismatch", undefined, {
            eventId: event.id,
            bookingId,
            paidCents: pi.amount,
            expectedCents: validation.expectedCents,
          });
          // On ne bloque pas le webhook mais on log l'alerte
          console.error(
            `[SECURITY ALERT] Payment amount mismatch for booking ${bookingId}: paid ${pi.amount}, expected ${validation.expectedCents}`
          );
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

          if (!booking) {
            securityLog("warn", "webhook_booking_not_found", undefined, {
              eventId: event.id,
              bookingId,
            });
            return;
          }

          // SÉCURITÉ : Vérification d'idempotence au niveau booking
          const alreadyConfirmed =
            booking.status === "CONFIRMED" &&
            !!booking.stripePaymentIntentId &&
            !!booking.stripeChargeId;

          const latestCharge =
            pi.charges?.data?.[pi.charges.data.length - 1] ?? null;
          const stripeChargeId =
            latestCharge?.id ?? booking.stripeChargeId ?? null;

          if (alreadyConfirmed) {
            // Booking déjà confirmée - mise à jour minimale seulement
            securityLog("info", "webhook_booking_already_confirmed", undefined, {
              eventId: event.id,
              bookingId,
            });
            await tx.booking.update({
              where: { id: bookingId },
              data: {
                stripePaymentIntentId: booking.stripePaymentIntentId ?? pi.id,
                stripeChargeId,
              },
            });
            return;
          }

          // SÉCURITÉ : Utiliser UNIQUEMENT les frais de la base de données
          // Ne jamais faire confiance aux metadata Stripe pour les montants critiques
          const priceCents = Math.round(booking.totalPrice * 100);
          const hostFeeCents = booking.hostFeeCents ?? 0;
          const payoutToHostCents = Math.max(0, priceCents - hostFeeCents);

          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: "CONFIRMED",
              stripePaymentIntentId: pi.id,
              stripeChargeId,
              // Ne pas écraser les frais existants avec les metadata
            },
          });

          // Crédit wallet hôte avec vérification
          if (payoutToHostCents > 0) {
            // Vérifier qu'on n'a pas déjà crédité pour ce booking
            const existingCredit = await tx.walletLedger.findFirst({
              where: {
                hostId: hostUserId,
                bookingId,
                reason: { startsWith: "booking_credit:" },
              },
            });

            if (existingCredit) {
              securityLog("warn", "webhook_duplicate_credit_attempt", undefined, {
                eventId: event.id,
                bookingId,
                hostUserId,
              });
              return;
            }

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

            securityLog("info", "webhook_host_credited", undefined, {
              eventId: event.id,
              bookingId,
              hostUserId,
              amountCents: payoutToHostCents,
            });
          }
        });

        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

        const piIdRaw = charge.payment_intent;
        if (!piIdRaw) break;

        const paymentIntentId =
          typeof piIdRaw === "string" ? piIdRaw : piIdRaw.id;

        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        const md = (pi.metadata ?? {}) as Record<string, string>;

        const bookingId = md.bookingId;
        const hostUserId = md.hostUserId;

        if (!bookingId || !hostUserId) {
          securityLog("warn", "refund_missing_metadata", undefined, {
            eventId: event.id,
            chargeId: charge.id,
          });
          break;
        }

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
              hostFeeCents: true, // SÉCURITÉ: Utiliser les frais de la BDD
            },
          });

          if (!booking) {
            securityLog("warn", "refund_booking_not_found", undefined, {
              eventId: event.id,
              bookingId,
            });
            return;
          }

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

          // SÉCURITÉ: Utiliser les frais de la BDD, pas des metadata
          const hostFeeCents = booking.hostFeeCents ?? 0;
          const hostShareCents = Math.max(0, priceCents - hostFeeCents);

          const proportionalHostDebit =
            priceCents > 0
              ? Math.round((hostShareCents * newRefundPart) / priceCents)
              : 0;

          let appliedHostDebit = 0;

          if (proportionalHostDebit > 0) {
            // Vérifier qu'on n'a pas déjà débité pour ce refund
            const existingDebit = await tx.walletLedger.findFirst({
              where: {
                hostId: hostUserId,
                bookingId,
                reason: { startsWith: "refund_booking:" },
                deltaCents: { lt: 0 },
              },
            });

            if (existingDebit) {
              securityLog("warn", "refund_duplicate_debit_attempt", undefined, {
                eventId: event.id,
                bookingId,
                hostUserId,
              });
            } else {
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

                  securityLog("info", "refund_host_debited", undefined, {
                    eventId: event.id,
                    bookingId,
                    hostUserId,
                    amountCents: appliedHostDebit,
                  });
                }
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

        const lokroomUserId =
          (acc.metadata?.lokroom_user_id as string | undefined) ?? undefined;

        const individual = acc.individual;

        if (lokroomUserId && individual) {
          const addr = individual.address;
          const dob = individual.dob;

          let birthDate: Date | null = null;
          if (dob?.day && dob?.month && dob?.year) {
            birthDate = new Date(Date.UTC(dob.year, dob.month - 1, dob.day));
          }

          await prisma.user.update({
            where: { id: lokroomUserId },
            data: {
              country: addr?.country ?? acc.country ?? null,
              profile: {
                upsert: {
                  create: {
                    firstName: individual.first_name ?? null,
                    lastName: individual.last_name ?? null,
                    phone: individual.phone ?? null,
                    birthDate,
                    addressLine1: addr?.line1 ?? null,
                    addressLine2: addr?.line2 ?? null,
                    city: addr?.city ?? null,
                    postalCode: addr?.postal_code ?? null,
                    country: addr?.country ?? acc.country ?? null,
                    province: addr?.state ?? null,
                  },
                  update: {
                    firstName: individual.first_name ?? undefined,
                    lastName: individual.last_name ?? undefined,
                    phone: individual.phone ?? undefined,
                    birthDate: birthDate ?? undefined,
                    addressLine1: addr?.line1 ?? undefined,
                    addressLine2: addr?.line2 ?? undefined,
                    city: addr?.city ?? undefined,
                    postalCode: addr?.postal_code ?? undefined,
                    country:
                      (addr?.country ?? acc.country) ?? undefined,
                    province: addr?.state ?? undefined,
                  },
                },
              },
            },
          });
        }

        break;
      }

      default:
        break;
    }

    // ==========================================================
    // 2) Stripe Identity – on sort du switch pour éviter les bugs TS
    // ==========================================================
    if (
      event.type === ("identity.verification_session.updated" as any)
    ) {
      const vs = (event as any)
        .data.object as Stripe.Identity.VerificationSession;

      const lokroomUserId =
        (vs.metadata?.lokroom_user_id as string | undefined) ?? undefined;

      let where: Prisma.UserWhereInput;

      if (lokroomUserId) {
        where = { id: lokroomUserId };
      } else {
        where = { identityStripeSessionId: vs.id ?? undefined } as any;
      }

      let newStatus:
        | "UNVERIFIED"
        | "PENDING"
        | "VERIFIED"
        | "REJECTED" = "PENDING";
      let verifiedAt: Date | null = null;

      switch (vs.status) {
        case "verified":
          newStatus = "VERIFIED";
          verifiedAt = new Date(
            ((vs.created ?? Math.floor(Date.now() / 1000)) as number) * 1000
          );
          break;
        case "canceled":
          newStatus = "REJECTED";
          break;
        case "processing":
        case "requires_input":
        default:
          newStatus = "PENDING";
          break;
      }

      await (prisma.user as any).updateMany({
        where,
        data: {
          identityStatus: newStatus,
          identityLastVerifiedAt: verifiedAt ?? undefined,
        },
      });
    }

    // L'événement a déjà été marqué comme traité en début de fonction
    return NextResponse.json({ received: true });
  } catch (e) {
    securityLog("error", "webhook_processing_error", undefined, {
      eventId: event?.id,
      error: e instanceof Error ? e.message : "unknown",
    });
    console.error("webhook error:", e);
    return NextResponse.json({ error: "webhook_failed" }, { status: 500 });
  }
}
