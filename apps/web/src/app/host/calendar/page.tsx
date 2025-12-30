"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HostCalendar from "@/components/calendar/HostCalendar";

type Listing = {
  id: string;
  title: string;
  price: number;
  currency: string;
  city: string;
  images: { url: string }[];
};

export default function HostCalendarPage() {
  const router = useRouter();
  const { status } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/host/calendar");
      return;
    }

    if (status === "authenticated") {
      fetchListings();
    }
  }, [status, router]);

  async function fetchListings() {
    try {
      const res = await fetch("/api/host/listings");
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      setListings(data.listings || []);
      if (data.listings?.length > 0) {
        setSelectedListing(data.listings[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Aucune annonce</h3>
          <p className="mt-2 text-sm text-gray-500">
            Crée une annonce pour gérer ton calendrier
          </p>
          <Link
            href="/listings/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
          >
            Créer une annonce
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/host" className="hover:text-gray-700">Tableau de bord</Link>
          <span>/</span>
          <span className="text-gray-900">Calendrier</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Calendrier</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gérez vos disponibilités, prix et synchronisations
        </p>
      </div>

      {/* Listing selector */}
      {listings.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner une annonce
          </label>
          <div className="flex flex-wrap gap-2">
            {listings.map((listing) => (
              <button
                key={listing.id}
                onClick={() => setSelectedListing(listing.id)}
                className={`
                  rounded-lg px-4 py-2 text-sm font-medium transition
                  ${selectedListing === listing.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                `}
              >
                {listing.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      {selectedListing && (
        <HostCalendar listingId={selectedListing} />
      )}

      {/* Quick links */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/host/listings"
          className="rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition"
        >
          <h3 className="font-medium text-gray-900">Mes annonces</h3>
          <p className="mt-1 text-sm text-gray-500">Gérer toutes mes annonces</p>
        </Link>
        <Link
          href="/host/bookings"
          className="rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition"
        >
          <h3 className="font-medium text-gray-900">Réservations</h3>
          <p className="mt-1 text-sm text-gray-500">Voir les réservations</p>
        </Link>
        <Link
          href="/host/wallet"
          className="rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition"
        >
          <h3 className="font-medium text-gray-900">Revenus</h3>
          <p className="mt-1 text-sm text-gray-500">Consulter mes gains</p>
        </Link>
      </div>
    </div>
  );
}
