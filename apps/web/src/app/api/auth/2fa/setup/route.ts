// POST /api/auth/2fa/setup - Initialiser la configuration 2FA
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import {
  generateSecret,
  generateQRCode,
  encryptSecret,
  formatSecretForDisplay,
} from "@/lib/2fa";

export async function POST(req: NextRequest) {
  try {
    // Verifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(`2fa-setup:${session.user.email}`, 5, 60000);
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: "Trop de tentatives. Reessayez dans une minute." },
        { status: 429 }
      );
    }

    // Recuperer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { twoFactorSecret: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 });
    }

    // Verifier si 2FA est deja active
    if (user.twoFactorSecret?.enabled) {
      return NextResponse.json(
        { error: "L'authentification a deux facteurs est deja activee" },
        { status: 400 }
      );
    }

    // Generer un nouveau secret
    const secret = generateSecret();
    const encryptedSecret = encryptSecret(secret);

    // Generer le QR code
    const qrCode = await generateQRCode(secret, user.email);

    // Sauvegarder le secret (non active)
    await prisma.twoFactorSecret.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        secret: encryptedSecret,
        backupCodes: [],
        enabled: false,
      },
      update: {
        secret: encryptedSecret,
        backupCodes: [],
        enabled: false,
      },
    });

    // Logger l'action
    await prisma.twoFactorLog.create({
      data: {
        userId: user.id,
        method: "SETUP_INITIATED",
        success: true,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({
      success: true,
      qrCode,
      secret: formatSecretForDisplay(secret),
      message: "Scannez le QR code avec votre application d'authentification",
    });
  } catch (error) {
    logger.error("[2FA Setup] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'initialisation du 2FA" },
      { status: 500 }
    );
  }
}
