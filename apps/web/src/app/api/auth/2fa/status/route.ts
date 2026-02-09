// GET /api/auth/2fa/status - Obtenir le statut 2FA de l'utilisateur
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Verifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    // Recuperer l'utilisateur et son secret 2FA
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        twoFactorSecret: {
          select: {
            enabled: true,
            backupCodes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 });
    }

    // Compter les logs 2FA recents
    const recentLogs = await prisma.twoFactorLog.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        method: true,
        success: true,
        createdAt: true,
        ipAddress: true,
      },
    });

    return NextResponse.json({
      enabled: user.twoFactorSecret?.enabled || false,
      hasPassword: !!user.passwordHash,
      backupCodesRemaining: user.twoFactorSecret?.backupCodes.length || 0,
      setupDate: user.twoFactorSecret?.createdAt || null,
      lastUpdated: user.twoFactorSecret?.updatedAt || null,
      recentActivity: recentLogs,
    });
  } catch (error) {
    console.error("[2FA Status] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation du statut" },
      { status: 500 }
    );
  }
}
