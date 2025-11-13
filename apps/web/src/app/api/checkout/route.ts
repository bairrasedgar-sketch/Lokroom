// apps/web/src/app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
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

  return NextResponse.json({ clientSecret: pi.client_secret, id: pi.id });
}
