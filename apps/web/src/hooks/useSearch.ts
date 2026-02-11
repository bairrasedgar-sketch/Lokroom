// apps/web/src/hooks/useSearch.ts
"use client";

import useSWR, { SWRConfiguration } from 'swr';
import { fetcher } from '@/lib/swr-config';

interface SearchFilters {
  query?: string;
  location?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  instantBook?: boolean;
  superhost?: boolean;
  minRating?: number;
  pricingMode?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  hourlyPrice: number | null;
  currency: string;
  country: string;
  city: string | null;
  type: string;
  pricingMode: string;
  maxGuests: number | null;
  bedrooms: number | null;
  bathroomsFull: number | null;
  rating: number;
  isInstantBook: boolean;
  images: { id: string; url: string; isCover: boolean }[];
  owner: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    isSuperhost: boolean;
  };
  amenities: Array<{
    id: string;
    slug: string;
    label: string;
    category: string;
  }>;
  highlights: string[];
}

interface SearchResponse {
  listings: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: Record<string, any>;
  sortBy: string;
}

/**
 * Hook to search listings with filters
 * Automatically caches and deduplicates requests
 */
export function useSearch(filters: SearchFilters = {}, config?: SWRConfiguration) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, String(value));
      }
    }
  });

  const queryString = params.toString();
  const url = queryString ? `/api/search?${queryString}` : '/api/search';

  const { data, error, isLoading, isValidating, mutate } = useSWR<SearchResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3000,
      keepPreviousData: true,
      ...config,
    }
  );

  return {
    listings: data?.listings || [],
    pagination: data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    appliedFilters: data?.filters || {},
    sortBy: data?.sortBy || 'relevance',
    loading: isLoading,
    isValidating,
    error: error?.message || null,
    mutate,
  };
}
