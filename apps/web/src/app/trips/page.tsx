"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useTranslation from "@/hooks/useTranslation";

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

export default function TripsPage() {
  const { locale, dict } = useTranslation();
  const t = dict.trips;

  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/bookings");
        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = (await res.json()) as ApiShape1 | ApiShape2 | unknown;

        if (Array.isArray((data as ApiShape2).upcoming)) {
          setUpcoming((data as ApiShape2).upcoming);
          setPast((data as ApiShape2).past ?? []);
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

          setUpcoming(upcomingTmp);
          setPast(pastTmp);
        } else {
          setUpcoming([]);
          setPast([]);
        }
      } catch (e) {
        console.error("Erreur chargement voyages:", e);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

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
    <main className="mx-auto max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t.subtitle}
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-6 inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab("upcoming")}
          className={[
            "rounded-full px-4 py-1.5",
            activeTab === "upcoming"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-900",
          ].join(" ")}
        >
          {t.upcoming}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("past")}
          className={[
            "rounded-full px-4 py-1.5",
            activeTab === "past"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-900",
          ].join(" ")}
        >
          {t.past}
        </button>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
          {t.loading}
        </div>
      ) : currentList.length === 0 ? (
        <EmptyStateTrips tab={activeTab} t={t} />
      ) : (
        <div className="space-y-4">
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
    </main>
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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
      <p className="font-medium text-gray-900">
        {isUpcoming ? t.noUpcomingTrips : t.noPastTrips}
      </p>
      <p className="mt-1 text-sm text-gray-500">
        {isUpcoming ? t.noUpcomingDesc : t.noPastDesc}
      </p>
      {isUpcoming && (
        <Link
          href="/"
          className="mt-4 inline-flex rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          {t.searchListing}
        </Link>
      )}
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

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={listing ? `/listings/${listing.id}` : "#"}
        className="flex"
      >
        {/* Image */}
        <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden bg-gray-100 sm:h-44 sm:w-52">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={listing?.title ?? "Lok'Room"}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width: 640px) 160px, 208px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
              {t.noImage}
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="flex flex-1 flex-col justify-between px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="line-clamp-1 text-sm font-semibold text-gray-900">
                {listing?.title ?? "Lok'Room"}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                {location || t.locationToCome}
              </p>
              <p className="mt-2 text-xs font-medium text-gray-800">
                {dateRange}
              </p>
            </div>

            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {status.toLowerCase() === "cancelled" ? t.cancelled : t.confirmed}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
            <span>{t.viewDetails}</span>
            {total != null && (
              <span className="font-semibold text-gray-900">
                {Math.round(total)} {currency}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-4 py-2 sm:px-5">
        <Link
          href={`/messages?listingId=${listing?.id}`}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          Contacter
        </Link>
        <Link
          href={`/help/issue?bookingId=${booking.id}`}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          Signaler un problème
        </Link>
      </div>
    </div>
  );
}
