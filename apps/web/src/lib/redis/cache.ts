// apps/web/src/lib/redis/cache.ts

/**
 * Service de cache Redis avec fallback et gestion d'erreurs.
 * Fournit une API simple pour get/set/delete avec TTL.
 */

import { getRedisClient } from "./client";
import type { Redis } from "ioredis";

export class CacheService {
  private redis: Redis | null = null;

  /**
   * Initialise Redis de manière lazy (seulement quand nécessaire).
   * Ne lance pas d'erreur pendant le build.
   */
  private getRedis(): Redis {
    if (!this.redis) {
      this.redis = getRedisClient();
    }
    return this.redis;
  }

  /**
   * Récupère une valeur du cache avec fallback optionnel.
   * Si la valeur n'existe pas et qu'un fallback est fourni, exécute le fallback et met en cache le résultat.
   */
  async get<T>(
    key: string,
    fallback?: () => Promise<T>,
    ttl?: number
  ): Promise<T | null> {
    try {
      const cached = await this.getRedis().get(key);

      if (cached) {
        try {
          return JSON.parse(cached) as T;
        } catch (parseError) {
          console.error(`[Cache] Failed to parse cached value for key ${key}:`, parseError);
          // Supprimer la valeur corrompue
          await this.del(key);
        }
      }

      if (fallback) {
        const data = await fallback();
        await this.set(key, data, ttl);
        return data;
      }

      return null;
    } catch (error) {
      console.error(`[Cache] Get error for key ${key}:`, error);
      // En cas d'erreur Redis, exécuter le fallback sans mettre en cache
      return fallback ? await fallback() : null;
    }
  }

  /**
   * Stocke une valeur dans le cache avec TTL optionnel.
   */
  async set(key: string, value: unknown, ttl: number = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.getRedis().setex(key, ttl, serialized);
    } catch (error) {
      console.error(`[Cache] Set error for key ${key}:`, error);
    }
  }

  /**
   * Supprime une ou plusieurs clés du cache.
   */
  async del(key: string | string[]): Promise<void> {
    try {
      if (Array.isArray(key)) {
        if (key.length > 0) {
          await this.getRedis().del(...key);
        }
      } else {
        await this.getRedis().del(key);
      }
    } catch (error) {
      console.error(`[Cache] Delete error for key(s) ${key}:`, error);
    }
  }

  /**
   * Supprime toutes les clés correspondant à un pattern.
   * Utilise SCAN pour éviter de bloquer Redis.
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys: string[] = [];
      const stream = this.getRedis().scanStream({
        match: pattern,
        count: 100,
      });

      stream.on("data", (resultKeys: string[]) => {
        keys.push(...resultKeys);
      });

      await new Promise<void>((resolve, reject) => {
        stream.on("end", () => resolve());
        stream.on("error", (err) => reject(err));
      });

      if (keys.length > 0) {
        // Supprimer par batch de 100 pour éviter de surcharger Redis
        const batchSize = 100;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          await this.getRedis().del(...batch);
        }
        console.log(`[Cache] Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      console.error(`[Cache] Delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Incrémente une valeur numérique dans le cache.
   */
  async incr(key: string, ttl?: number): Promise<number> {
    try {
      const value = await this.getRedis().incr(key);
      if (ttl) {
        await this.getRedis().expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error(`[Cache] Incr error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Décrémente une valeur numérique dans le cache.
   */
  async decr(key: string): Promise<number> {
    try {
      return await this.getRedis().decr(key);
    } catch (error) {
      console.error(`[Cache] Decr error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Vérifie si une clé existe dans le cache.
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.getRedis().exists(key);
      return result === 1;
    } catch (error) {
      console.error(`[Cache] Exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Récupère le TTL restant d'une clé (en secondes).
   * Retourne -1 si la clé n'existe pas, -2 si elle n'a pas de TTL.
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.getRedis().ttl(key);
    } catch (error) {
      console.error(`[Cache] TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Définit un TTL sur une clé existante.
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.getRedis().expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error(`[Cache] Expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Récupère plusieurs valeurs en une seule opération.
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return [];

      const values = await this.getRedis().mget(...keys);
      return values.map((value) => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error(`[Cache] Mget error for keys ${keys}:`, error);
      return keys.map(() => null);
    }
  }

  /**
   * Stocke plusieurs valeurs en une seule opération.
   */
  async mset(entries: Array<{ key: string; value: unknown; ttl?: number }>): Promise<void> {
    try {
      const pipeline = this.getRedis().pipeline();

      for (const { key, value, ttl } of entries) {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }

      await pipeline.exec();
    } catch (error) {
      console.error(`[Cache] Mset error:`, error);
    }
  }

  /**
   * Vide tout le cache (à utiliser avec précaution).
   */
  async flushAll(): Promise<void> {
    try {
      await this.getRedis().flushall();
      console.log("[Cache] All cache cleared");
    } catch (error) {
      console.error("[Cache] Flush error:", error);
    }
  }

  /**
   * Récupère des statistiques sur le cache.
   */
  async getStats(): Promise<{
    keys: number;
    memory: string;
    hits: string;
    misses: string;
  }> {
    try {
      const info = await this.getRedis().info("stats");
      const keyspace = await this.getRedis().info("keyspace");

      // Parser les infos
      const stats = {
        keys: 0,
        memory: "0",
        hits: "0",
        misses: "0",
      };

      // Extraire le nombre de clés
      const dbMatch = keyspace.match(/db0:keys=(\d+)/);
      if (dbMatch) {
        stats.keys = parseInt(dbMatch[1], 10);
      }

      // Extraire les hits/misses
      const hitsMatch = info.match(/keyspace_hits:(\d+)/);
      const missesMatch = info.match(/keyspace_misses:(\d+)/);
      if (hitsMatch) stats.hits = hitsMatch[1];
      if (missesMatch) stats.misses = missesMatch[1];

      return stats;
    } catch (error) {
      console.error("[Cache] Stats error:", error);
      return { keys: 0, memory: "0", hits: "0", misses: "0" };
    }
  }
}

// Note: N'exportez PAS d'instance singleton ici pour éviter l'initialisation pendant le build.
// Utilisez cache-safe.ts à la place, qui gère l'initialisation lazy de manière sécurisée.
