// apps/web/src/app/api/bookings/[id]/security-deposit/authorize/route.ts
/**
 * POST /api/bookings/[id]/security-deposit/authorize
 * Confirme l'autorisation du dépôt après paiement réussi
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { authorizeDeposit } from "@/lib/security-deposit";
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

    // Récupérer le dépôt
    const deposit = await prisma.securityDeposit.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            guest: true,
            listing: {
              include: {
                owner: true,
                securityDepositPolicy: true,
              },
            },
          },
        },
      },
    });

    if (!deposit) {
      return NextResponse.json({ error: "Dépôt introuvable" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le guest
    if (deposit.booking.guestId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Autoriser le dépôt
    const result = await authorizeDeposit(deposit.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Envoyer notification au guest
    await createNotification({
      userId: deposit.booking.guestId,
      type: "SECURITY_DEPOSIT_AUTHORIZED",
      title: "Caution autorisée",
      message: `Une caution de ${(deposit.amountCents / 100).toFixed(2)} ${deposit.currency} a été autorisée pour votre réservation`,
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
      message: "Dépôt autorisé avec succès",
    });
  } catch (error) {
    logger.error("[API] Erreur autorisation dépôt:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
