// POST /api/auth/2fa/backup-codes/regenerate - Regenerer les codes de secours
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

    // Rate limiting
    const rateLimitResult = await rateLimit(`2fa-regenerate:${session.user.email}`, 3, 60000);
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
      return NextResponse.json({ error: "Code TOTP requis" }, { status: 400 });
    }

    // Recuperer l'utilisateur et son secret 2FA
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { twoFactorSecret: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 });
    }

    if (!user.twoFactorSecret?.enabled) {
      return NextResponse.json(
        { error: "Le 2FA n'est pas active" },
        { status: 400 }
      );
    }

    // Dechiffrer le secret et verifier le code TOTP
    const secret = decryptSecret(user.twoFactorSecret.secret);
    const isValid = verifyToken(secret, code);

    // Logger la tentative
    await prisma.twoFactorLog.create({
      data: {
        userId: user.id,
        method: "BACKUP_REGENERATE_ATTEMPT",
        success: isValid,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Code TOTP invalide" },
        { status: 400 }
      );
    }

    // Generer de nouveaux codes de secours
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    // Mettre a jour les codes
    await prisma.twoFactorSecret.update({
      where: { userId: user.id },
      data: { backupCodes: hashedBackupCodes },
    });

    // Logger la regeneration
    await prisma.twoFactorLog.create({
      data: {
        userId: user.id,
        method: "BACKUP_REGENERATED",
        success: true,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({
      success: true,
      backupCodes,
      message: "Nouveaux codes de secours generes. Les anciens codes ne sont plus valides.",
    });
  } catch (error) {
    logger.error("[2FA Regenerate Backup] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la regeneration des codes" },
      { status: 500 }
    );
  }
}
