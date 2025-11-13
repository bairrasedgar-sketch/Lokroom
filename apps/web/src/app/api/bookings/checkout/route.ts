// apps/web/src/app/api/bookings/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrigin } from "@/lib/origin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId, amount, currency, hostUserId } = await req.json();
  if (!bookingId || !amount || !currency || !hostUserId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const origin = getOrigin();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency,
        product_data: { name: `Réservation #${bookingId}` },
        unit_amount: Math.round(Number(amount) * 100),
      },
      quantity: 1,
    }],
    // ⬇️ très important: copie nos metadata sur le PaymentIntent
    payment_intent_data: {
      metadata: {
        bookingId,
        hostUserId,
        currency, // "EUR" | "CAD"
      },
    },
    success_url: `${origin}/profile?status=success`,
    cancel_url: `${origin}/profile?status=cancel`,
    metadata: { bookingId, userEmail: session.user.email }, // (facultatif)
  });

  return NextResponse.json({ url: checkoutSession.url });
}
