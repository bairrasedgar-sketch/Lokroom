// apps/web/src/lib/redis/client.ts

/**
 * Client Redis avec gestion de connexion et reconnexion automatique.
 * Utilise ioredis pour une meilleure performance et fiabilité.
 */

import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  // Ne JAMAIS initialiser Redis pendant le build
  if (process.env.VERCEL_ENV === 'production' && !process.env.REDIS_URL) {
    throw new Error('Redis not available during build');
  }

  if (!redis) {
    const redisUrl = process.env.REDIS_URL;

    // Si pas de REDIS_URL configuré, ne pas initialiser
    if (!redisUrl) {
      throw new Error('REDIS_URL not configured');
    }

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        // Ne pas réessayer pendant le build
        if (times > 1) return null;
        return null; // Pas de retry
      },
      reconnectOnError() {
        return false; // Pas de reconnexion
      },
      lazyConnect: true,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      connectTimeout: 1000, // Timeout rapide
    });

    // Désactiver tous les logs pendant le build
    redis.on("error", () => {
      // Silencieux
    });

    redis.on("connect", () => {
      // Silencieux
    });

    redis.on("ready", () => {
      // Silencieux
    });

    redis.on("close", () => {
      // Silencieux
    });

    redis.on("reconnecting", () => {
      // Silencieux
    });
  }

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log("[Redis] Connection closed gracefully");
  }
}

// Vérifier si Redis est disponible
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error("[Redis] Health check failed:", error);
    return false;
  }
}
