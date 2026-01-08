// apps/web/src/app/api/bookings/[id]/security-deposit/create/route.ts
/**
 * POST /api/bookings/[id]/security-deposit/create
 * Crée un hold Stripe pour le dépôt de garantie
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createDepositHold } from "@/lib/security-deposit";

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

    // Récupérer la réservation avec la politique de dépôt
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          include: {
            securityDepositPolicy: true,
          },
        },
        securityDeposit: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le guest de la réservation
    if (booking.guestId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Vérifier qu'un dépôt n'existe pas déjà
    if (booking.securityDeposit) {
      return NextResponse.json(
        { error: "Un dépôt de garantie existe déjà pour cette réservation" },
        { status: 400 }
      );
    }

    // Vérifier que la politique de dépôt est activée
    const policy = booking.listing.securityDepositPolicy;
    if (!policy || !policy.enabled) {
      return NextResponse.json(
        { error: "Le dépôt de garantie n'est pas requis pour cette annonce" },
        { status: 400 }
      );
    }

    // Créer le hold
    const result = await createDepositHold(
      bookingId,
      policy.amountCents,
      policy.currency
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      depositId: result.depositId,
      clientSecret: result.clientSecret,
      amount: policy.amountCents,
      currency: policy.currency,
    });
  } catch (error) {
    console.error("[API] Erreur création dépôt:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
