// apps/web/src/app/api/auth/login/route.ts
// API pour la connexion avec email + mot de passe

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { authRateLimiter, withRateLimit } from "@/lib/security/rate-limit";
import { sanitizeEmail } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

// Rate limit: 5 tentatives par minute par IP pour login
const LOGIN_RATE_LIMIT = 5;
const LOGIN_WINDOW_MS = 60_000;

/**
 * POST /api/auth/login
 * Vérifier les credentials email + mot de passe
 * (utilisé par NextAuth Credentials provider)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
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
    const { ok: rateLimitOk } = await rateLimit(`login:${ip}`, LOGIN_RATE_LIMIT, LOGIN_WINDOW_MS);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans une minute.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({
        error: "Email et mot de passe requis",
      }, { status: 400 });
    }

    // Sanitize email input
    const normalizedEmail = sanitizeEmail(email);
    if (!normalizedEmail) {
      return NextResponse.json({
        error: "Format d'email invalide",
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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
        hostProfile: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      // Ne pas révéler si l'email existe ou non
      return NextResponse.json({
        error: "Email ou mot de passe incorrect",
        code: "INVALID_CREDENTIALS",
      }, { status: 401 });
    }

    // Vérifier si l'utilisateur a un mot de passe
    if (!user.passwordHash) {
      return NextResponse.json({
        error: "Ce compte n'a pas de mot de passe. Connectez-vous avec le lien par email.",
        code: "NO_PASSWORD",
        hasPassword: false,
      }, { status: 400 });
    }

    // Vérifier le mot de passe
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({
        error: "Email ou mot de passe incorrect",
        code: "INVALID_CREDENTIALS",
      }, { status: 401 });
    }

    // Mettre à jour la dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Retourner les infos utilisateur (sans le passwordHash)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim(),
        role: user.role,
        isHost: !!user.hostProfile,
        emailVerified: user.emailVerified,
        image: user.profile?.avatarUrl || null,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * GET /api/auth/login?email=xxx
 * Vérifier si un email existe et a un mot de passe configuré
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting pour éviter l'énumération d'emails
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";
    const { ok: rateLimitOk } = await rateLimit(`login-check:${ip}`, 10, LOGIN_WINDOW_MS);

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans une minute.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        exists: false,
        hasPassword: false,
      });
    }

    return NextResponse.json({
      exists: true,
      hasPassword: !!user.passwordHash,
    });
  } catch (error) {
    console.error("GET /api/auth/login error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
