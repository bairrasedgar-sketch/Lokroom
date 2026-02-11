// apps/web/src/hooks/useReviews.ts
"use client";

import useSWR, { SWRConfiguration } from 'swr';
import { fetcher } from '@/lib/swr-config';

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  listing?: {
    id: string;
    title: string;
  };
};

type ReviewsResponse = {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
};

/**
 * Hook to fetch reviews for a listing
 */
export function useListingReviews(
  listingId: string | null,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, mutate } = useSWR<ReviewsResponse>(
    listingId ? `/api/listings/${listingId}/reviews` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      ...config,
    }
  );

  return {
    reviews: data?.reviews || [],
    averageRating: data?.averageRating || 0,
    totalReviews: data?.totalReviews || 0,
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Hook to fetch reviews by a user
 */
export function useUserReviews(
  userId: string | null,
  config?: SWRConfiguration
) {
  const { data, error, isLoading, mutate } = useSWR<ReviewsResponse>(
    userId ? `/api/users/${userId}/reviews` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      ...config,
    }
  );

  return {
    reviews: data?.reviews || [],
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Hook to fetch reviews received by a host
 */
export function useHostReviews(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<ReviewsResponse>(
    '/api/host/reviews',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      ...config,
    }
  );

  return {
    reviews: data?.reviews || [],
    averageRating: data?.averageRating || 0,
    totalReviews: data?.totalReviews || 0,
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}
