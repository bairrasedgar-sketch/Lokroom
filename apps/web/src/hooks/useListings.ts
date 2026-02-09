"use client";

import { useState, useEffect } from "react";

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
  initialData?: Listing[];
};

export function useListings({ filters = {}, initialData = [] }: UseListingsOptions = {}) {
  const [listings, setListings] = useState<Listing[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Object.keys(filters).length === 0) {
      setListings(initialData);
      return;
    }

    const fetchListings = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams(filters);
        const response = await fetch(`/api/listings?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch listings");
        }

        const data = await response.json();
        setListings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [JSON.stringify(filters)]);

  return { listings, loading, error };
}
