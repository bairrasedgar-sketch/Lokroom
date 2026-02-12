// apps/web/src/app/api/auth/mobile/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { generateMobileAuthToken } from "@/lib/auth/jwt";
import { logger } from "@/lib/logger";


/**
 * POST /api/auth/mobile/login
 * Authentification mobile avec JWT
 *
 * Body: { email: string, password: string }
 * Returns: { token: string, user: {...} }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        emailVerified: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        twoFactorSecret: {
          select: { enabled: true },
        },
      },
    });

    // Vérifier que l'utilisateur existe
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Vérifier si 2FA est activé
    if (user.twoFactorSecret?.enabled) {
      return NextResponse.json(
        {
          error: "2FA activé",
          code: "2FA_REQUIRED",
          message: "L'authentification à deux facteurs n'est pas encore supportée sur mobile. Veuillez désactiver le 2FA depuis le site web.",
        },
        { status: 403 }
      );
    }

    // Générer le JWT
    const token = await generateMobileAuthToken(
      user.id,
      user.email,
      user.role
    );

    // Mettre à jour la dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Retourner le token et les infos utilisateur
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() || null,
        image: user.profile?.avatarUrl || null,
        role: user.role,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
      },
    });
  } catch (error) {
    logger.error("[Mobile Auth] Login error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }
}
