// apps/web/src/lib/redis/client.ts

/**
 * Client Redis avec gestion de connexion et reconnexion automatique.
 * Utilise ioredis pour une meilleure performance et fiabilité.
 */

import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  // Ne pas initialiser Redis pendant le build
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    throw new Error('Redis not available during build');
  }

  if (!redis) {
    const redisUrl = process.env.REDIS_URL;

    // Si pas de REDIS_URL configuré, ne pas initialiser
    if (!redisUrl) {
      throw new Error('REDIS_URL not configured');
    }

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        // Limiter les tentatives pendant le build
        if (times > 3) return null;
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
      lazyConnect: true,
      enableReadyCheck: true,
      enableOfflineQueue: false, // Désactiver la queue si pas connecté
    });

    redis.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
    });

    redis.on("connect", () => {
      console.log("[Redis] Connected successfully");
    });

    redis.on("ready", () => {
      console.log("[Redis] Ready to accept commands");
    });

    redis.on("close", () => {
      console.log("[Redis] Connection closed");
    });

    redis.on("reconnecting", () => {
      console.log("[Redis] Reconnecting...");
    });

    // Connecter seulement en runtime, pas pendant le build
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
      redis.connect().catch((err) => {
        console.error("[Redis] Initial connection failed:", err.message);
      });
    }
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
