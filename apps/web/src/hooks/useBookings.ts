// apps/web/src/hooks/useBookings.ts
"use client";

import useSWR, { SWRConfiguration } from 'swr';
import { fetcher } from '@/lib/swr-config';

type Currency = "EUR" | "CAD";
type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

type ListingThumbnail = {
  id: string;
  title: string;
  price: number;
  currency: Currency;
  images: { id: string; url: string }[];
};

type Booking = {
  id: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  totalPrice: number;
  currency: Currency;
  createdAt: string;
  listing: ListingThumbnail;
};

type BookingsResponse = {
  bookings: Booking[];
};

/**
 * Hook to fetch user's bookings with SWR
 */
export function useBookings(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<BookingsResponse>(
    '/api/bookings',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      ...config,
    }
  );

  return {
    bookings: data?.bookings || [],
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Hook to fetch a single booking by ID
 */
export function useBooking(id: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/bookings/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
      ...config,
    }
  );

  return {
    booking: data || null,
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Hook to fetch host's bookings
 */
export function useHostBookings(config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/host/bookings',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      ...config,
    }
  );

  return {
    bookings: data?.bookings || [],
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}

/**
 * Hook to fetch booking preview (price calculation)
 */
export function useBookingPreview(
  listingId: string | null,
  startDate: string | null,
  endDate: string | null,
  guests: number = 1,
  promoCode?: string,
  config?: SWRConfiguration
) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  params.set('guests', guests.toString());
  if (promoCode) params.set('promoCode', promoCode);

  const url = listingId && startDate && endDate
    ? `/api/bookings/preview?listingId=${listingId}&${params.toString()}`
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
      ...config,
    }
  );

  return {
    preview: data || null,
    loading: isLoading,
    error: error?.message || null,
    mutate,
  };
}
