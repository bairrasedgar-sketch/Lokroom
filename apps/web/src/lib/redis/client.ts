// apps/web/src/lib/redis/client.ts

/**
 * Client Redis avec gestion de connexion et reconnexion automatique.
 * Utilise ioredis pour une meilleure performance et fiabilité.
 */

import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
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
      lazyConnect: true, // Ne pas se connecter immédiatement
      enableReadyCheck: true,
      enableOfflineQueue: true,
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

    // Connecter immédiatement
    redis.connect().catch((err) => {
      console.error("[Redis] Initial connection failed:", err.message);
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
