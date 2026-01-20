// apps/web/src/app/api/payments/paypal/webhook/route.ts
/**
 * Webhook PayPal pour recevoir les événements de paiement
 *
 * POST /api/payments/paypal/webhook
 *
 * Événements gérés:
 * - PAYMENT.CAPTURE.COMPLETED: Paiement capturé avec succès
 * - PAYMENT.CAPTURE.REFUNDED: Paiement remboursé
 * - PAYMENT.CAPTURE.DENIED: Paiement refusé
 * - CHECKOUT.ORDER.APPROVED: Commande approuvée par l'utilisateur
 */
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  verifyWebhookSignature,
  extractWebhookHeaders,
  isPayPalConfigured,
  type PayPalWebhookEvent,
} from "@/lib/paypal";
import { notifyBookingConfirmed, notifyBookingCancelled } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { securityLogger } from "@/lib/security-logger";

export const dynamic = "force-dynamic";

// Désactiver le parsing automatique du body pour pouvoir vérifier la signature
export const runtime = "nodejs";

/**
 * Vérifie si un événement a déjà été traité (idempotence)
 */
async function checkAndMarkEventProcessed(eventId: string, eventType: string): Promise<boolean> {
  try {
    await prisma.payPalEvent.create({
      data: {
        id: eventId,
        type: eventType,
      },
    });
    return false; // Événement pas encore traité
  } catch (error) {
    // Vérifier si c'est une violation de contrainte unique
    if (
      error instanceof Error &&
      (error.message.includes("Unique constraint") ||
        error.message.includes("duplicate key"))
    ) {
      return true; // Déjà traité
    }
    // Autre erreur - on continue quand même
    console.warn("[PayPal Webhook] Idempotence check error:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting: 100 webhooks par minute par IP
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
  const rateLimitKey = `webhook:paypal:${ip}`;
  const rateLimitResult = await rateLimit(rateLimitKey, 100, 60_000);

  if (!rateLimitResult.ok) {
    console.error("[PayPal Webhook] Rate limit exceeded", { ip });
    securityLogger.webhookRateLimit(ip, "/api/payments/paypal/webhook");
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  // Vérifier que PayPal est configuré
  if (!isPayPalConfigured()) {
    return NextResponse.json(
      { error: "paypal_not_configured" },
      { status: 503 }
    );
  }

  try {
    // Extraire les headers de webhook
    const webhookHeaders = extractWebhookHeaders(req.headers);
    if (!webhookHeaders) {
      console.error("[PayPal Webhook] Missing webhook headers");
      return NextResponse.json(
        { error: "missing_webhook_headers" },
        { status: 400 }
      );
    }

    // Lire le body brut
    const rawBody = await req.text();
    let event: PayPalWebhookEvent;

    try {
      event = JSON.parse(rawBody) as PayPalWebhookEvent;
    } catch {
      console.error("[PayPal Webhook] Invalid JSON body");
      return NextResponse.json(
        { error: "invalid_json" },
        { status: 400 }
      );
    }

    // Vérifier la signature du webhook (en production)
    if (process.env.NODE_ENV === "production" && process.env.PAYPAL_WEBHOOK_ID) {
      const isValid = await verifyWebhookSignature({
        ...webhookHeaders,
        webhookId: process.env.PAYPAL_WEBHOOK_ID,
        webhookEvent: event,
      });

      if (!isValid) {
        console.error("[PayPal Webhook] Invalid signature");
        return NextResponse.json(
          { error: "invalid_signature" },
          { status: 401 }
        );
      }
    }

    // Vérification d'idempotence
    const alreadyProcessed = await checkAndMarkEventProcessed(event.id, event.event_type);
    if (alreadyProcessed) {
      console.log("[PayPal Webhook] Duplicate event:", event.id);
      return NextResponse.json({ received: true, duplicate: true });
    }

    console.log("[PayPal Webhook] Processing event:", {
      id: event.id,
      type: event.event_type,
      resourceType: event.resource_type,
    });

    // Traiter l'événement selon son type
    switch (event.event_type) {
      case "PAYMENT.CAPTURE.COMPLETED": {
        await handleCaptureCompleted(event);
        break;
      }

      case "PAYMENT.CAPTURE.REFUNDED": {
        await handleCaptureRefunded(event);
        break;
      }

      case "PAYMENT.CAPTURE.DENIED": {
        await handleCaptureDenied(event);
        break;
      }

      case "CHECKOUT.ORDER.APPROVED": {
        // L'utilisateur a approuvé la commande - on peut capturer
        // Note: Généralement, la capture est faite côté client via l'API capture-order
        console.log("[PayPal Webhook] Order approved:", event.resource);
        break;
      }

      default:
        console.log("[PayPal Webhook] Unhandled event type:", event.event_type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PayPal Webhook] Error:", error);
    return NextResponse.json(
      { error: "webhook_processing_failed" },
      { status: 500 }
    );
  }
}

/**
 * Gère l'événement PAYMENT.CAPTURE.COMPLETED
 */
async function handleCaptureCompleted(event: PayPalWebhookEvent) {
  const resource = event.resource as {
    id: string;
    status: string;
    amount: { currency_code: string; value: string };
    custom_id?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
  };

  const captureId = resource.id;
  const orderId = resource.supplementary_data?.related_ids?.order_id;
  const bookingId = resource.custom_id;

  console.log("[PayPal Webhook] Capture completed:", {
    captureId,
    orderId,
    bookingId,
    amount: resource.amount,
  });

  // Trouver la transaction par orderId ou bookingId
  let transaction = null;

  if (orderId) {
    transaction = await prisma.payPalTransaction.findUnique({
      where: { orderId },
      include: {
        booking: {
          include: {
            listing: { select: { ownerId: true } },
          },
        },
      },
    });
  }

  if (!transaction && bookingId) {
    transaction = await prisma.payPalTransaction.findFirst({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            listing: { select: { ownerId: true } },
          },
        },
      },
    });
  }

  if (!transaction) {
    console.warn("[PayPal Webhook] Transaction not found for capture:", captureId);
    return;
  }

  // Vérifier si déjà traité
  if (transaction.status === "CAPTURED" && transaction.captureId === captureId) {
    console.log("[PayPal Webhook] Capture already processed:", captureId);
    return;
  }

  // Mettre à jour dans une transaction atomique
  await prisma.$transaction(async (tx) => {
    // Mettre à jour la transaction PayPal
    await tx.payPalTransaction.update({
      where: { id: transaction.id },
      data: {
        status: "CAPTURED",
        captureId,
      },
    });

    // Confirmer la réservation si pas déjà fait
    if (transaction.booking.status !== "CONFIRMED") {
      await tx.booking.update({
        where: { id: transaction.bookingId },
        data: {
          status: "CONFIRMED",
          paymentProvider: "PAYPAL",
        },
      });

      // Créditer le wallet de l'hôte
      const booking = transaction.booking;
      const priceCents = Math.round(booking.totalPrice * 100);
      const hostFeeCents = booking.hostFeeCents ?? 0;
      const payoutToHostCents = Math.max(0, priceCents - hostFeeCents);
      const hostUserId = booking.listing.ownerId;

      // Vérifier qu'on n'a pas déjà crédité
      const existingCredit = await tx.walletLedger.findFirst({
        where: {
          hostId: hostUserId,
          bookingId: booking.id,
          reason: { startsWith: "booking_credit:" },
        },
      });

      if (!existingCredit && payoutToHostCents > 0) {
        await tx.wallet.upsert({
          where: { hostId: hostUserId },
          update: { balanceCents: { increment: payoutToHostCents } },
          create: { hostId: hostUserId, balanceCents: payoutToHostCents },
        });

        await tx.walletLedger.create({
          data: {
            hostId: hostUserId,
            deltaCents: payoutToHostCents,
            reason: `booking_credit:${booking.id}`,
            bookingId: booking.id,
          },
        });
      }
    }
  });

  // Envoyer les notifications
  try {
    await notifyBookingConfirmed(transaction.bookingId);
  } catch (error) {
    console.error("[PayPal Webhook] Notification error:", error);
  }
}

/**
 * Gère l'événement PAYMENT.CAPTURE.REFUNDED
 */
async function handleCaptureRefunded(event: PayPalWebhookEvent) {
  const resource = event.resource as {
    id: string;
    status: string;
    amount: { currency_code: string; value: string };
    custom_id?: string;
  };

  const refundId = resource.id;
  const refundAmountCents = Math.round(parseFloat(resource.amount.value) * 100);

  console.log("[PayPal Webhook] Capture refunded:", {
    refundId,
    amount: resource.amount,
  });

  // Trouver la transaction par captureId (le refund contient l'ID de la capture parente)
  // Note: PayPal envoie l'ID du refund, pas de la capture. On doit chercher différemment.
  const transaction = await prisma.payPalTransaction.findFirst({
    where: {
      status: "CAPTURED",
    },
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        include: {
          listing: { select: { ownerId: true } },
        },
      },
    },
  });

  if (!transaction) {
    console.warn("[PayPal Webhook] Transaction not found for refund");
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Mettre à jour la transaction PayPal
    await tx.payPalTransaction.update({
      where: { id: transaction.id },
      data: {
        status: "REFUNDED",
      },
    });

    // Mettre à jour la réservation
    const booking = transaction.booking;
    const currentRefund = booking.refundAmountCents ?? 0;
    const newRefundTotal = currentRefund + refundAmountCents;
    const priceCents = Math.round(booking.totalPrice * 100);
    const isFullyRefunded = newRefundTotal >= priceCents;

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        refundAmountCents: newRefundTotal,
        status: isFullyRefunded ? "CANCELLED" : booking.status,
        cancelledAt: isFullyRefunded ? new Date() : booking.cancelledAt,
      },
    });

    // Débiter le wallet de l'hôte si nécessaire
    const hostUserId = booking.listing.ownerId;
    const hostFeeCents = booking.hostFeeCents ?? 0;
    const hostShareCents = Math.max(0, priceCents - hostFeeCents);
    const proportionalHostDebit =
      priceCents > 0
        ? Math.round((hostShareCents * refundAmountCents) / priceCents)
        : 0;

    if (proportionalHostDebit > 0) {
      const wallet = await tx.wallet.findUnique({
        where: { hostId: hostUserId },
        select: { balanceCents: true },
      });

      if (wallet && wallet.balanceCents > 0) {
        const appliedDebit = Math.min(wallet.balanceCents, proportionalHostDebit);

        await tx.wallet.update({
          where: { hostId: hostUserId },
          data: { balanceCents: { decrement: appliedDebit } },
        });

        await tx.walletLedger.create({
          data: {
            hostId: hostUserId,
            deltaCents: -appliedDebit,
            reason: `refund_booking:${booking.id}`,
            bookingId: booking.id,
          },
        });
      }
    }
  });

  // Envoyer les notifications
  try {
    await notifyBookingCancelled(transaction.bookingId, "system");
  } catch (error) {
    console.error("[PayPal Webhook] Notification error:", error);
  }
}

/**
 * Gère l'événement PAYMENT.CAPTURE.DENIED
 */
async function handleCaptureDenied(event: PayPalWebhookEvent) {
  const resource = event.resource as {
    id: string;
    status: string;
    custom_id?: string;
  };

  console.log("[PayPal Webhook] Capture denied:", resource);

  // Trouver et mettre à jour la transaction
  if (resource.custom_id) {
    await prisma.payPalTransaction.updateMany({
      where: {
        bookingId: resource.custom_id,
        status: { in: ["CREATED", "APPROVED"] },
      },
      data: {
        status: "FAILED",
      },
    });
  }
}
