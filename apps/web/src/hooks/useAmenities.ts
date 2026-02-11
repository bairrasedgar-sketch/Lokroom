// apps/web/src/hooks/useAmenities.ts
"use client";

import useSWR, { SWRConfiguration } from 'swr';
import { fetcher, staticConfig } from '@/lib/swr-config';

type Amenity = {
  id: string;
  slug: string;
  label: string;
  category: string;
  icon?: string;
};

type AmenitiesResponse = {
  amenities: Amenity[];
};

/**
 * Hook to fetch amenities (static data)
 * Uses long cache time since amenities rarely change
 */
export function useAmenities(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<AmenitiesResponse>(
    '/api/amenities',
    fetcher,
    {
      ...staticConfig,
      ...config,
    }
  );

  return {
    amenities: data?.amenities || [],
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Hook to fetch amenities for a specific listing
 */
export function useListingAmenities(
  listingId: string | null,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, mutate } = useSWR(
    listingId ? `/api/listings/${listingId}/amenities` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      ...config,
    }
  );

  return {
    amenities: data || [],
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}
