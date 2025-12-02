// apps/web/src/app/trips/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

        const data = (await res.json()) as ApiShape1 | ApiShape2 | any;

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
          // format inconnu → on ignore
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Voyages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Retrouve tous tes séjours Lok&apos;Room : réservations à venir et
            voyages passés.
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
          À venir
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
          Passés
        </button>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
          Chargement de tes voyages...
        </div>
      ) : currentList.length === 0 ? (
        <EmptyStateTrips tab={activeTab} />
      ) : (
        <div className="space-y-4">
          {currentList.map((booking) => (
            <TripCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </main>
  );
}

function EmptyStateTrips({ tab }: { tab: Tab }) {
  const isUpcoming = tab === "upcoming";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
      <p className="font-medium text-gray-900">
        {isUpcoming ? "Aucun voyage à venir" : "Aucun voyage passé"}
      </p>
      <p className="mt-1 text-sm text-gray-500">
        {isUpcoming
          ? "Dès que tu réserveras un séjour, il apparaîtra ici avec toutes les infos utiles."
          : "Une fois que tu auras terminé des séjours, ils apparaîtront ici pour ton historique."}
      </p>
      {isUpcoming && (
        <Link
          href="/"
          className="mt-4 inline-flex rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          Rechercher une annonce
        </Link>
      )}
    </div>
  );
}

function formatDateRange(b: Booking): string {
  const startRaw = b.startDate ?? b.checkIn;
  const endRaw = b.endDate ?? b.checkOut;

  if (!startRaw || !endRaw) return "Dates à confirmer";

  const start = new Date(startRaw);
  const end = new Date(endRaw);

  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
  };

  const startStr = start.toLocaleDateString(undefined, opts);
  const endStr = end.toLocaleDateString(undefined, opts);

  return `${startStr} – ${endStr}`;
}

function TripCard({ booking }: { booking: Booking }) {
  const listing = booking.listing;
  const imageUrl = listing?.images?.[0]?.url ?? null;
  const location = [listing?.city, listing?.country].filter(Boolean).join(", ");
  const dateRange = formatDateRange(booking);
  const total = booking.totalPrice ?? null;
  const currency = booking.currency === "CAD" ? "CAD" : "€";
  const status = booking.status ?? "confirmée";

  return (
    <Link
      href={listing ? `/listings/${listing.id}` : "#"}
      className="group flex overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Image */}
      <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden bg-gray-100 sm:h-44 sm:w-52">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={listing?.title ?? "Annonce Lok'Room"}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
            Aucune image
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="flex flex-1 flex-col justify-between px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="line-clamp-1 text-sm font-semibold text-gray-900">
              {listing?.title ?? "Séjour Lok'Room"}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {location || "Emplacement à venir"}
            </p>
            <p className="mt-2 text-xs font-medium text-gray-800">
              {dateRange}
            </p>
          </div>

          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {status.toLowerCase() === "cancelled"
              ? "Annulé"
              : "Réservation confirmée"}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
          <span>Voir les détails du voyage</span>
          {total != null && (
            <span className="font-semibold text-gray-900">
              {Math.round(total)} {currency}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
