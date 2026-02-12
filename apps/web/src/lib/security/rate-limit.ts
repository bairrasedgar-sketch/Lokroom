/**
 * Lok'Room - Rate Limiting avec Upstash Redis
 * Protection contre les abus et attaques DDoS
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";


// Initialiser Redis (utilise les variables d'env UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// ============================================
// RATE LIMITERS PAR CATÉGORIE
// ============================================

/**
 * Rate limiter pour les routes d'authentification
 * 5 requêtes par minute par IP
 */
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "ratelimit:auth",
});

/**
 * Rate limiter pour les routes API sensibles (bookings, messages)
 * 100 requêtes par minute par IP
 */
export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit:api",
});

/**
 * Rate limiter pour les routes publiques (listings, search)
 * 1000 requêtes par minute par IP
 */
export const publicRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, "1 m"),
  analytics: true,
  prefix: "ratelimit:public",
});

/**
 * Rate limiter strict pour les actions critiques (paiements, modifications)
 * 10 requêtes par minute par IP
 */
export const strictRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "ratelimit:strict",
});

// ============================================
// HELPERS
// ============================================

/**
 * Extrait l'identifiant unique de la requête (IP uniquement)
 * @deprecated Utiliser getIdentifierWithAuth() pour inclure le user ID
 */
export function getIdentifier(req: NextRequest): string {
  // Priorité 1: IP réelle (Vercel, Cloudflare, etc.)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  // Priorité 2: IP Vercel
  const vercelIp = req.headers.get("x-real-ip");
  if (vercelIp) {
    return vercelIp;
  }

  // Fallback: IP de connexion
  return req.ip || "unknown";
}

/**
 * 🔒 SÉCURITÉ AMÉLIORÉE : Extrait l'identifiant avec priorité au user ID
 *
 * Priorité des identifiants :
 * 1. User ID (si authentifié) - Impossible à contourner
 * 2. IP (si non authentifié) - Peut être contourné avec VPN
 *
 * Avantages :
 * - Empêche les utilisateurs authentifiés de contourner le rate limiting avec un VPN
 * - Permet un rate limiting plus strict par utilisateur
 * - Protège mieux contre les abus
 */
export function getIdentifierWithAuth(req: NextRequest, userId?: string | null): string {
  // Priorité 1: User ID si authentifié (impossible à contourner)
  if (userId) {
    return `user:${userId}`;
  }

  // Priorité 2: IP pour les utilisateurs non authentifiés
  return `ip:${getIdentifier(req)}`;
}

/**
 * Middleware de rate limiting avec support du user ID
 * Retourne NextResponse si rate limit dépassé, sinon { success: true }
 *
 * @param req - NextRequest
 * @param limiter - Ratelimit instance
 * @param userId - User ID optionnel (si authentifié)
 */
export async function withRateLimit(
  req: NextRequest,
  limiter: Ratelimit,
  userId?: string | null
): Promise<NextResponse | { success: true }> {
  // Si Redis n'est pas configuré, skip le rate limiting en dev
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === "development") {
      logger.warn("[RateLimit] Redis non configuré - rate limiting désactivé");
      return { success: true };
    }
    // En production, bloquer si Redis n'est pas configuré
    return NextResponse.json(
      { error: "Service temporairement indisponible" },
      { status: 503 }
    );
  }

  // Utiliser getIdentifierWithAuth pour inclure le user ID si disponible
  const id = getIdentifierWithAuth(req, userId);

  try {
    const { success, limit, remaining, reset } = await limiter.limit(id);

    if (!success) {
      return NextResponse.json(
        {
          error: "Trop de requêtes. Veuillez réessayer plus tard.",
          limit,
          remaining: 0,
          reset: new Date(reset).toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return { success: true };
  } catch (error) {
    logger.error("[RateLimit] Erreur:", error);
    // En cas d'erreur Redis, laisser passer la requête (fail-open)
    return { success: true };
  }
}

/**
 * 🔒 SÉCURITÉ AMÉLIORÉE : Rate limiting avec authentification automatique
 *
 * Cette fonction récupère automatiquement le user ID depuis la session NextAuth
 * et l'utilise pour le rate limiting. Cela empêche les utilisateurs authentifiés
 * de contourner le rate limiting avec un VPN.
 *
 * @param req - NextRequest
 * @param limiter - Ratelimit instance
 * @returns NextResponse si rate limit dépassé, sinon { success: true, userId?: string }
 */
export async function withRateLimitAuth(
  req: NextRequest,
  limiter: Ratelimit
): Promise<NextResponse | { success: true; userId?: string }> {
  // Récupérer la session NextAuth
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || null;

  // Appliquer le rate limiting avec le user ID si disponible
  const result = await withRateLimit(req, limiter, userId);

  // Si le rate limiting a réussi, retourner le userId pour éviter de refaire la requête
  if (result instanceof NextResponse) {
    return result;
  }

  return { success: true, userId: userId || undefined };
}

/**
 * Wrapper pour créer un handler API avec rate limiting automatique
 * @deprecated Utiliser withRateLimitAuth() pour inclure le user ID
 */
export function withRateLimitHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limiter: Ratelimit
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResult = await withRateLimit(req, limiter);

    if (rateLimitResult instanceof NextResponse) {
      return rateLimitResult;
    }

    return handler(req);
  };
}
