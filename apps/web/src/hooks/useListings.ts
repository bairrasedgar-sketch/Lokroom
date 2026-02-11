"use client";

import useSWR, { SWRConfiguration } from 'swr';
import { fetcher } from '@/lib/swr-config';

type Listing = {
  id: string;
  title: string;
  city: string | null;
  country: string;
  type: string;
  createdAt: Date;
  images: { id: string; url: string }[];
  priceFormatted: string;
  ownerName: string | null;
  maxGuests: number | null;
  beds: number | null;
  isInstantBook: boolean;
};

type UseListingsOptions = {
  filters?: Record<string, string>;
  config?: SWRConfiguration;
};

/**
 * Hook to fetch listings with SWR
 * Supports filtering and caching
 */
export function useListings({ filters = {}, config }: UseListingsOptions = {}) {
  const params = new URLSearchParams(filters);
  const queryString = params.toString();
  const url = queryString ? `/api/listings?${queryString}` : '/api/listings';

  const { data, error, isLoading, isValidating, mutate } = useSWR<Listing[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      ...config,
    }
  );

  return {
    listings: data || [],
    loading: isLoading,
    error: error?.message || null,
    isValidating,
    mutate,
  };
}

/**
 * Hook to fetch a single listing by ID
 */
export function useListing(id: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/listings/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      ...config,
    }
  );

  return {
    listing: data || null,
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Hook to fetch host's listings
 */
export function useHostListings(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/host/listings',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      ...config,
    }
  );

  return {
    listings: data || [],
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}
