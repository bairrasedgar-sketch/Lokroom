// apps/web/src/app/api/payments/paypal/create-order/route.ts
/**
 * API pour créer une commande PayPal
 *
 * POST /api/payments/paypal/create-order
 * Body: { bookingId: string }
 *
 * Retourne: { orderId: string, approvalUrl: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOrder, mapCurrencyToPayPal, isPayPalConfigured } from "@/lib/paypal";
import { computeFees, inferRegion } from "@/lib/fees";
import { fromPrismaCurrency } from "@/lib/currency";

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
  } | null;

  if (!body?.bookingId) {
    return NextResponse.json(
      { error: "bookingId_required" },
      { status: 400 }
    );
  }

  try {
    // Récupérer la réservation avec les infos nécessaires
    const booking = await prisma.booking.findUnique({
      where: { id: body.bookingId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            country: true,
            province: true,
            ownerId: true,
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
    });

    if (!booking) {
      return NextResponse.json(
        { error: "booking_not_found" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est bien le guest de cette réservation
    if (booking.guest.email !== session.user.email) {
      return NextResponse.json(
        { error: "forbidden_not_booking_guest" },
        { status: 403 }
      );
    }

    // Vérifier que la réservation est en attente de paiement
    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "booking_not_pending" },
        { status: 400 }
      );
    }

    // Calculer les frais (même logique que Stripe)
    const priceCents = Math.round(booking.totalPrice * 100);
    if (priceCents <= 0) {
      return NextResponse.json(
        { error: "invalid_booking_price" },
        { status: 400 }
      );
    }

    const currency = fromPrismaCurrency(booking.currency);
    const region = inferRegion({
      currency: currency as "EUR" | "CAD",
      country: booking.listing.country,
      provinceCode: booking.listing.province,
    });

    const fees = computeFees({
      priceCents,
      currency: currency as "EUR" | "CAD",
      region,
    });

    const totalChargeCents = fees.chargeCents;
    const paypalCurrency = mapCurrencyToPayPal(currency);

    // Vérifier s'il existe déjà une transaction PayPal CREATED pour cette réservation
    const existingTransaction = await prisma.payPalTransaction.findFirst({
      where: {
        bookingId: booking.id,
        status: "CREATED",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Si une transaction existe et est récente (moins de 30 minutes), la réutiliser
    if (existingTransaction) {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (existingTransaction.createdAt > thirtyMinutesAgo) {
        return NextResponse.json({
          orderId: existingTransaction.orderId,
          bookingId: booking.id,
          amountCents: totalChargeCents,
          currency: paypalCurrency,
          fees: {
            hostFeeCents: fees.hostFeeCents,
            guestFeeCents: fees.guestFeeCents,
            taxOnGuestFeeCents: fees.taxOnGuestFeeCents,
            platformNetCents: fees.platformNetCents,
            region: fees.region,
          },
        });
      }
    }

    // Créer la commande PayPal
    const order = await createOrder({
      amountCents: totalChargeCents,
      currency: paypalCurrency,
      bookingId: booking.id,
      description: `Réservation ${booking.listing.title}`,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking.id}/paypal-return`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking.id}?paypal_cancelled=1`,
    });

    // Trouver l'URL d'approbation
    const approvalUrl = order.links?.find((link) => link.rel === "approve")?.href;

    // Calculer la marge nette plateforme
    const platformNetCents =
      fees.hostFeeCents +
      fees.guestFeeCents +
      fees.taxOnGuestFeeCents -
      fees.stripeEstimateCents; // On utilise l'estimation Stripe comme proxy

    // Créer la transaction PayPal en BDD
    await prisma.payPalTransaction.create({
      data: {
        bookingId: booking.id,
        orderId: order.id,
        amountCents: totalChargeCents,
        currency: paypalCurrency,
        status: "CREATED",
        rawResponse: JSON.parse(JSON.stringify(order)),
      },
    });

    // Mettre à jour la réservation avec les frais calculés
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        hostFeeCents: fees.hostFeeCents,
        guestFeeCents: fees.guestFeeCents,
        taxOnGuestFeeCents: fees.taxOnGuestFeeCents,
        stripeFeeEstimateCents: fees.stripeEstimateCents,
        platformNetCents,
        paymentProvider: "PAYPAL",
      },
    });

    console.log("[PayPal] Order created for booking:", {
      bookingId: booking.id,
      orderId: order.id,
      amountCents: totalChargeCents,
      currency: paypalCurrency,
    });

    return NextResponse.json({
      orderId: order.id,
      approvalUrl,
      bookingId: booking.id,
      amountCents: totalChargeCents,
      currency: paypalCurrency,
      fees: {
        hostFeeCents: fees.hostFeeCents,
        guestFeeCents: fees.guestFeeCents,
        taxOnGuestFeeCents: fees.taxOnGuestFeeCents,
        platformNetCents,
        region: fees.region,
      },
    });
  } catch (error) {
    console.error("[PayPal] Create order error:", error);
    return NextResponse.json(
      { error: "paypal_create_order_failed" },
      { status: 500 }
    );
  }
}
