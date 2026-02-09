"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useTranslation from "@/hooks/useTranslation";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { useSWRFetch } from "@/hooks/useSWRFetch";

type BookingListing = {
  id: string;
  title?: string | null;
  city?: string | null;
  country?: string | null;
  images?: { id: string; url: string | null }[];
};

type Booking = {
  id: string;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  totalPrice?: number | null;
  currency?: string | null;
  listing: BookingListing;
};

type ApiShape1 = { bookings: Booking[] };
type ApiShape2 = { upcoming: Booking[]; past: Booking[] };

type Tab = "upcoming" | "past";

function getBookingStartDate(b: Booking): Date {
  const raw =
    b.startDate ??
    b.checkIn ??
    b.endDate ??
    b.checkOut ??
    new Date().toISOString();
  return new Date(raw);
}

function TripsPageContent() {
  const { locale, dict } = useTranslation();
  const t = dict.trips;

  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  // Use SWR for bookings with cache
  const { data, error, isLoading } = useSWRFetch<ApiShape1 | ApiShape2>('/api/bookings', {
    revalidateOnMount: true,
    refreshInterval: 60000, // Refresh every minute
  });

  // Process bookings data
  const { upcoming, past } = useMemo(() => {
    if (!data) return { upcoming: [], past: [] };

    if (Array.isArray((data as ApiShape2).upcoming)) {
      return {
        upcoming: (data as ApiShape2).upcoming,
        past: (data as ApiShape2).past ?? [],
      };
    } else if (Array.isArray((data as ApiShape1).bookings)) {
      const all = (data as ApiShape1).bookings;
      const now = new Date();

      const upcomingTmp: Booking[] = [];
      const pastTmp: Booking[] = [];

      for (const b of all) {
        const start = getBookingStartDate(b);
        if (start >= now) {
          upcomingTmp.push(b);
        } else {
          pastTmp.push(b);
        }
      }

      return { upcoming: upcomingTmp, past: pastTmp };
    }

    return { upcoming: [], past: [] };
  }, [data]);

  const currentList = useMemo(
    () => (activeTab === "upcoming" ? upcoming : past),
    [activeTab, upcoming, past],
  );

  function formatDateRange(b: Booking): string {
    const startRaw = b.startDate ?? b.checkIn;
    const endRaw = b.endDate ?? b.checkOut;

    if (!startRaw || !endRaw) return t.datesToConfirm;

    const start = new Date(startRaw);
    const end = new Date(endRaw);
    const dateLocale = locale === "en" ? "en-US" : "fr-FR";

    const opts: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
    };

    const startStr = start.toLocaleDateString(dateLocale, opts);
    const endStr = end.toLocaleDateString(dateLocale, opts);

    return `${startStr} – ${endStr}`;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header - Mobile optimized */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="mx-auto max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{t.title}</h1>
            <p className="mt-1 text-sm text-gray-600 hidden sm:block">
              {t.subtitle}
            </p>
          </div>

          {/* Tabs - Full width on mobile */}
          <div className="flex border-b border-gray-200 -mb-px">
            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={[
                "flex-1 sm:flex-none sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "upcoming"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
              ].join(" ")}
            >
              {t.upcoming}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("past")}
              className={[
                "flex-1 sm:flex-none sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "past"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
              ].join(" ")}
            >
              {t.past}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1600px] px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {isLoading ? (
          <LoadingState />
        ) : currentList.length === 0 ? (
          <EmptyStateTrips tab={activeTab} t={t} />
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {currentList.map((booking) => (
              <TripCard
                key={booking.id}
                booking={booking}
                t={t}
                formatDateRange={formatDateRange}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 sm:space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl sm:rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="flex flex-col sm:flex-row">
            {/* Image skeleton */}
            <div className="h-48 sm:h-44 sm:w-52 flex-shrink-0 bg-gray-200 animate-pulse" />

            {/* Content skeleton */}
            <div className="flex-1 p-4 sm:p-5 space-y-3">
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-8 bg-gray-200 rounded-full animate-pulse w-24" />
                <div className="h-8 bg-gray-200 rounded-full animate-pulse w-32" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyStateTrips({
  tab,
  t,
}: {
  tab: Tab;
  t: typeof import("@/locales/fr").default.trips;
}) {
  const isUpcoming = tab === "upcoming";

  return (
    <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="p-8 sm:p-12 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
            />
          </svg>
        </div>

        {/* Text */}
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          {isUpcoming ? t.noUpcomingTrips : t.noPastTrips}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
          {isUpcoming ? t.noUpcomingDesc : t.noPastDesc}
        </p>

        {/* CTA */}
        {isUpcoming && (
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-rose-500 px-6 py-3 text-sm font-medium text-white hover:bg-rose-600 transition-colors shadow-sm"
          >
            {t.searchListing}
          </Link>
        )}
      </div>
    </div>
  );
}

function TripCard({
  booking,
  t,
  formatDateRange,
}: {
  booking: Booking;
  t: typeof import("@/locales/fr").default.trips;
  formatDateRange: (b: Booking) => string;
}) {
  const listing = booking.listing;
  const imageUrl = listing?.images?.[0]?.url ?? null;
  const location = [listing?.city, listing?.country].filter(Boolean).join(", ");
  const dateRange = formatDateRange(booking);
  const total = booking.totalPrice ?? null;
  const currency = booking.currency === "CAD" ? "CAD" : "€";
  const status = booking.status ?? "confirmée";
  const isCancelled = status.toLowerCase() === "cancelled";

  return (
    <div className="group overflow-hidden rounded-xl sm:rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <Link
        href={listing ? `/listings/${listing.id}` : "#"}
        className="block"
      >
        {/* Mobile: Vertical layout, Desktop: Horizontal layout */}
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative h-48 sm:h-44 sm:w-52 flex-shrink-0 overflow-hidden bg-gray-100">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={listing?.title ?? "Lok'Room"}
                fill
                className="object-cover transition group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 208px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg
                  className="h-12 w-12 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
            )}

            {/* Status badge on image */}
            <div className="absolute top-3 right-3">
              <span
                className={[
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-sm",
                  isCancelled
                    ? "bg-red-500/90 text-white"
                    : "bg-emerald-500/90 text-white",
                ].join(" ")}
              >
                {isCancelled ? (
                  <>
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t.cancelled}
                  </>
                ) : (
                  <>
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t.confirmed}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-4 sm:p-5">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                    {listing?.title ?? "Lok'Room"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 flex items-center gap-1">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {location || t.locationToCome}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span className="font-medium text-gray-900">{dateRange}</span>
              </div>

              {total != null && (
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-lg font-semibold text-gray-900">
                    {Math.round(total)} {currency}
                  </span>
                  <span className="text-sm text-gray-500">total</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Actions - Mobile optimized */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-t border-gray-100 p-3 sm:p-4 bg-gray-50">
        <Link
          href={`/messages?listingId=${listing?.id}`}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          Contacter l'hôte
        </Link>
        <Link
          href={`/help/issue?bookingId=${booking.id}`}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          Obtenir de l'aide
        </Link>
      </div>
    </div>
  );
}

export default function TripsPage() {
  return (
    <PageErrorBoundary>
      <TripsPageContent />
    </PageErrorBoundary>
  );
}
