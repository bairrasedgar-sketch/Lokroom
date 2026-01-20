// apps/web/src/lib/rate-limit.ts

/**
 * Rate limiting avec Redis (Upstash) pour une protection robuste en production.
 * Utilise l'algorithme sliding window pour un rate limiting précis.
 */

import { Redis } from "@upstash/redis";

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 20;

// Initialiser Redis uniquement si les variables d'environnement sont présentes
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Fallback en mémoire pour le développement local
const memoryBuckets = new Map<string, { count: number; expiresAt: number }>();

export async function rateLimit(
  key: string,
  maxRequests = MAX_REQUESTS,
  windowMs = WINDOW_MS
): Promise<{ ok: boolean; remaining: number }> {
  // Si Redis est disponible, l'utiliser
  if (redis) {
    return rateLimitRedis(key, maxRequests, windowMs);
  }

  // Sinon, fallback en mémoire (dev uniquement)
  return rateLimitMemory(key, maxRequests, windowMs);
}

/**
 * Rate limiting avec Redis (production)
 */
async function rateLimitRedis(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ ok: boolean; remaining: number }> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `ratelimit:${key}`;

  try {
    // Utiliser une transaction Redis pour garantir l'atomicité
    const pipeline = redis!.pipeline();

    // Supprimer les entrées expirées
    pipeline.zremrangebyscore(redisKey, 0, windowStart);

    // Compter les requêtes dans la fenêtre
    pipeline.zcard(redisKey);

    // Ajouter la requête actuelle
    pipeline.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` });

    // Définir l'expiration de la clé
    pipeline.expire(redisKey, Math.ceil(windowMs / 1000));

    const results = await pipeline.exec();
    const count = (results[1] as number) || 0;

    if (count >= maxRequests) {
      // Supprimer la requête qu'on vient d'ajouter car elle dépasse la limite
      await redis!.zpopmax(redisKey);
      return { ok: false, remaining: 0 };
    }

    return {
      ok: true,
      remaining: maxRequests - count - 1,
    };
  } catch (error) {
    console.error("[Rate Limit] Redis error, falling back to memory:", error);
    return rateLimitMemory(key, maxRequests, windowMs);
  }
}

/**
 * Rate limiting en mémoire (fallback pour dev)
 */
function rateLimitMemory(
  key: string,
  maxRequests: number,
  windowMs: number
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const current = memoryBuckets.get(key);

  if (!current || current.expiresAt < now) {
    memoryBuckets.set(key, {
      count: 1,
      expiresAt: now + windowMs,
    });
    return { ok: true, remaining: maxRequests - 1 };
  }

  if (current.count >= maxRequests) {
    return { ok: false, remaining: 0 };
  }

  current.count += 1;
  memoryBuckets.set(key, current);

  return {
    ok: true,
    remaining: maxRequests - current.count,
  };
}
