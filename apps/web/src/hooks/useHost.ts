// apps/web/src/hooks/useHost.ts
"use client";

import useSWR, { SWRConfiguration } from 'swr';
import { fetcher } from '@/lib/swr-config';

type DashboardStats = {
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  upcoming: number;
  thisMonth: number;
  cancelled: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  currency: string;
};

type HostDashboardResponse = {
  stats: DashboardStats;
};

/**
 * Hook to fetch host dashboard stats with SWR
 * Replaces direct fetch in HostDashboardStats component
 */
export function useHostDashboard(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<HostDashboardResponse>(
    '/api/host/dashboard',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30s cache
      ...config,
    }
  );

  return {
    stats: data?.stats || null,
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Hook to fetch host analytics
 */
export function useHostAnalytics(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/host/analytics',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 min cache
      ...config,
    }
  );

  return {
    analytics: data || null,
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Hook to fetch host calendar availability
 */
export function useHostCalendar(
  listingId: string | null,
  month?: string,
  config?: SWRConfiguration
) {
  const params = month ? `?month=${month}` : '';
  const url = listingId ? `/api/host/listings/${listingId}/calendar${params}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 10s cache
      ...config,
    }
  );

  return {
    calendar: data || null,
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}
