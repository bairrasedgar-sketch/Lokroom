// apps/web/src/app/api/auth/forgot-password/route.ts
// API pour la réinitialisation du mot de passe

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateVerificationCode, validatePassword, hashPassword } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/forgot-password
 * Envoyer un code de réinitialisation par email
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, profile: { select: { firstName: true } } },
    });

    // Toujours retourner succès pour ne pas révéler si l'email existe
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Si cet email existe, un code de réinitialisation a été envoyé.",
      });
    }

    // Générer un code à 6 chiffres
    const resetCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Sauvegarder le code dans la base
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetCode,
        resetTokenExpiresAt: expiresAt,
      },
    });

    // Envoyer l'email avec le code
    await sendPasswordResetEmail({
      to: user.email,
      firstName: user.profile?.firstName || undefined,
      code: resetCode,
    });

    return NextResponse.json({
      success: true,
      message: "Si cet email existe, un code de réinitialisation a été envoyé.",
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PUT /api/auth/forgot-password
 * Vérifier le code et réinitialiser le mot de passe
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json({
        error: "Email, code et nouveau mot de passe requis",
      }, { status: 400 });
    }

    // Valider le nouveau mot de passe
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return NextResponse.json({
        error: "Mot de passe invalide",
        details: validation.errors,
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        resetToken: true,
        resetTokenExpiresAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        error: "Code invalide ou expiré",
        code: "INVALID_CODE",
      }, { status: 400 });
    }

    // Vérifier le code
    if (user.resetToken !== code) {
      return NextResponse.json({
        error: "Code invalide ou expiré",
        code: "INVALID_CODE",
      }, { status: 400 });
    }

    // Vérifier l'expiration
    if (!user.resetTokenExpiresAt || new Date() > user.resetTokenExpiresAt) {
      return NextResponse.json({
        error: "Code expiré. Veuillez demander un nouveau code.",
        code: "CODE_EXPIRED",
      }, { status: 400 });
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await hashPassword(newPassword);

    // Mettre à jour le mot de passe et effacer le token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error) {
    console.error("PUT /api/auth/forgot-password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
