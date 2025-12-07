// apps/web/src/app/api/bookings/pay/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

// SÉCURITÉ: Pas de GET - ne pas exposer la structure de l'API
// Les routes non autorisées renvoient automatiquement 405 Method Not Allowed

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const body = (await req.json().catch(() => null)) as { bookingId?: string } | null;
    if (!body?.bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    // Récupérer la réservation + owner + devise
    const booking = await prisma.booking.findUnique({
      where: { id: body.bookingId },
      include: { listing: { select: { id: true, ownerId: true, currency: true } } },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // SÉCURITÉ: Seul le guest peut payer sa propre réservation
    if (booking.guestId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json({ error: "Booking not payable" }, { status: 400 });
    }

    const amountCents = Math.round(booking.totalPrice * 100);
    const currency = booking.currency.toLowerCase() as "eur" | "cad";

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      automatic_payment_methods: { enabled: true },
      // Metadata pour le webhook - ne pas exposer dans la réponse
      metadata: {
        bookingId: booking.id,
        listingId: booking.listingId,
        hostUserId: booking.listing.ownerId,
        currency: booking.currency,
      },
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (e) {
    console.error("pay route error:", e);
    return NextResponse.json({ error: "pay_failed" }, { status: 500 });
  }
}
