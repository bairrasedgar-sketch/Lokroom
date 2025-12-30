/**
 * API Admin - Détail et actions sur une réservation
 * GET /api/admin/bookings/[id]
 * PUT /api/admin/bookings/[id] - Actions (cancel, refund)
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminPermission, logAdminAction } from "@/lib/admin-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminPermission("bookings:view");
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
            price: true,
            currency: true,
            type: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: { select: { avatarUrl: true, phone: true } },
                hostProfile: { select: { stripeAccountId: true, payoutsEnabled: true } },
              },
            },
            images: {
              where: { isCover: true },
              take: 1,
              select: { url: true },
            },
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            profile: { select: { avatarUrl: true, phone: true } },
            _count: { select: { bookings: true } },
          },
        },
        cancelledByUser: {
          select: { id: true, name: true, email: true },
        },
        reviews: {
          include: {
            author: { select: { id: true, name: true } },
          },
        },
        disputes: {
          select: {
            id: true,
            reason: true,
            status: true,
            createdAt: true,
          },
        },
        conversations: {
          select: {
            id: true,
            _count: { select: { messages: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer les notes admin
    const adminNotes = await prisma.adminNote.findMany({
      where: {
        targetType: "Booking",
        targetId: id,
      },
      include: {
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Récupérer l'historique admin
    const auditHistory = await prisma.auditLog.findMany({
      where: {
        entityType: "Booking",
        entityId: id,
      },
      include: {
        admin: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Calculer les montants
    const totalWithFees = booking.totalPrice * 100 + booking.guestFeeCents;
    const hostPayout = booking.totalPrice * 100 - booking.hostFeeCents;

    return NextResponse.json({
      booking: {
        ...booking,
        coverImage: booking.listing.images[0]?.url || null,
        calculations: {
          basePrice: booking.totalPrice * 100, // en cents
          guestFee: booking.guestFeeCents,
          hostFee: booking.hostFeeCents,
          platformNet: booking.platformNetCents,
          stripeFee: booking.stripeFeeEstimateCents,
          taxOnGuestFee: booking.taxOnGuestFeeCents,
          totalCharged: totalWithFees,
          hostPayout,
          refunded: booking.refundAmountCents || 0,
        },
        adminNotes,
        auditHistory,
      },
    });
  } catch (error) {
    console.error("Erreur API admin booking detail:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { action, reason, refundAmount, refundType } = body;

  // Déterminer la permission requise
  let permission: "bookings:cancel" | "bookings:refund" = "bookings:cancel";
  if (action === "refund") {
    permission = "bookings:refund";
  }

  const auth = await requireAdminPermission(permission);
  if ("error" in auth) return auth.error;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: { select: { title: true, ownerId: true } },
        guest: { select: { email: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      );
    }

    switch (action) {
      case "cancel": {
        if (booking.status === "CANCELLED") {
          return NextResponse.json(
            { error: "Réservation déjà annulée" },
            { status: 400 }
          );
        }

        await prisma.booking.update({
          where: { id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelledByUserId: auth.session.user.id,
          },
        });

        await logAdminAction({
          adminId: auth.session.user.id,
          action: "BOOKING_CANCELLED_ADMIN",
          targetType: "Booking",
          targetId: id,
          details: {
            reason,
            listingTitle: booking.listing.title,
            guestEmail: booking.guest.email,
            totalPrice: booking.totalPrice,
          },
          request,
        });

        return NextResponse.json({ success: true, status: "CANCELLED" });
      }

      case "refund": {
        if (!refundAmount || refundAmount <= 0) {
          return NextResponse.json(
            { error: "Montant de remboursement invalide" },
            { status: 400 }
          );
        }

        const maxRefund = booking.totalPrice * 100 + booking.guestFeeCents - (booking.refundAmountCents || 0);
        if (refundAmount > maxRefund) {
          return NextResponse.json(
            { error: `Montant maximum remboursable: ${maxRefund / 100}€` },
            { status: 400 }
          );
        }

        // TODO: Intégrer avec Stripe pour le remboursement réel
        // const refund = await stripe.refunds.create({
        //   payment_intent: booking.stripePaymentIntentId,
        //   amount: refundAmount,
        // });

        const newRefundTotal = (booking.refundAmountCents || 0) + refundAmount;

        await prisma.booking.update({
          where: { id },
          data: {
            refundAmountCents: newRefundTotal,
            // Si remboursement total, annuler la réservation
            ...(newRefundTotal >= booking.totalPrice * 100 + booking.guestFeeCents && {
              status: "CANCELLED",
              cancelledAt: new Date(),
              cancelledByUserId: auth.session.user.id,
            }),
          },
        });

        await logAdminAction({
          adminId: auth.session.user.id,
          action: "BOOKING_REFUNDED",
          targetType: "Booking",
          targetId: id,
          details: {
            refundAmount,
            refundType: refundType || "partial",
            reason,
            totalRefunded: newRefundTotal,
            guestEmail: booking.guest.email,
          },
          request,
        });

        return NextResponse.json({
          success: true,
          refundAmount,
          totalRefunded: newRefundTotal,
        });
      }

      case "confirm": {
        if (booking.status !== "PENDING") {
          return NextResponse.json(
            { error: "Seules les réservations en attente peuvent être confirmées" },
            { status: 400 }
          );
        }

        await prisma.booking.update({
          where: { id },
          data: { status: "CONFIRMED" },
        });

        await logAdminAction({
          adminId: auth.session.user.id,
          action: "BOOKING_CANCELLED_ADMIN",
          targetType: "Booking",
          targetId: id,
          details: {
            listingTitle: booking.listing.title,
            guestEmail: booking.guest.email,
          },
          request,
        });

        return NextResponse.json({ success: true, status: "CONFIRMED" });
      }

      default:
        return NextResponse.json(
          { error: "Action invalide" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Erreur action booking:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
