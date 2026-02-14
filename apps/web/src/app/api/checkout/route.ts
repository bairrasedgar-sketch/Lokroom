// apps/web/src/app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    // 🔒 SÉCURITÉ : Authentification requise pour créer un checkout
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amountCents, currency = "eur", applicationFeeCents = 0, metadata } =
      (await req.json()) || {};

    if (!amountCents || amountCents < 50) {
      return NextResponse.json({ error: "amount_too_small" }, { status: 400 });
    }

    // Paiement sur la plateforme (pas de transfer_data ici)
    const pi = await stripe.paymentIntents.create({
      amount: Math.trunc(amountCents),
      currency,
      automatic_payment_methods: { enabled: true },
      application_fee_amount: applicationFeeCents ? Math.trunc(applicationFeeCents) : undefined,
      metadata: metadata || {},
    });

    logger.info("Payment intent created", {
      userId: session.user.email,
      paymentIntentId: pi.id,
      amount: amountCents,
      currency,
    });

    return NextResponse.json({ clientSecret: pi.client_secret, id: pi.id });
  } catch (error) {
    logger.error("Checkout creation failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "CHECKOUT_FAILED",
        message: "Failed to create payment intent. Please try again."
      },
      { status: 500 }
    );
  }
}
