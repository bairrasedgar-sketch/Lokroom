// POST /api/auth/2fa/verify - Verifier le code 2FA lors de la connexion
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import {
  decryptSecret,
  verifyTwoFactorCode,
} from "@/lib/2fa";
import { verifyTwoFactorPendingToken } from "@/lib/2fa-token";
import { logger } from "@/lib/logger";


export async function POST(req: NextRequest) {
  try {
    // Parser le body
    const body = await req.json();
    const { token, code } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token requis" }, { status: 400 });
    }

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code requis" }, { status: 400 });
    }

    // Verifier le token temporaire
    const tokenPayload = await verifyTwoFactorPendingToken(token);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: "Session expiree. Veuillez vous reconnecter." },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(`2fa-verify:${tokenPayload.userId}`, 5, 60000);
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: "Trop de tentatives. Reessayez dans une minute." },
        { status: 429 }
      );
    }

    // Recuperer l'utilisateur et son secret 2FA
    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.userId },
      include: { twoFactorSecret: true },
    });

    if (!user || !user.twoFactorSecret?.enabled) {
      return NextResponse.json(
        { error: "2FA non configure pour cet utilisateur" },
        { status: 400 }
      );
    }

    // Dechiffrer le secret
    const secret = decryptSecret(user.twoFactorSecret.secret);

    // Verifier le code (TOTP ou code de secours)
    const verifyResult = await verifyTwoFactorCode(
      code,
      secret,
      user.twoFactorSecret.backupCodes
    );

    // Logger la tentative
    await prisma.twoFactorLog.create({
      data: {
        userId: user.id,
        method: verifyResult.method || "UNKNOWN",
        success: verifyResult.success,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    if (!verifyResult.success) {
      return NextResponse.json(
        { error: "Code invalide" },
        { status: 400 }
      );
    }

    // Si un code de secours a ete utilise, le supprimer
    if (verifyResult.method === "BACKUP_CODE" && verifyResult.usedBackupCodeIndex !== undefined) {
      const updatedBackupCodes = [...user.twoFactorSecret.backupCodes];
      updatedBackupCodes.splice(verifyResult.usedBackupCodeIndex, 1);

      await prisma.twoFactorSecret.update({
        where: { userId: user.id },
        data: { backupCodes: updatedBackupCodes },
      });
    }

    // Mettre a jour la derniere connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      method: verifyResult.method,
      remainingBackupCodes: verifyResult.method === "BACKUP_CODE"
        ? user.twoFactorSecret.backupCodes.length - 1
        : undefined,
    });
  } catch (error) {
    logger.error("[2FA Verify] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la verification" },
      { status: 500 }
    );
  }
}
