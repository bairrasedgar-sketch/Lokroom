// apps/web/src/app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { validateRequestBody, createCheckoutSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    // 🔒 SÉCURITÉ : Authentification requise pour créer un checkout
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔒 VALIDATION : Valider les inputs avec Zod
    const validation = await validateRequestBody(req, createCheckoutSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { amountCents, currency, applicationFeeCents, metadata } = validation.data;

    // Paiement sur la plateforme (pas de transfer_data ici)
    const pi = await stripe.paymentIntents.create({
      amount: Math.trunc(amountCents),
      currency: (currency || "EUR").toLowerCase(),
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
