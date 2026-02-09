// apps/web/src/hooks/useSWRFetch.ts
import useSWR, { SWRConfiguration } from 'swr'
import { authenticatedFetch } from '@/lib/auth/api-client'

/**
 * Fetcher function for SWR that uses authenticatedFetch
 * Handles both authenticated and unauthenticated requests
 */
const fetcher = async (url: string) => {
  const response = await authenticatedFetch(url)

  if (!response.ok) {
    const error = new Error('API error')
    // Attach extra info to the error object
    ;(error as any).info = await response.json().catch(() => null)
    ;(error as any).status = response.status
    throw error
  }

  return response.json()
}

/**
 * Custom SWR hook with optimized defaults for Lok'Room
 *
 * @param url - API endpoint URL (null to disable fetching)
 * @param options - SWR configuration options
 * @returns SWR response with data, error, isLoading, isValidating, mutate
 *
 * @example
 * const { data, error, isLoading } = useSWRFetch<Listing[]>('/api/listings')
 */
export function useSWRFetch<T = any>(
  url: string | null,
  options?: SWRConfiguration
) {
  return useSWR<T>(
    url,
    fetcher,
    {
      // Disable revalidation on focus to reduce unnecessary requests
      revalidateOnFocus: false,

      // Revalidate when reconnecting to network
      revalidateOnReconnect: true,

      // Dedupe requests within 2 seconds
      dedupingInterval: 2000,

      // Keep previous data while revalidating
      keepPreviousData: true,

      // Retry on error (3 times max)
      errorRetryCount: 3,

      // Exponential backoff for retries
      errorRetryInterval: 5000,

      // Allow custom options to override defaults
      ...options,
    }
  )
}

/**
 * Hook for fetching data with automatic refresh interval
 * Useful for real-time data like notifications, messages, etc.
 *
 * @param url - API endpoint URL
 * @param refreshInterval - Refresh interval in milliseconds (default: 30000 = 30s)
 * @param options - Additional SWR configuration options
 */
export function useSWRFetchWithRefresh<T = any>(
  url: string | null,
  refreshInterval: number = 30000,
  options?: SWRConfiguration
) {
  return useSWRFetch<T>(url, {
    refreshInterval,
    ...options,
  })
}

/**
 * Hook for fetching data that rarely changes
 * Uses longer cache time and less aggressive revalidation
 *
 * @param url - API endpoint URL
 * @param options - Additional SWR configuration options
 */
export function useSWRFetchStatic<T = any>(
  url: string | null,
  options?: SWRConfiguration
) {
  return useSWRFetch<T>(url, {
    // Cache for 5 minutes
    dedupingInterval: 300000,

    // Don't revalidate on mount if data exists
    revalidateIfStale: false,

    // Don't revalidate on reconnect
    revalidateOnReconnect: false,

    ...options,
  })
}
