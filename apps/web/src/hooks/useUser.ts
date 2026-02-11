// apps/web/src/hooks/useUser.ts
"use client";

import useSWR, { SWRConfiguration } from 'swr';
import { fetcher } from '@/lib/swr-config';

type Role = "HOST" | "GUEST" | "BOTH" | "ADMIN";

type MeUser = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  identityStatus?: string | null;
  hostProfile?: {
    payoutsEnabled: boolean;
    kycStatus: string;
  } | null;
  wallet?: {
    balanceCents: number;
  } | null;
};

type MeResponse = {
  user: MeUser | null;
};

/**
 * Hook to fetch current user data with SWR
 * Replaces the old useMe hook
 */
export function useUser(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<MeResponse>(
    '/api/me',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      ...config,
    }
  );

  return {
    user: data?.user || null,
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Hook to fetch user profile by ID
 */
export function useUserProfile(userId: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/users/${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      ...config,
    }
  );

  return {
    profile: data || null,
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Hook to fetch user's favorites
 */
export function useFavorites(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/favorites',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      ...config,
    }
  );

  return {
    favorites: data || [],
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Hook to fetch user's notifications
 */
export function useNotifications(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/notifications',
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // Refresh every 30s
      dedupingInterval: 5000,
      ...config,
    }
  );

  return {
    notifications: data || [],
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}
