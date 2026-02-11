/**
 * Lok'Room - Rate Limiting avec Upstash Redis
 * Protection contre les abus et attaques DDoS
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

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
 * Extrait l'identifiant unique de la requête (IP ou user ID)
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
 * Middleware de rate limiting
 * Retourne une réponse 429 si la limite est dépassée
 */
export async function withRateLimit(
  req: NextRequest,
  limiter: Ratelimit,
  identifier?: string
): Promise<{ success: true } | NextResponse> {
  // Si Redis n'est pas configuré, skip le rate limiting en dev
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[RateLimit] Redis non configuré - rate limiting désactivé");
      return { success: true };
    }
    // En production, bloquer si Redis n'est pas configuré
    return NextResponse.json(
      { error: "Service temporairement indisponible" },
      { status: 503 }
    );
  }

  const id = identifier || getIdentifier(req);

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
    console.error("[RateLimit] Erreur:", error);
    // En cas d'erreur Redis, laisser passer la requête (fail-open)
    return { success: true };
  }
}

/**
 * Wrapper pour créer un handler API avec rate limiting automatique
 */
export function withRateLimitHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limiter: Ratelimit
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResult = await withRateLimit(req, limiter);

    if (rateLimitResult.success !== true) {
      return rateLimitResult;
    }

    return handler(req);
  };
}
