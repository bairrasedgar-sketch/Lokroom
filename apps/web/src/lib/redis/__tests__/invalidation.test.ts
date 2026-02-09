// apps/web/src/lib/redis/__tests__/invalidation.test.ts

/**
 * Tests pour l'invalidation du cache.
 */

import { cache } from "../cache";
import { CacheKeys, CacheTTL } from "../keys";
import {
  invalidateListingCache,
  invalidateUserCache,
  invalidateBookingCache,
} from "../invalidation";

describe("Cache Invalidation", () => {
  beforeEach(async () => {
    await cache.flushAll();
  });

  afterAll(async () => {
    await cache.flushAll();
  });

  describe("invalidateListingCache", () => {
    it("should invalidate listing and related caches", async () => {
      const listingId = "listing-123";

      // Créer des entrées de cache
      await cache.set(CacheKeys.listing(listingId), { id: listingId }, CacheTTL.MEDIUM);
      await cache.set(CacheKeys.reviews(listingId), [], CacheTTL.MEDIUM);
      await cache.set(CacheKeys.reviewStats(listingId), {}, CacheTTL.MEDIUM);
      await cache.set("listings:all", [], CacheTTL.MEDIUM);

      // Invalider
      await invalidateListingCache(listingId);

      // Vérifier que les caches sont invalidés
      expect(await cache.get(CacheKeys.listing(listingId))).toBeNull();
      expect(await cache.get(CacheKeys.reviews(listingId))).toBeNull();
      expect(await cache.get(CacheKeys.reviewStats(listingId))).toBeNull();
      expect(await cache.get("listings:all")).toBeNull();
    });
  });

  describe("invalidateUserCache", () => {
    it("should invalidate user and related caches", async () => {
      const userId = "user-456";

      // Créer des entrées de cache
      await cache.set(CacheKeys.user(userId), { id: userId }, CacheTTL.MEDIUM);
      await cache.set(CacheKeys.userProfile(userId), {}, CacheTTL.MEDIUM);
      await cache.set(CacheKeys.bookingsByUser(userId), [], CacheTTL.MEDIUM);
      await cache.set(CacheKeys.favorites(userId), [], CacheTTL.MEDIUM);

      // Invalider
      await invalidateUserCache(userId);

      // Vérifier que les caches sont invalidés
      expect(await cache.get(CacheKeys.user(userId))).toBeNull();
      expect(await cache.get(CacheKeys.userProfile(userId))).toBeNull();
      expect(await cache.get(CacheKeys.bookingsByUser(userId))).toBeNull();
      expect(await cache.get(CacheKeys.favorites(userId))).toBeNull();
    });
  });

  describe("invalidateBookingCache", () => {
    it("should invalidate booking and related caches", async () => {
      const bookingId = "booking-789";
      const userId = "user-456";
      const listingId = "listing-123";

      // Créer des entrées de cache
      await cache.set(CacheKeys.booking(bookingId), { id: bookingId }, CacheTTL.MEDIUM);
      await cache.set(CacheKeys.bookingsByUser(userId), [], CacheTTL.MEDIUM);
      await cache.set(CacheKeys.bookingsByListing(listingId), [], CacheTTL.MEDIUM);
      await cache.set(`bookings:availability:${listingId}:2026-02-09`, {}, CacheTTL.MEDIUM);

      // Invalider
      await invalidateBookingCache(bookingId, userId, listingId);

      // Vérifier que les caches sont invalidés
      expect(await cache.get(CacheKeys.booking(bookingId))).toBeNull();
      expect(await cache.get(CacheKeys.bookingsByUser(userId))).toBeNull();
      expect(await cache.get(CacheKeys.bookingsByListing(listingId))).toBeNull();
      expect(await cache.get(`bookings:availability:${listingId}:2026-02-09`)).toBeNull();
    });
  });
});
