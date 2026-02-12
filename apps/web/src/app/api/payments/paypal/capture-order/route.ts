// apps/web/src/app/api/payments/paypal/capture-order/route.ts
/**
 * API pour capturer une commande PayPal après approbation
 *
 * POST /api/payments/paypal/capture-order
 * Body: { orderId: string }
 *
 * Cette API est appelée après que l'utilisateur a approuvé le paiement sur PayPal.
 * Elle capture le paiement, confirme la réservation et crédite le wallet de l'hôte.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { captureOrder, isPayPalConfigured } from "@/lib/paypal";
import { notifyBookingConfirmed } from "@/lib/notifications";
import { logger } from "@/lib/logger";


export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Vérifier que PayPal est configuré
  if (!isPayPalConfigured()) {
    return NextResponse.json(
      { error: "paypal_not_configured" },
      { status: 503 }
    );
  }

  // Vérifier l'authentification
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Parser le body
  const body = (await req.json().catch(() => null)) as {
    orderId?: string;
  } | null;

  if (!body?.orderId) {
    return NextResponse.json(
      { error: "orderId_required" },
      { status: 400 }
    );
  }

  try {
    // Récupérer la transaction PayPal
    const transaction = await prisma.payPalTransaction.findUnique({
      where: { orderId: body.orderId },
      include: {
        booking: {
          include: {
            listing: {
              select: {
                id: true,
                ownerId: true,
                title: true,
              },
            },
            guest: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "transaction_not_found" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est bien le guest de cette réservation
    if (transaction.booking.guest.email !== session.user.email) {
      return NextResponse.json(
        { error: "forbidden_not_booking_guest" },
        { status: 403 }
      );
    }

    // Vérifier que la transaction n'a pas déjà été capturée
    if (transaction.status === "CAPTURED") {
      return NextResponse.json({
        success: true,
        alreadyCaptured: true,
        bookingId: transaction.bookingId,
        captureId: transaction.captureId,
      });
    }

    // Vérifier que la réservation est en attente
    if (transaction.booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "booking_not_pending" },
        { status: 400 }
      );
    }

    // Capturer le paiement PayPal
    const { order, capture } = await captureOrder(body.orderId);

    if (!capture || capture.status !== "COMPLETED") {
      // Mettre à jour le statut de la transaction
      await prisma.payPalTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "FAILED",
          rawResponse: JSON.parse(JSON.stringify(order)),
        },
      });

      return NextResponse.json(
        { error: "capture_failed", details: capture?.status },
        { status: 400 }
      );
    }

    // Extraire le payer ID
    const payerId = order.payer?.payer_id;

    // Transaction atomique pour confirmer la réservation et créditer l'hôte
    await prisma.$transaction(async (tx) => {
      // Mettre à jour la transaction PayPal
      await tx.payPalTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "CAPTURED",
          captureId: capture.id,
          payerId,
          rawResponse: JSON.parse(JSON.stringify(order)),
        },
      });

      // Confirmer la réservation
      await tx.booking.update({
        where: { id: transaction.bookingId },
        data: {
          status: "CONFIRMED",
          paymentProvider: "PAYPAL",
        },
      });

      // Calculer le montant à créditer à l'hôte
      const booking = transaction.booking;
      const priceCents = Math.round(booking.totalPrice * 100);
      const hostFeeCents = booking.hostFeeCents ?? 0;
      const payoutToHostCents = Math.max(0, priceCents - hostFeeCents);

      const hostUserId = booking.listing.ownerId;

      // Vérifier qu'on n'a pas déjà crédité pour cette réservation
      const existingCredit = await tx.walletLedger.findFirst({
        where: {
          hostId: hostUserId,
          bookingId: booking.id,
          reason: { startsWith: "booking_credit:" },
        },
      });

      if (!existingCredit && payoutToHostCents > 0) {
        // Créditer le wallet de l'hôte
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

        // Créer l'entrée dans le ledger
        await tx.walletLedger.create({
          data: {
            hostId: hostUserId,
            deltaCents: payoutToHostCents,
            reason: `booking_credit:${booking.id}`,
            bookingId: booking.id,
          },
        });

        logger.debug("[PayPal] Host wallet credited:", {
          hostUserId,
          bookingId: booking.id,
          amountCents: payoutToHostCents,
        });
      }
    });

    // Envoyer les notifications (hors transaction)
    try {
      await notifyBookingConfirmed(transaction.bookingId);
    } catch (notifError) {
      logger.error("[PayPal] Failed to send notifications:", notifError);
      // Ne pas faire échouer la capture pour une erreur de notification
    }

    logger.debug("[PayPal] Order captured successfully:", {
      orderId: body.orderId,
      captureId: capture.id,
      bookingId: transaction.bookingId,
    });

    return NextResponse.json({
      success: true,
      bookingId: transaction.bookingId,
      captureId: capture.id,
      status: "CONFIRMED",
    });
  } catch (error) {
    logger.error("[PayPal] Capture order error:", error);
    return NextResponse.json(
      { error: "paypal_capture_failed" },
      { status: 500 }
    );
  }
}
