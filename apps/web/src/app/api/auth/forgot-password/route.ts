// apps/web/src/app/api/auth/forgot-password/route.ts
// API pour la réinitialisation du mot de passe

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateVerificationCode, validatePassword, hashPassword, verifyPassword } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { authRateLimiter, withRateLimit } from "@/lib/security/rate-limit";
import { sanitizeEmail } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

// Rate limit: 3 demandes par 15 minutes par IP
const FORGOT_PASSWORD_RATE_LIMIT = 3;
const FORGOT_PASSWORD_WINDOW_MS = 15 * 60_000;

// Nombre maximum d'anciens mots de passe à vérifier
const PASSWORD_HISTORY_LIMIT = 5;

/**
 * POST /api/auth/forgot-password
 * Envoyer un code de réinitialisation par email
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting avec Upstash
    const rateLimitResult = await withRateLimit(req, authRateLimiter);
    if ('success' in rateLimitResult && rateLimitResult.success !== true) {
      return rateLimitResult;
    }

    // Rate limiting legacy (double protection)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`forgot-password:${ip}`, FORGOT_PASSWORD_RATE_LIMIT, FORGOT_PASSWORD_WINDOW_MS);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Trop de demandes. Réessayez dans 15 minutes.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Sanitize email input
    const normalizedEmail = sanitizeEmail(email);
    if (!normalizedEmail) {
      return NextResponse.json({ error: "Format d'email invalide" }, { status: 400 });
    }

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
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting avec Upstash
    const rateLimitResult = await withRateLimit(req, authRateLimiter);
    if ('success' in rateLimitResult && rateLimitResult.success !== true) {
      return rateLimitResult as NextResponse;
    }

    // Rate limiting legacy (double protection)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`reset-password:${ip}`, 5, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans une minute.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await req.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json({
        error: "Email, code et nouveau mot de passe requis",
      }, { status: 400 });
    }

    // Sanitize email input
    const normalizedEmail = sanitizeEmail(email);
    if (!normalizedEmail) {
      return NextResponse.json({ error: "Format d'email invalide" }, { status: 400 });
    }

    // Valider le nouveau mot de passe
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return NextResponse.json({
        error: "Mot de passe invalide",
        details: validation.errors,
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        passwordHash: true,
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

    // ====== SÉCURITÉ: Vérifier que le nouveau mot de passe n'est pas identique à l'actuel ======
    if (user.passwordHash) {
      const isSameAsCurrent = await verifyPassword(newPassword, user.passwordHash);
      if (isSameAsCurrent) {
        return NextResponse.json({
          error: "Le nouveau mot de passe doit être différent de l'actuel.",
          code: "SAME_PASSWORD",
        }, { status: 400 });
      }
    }

    // ====== SÉCURITÉ: Vérifier l'historique des mots de passe ======
    const passwordHistory = await prisma.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: PASSWORD_HISTORY_LIMIT,
      select: { passwordHash: true },
    });

    for (const oldPassword of passwordHistory) {
      const matchesOld = await verifyPassword(newPassword, oldPassword.passwordHash);
      if (matchesOld) {
        return NextResponse.json({
          error: "Ce mot de passe a déjà été utilisé. Veuillez en choisir un différent.",
          code: "PASSWORD_REUSED",
        }, { status: 400 });
      }
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await hashPassword(newPassword);

    // Sauvegarder l'ancien mot de passe dans l'historique (si existant)
    if (user.passwordHash) {
      await prisma.passwordHistory.create({
        data: {
          userId: user.id,
          passwordHash: user.passwordHash,
        },
      });

      // Nettoyer l'historique ancien (garder seulement les N derniers)
      const oldEntries = await prisma.passwordHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip: PASSWORD_HISTORY_LIMIT,
        select: { id: true },
      });

      if (oldEntries.length > 0) {
        await prisma.passwordHistory.deleteMany({
          where: { id: { in: oldEntries.map(e => e.id) } },
        });
      }
    }

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
