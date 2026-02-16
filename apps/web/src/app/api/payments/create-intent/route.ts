// apps/web/src/app/api/payments/create-intent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type Stripe from "stripe";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { computeFees, inferRegion } from "@/lib/fees";
import type { Currency as PrismaCurrency } from "@prisma/client";
import { fromPrismaCurrency } from "@/lib/currency";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function mapCurrencyToStripe(currency: PrismaCurrency): "eur" | "cad" {
  switch (currency) {
    case "EUR":
      return "eur";
    case "CAD":
      return "cad";
    default:
      return "eur";
  }
}

export async function POST(req: NextRequest) {
  try {
    // 🔒 RATE LIMITING: 10 req/min pour création payment intent
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`payment-intent:${ip}`, 10, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as
    | {
        bookingId?: string;
      }
    | null;

    if (!body?.bookingId) {
      return NextResponse.json(
        { error: "bookingId_required" },
        { status: 400 },
      );
    }

    // On récupère la booking + listing + guest
    const booking = await prisma.booking.findUnique({
    where: { id: body.bookingId },
    include: {
      listing: {
        select: {
          id: true,
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
        { status: 404 },
      );
    }

    // Le user connecté doit être le guest de cette booking
    if (booking.guest.email !== session.user.email) {
      return NextResponse.json(
        { error: "forbidden_not_booking_guest" },
        { status: 403 },
      );
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "booking_not_pending" },
        { status: 400 },
      );
    }

    // Prix de base en cents
    const priceCents = Math.round(booking.totalPrice * 100);
    if (priceCents <= 0) {
      return NextResponse.json(
        { error: "invalid_booking_price" },
        { status: 400 },
      );
    }

    // Currency front (union string) à partir de l'enum Prisma
    const currency = fromPrismaCurrency(booking.currency);

    // Région pour le moteur de fees (FR vs provinces CA)
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

    const stripeCurrency = mapCurrencyToStripe(booking.currency);
    const amount = fees.chargeCents;

    // Metadata complètes pour le webhook
    const metadata: Record<string, string> = {
      bookingId: booking.id,
      listingId: booking.listing.id,
      guestId: booking.guest.id,
      hostUserId: booking.listing.ownerId,
      // snapshot des frais
      fee_host_cents: String(fees.hostFeeCents),
      fee_guest_cents: String(fees.guestFeeCents),
      tax_guest_cents: String(fees.taxOnGuestFeeCents),
      total_cents: String(fees.chargeCents),
      stripe_fee_estimate_cents: String(fees.stripeEstimateCents),
      currency: booking.currency,
      region: fees.region,
    };

    try {
      let paymentIntent: Stripe.PaymentIntent | null = null;

      // Si on a déjà un PI sur la booking → on tente de le réutiliser/mettre à jour
      if (booking.stripePaymentIntentId) {
        const existing = await stripe.paymentIntents.retrieve(
          booking.stripePaymentIntentId,
        );

        if (
          existing.status === "requires_payment_method" ||
          existing.status === "requires_confirmation" ||
          existing.status === "requires_action"
        ) {
          // On met juste à jour les metadata, au cas où les frais auraient changé
          paymentIntent = await stripe.paymentIntents.update(existing.id, {
            metadata,
          });
        } else if (existing.status === "processing") {
          // On renvoie tel quel (paiement déjà en cours)
          paymentIntent = existing;
        } else {
          // succeeded / canceled / autres → on recrée un nouveau PI
          paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: stripeCurrency,
            metadata,
            automatic_payment_methods: { enabled: true },
            receipt_email: booking.guest.email ?? undefined,
          });
        }
      } else {
        // Pas encore de PaymentIntent → on le crée
        paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: stripeCurrency,
          metadata,
          automatic_payment_methods: { enabled: true },
          receipt_email: booking.guest.email ?? undefined,
        });
      }

      if (!paymentIntent.client_secret) {
        return NextResponse.json(
          { error: "missing_client_secret" },
          { status: 500 },
        );
      }

      // On calcule la marge nette estimée pour la plateforme
      const platformNetCents =
        fees.hostFeeCents +
        fees.guestFeeCents +
        fees.taxOnGuestFeeCents -
        fees.stripeEstimateCents;

      // On sauvegarde le snapshot des frais + l'ID du PI dans la booking
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          stripePaymentIntentId: paymentIntent.id,
          hostFeeCents: fees.hostFeeCents,
          guestFeeCents: fees.guestFeeCents,
          taxOnGuestFeeCents: fees.taxOnGuestFeeCents,
          stripeFeeEstimateCents: fees.stripeEstimateCents,
          platformNetCents,
        },
      });

      return NextResponse.json({
        bookingId: booking.id,
        clientSecret: paymentIntent.client_secret,
        amountCents: amount,
        currency: booking.currency,
        fees: {
          hostFeeCents: fees.hostFeeCents,
          guestFeeCents: fees.guestFeeCents,
          taxOnGuestFeeCents: fees.taxOnGuestFeeCents,
          stripeFeeEstimateCents: fees.stripeEstimateCents,
          platformNetCents,
          region: fees.region,
        },
      });
    } catch (err) {
      logger.error("create-intent inner error", { error: err, endpoint: "/api/payments/create-intent" });
      return NextResponse.json(
        { error: "stripe_error" },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error("POST /api/payments/create-intent error", { error });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
