// apps/web/src/lib/redis/index.ts

/**
 * Point d'entrée principal pour le système de cache Redis.
 * Exporte tous les modules nécessaires.
 */

export { getRedisClient, closeRedis, isRedisAvailable } from "./client";
export { cache, CacheService } from "./cache";
export { CacheKeys, CacheTTL, CachePatterns } from "./keys";
export {
  invalidateListingCache,
  invalidateUserCache,
  invalidateBookingCache,
  invalidateReviewCache,
  invalidateSearchCache,
  invalidateAmenitiesCache,
  invalidateStatsCache,
  invalidateFavoritesCache,
  invalidateNotificationsCache,
  invalidateAllCache,
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
