// apps/web/src/lib/redis/index.ts

/**
 * Point d'entrée principal pour le système de cache Redis.
 * Exporte tous les modules nécessaires.
 */

export { getRedisClient, closeRedis } from "./client";
export { CacheService } from "./cache";
export { cache, isRedisAvailable, invalidateAllCache, invalidateListingCache } from "./cache-safe";
export { CacheKeys, CacheTTL, CachePatterns } from "./keys";
export {
  invalidateUserCache,
  invalidateBookingCache,
  invalidateReviewCache,
  invalidateSearchCache,
  invalidateAmenitiesCache,
  invalidateStatsCache,
  invalidateFavoritesCache,
  invalidateNotificationsCache,
} from "./invalidation";
export {
  checkRateLimit,
  checkRateLimitSlidingWindow,
  resetRateLimit,
  getRateLimitInfo,
} from "./rate-limit-redis";
export type { RateLimitResult } from "./rate-limit-redis";
export {
  cacheMiddleware,
  cacheMiddlewareWithETag,
  generateCacheKey,
  withCache,
} from "./middleware";
export type { CacheMiddlewareOptions } from "./middleware";
