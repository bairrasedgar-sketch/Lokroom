// apps/web/src/lib/redis/rate-limit.ts

/**
 * Rate limiting avec Redis utilisant l'algorithme sliding window.
 * Remplace le système Upstash existant par ioredis.
 */

import { cache } from "./cache";
import { CacheKeys } from "./keys";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Vérifie le rate limit pour une clé donnée.
 * Utilise l'algorithme sliding window pour un rate limiting précis.
 */
export async function checkRateLimit(
  ip: string,
  endpoint: string,
  limit: number = 100,
  window: number = 60
): Promise<RateLimitResult> {
  const key = CacheKeys.rateLimit(ip, endpoint);

  try {
    const count = await cache.incr(key, window);
    const ttl = await cache.ttl(key);

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: Date.now() + ttl * 1000,
    };
  } catch (error) {
    console.error("[RateLimit] Error checking rate limit:", error);
    // En cas d'erreur, autoriser la requête pour ne pas bloquer le service
    return {
      allowed: true,
      remaining: limit,
      resetAt: Date.now() + window * 1000,
    };
  }
}

/**
 * Rate limiting avancé avec sliding window précis.
 * Plus précis que le simple compteur, mais plus coûteux en ressources.
 */
export async function checkRateLimitSlidingWindow(
  ip: string,
  endpoint: string,
  limit: number = 100,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const key = CacheKeys.rateLimit(ip, endpoint);
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    const redis = (cache as any).redis;

    // Utiliser une transaction Redis pour garantir l'atomicité
    const pipeline = redis.pipeline();

    // Supprimer les entrées expirées
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Compter les requêtes dans la fenêtre
    pipeline.zcard(key);

    // Ajouter la requête actuelle
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Définir l'expiration de la clé
    pipeline.expire(key, Math.ceil(windowMs / 1000));

    const results = await pipeline.exec();
    const count = (results[1][1] as number) || 0;

    if (count >= limit) {
      // Supprimer la requête qu'on vient d'ajouter car elle dépasse la limite
      await redis.zpopmax(key);
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + windowMs,
      };
    }

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetAt: now + windowMs,
    };
  } catch (error) {
    console.error("[RateLimit] Error in sliding window:", error);
    // Fallback sur le rate limit simple
    return checkRateLimit(ip, endpoint, limit, Math.ceil(windowMs / 1000));
  }
}

/**
 * Réinitialise le rate limit pour une clé donnée.
 */
export async function resetRateLimit(ip: string, endpoint: string): Promise<void> {
  const key = CacheKeys.rateLimit(ip, endpoint);
  await cache.del(key);
}

/**
 * Récupère les informations de rate limit sans incrémenter le compteur.
 */
export async function getRateLimitInfo(
  ip: string,
  endpoint: string,
  limit: number = 100
): Promise<RateLimitResult> {
  const key = CacheKeys.rateLimit(ip, endpoint);

  try {
    const redis = (cache as any).redis;
    const count = await redis.zcard(key);
    const ttl = await cache.ttl(key);

    return {
      allowed: count < limit,
      remaining: Math.max(0, limit - count),
      resetAt: Date.now() + ttl * 1000,
    };
  } catch (error) {
    console.error("[RateLimit] Error getting rate limit info:", error);
    return {
      allowed: true,
      remaining: limit,
      resetAt: Date.now() + 60000,
    };
  }
}
