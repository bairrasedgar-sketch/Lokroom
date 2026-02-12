// apps/web/src/app/api/bookings/[id]/security-deposit/capture/route.ts
/**
 * POST /api/bookings/[id]/security-deposit/capture
 * Capture tout ou partie du dépôt (en cas de dommages)
 * Réservé à l'hôte ou admin
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { captureDeposit, canCaptureDeposit } from "@/lib/security-deposit";
import { createNotification } from "@/lib/notifications";
import { logger } from "@/lib/logger";


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
    const body = await req.json();
    const { amount, reason, damagePhotos } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Montant invalide" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Une raison est obligatoire" },
        { status: 400 }
      );
    }

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
    const canCapture = await canCaptureDeposit(deposit.id, session.user.id);
    if (!canCapture) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à capturer ce dépôt" },
        { status: 403 }
      );
    }

    // Convertir le montant en centimes si nécessaire
    const amountCents = Math.round(amount * 100);

    // Capturer le dépôt
    const result = await captureDeposit(
      deposit.id,
      amountCents,
      reason,
      damagePhotos || []
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Envoyer notification au guest
    await createNotification({
      userId: deposit.booking.guestId,
      type: "SECURITY_DEPOSIT_CAPTURED",
      title: "Réclamation sur votre caution",
      message: `${(amountCents / 100).toFixed(2)} ${deposit.currency} ont été retenus sur votre caution. Raison: ${reason}`,
      actionUrl: `/reservations/${bookingId}`,
      data: {
        bookingId,
        depositId: deposit.id,
        capturedAmountCents: amountCents,
        reason,
        currency: deposit.currency,
      },
    });

    return NextResponse.json({
      success: true,
      capturedAmount: amountCents,
      message: "Dépôt capturé avec succès",
    });
  } catch (error) {
    logger.error("[API] Erreur capture dépôt:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
