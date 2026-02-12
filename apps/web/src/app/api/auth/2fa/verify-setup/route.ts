// POST /api/auth/2fa/verify-setup - Verifier et activer le 2FA
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import {
  decryptSecret,
  verifyToken,
  generateBackupCodes,
  hashBackupCodes,
} from "@/lib/2fa";

export async function POST(req: NextRequest) {
  try {
    // Verifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    // Rate limiting (plus strict pour la verification)
    const rateLimitResult = await rateLimit(`2fa-verify-setup:${session.user.email}`, 10, 60000);
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: "Trop de tentatives. Reessayez dans une minute." },
        { status: 429 }
      );
    }

    // Parser le body
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code requis" }, { status: 400 });
    }

    // Recuperer l'utilisateur et son secret 2FA
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { twoFactorSecret: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 });
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: "Veuillez d'abord initialiser le 2FA" },
        { status: 400 }
      );
    }

    if (user.twoFactorSecret.enabled) {
      return NextResponse.json(
        { error: "Le 2FA est deja active" },
        { status: 400 }
      );
    }

    // Dechiffrer le secret et verifier le code
    const secret = decryptSecret(user.twoFactorSecret.secret);
    const isValid = verifyToken(secret, code);

    // Logger la tentative
    await prisma.twoFactorLog.create({
      data: {
        userId: user.id,
        method: "TOTP",
        success: isValid,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Code invalide. Verifiez que l'heure de votre appareil est correcte." },
        { status: 400 }
      );
    }

    // Generer les codes de secours
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    // Activer le 2FA
    await prisma.twoFactorSecret.update({
      where: { userId: user.id },
      data: {
        enabled: true,
        backupCodes: hashedBackupCodes,
      },
    });

    // Logger l'activation
    await prisma.twoFactorLog.create({
      data: {
        userId: user.id,
        method: "SETUP_COMPLETED",
        success: true,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({
      success: true,
      backupCodes,
      message: "L'authentification a deux facteurs est maintenant activee. Conservez vos codes de secours en lieu sur.",
    });
  } catch (error) {
    logger.error("[2FA Verify Setup] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'activation du 2FA" },
      { status: 500 }
    );
  }
}
