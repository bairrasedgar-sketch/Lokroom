// apps/web/src/app/api/payments/paypal/refund/route.ts
/**
 * API pour rembourser un paiement PayPal
 *
 * POST /api/payments/paypal/refund
 * Body: { bookingId: string, amountCents?: number, reason?: string }
 *
 * Si amountCents n'est pas spécifié, remboursement total.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { refundCapture, isPayPalConfigured } from "@/lib/paypal";
import { notifyBookingCancelled } from "@/lib/notifications";

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
    bookingId?: string;
    amountCents?: number;
    reason?: string;
  } | null;

  if (!body?.bookingId) {
    return NextResponse.json(
      { error: "bookingId_required" },
      { status: 400 }
    );
  }

  try {
    // Récupérer la réservation et la transaction PayPal
    const booking = await prisma.booking.findUnique({
      where: { id: body.bookingId },
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
          },
        },
        paypalTransactions: {
          where: {
            status: "CAPTURED",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "booking_not_found" },
        { status: 404 }
      );
    }

    // Vérifier les permissions (guest ou host ou admin)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    const isGuest = booking.guest.email === session.user.email;
    const isHost = booking.listing.ownerId === user?.id;
    const isAdmin = user?.role === "ADMIN";

    if (!isGuest && !isHost && !isAdmin) {
      return NextResponse.json(
        { error: "forbidden" },
        { status: 403 }
      );
    }

    // Vérifier qu'il y a une transaction PayPal capturée
    const transaction = booking.paypalTransactions[0];
    if (!transaction || !transaction.captureId) {
      return NextResponse.json(
        { error: "no_captured_transaction" },
        { status: 400 }
      );
    }

    // Vérifier que la réservation n'est pas déjà annulée
    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "booking_already_cancelled" },
        { status: 400 }
      );
    }

    // Calculer le montant à rembourser
    const priceCents = Math.round(booking.totalPrice * 100);
    const guestFeeCents = booking.guestFeeCents ?? 0;
    const taxOnGuestFeeCents = booking.taxOnGuestFeeCents ?? 0;
    const totalChargeCents = priceCents + guestFeeCents + taxOnGuestFeeCents;
    const alreadyRefunded = booking.refundAmountCents ?? 0;
    const maxRefundable = totalChargeCents - alreadyRefunded;

    let refundAmountCents = body.amountCents ?? maxRefundable;
    refundAmountCents = Math.min(refundAmountCents, maxRefundable);

    if (refundAmountCents <= 0) {
      return NextResponse.json(
        { error: "nothing_to_refund" },
        { status: 400 }
      );
    }

    // Effectuer le remboursement PayPal
    const refund = await refundCapture({
      captureId: transaction.captureId,
      amountCents: refundAmountCents,
      currency: transaction.currency,
      reason: body.reason || "Remboursement Lok'Room",
    });

    if (refund.status !== "COMPLETED" && refund.status !== "PENDING") {
      return NextResponse.json(
        { error: "refund_failed", details: refund.status },
        { status: 400 }
      );
    }

    // Mettre à jour en transaction atomique
    const isFullRefund = refundAmountCents >= maxRefundable;

    await prisma.$transaction(async (tx) => {
      // Mettre à jour la transaction PayPal
      await tx.payPalTransaction.update({
        where: { id: transaction.id },
        data: {
          status: isFullRefund ? "REFUNDED" : "CAPTURED", // Garder CAPTURED si partiel
        },
      });

      // Mettre à jour la réservation
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          refundAmountCents: alreadyRefunded + refundAmountCents,
          status: isFullRefund ? "CANCELLED" : booking.status,
          cancelledAt: isFullRefund ? new Date() : booking.cancelledAt,
          cancelledByUserId: isFullRefund ? user?.id : booking.cancelledByUserId,
        },
      });

      // Débiter le wallet de l'hôte proportionnellement
      const hostUserId = booking.listing.ownerId;
      const hostFeeCents = booking.hostFeeCents ?? 0;
      const hostShareCents = Math.max(0, priceCents - hostFeeCents);
      const proportionalHostDebit =
        priceCents > 0
          ? Math.round((hostShareCents * refundAmountCents) / totalChargeCents)
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

          console.log("[PayPal] Host wallet debited:", {
            hostUserId,
            bookingId: booking.id,
            amountCents: appliedDebit,
          });
        }
      }
    });

    // Envoyer les notifications si annulation complète
    if (isFullRefund) {
      try {
        const cancelledBy = isGuest ? "guest" : isHost ? "host" : "system";
        await notifyBookingCancelled(booking.id, cancelledBy);
      } catch (error) {
        console.error("[PayPal] Notification error:", error);
      }
    }

    console.log("[PayPal] Refund processed:", {
      bookingId: booking.id,
      refundId: refund.id,
      amountCents: refundAmountCents,
      isFullRefund,
    });

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      refundStatus: refund.status,
      refundAmountCents,
      isFullRefund,
      bookingStatus: isFullRefund ? "CANCELLED" : booking.status,
    });
  } catch (error) {
    console.error("[PayPal] Refund error:", error);
    return NextResponse.json(
      { error: "paypal_refund_failed" },
      { status: 500 }
    );
  }
}
