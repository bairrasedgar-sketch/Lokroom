// apps/web/src/hooks/useTracking.ts
"use client";

import { useCallback } from "react";
import { logger } from "@/lib/logger";


type TrackingAction = "view" | "click" | "search" | "favorite" | "book";

interface TrackingMetadata {
  [key: string]: any;
}

export function useTracking() {
  const trackBehavior = useCallback(
    async (action: TrackingAction, listingId?: string, metadata?: TrackingMetadata) => {
      try {
        await fetch("/api/tracking/behavior", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            listingId,
            metadata,
          }),
        });
      } catch (error) {
        logger.error("Error tracking behavior:", error);
        // Ne pas throw pour ne pas casser l'expérience utilisateur
      }
    },
    []
  );

  const trackListingView = useCallback(
    (listingId: string) => {
      trackBehavior("view", listingId);
    },
    [trackBehavior]
  );

  const trackListingClick = useCallback(
    (listingId: string) => {
      trackBehavior("click", listingId);
    },
    [trackBehavior]
  );

  const trackSearch = useCallback(
    (query: string, filters?: Record<string, any>) => {
      trackBehavior("search", undefined, { query, filters });
    },
    [trackBehavior]
  );

  const trackFavorite = useCallback(
    (listingId: string) => {
      trackBehavior("favorite", listingId);
    },
    [trackBehavior]
  );

  const trackBooking = useCallback(
    (listingId: string, bookingId: string) => {
      trackBehavior("book", listingId, { bookingId });
    },
    [trackBehavior]
  );

  return {
    trackBehavior,
    trackListingView,
    trackListingClick,
    trackSearch,
    trackFavorite,
    trackBooking,
  };
}
