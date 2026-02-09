// apps/web/src/lib/redis/invalidation.ts

/**
 * Gestion de l'invalidation automatique du cache.
 * Permet de maintenir la cohérence des données entre la DB et le cache.
 */

import { cache } from "./cache-safe";
import { CacheKeys, CachePatterns } from "./keys";

/**
 * Invalide le cache d'une annonce et toutes les données associées.
 */
export async function invalidateListingCache(listingId: string): Promise<void> {
  try {
    await cache.del([
      CacheKeys.listing(listingId),
      CacheKeys.reviews(listingId),
      CacheKeys.reviewStats(listingId),
      CacheKeys.listingStats(listingId),
      CacheKeys.bookingsByListing(listingId),
    ]);

    // Invalider toutes les listes de listings
    await cache.delPattern(CachePatterns.allListings());

    console.log(`[Cache] Invalidated listing cache: ${listingId}`);
  } catch (error) {
    console.error(`[Cache] Error invalidating listing cache:`, error);
  }
}

/**
 * Invalide le cache d'un utilisateur et toutes les données associées.
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    await cache.del([
      CacheKeys.user(userId),
      CacheKeys.userProfile(userId),
      CacheKeys.bookingsByUser(userId),
      CacheKeys.listingsByOwner(userId),
      CacheKeys.userReviews(userId),
      CacheKeys.dashboardStats(userId),
      CacheKeys.favorites(userId),
      CacheKeys.notifications(userId),
      CacheKeys.unreadCount(userId),
      CacheKeys.unreadMessages(userId),
    ]);

    console.log(`[Cache] Invalidated user cache: ${userId}`);
  } catch (error) {
    console.error(`[Cache] Error invalidating user cache:`, error);
  }
}

/**
 * Invalide le cache d'une réservation et toutes les données associées.
 */
export async function invalidateBookingCache(
  bookingId: string,
  userId: string,
  listingId: string
): Promise<void> {
  try {
    await cache.del([
      CacheKeys.booking(bookingId),
      CacheKeys.bookingsByUser(userId),
      CacheKeys.bookingsByListing(listingId),
      CacheKeys.dashboardStats(userId),
    ]);

    // Invalider la disponibilité du listing
    await cache.delPattern(`bookings:availability:${listingId}:*`);

    console.log(`[Cache] Invalidated booking cache: ${bookingId}`);
  } catch (error) {
    console.error(`[Cache] Error invalidating booking cache:`, error);
  }
}

/**
 * Invalide le cache des avis d'une annonce.
 */
export async function invalidateReviewCache(
  listingId: string,
  userId?: string
): Promise<void> {
  try {
    await cache.del([
      CacheKeys.reviews(listingId),
      CacheKeys.reviewStats(listingId),
      CacheKeys.listing(listingId),
    ]);

    if (userId) {
      await cache.del(CacheKeys.userReviews(userId));
    }

    console.log(`[Cache] Invalidated review cache: ${listingId}`);
  } catch (error) {
    console.error(`[Cache] Error invalidating review cache:`, error);
  }
}

/**
 * Invalide le cache de recherche.
 */
export async function invalidateSearchCache(): Promise<void> {
  try {
    await cache.delPattern("search:*");
    await cache.delPattern("listings:search:*");

    console.log(`[Cache] Invalidated search cache`);
  } catch (error) {
    console.error(`[Cache] Error invalidating search cache:`, error);
  }
}

/**
 * Invalide le cache des amenities.
 */
export async function invalidateAmenitiesCache(): Promise<void> {
  try {
    await cache.del(CacheKeys.amenities());
    await cache.delPattern("amenities:*");

    console.log(`[Cache] Invalidated amenities cache`);
  } catch (error) {
    console.error(`[Cache] Error invalidating amenities cache:`, error);
  }
}

/**
 * Invalide le cache des statistiques.
 */
export async function invalidateStatsCache(userId?: string): Promise<void> {
  try {
    if (userId) {
      await cache.del(CacheKeys.dashboardStats(userId));
    } else {
      await cache.delPattern(CachePatterns.allStats());
    }

    console.log(`[Cache] Invalidated stats cache`);
  } catch (error) {
    console.error(`[Cache] Error invalidating stats cache:`, error);
  }
}

/**
 * Invalide le cache des favoris d'un utilisateur.
 */
export async function invalidateFavoritesCache(userId: string): Promise<void> {
  try {
    await cache.del(CacheKeys.favorites(userId));

    console.log(`[Cache] Invalidated favorites cache: ${userId}`);
  } catch (error) {
    console.error(`[Cache] Error invalidating favorites cache:`, error);
  }
}

/**
 * Invalide le cache des notifications d'un utilisateur.
 */
export async function invalidateNotificationsCache(userId: string): Promise<void> {
  try {
    await cache.del([
      CacheKeys.notifications(userId),
      CacheKeys.unreadCount(userId),
    ]);

    console.log(`[Cache] Invalidated notifications cache: ${userId}`);
  } catch (error) {
    console.error(`[Cache] Error invalidating notifications cache:`, error);
  }
}

/**
 * Invalide tout le cache (à utiliser avec précaution).
 */
export async function invalidateAllCache(): Promise<void> {
  try {
    await cache.flushAll();
    console.log(`[Cache] Invalidated all cache`);
  } catch (error) {
    console.error(`[Cache] Error invalidating all cache:`, error);
  }
}
