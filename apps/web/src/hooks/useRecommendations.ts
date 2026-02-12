// apps/web/src/hooks/useRecommendations.ts
"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { logger } from "@/lib/logger";


interface Recommendation {
  id: string;
  userId: string;
  listingId: string;
  score: number;
  reason: string;
  createdAt: Date;
  listing: {
    id: string;
    title: string;
    city: string | null;
    country: string;
    type: string;
    price: number;
    currency: string;
    createdAt: Date;
    images: { id: string; url: string }[];
    reviews: { rating: number }[];
    owner: { name: string | null } | null;
    maxGuests: number | null;
    beds: number | null;
    isInstantBook: boolean;
  };
}

interface UseRecommendationsReturn {
  recommendations: Recommendation[];
  isLoading: boolean;
  error: Error | null;
  regenerate: () => Promise<void>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useRecommendations(): UseRecommendationsReturn {
  const { data, error, isLoading, mutate } = useSWR<{ recommendations: Recommendation[] }>(
    "/api/recommendations",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  const regenerate = async () => {
    try {
      const response = await fetch("/api/recommendations/regenerate", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate recommendations");
      }

      // Revalider les données
      await mutate();
    } catch (err) {
      logger.error("Error regenerating recommendations:", err);
      throw err;
    }
  };

  return {
    recommendations: data?.recommendations || [],
    isLoading,
    error: error || null,
    regenerate,
  };
}
