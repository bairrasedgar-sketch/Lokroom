// apps/web/src/app/api/bookings/[id]/confirm-payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { sendBookingConfirmation, sendNewBookingToHost } from "@/lib/email";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🔒 VALIDATION: Schéma Zod pour le bookingId
const bookingIdSchema = z.string().min(1, "bookingId requis");

type RouteParams = {
  params: { id: string };
};

/**
 * POST /api/bookings/[id]/confirm-payment
 * Appelé après un paiement Stripe réussi pour mettre à jour le statut immédiatement
 * et envoyer les emails de confirmation
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    // 🔒 RATE LIMITING: 10 req/min pour éviter abus sur confirmations
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`confirm-payment:${ip}`, 10, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Trop de tentatives. Réessayez dans une minute." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 🔒 VALIDATION: Valider le bookingId
    let bookingId: string;
    try {
      bookingId = bookingIdSchema.parse(params.id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "INVALID_BOOKING_ID" }, { status: 400 });
    }

    // Récupérer la réservation
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "booking_not_found" }, { status: 404 });
    }

    // Sécurité : seul le guest peut confirmer son paiement
    if (booking.guestId !== userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Si déjà confirmé, on retourne simplement le statut
    if (booking.status === "CONFIRMED") {
      return NextResponse.json({
        success: true,
        status: "CONFIRMED",
        message: "Booking already confirmed"
      });
    }

    // Vérifier le paiement Stripe
    if (!booking.stripePaymentIntentId) {
      return NextResponse.json({ error: "no_payment_intent" }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({
        error: "payment_not_succeeded",
        paymentStatus: paymentIntent.status
      }, { status: 400 });
    }

    // Mettre à jour le statut à CONFIRMED
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
      },
    });

    // Formater les dates pour les emails
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    // Envoyer l'email de confirmation au guest
    try {
      if (booking.guest.email) {
        await sendBookingConfirmation(booking.guest.email, {
          guestName: booking.guest.name || "Voyageur",
          listingTitle: booking.listing.title,
          hostName: booking.listing.owner.name || "Votre hôte",
          startDate: formatDate(booking.startDate),
          endDate: formatDate(booking.endDate),
          totalPrice: booking.totalPrice.toFixed(0),
          currency: booking.currency,
          bookingId: booking.id,
        });
        logger.debug("[confirm-payment] Email sent to guest", { email: booking.guest.email });
      }
    } catch (emailError) {
      logger.error("[confirm-payment] Guest email error", { error: emailError });
    }

    // Envoyer une notification à l'hôte
    try {
      if (booking.listing.owner.email) {
        // Calculer le montant que l'hôte recevra (total - commission 15%)
        const hostAmount = (booking.totalPrice * 0.85).toFixed(0);

        await sendNewBookingToHost(booking.listing.owner.email, {
          hostName: booking.listing.owner.name || "Hôte",
          guestName: booking.guest.name || "Voyageur",
          listingTitle: booking.listing.title,
          startDate: formatDate(booking.startDate),
          endDate: formatDate(booking.endDate),
          totalPrice: hostAmount,
          currency: booking.currency,
          bookingId: booking.id,
        });
        logger.debug("[confirm-payment] Email sent to host", { email: booking.listing.owner.email });
      }
    } catch (hostEmailError) {
      logger.error("[confirm-payment] Host email error", { error: hostEmailError });
    }

    return NextResponse.json({
      success: true,
      status: updatedBooking.status,
      bookingId: updatedBooking.id,
    });
  } catch (e) {
    logger.error("[confirm-payment] Error:", e);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );
  }
}
