// POST /api/auth/2fa/disable - Desactiver le 2FA
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password";
import { logger } from "@/lib/logger";


export async function POST(req: NextRequest) {
  try {
    // Verifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(`2fa-disable:${session.user.email}`, 5, 60000);
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: "Trop de tentatives. Reessayez dans une minute." },
        { status: 429 }
      );
    }

    // Parser le body
    const body = await req.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
    }

    // Recuperer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { twoFactorSecret: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 });
    }

    // Verifier que le 2FA est active
    if (!user.twoFactorSecret?.enabled) {
      return NextResponse.json(
        { error: "Le 2FA n'est pas active" },
        { status: 400 }
      );
    }

    // Verifier le mot de passe
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Vous devez avoir un mot de passe pour desactiver le 2FA" },
        { status: 400 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      // Logger l'echec
      await prisma.twoFactorLog.create({
        data: {
          userId: user.id,
          method: "DISABLE_ATTEMPT",
          success: false,
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
          userAgent: req.headers.get("user-agent") || null,
        },
      });

      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 400 }
      );
    }

    // Supprimer le secret 2FA
    await prisma.twoFactorSecret.delete({
      where: { userId: user.id },
    });

    // Logger la desactivation
    await prisma.twoFactorLog.create({
      data: {
        userId: user.id,
        method: "DISABLED",
        success: true,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "L'authentification a deux facteurs a ete desactivee",
    });
  } catch (error) {
    logger.error("[2FA Disable] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la desactivation du 2FA" },
      { status: 500 }
    );
  }
}
