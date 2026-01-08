// apps/web/src/app/api/auth/signup/route.ts
/**
 * API pour l'inscription avec code de vérification par email
 *
 * POST /api/auth/signup - Envoyer un code de vérification
 * PUT /api/auth/signup - Vérifier le code et créer le compte
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateVerificationCode } from "@/lib/password";
import { sendEmailVerificationCode } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { SignJWT } from "jose";

export const dynamic = "force-dynamic";

// Rate limit: 5 demandes par 15 minutes par IP
const SIGNUP_RATE_LIMIT = 5;
const SIGNUP_WINDOW_MS = 15 * 60_000;

// Durée de validité du code: 15 minutes
const CODE_EXPIRY_MINUTES = 15;

// Clé pour signer les tokens
const AUTH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-key"
);

/**
 * Génère un token JWT pour la connexion après vérification d'email
 */
async function generateEmailVerificationToken(userId: string, email: string): Promise<string> {
  return new SignJWT({
    userId,
    email,
    type: "email-verified",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m") // Token valide 5 minutes
    .sign(AUTH_TOKEN_SECRET);
}

/**
 * POST /api/auth/signup
 * Envoyer un code de vérification par email pour l'inscription
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting par IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`signup:${ip}`, SIGNUP_RATE_LIMIT, SIGNUP_WINDOW_MS);

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

    const normalizedEmail = email.trim().toLowerCase();

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "Format d'email invalide" }, { status: 400 });
    }

    // Vérifier si l'email existe déjà avec un compte vérifié
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        emailVerified: true,
        passwordHash: true,
      },
    });

    // Si l'utilisateur existe et a un mot de passe, il doit se connecter
    if (existingUser?.passwordHash) {
      return NextResponse.json({
        error: "Un compte existe déjà avec cet email. Connectez-vous.",
        code: "ACCOUNT_EXISTS",
        hasPassword: true,
      }, { status: 400 });
    }

    // Générer un code à 6 chiffres
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    if (existingUser) {
      // Mettre à jour l'utilisateur existant (compte OAuth sans mot de passe)
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          emailVerificationCode: verificationCode,
          emailVerificationCodeExpiresAt: expiresAt,
        },
      });
    } else {
      // Créer un nouvel utilisateur en attente de vérification
      await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          emailVerificationCode: verificationCode,
          emailVerificationCodeExpiresAt: expiresAt,
        },
        create: {
          email: normalizedEmail,
          emailVerificationCode: verificationCode,
          emailVerificationCodeExpiresAt: expiresAt,
        },
      });
    }

    // Envoyer l'email avec le code
    await sendEmailVerificationCode({
      to: normalizedEmail,
      code: verificationCode,
    });

    return NextResponse.json({
      success: true,
      message: "Code de vérification envoyé par email.",
      expiresInMinutes: CODE_EXPIRY_MINUTES,
    });
  } catch (error) {
    console.error("POST /api/auth/signup error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PUT /api/auth/signup
 * Vérifier le code et finaliser l'inscription
 */
export async function PUT(req: NextRequest) {
  try {
    // Rate limiting par IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`verify-signup:${ip}`, 10, 60_000);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans une minute.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({
        error: "Email et code requis",
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        emailVerificationCode: true,
        emailVerificationCodeExpiresAt: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        error: "Code invalide ou expiré",
        code: "INVALID_CODE",
      }, { status: 400 });
    }

    // Vérifier le code
    if (user.emailVerificationCode !== normalizedCode) {
      return NextResponse.json({
        error: "Code invalide ou expiré",
        code: "INVALID_CODE",
      }, { status: 400 });
    }

    // Vérifier l'expiration
    if (!user.emailVerificationCodeExpiresAt || new Date() > user.emailVerificationCodeExpiresAt) {
      return NextResponse.json({
        error: "Code expiré. Veuillez demander un nouveau code.",
        code: "CODE_EXPIRED",
      }, { status: 400 });
    }

    // Marquer l'email comme vérifié et effacer le code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationCode: null,
        emailVerificationCodeExpiresAt: null,
      },
    });

    // Générer un token pour la connexion automatique
    const verificationToken = await generateEmailVerificationToken(user.id, normalizedEmail);

    return NextResponse.json({
      success: true,
      message: "Email vérifié avec succès",
      userId: user.id,
      verificationToken,
    });
  } catch (error) {
    console.error("PUT /api/auth/signup error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
