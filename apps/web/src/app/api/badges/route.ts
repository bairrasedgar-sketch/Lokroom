import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { badgeInfo, BADGE_TYPES } from "@/lib/badges";
import { generateBadgeId } from "@/lib/crypto/random";

// GET /api/badges - Récupérer les badges d'un utilisateur
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 });
  }

  const badges = await prisma.userBadge.findMany({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { earnedAt: "desc" },
  });

  // Enrichir avec les infos de badge
  const enrichedBadges = badges.map((badge) => ({
    ...badge,
    info: badgeInfo[badge.type] || {
      name: badge.type,
      description: "",
      icon: "🎖️",
      color: "bg-gray-100 text-gray-800",
    },
  }));

  return NextResponse.json({ badges: enrichedBadges });
}

// POST /api/badges - Attribuer un badge (admin uniquement ou automatique)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifier que c'est un admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !["ADMIN", "SUPERADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, badgeType, expiresAt, metadata } = body;

    if (!userId || !badgeType) {
      return NextResponse.json({ error: "userId et badgeType requis" }, { status: 400 });
    }

    // Vérifier que le type de badge est valide
    if (!BADGE_TYPES.includes(badgeType)) {
      return NextResponse.json({ error: "Type de badge invalide" }, { status: 400 });
    }

    // Créer ou mettre à jour le badge
    const badge = await prisma.userBadge.upsert({
      where: {
        userId_type: {
          userId,
          type: badgeType,
        },
      },
      update: {
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        metadata: metadata || undefined,
      },
      create: {
        id: generateBadgeId(), // 🔒 SÉCURITÉ : Utilise crypto au lieu de Math.random()
        userId,
        type: badgeType,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        metadata: metadata || null,
      },
    });

    return NextResponse.json({ success: true, badge });
  } catch (error) {
    console.error("Error creating badge:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/badges - Retirer un badge (admin uniquement)
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Vérifier que c'est un admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !["ADMIN", "SUPERADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const badgeId = searchParams.get("badgeId");

  if (!badgeId) {
    return NextResponse.json({ error: "badgeId requis" }, { status: 400 });
  }

  await prisma.userBadge.delete({
    where: { id: badgeId },
  });

  return NextResponse.json({ success: true });
}
