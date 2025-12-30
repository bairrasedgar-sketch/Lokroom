/**
 * API - Suppression de compte (Droit à l'oubli RGPD)
 * POST /api/account/delete - Demande de suppression
 * DELETE /api/account/delete - Annuler la demande
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // Check if there's already a pending request
    const existingRequest = await prisma.accountDeletionRequest.findFirst({
      where: {
        userId: session.user.id,
        status: "pending",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error: "Une demande de suppression est déjà en cours",
          scheduledAt: existingRequest.scheduledAt,
        },
        { status: 400 }
      );
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        guestId: session.user.id,
        status: "CONFIRMED",
        endDate: { gte: new Date() },
      },
    });

    // Check for hosted listings with future bookings
    const hostedActiveBookings = await prisma.booking.count({
      where: {
        listing: { ownerId: session.user.id },
        status: "CONFIRMED",
        endDate: { gte: new Date() },
      },
    });

    if (activeBookings > 0 || hostedActiveBookings > 0) {
      return NextResponse.json(
        {
          error: "Vous avez des réservations actives",
          activeBookings,
          hostedActiveBookings,
          message: "Vous devez attendre la fin ou annuler vos réservations avant de supprimer votre compte.",
        },
        { status: 400 }
      );
    }

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { hostId: session.user.id },
    });

    if (wallet && wallet.balanceCents > 0) {
      return NextResponse.json(
        {
          error: "Votre portefeuille contient encore des fonds",
          balanceCents: wallet.balanceCents,
          message: "Veuillez retirer vos fonds avant de supprimer votre compte.",
        },
        { status: 400 }
      );
    }

    // Schedule deletion for 30 days from now (RGPD grace period)
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 30);

    const deletionRequest = await prisma.accountDeletionRequest.create({
      data: {
        userId: session.user.id,
        reason: reason || null,
        status: "pending",
        scheduledAt,
      },
    });

    // Send confirmation email (would be done via email service)
    // await sendDeletionConfirmationEmail(session.user.email, scheduledAt);

    return NextResponse.json({
      success: true,
      message: "Demande de suppression enregistrée",
      scheduledAt,
      requestId: deletionRequest.id,
      cancellableUntil: scheduledAt,
    });
  } catch (error) {
    console.error("Erreur suppression compte:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Find and cancel pending deletion request
    const pendingRequest = await prisma.accountDeletionRequest.findFirst({
      where: {
        userId: session.user.id,
        status: "pending",
      },
    });

    if (!pendingRequest) {
      return NextResponse.json(
        { error: "Aucune demande de suppression en cours" },
        { status: 404 }
      );
    }

    await prisma.accountDeletionRequest.update({
      where: { id: pendingRequest.id },
      data: {
        status: "cancelled",
        processedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Demande de suppression annulée",
    });
  } catch (error) {
    console.error("Erreur annulation suppression:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Get current deletion request status
    const pendingRequest = await prisma.accountDeletionRequest.findFirst({
      where: {
        userId: session.user.id,
        status: "pending",
      },
    });

    if (!pendingRequest) {
      return NextResponse.json({
        hasPendingRequest: false,
      });
    }

    return NextResponse.json({
      hasPendingRequest: true,
      scheduledAt: pendingRequest.scheduledAt,
      requestedAt: pendingRequest.createdAt,
      reason: pendingRequest.reason,
    });
  } catch (error) {
    console.error("Erreur statut suppression:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
