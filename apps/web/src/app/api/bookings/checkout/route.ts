// apps/web/src/app/api/bookings/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting très permissif : 100 requêtes par minute par utilisateur
  const rateLimitKey = `checkout:${session.user.email}`;
  const rateLimitResult = await rateLimit(rateLimitKey, 100, 60_000);

  if (!rateLimitResult.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const { bookingId, amount, currency, hostUserId } = await req.json();
  if (!bookingId || !amount || !currency || !hostUserId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // VALIDATION CRITIQUE: Vérifier le montant contre la base de données
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        totalPrice: true,
        currency: true,
        guestId: true,
        listing: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est bien le guest de cette réservation
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser || booking.guestId !== currentUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Vérifier que le montant correspond exactement
    const expectedAmount = Math.round(booking.totalPrice * 100);
    const providedAmount = Math.round(Number(amount) * 100);

    if (expectedAmount !== providedAmount) {
      console.error(`Payment amount mismatch for booking ${bookingId}: expected ${expectedAmount}, got ${providedAmount}`);
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Vérifier que la devise correspond
    if (booking.currency.toUpperCase() !== currency.toUpperCase()) {
      return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
    }

    // Vérifier que le hostUserId correspond au propriétaire du listing
    if (booking.listing.ownerId !== hostUserId) {
      return NextResponse.json({ error: "Invalid host" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error validating booking:", error);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
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
