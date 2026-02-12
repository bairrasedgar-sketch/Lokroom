// apps/web/src/lib/recommendations/tracking.ts
import { prisma } from "@/lib/db";
import { regenerateRecommendations } from "./engine";
import { logger } from "@/lib/logger";


/**
 * Track user behavior for recommendations
 */
export async function trackUserBehavior(
  userId: string,
  action: "view" | "click" | "search" | "favorite" | "book",
  listingId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await prisma.userBehavior.create({
      data: {
        userId,
        action,
        listingId: listingId || null,
        metadata: metadata || undefined,
      },
    });

    // Régénérer les recommandations en background si action importante
    if (["favorite", "book"].includes(action)) {
      // Ne pas attendre la régénération pour ne pas bloquer la requête
      regenerateRecommendations(userId).catch((error) => {
        logger.error(`[Tracking] Failed to regenerate recommendations for user ${userId}:`, error);
      });
    }
  } catch (error) {
    logger.error(`[Tracking] Failed to track behavior for user ${userId}:`, error);
    // Ne pas throw pour ne pas casser l'expérience utilisateur
  }
}

/**
 * Track listing view
 */
export async function trackListingView(userId: string, listingId: string): Promise<void> {
  await trackUserBehavior(userId, "view", listingId);
}

/**
 * Track listing click
 */
export async function trackListingClick(userId: string, listingId: string): Promise<void> {
  await trackUserBehavior(userId, "click", listingId);
}

/**
 * Track search
 */
export async function trackSearch(
  userId: string,
  query: string,
  filters?: Record<string, any>
): Promise<void> {
  await trackUserBehavior(userId, "search", undefined, { query, filters });
}

/**
 * Track favorite
 */
export async function trackFavorite(userId: string, listingId: string): Promise<void> {
  await trackUserBehavior(userId, "favorite", listingId);
}

/**
 * Track booking
 */
export async function trackBooking(userId: string, listingId: string, bookingId: string): Promise<void> {
  await trackUserBehavior(userId, "book", listingId, { bookingId });
}
