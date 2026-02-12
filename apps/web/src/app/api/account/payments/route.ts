// apps/web/src/app/api/account/payments/route.ts
/**
 * API pour recuperer l'historique des paiements d'un utilisateur
 *
 * GET /api/account/payments
 *
 * Retourne les paiements Stripe et PayPal de l'utilisateur
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";


export const dynamic = "force-dynamic";

type PaymentResponse = {
  id: string;
  type: "incoming" | "outgoing";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  date: string;
  description: string;
  provider: "STRIPE" | "PAYPAL";
  bookingId?: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // Recuperer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Recuperer les reservations de l'utilisateur (en tant que guest)
    const bookings = await prisma.booking.findMany({
      where: {
        guestId: user.id,
        status: { in: ["CONFIRMED", "CANCELLED"] },
      },
      include: {
        listing: {
          select: {
            title: true,
          },
        },
        paypalTransactions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const payments: PaymentResponse[] = [];

    for (const booking of bookings) {
      const totalChargeCents =
        Math.round(booking.totalPrice * 100) +
        (booking.guestFeeCents ?? 0) +
        (booking.taxOnGuestFeeCents ?? 0);

      // Determiner le provider et le statut
      const paypalTx = booking.paypalTransactions[0];
      const isPayPal = booking.paymentProvider === "PAYPAL" || !!paypalTx;

      let status: PaymentResponse["status"] = "pending";
      if (booking.status === "CONFIRMED") {
        status = "completed";
      } else if (booking.status === "CANCELLED") {
        if (booking.refundAmountCents && booking.refundAmountCents > 0) {
          status = "refunded";
        } else {
          status = "failed";
        }
      }

      // Paiement principal
      payments.push({
        id: booking.id,
        type: "outgoing",
        amount: totalChargeCents / 100,
        currency: booking.currency,
        status,
        date: booking.createdAt.toISOString(),
        description: `Reservation - ${booking.listing.title}`,
        provider: isPayPal ? "PAYPAL" : "STRIPE",
        bookingId: booking.id,
      });

      // Si rembourse, ajouter une entree de remboursement
      if (booking.refundAmountCents && booking.refundAmountCents > 0) {
        payments.push({
          id: `${booking.id}-refund`,
          type: "incoming",
          amount: booking.refundAmountCents / 100,
          currency: booking.currency,
          status: "completed",
          date: booking.cancelledAt?.toISOString() ?? booking.createdAt.toISOString(),
          description: `Remboursement - ${booking.listing.title}`,
          provider: isPayPal ? "PAYPAL" : "STRIPE",
          bookingId: booking.id,
        });
      }
    }

    // Trier par date decroissante
    payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ payments });
  } catch (error) {
    logger.error("[Account Payments] Error:", error);
    return NextResponse.json(
      { error: "failed_to_load_payments" },
      { status: 500 }
    );
  }
}
