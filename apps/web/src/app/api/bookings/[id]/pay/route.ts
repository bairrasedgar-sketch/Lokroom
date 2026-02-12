// apps/web/src/app/api/bookings/[id]/pay/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = {
  params: { id: string };
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const bookingId = params.id;

    // ─────────────────────────────────────────────────────────────
    // SÉCURITÉ : Vérification KYC obligatoire avant paiement
    // ─────────────────────────────────────────────────────────────
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { identityStatus: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // L'utilisateur doit avoir vérifié son identité (KYC) pour payer
    if (currentUser.identityStatus !== "VERIFIED") {
      return NextResponse.json(
        {
          error: "kyc_required",
          message: "Identity verification is required before making a payment. Please complete KYC verification in your account settings.",
          identityStatus: currentUser.identityStatus,
        },
        { status: 403 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          include: {
            owner: {
              include: {
                hostProfile: true,
              },
            },
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

    // sécurité : seul le guest peut payer sa réservation
    if (booking.guestId !== userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "booking_not_pending" },
        { status: 400 }
      );
    }

    const hostUser = booking.listing.owner;
    const hostProfile = hostUser.hostProfile;

    if (!hostProfile?.stripeAccountId) {
      return NextResponse.json(
        { error: "host_no_stripe_account" },
        { status: 400 }
      );
    }

    if (!hostProfile.payoutsEnabled) {
      // tu peux être plus chill ici et juste prévenir côté UI
      return NextResponse.json(
        { error: "host_payouts_disabled" },
        { status: 400 }
      );
    }

    const priceCents = Math.round(booking.totalPrice * 100);

    if (priceCents <= 0) {
      return NextResponse.json(
        { error: "invalid_amount" },
        { status: 400 }
      );
    }

    // Modèle simple : 15% de commission hôte
    const hostFeeCents = Math.round(priceCents * 0.15);

    // Pas encore de frais guest pour l'instant
    const guestFeeCents = 0;
    const taxOnGuestFeeCents = 0;

    // estimation grossière des frais Stripe : 2.9% + 30 cents
    const stripeFeeEstimateCents = Math.round(priceCents * 0.029) + 30;

    const currency = booking.currency.toLowerCase() as "eur" | "cad";

    const paymentIntent = await stripe.paymentIntents.create({
      amount: priceCents,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      application_fee_amount: hostFeeCents,
      transfer_data: {
        destination: hostProfile.stripeAccountId,
      },
      metadata: {
        bookingId: booking.id,
        hostUserId: hostUser.id,
        fee_host_cents: String(hostFeeCents),
        fee_guest_cents: String(guestFeeCents),
        tax_guest_cents: String(taxOnGuestFeeCents),
        stripe_fee_estimate_cents: String(stripeFeeEstimateCents),
      },
    });

    // on garde tout en base pour que le webhook puisse bosser proprement
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        hostFeeCents,
        guestFeeCents,
        taxOnGuestFeeCents,
        stripeFeeEstimateCents,
      },
    });

    // Calcul du net plateforme
    const platformNetCents = hostFeeCents - stripeFeeEstimateCents;

    // Déterminer la région pour les taxes
    const region = booking.listing.country?.toUpperCase() === "CA"
      ? (booking.listing.province || "CA")
      : (booking.listing.country || "FR");

    return NextResponse.json({
      bookingId: booking.id,
      clientSecret: paymentIntent.client_secret,
      amountCents: priceCents,
      currency: booking.currency,
      fees: {
        hostFeeCents,
        guestFeeCents,
        taxOnGuestFeeCents,
        stripeFeeEstimateCents,
        platformNetCents,
        region,
      },
    });
  } catch (e) {
    logger.error("bookings/[id]/pay error:", e);
    return NextResponse.json(
      { error: "payment_intent_failed" },
      { status: 500 }
    );
  }
}
