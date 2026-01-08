// apps/web/src/app/api/bookings/[id]/security-deposit/route.ts
/**
 * GET /api/bookings/[id]/security-deposit
 * Obtient les détails du dépôt de garantie
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDepositStatus, formatDepositAmount } from "@/lib/security-deposit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: bookingId } = await params;

    // Récupérer la réservation pour vérifier les permissions
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le guest, l'hôte ou admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isGuest = booking.guestId === session.user.id;
    const isHost = booking.listing.ownerId === session.user.id;
    const isAdmin = user?.role === "ADMIN";

    if (!isGuest && !isHost && !isAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Obtenir le statut du dépôt
    const deposit = await getDepositStatus(bookingId);

    if (!deposit) {
      return NextResponse.json({ deposit: null });
    }

    // Formater les montants pour l'affichage
    const formattedAmount = formatDepositAmount(deposit.amountCents, deposit.currency);
    const formattedCapturedAmount = deposit.capturedAmountCents
      ? formatDepositAmount(deposit.capturedAmountCents, deposit.currency)
      : null;

    return NextResponse.json({
      deposit: {
        ...deposit,
        formattedAmount,
        formattedCapturedAmount,
        canCapture: isHost || isAdmin,
        canRelease: isHost || isAdmin,
      },
    });
  } catch (error) {
    console.error("[API] Erreur récupération dépôt:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
