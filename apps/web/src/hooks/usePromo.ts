// apps/web/src/hooks/usePromo.ts
"use client";

import useSWR, { SWRConfiguration } from 'swr';
import { fetcher } from '@/lib/swr-config';

type PromoValidationResponse = {
  valid: boolean;
  code?: string;
  discountPercent?: number;
  discountAmountCents?: number;
  error?: string;
};

/**
 * Hook to validate promo code
 * Note: This is a manual trigger hook, not auto-fetching
 */
export function usePromoValidation(
  code: string | null,
  listingId: string | null,
  config?: SWRConfiguration
) {
  const url = code && listingId
    ? `/api/promos/validate?code=${encodeURIComponent(code)}&listingId=${listingId}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<PromoValidationResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      // Don't auto-fetch, only when explicitly called
      revalidateOnMount: false,
      ...config,
    }
  );

  return {
    validation: data || null,
    loading: isLoading,
    error: error?.message || null,
    validate: mutate, // Use mutate to trigger validation
  };
}

/**
 * Hook to fetch available promos for a listing
 */
export function useAvailablePromos(
  listingId: string | null,
  config?: SWRConfiguration
) {
  const url = listingId ? `/api/promos?listingId=${listingId}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 min cache
      ...config,
    }
  );

  return {
    promos: data?.promos || [],
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}
