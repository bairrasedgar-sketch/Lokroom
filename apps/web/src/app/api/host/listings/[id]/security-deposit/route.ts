// apps/web/src/app/api/host/listings/[id]/security-deposit/route.ts
/**
 * GET/PUT /api/host/listings/[id]/security-deposit
 * Gestion de la politique de dépôt de garantie pour une annonce
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDepositPolicy, upsertDepositPolicy } from "@/lib/security-deposit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: listingId } = await params;

    // Vérifier que l'utilisateur est le propriétaire de l'annonce
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
    }

    if (listing.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Récupérer la politique
    const policy = await getDepositPolicy(listingId);

    return NextResponse.json({
      policy: policy || {
        enabled: false,
        amountCents: 20000, // 200€ par défaut
        currency: "EUR",
        description: null,
        refundDays: 7,
      },
    });
  } catch (error) {
    console.error("[API] Erreur récupération politique dépôt:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: listingId } = await params;
    const body = await req.json();

    // Vérifier que l'utilisateur est le propriétaire de l'annonce
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { ownerId: true, currency: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
    }

    if (listing.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Validation
    const { enabled, amount, description, refundDays } = body;

    if (enabled && (!amount || amount <= 0)) {
      return NextResponse.json(
        { error: "Le montant de la caution doit être supérieur à 0" },
        { status: 400 }
      );
    }

    if (refundDays !== undefined && (refundDays < 1 || refundDays > 30)) {
      return NextResponse.json(
        { error: "Le délai de remboursement doit être entre 1 et 30 jours" },
        { status: 400 }
      );
    }

    // Convertir le montant en centimes
    const amountCents = Math.round((amount || 200) * 100);

    // Mettre à jour la politique
    const result = await upsertDepositPolicy(listingId, {
      enabled: enabled || false,
      amountCents,
      currency: listing.currency || "EUR",
      description: description || null,
      refundDays: refundDays || 7,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      policy: result.policy,
    });
  } catch (error) {
    console.error("[API] Erreur mise à jour politique dépôt:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
