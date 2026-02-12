// apps/web/src/lib/swr-config.ts
import { SWRConfiguration } from 'swr';
import { authenticatedFetch } from '@/lib/auth/api-client';
import { logger } from "@/lib/logger";


/**
 * Global fetcher function for SWR
 * Uses authenticatedFetch to handle authentication automatically
 */
export const fetcher = async (url: string) => {
  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const error = new Error('API request failed');
    (error as any).info = await response.json().catch(() => null);
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
};

/**
 * Global SWR configuration for Lok'Room
 * Optimized for performance and user experience
 */
export const swrConfig: SWRConfiguration = {
  // Use the global fetcher
  fetcher,

  // Revalidation settings
  revalidateOnFocus: false, // Don't revalidate when window regains focus
  revalidateOnReconnect: true, // Revalidate when network reconnects
  revalidateIfStale: true, // Revalidate if data is stale

  // Deduplication
  dedupingInterval: 2000, // Dedupe requests within 2 seconds

  // Error handling
  errorRetryCount: 3, // Retry failed requests 3 times
  errorRetryInterval: 5000, // Wait 5s between retries
  shouldRetryOnError: true,

  // Performance
  keepPreviousData: true, // Keep previous data while revalidating

  // Loading delay
  loadingTimeout: 3000, // Show loading state after 3s

  // Focus throttle
  focusThrottleInterval: 5000, // Throttle focus revalidation to 5s

  // Error handler
  onError: (error, key) => {
    logger.error(`SWR Error for ${key}:`, error);
  },

  // Success handler
  onSuccess: (data, key, config) => {
    // Optional: log successful fetches in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`SWR Success for ${key}`);
    }
  },
};

/**
 * Configuration for real-time data (messages, notifications)
 * More aggressive revalidation
 */
export const realtimeConfig: SWRConfiguration = {
  ...swrConfig,
  refreshInterval: 30000, // Refresh every 30 seconds
  revalidateOnFocus: true, // Revalidate on focus for real-time data
  dedupingInterval: 1000, // Shorter deduping for real-time
};

/**
 * Configuration for static data (amenities, categories)
 * Less aggressive revalidation
 */
export const staticConfig: SWRConfiguration = {
  ...swrConfig,
  dedupingInterval: 300000, // 5 minutes
  revalidateIfStale: false,
  revalidateOnReconnect: false,
};
