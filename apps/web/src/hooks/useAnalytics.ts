import { useCallback } from 'react';
import {
  trackSearch,
  trackListingClick,
  trackFavorite,
  trackBeginCheckout,
  trackBookingCompleted,
  trackEvent,
  setUserProperties,
  setUserId,
  type SearchEvent,
  type ListingClickEvent,
  type FavoriteEvent,
  type BookingEvent,
  type BookingCompletedEvent,
} from '@/lib/analytics/ga4';

/**
 * Hook personnalisé pour faciliter le tracking analytics
 * Fournit des méthodes memoized pour tracker les événements
 */
export function useAnalytics() {
  // Track une recherche
  const logSearch = useCallback((event: SearchEvent) => {
    trackSearch(event);
  }, []);

  // Track un clic sur une annonce
  const logListingClick = useCallback((event: ListingClickEvent) => {
    trackListingClick(event);
  }, []);

  // Track l'ajout/suppression d'un favori
  const logFavorite = useCallback((event: FavoriteEvent) => {
    trackFavorite(event);
  }, []);

  // Track le début d'une réservation
  const logBeginCheckout = useCallback((event: BookingEvent) => {
    trackBeginCheckout(event);
  }, []);

  // Track une réservation complétée
  const logBookingCompleted = useCallback((event: BookingCompletedEvent) => {
    trackBookingCompleted(event);
  }, []);

  // Track un événement custom
  const logEvent = useCallback(
    (eventName: string, eventParams?: Record<string, any>) => {
      trackEvent(eventName, eventParams);
    },
    []
  );

  // Set user properties
  const setUser = useCallback((properties: Record<string, any>) => {
    setUserProperties(properties);
  }, []);

  // Set user ID
  const identifyUser = useCallback((userId: string | null) => {
    setUserId(userId);
  }, []);

  return {
    logSearch,
    logListingClick,
    logFavorite,
    logBeginCheckout,
    logBookingCompleted,
    logEvent,
    setUser,
    identifyUser,
  };
}
