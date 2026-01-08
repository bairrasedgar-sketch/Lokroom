// apps/web/src/app/api/bookings/[id]/security-deposit/release/route.ts
/**
 * POST /api/bookings/[id]/security-deposit/release
 * Libère le dépôt (annule le hold Stripe)
 * Réservé à l'hôte ou admin
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { releaseDeposit, canReleaseDeposit } from "@/lib/security-deposit";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: bookingId } = await params;

    // Récupérer le dépôt
    const deposit = await prisma.securityDeposit.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            guest: true,
            listing: {
              include: { owner: true },
            },
          },
        },
      },
    });

    if (!deposit) {
      return NextResponse.json({ error: "Dépôt introuvable" }, { status: 404 });
    }

    // Vérifier les permissions
    const canRelease = await canReleaseDeposit(deposit.id, session.user.id);
    if (!canRelease) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à libérer ce dépôt" },
        { status: 403 }
      );
    }

    // Libérer le dépôt
    const result = await releaseDeposit(deposit.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Envoyer notification au guest
    await createNotification({
      userId: deposit.booking.guestId,
      type: "SECURITY_DEPOSIT_RELEASED",
      title: "Caution libérée",
      message: `Votre caution de ${(deposit.amountCents / 100).toFixed(2)} ${deposit.currency} a été libérée`,
      actionUrl: `/reservations/${bookingId}`,
      data: {
        bookingId,
        depositId: deposit.id,
        amountCents: deposit.amountCents,
        currency: deposit.currency,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Dépôt libéré avec succès",
    });
  } catch (error) {
    console.error("[API] Erreur libération dépôt:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
