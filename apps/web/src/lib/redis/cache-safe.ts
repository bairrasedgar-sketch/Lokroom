// Wrapper sécurisé pour le cache Redis qui gère l'absence de Redis
import { CacheService } from "./cache";
import { logger } from "@/lib/logger";


// Réexporter les constantes de keys.ts pour la compatibilité
export { CacheKeys, CacheTTL, CachePatterns } from "./keys";

let cacheInstance: CacheService | null = null;

export function getSafeCache(): CacheService | null {
  // Ne pas initialiser pendant le build
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null;
  }

  // Ne pas initialiser si REDIS_URL n'est pas configuré
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!cacheInstance) {
    try {
      cacheInstance = new CacheService();
    } catch (error) {
      logger.error('[Cache] Failed to initialize:', error);
      return null;
    }
  }

  return cacheInstance;
}

// Export d'une instance safe qui ne crash pas si Redis n'est pas disponible
export const cache = {
  async get<T>(key: string, fallback?: () => Promise<T>, ttl?: number): Promise<T | null> {
    const c = getSafeCache();
    if (!c) return fallback ? await fallback() : null;
    return c.get(key, fallback, ttl);
  },

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const c = getSafeCache();
    if (!c) return;
    return c.set(key, value, ttl);
  },

  async del(key: string | string[]): Promise<void> {
    const c = getSafeCache();
    if (!c) return;
    return c.del(key);
  },

  async delPattern(pattern: string): Promise<void> {
    const c = getSafeCache();
    if (!c) return;
    return c.delPattern(pattern);
  },

  async incr(key: string, ttl?: number): Promise<number> {
    const c = getSafeCache();
    if (!c) return 0;
    return c.incr(key, ttl);
  },

  async exists(key: string): Promise<boolean> {
    const c = getSafeCache();
    if (!c) return false;
    return c.exists(key);
  },

  async flushAll(): Promise<void> {
    const c = getSafeCache();
    if (!c) return;
    return c.flushAll();
  },

  async decr(key: string): Promise<number> {
    const c = getSafeCache();
    if (!c) return 0;
    return c.decr(key);
  },

  async ttl(key: string): Promise<number> {
    const c = getSafeCache();
    if (!c) return -1;
    return c.ttl(key);
  },

  async expire(key: string, ttl: number): Promise<boolean> {
    const c = getSafeCache();
    if (!c) return false;
    return c.expire(key, ttl);
  },

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const c = getSafeCache();
    if (!c) return keys.map(() => null);
    return c.mget<T>(keys);
  },

  async mset(entries: Array<{ key: string; value: unknown; ttl?: number }>): Promise<void> {
    const c = getSafeCache();
    if (!c) return;
    return c.mset(entries);
  },

  async getStats(): Promise<{
    keys: number;
    memory: string;
    hits: string;
    misses: string;
  }> {
    const c = getSafeCache();
    if (!c) return { keys: 0, memory: "0", hits: "0", misses: "0" };
    return c.getStats();
  }
};

// Fonctions utilitaires pour l'invalidation du cache
export async function invalidateAllCache(): Promise<void> {
  const c = getSafeCache();
  if (!c) return;
  return c.flushAll();
}

export async function invalidateListingCache(listingId: string): Promise<void> {
  const c = getSafeCache();
  if (!c) return;

  // Importer CachePatterns pour l'invalidation
  const { CachePatterns } = await import("./keys");
  return c.delPattern(CachePatterns.listingRelated(listingId));
}

export async function isRedisAvailable(): Promise<boolean> {
  try {
    const c = getSafeCache();
    if (!c) return false;

    // Tester la connexion avec une commande simple
    return await c.exists("__health_check__");
  } catch (error) {
    logger.error("[Redis] Health check failed:", error);
    return false;
  }
}
