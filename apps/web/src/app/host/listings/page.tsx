// apps/web/src/app/host/listings/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Types d'espaces avec leurs labels
const SPACE_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  ROOM: "Chambre",
  STUDIO: "Studio créatif",
  OFFICE: "Bureau",
  COWORKING: "Coworking",
  MEETING_ROOM: "Salle de réunion",
  PARKING: "Parking",
  GARAGE: "Garage",
  STORAGE: "Stockage",
  EVENT_SPACE: "Espace événementiel",
  RECORDING_STUDIO: "Studio d'enregistrement",
  OTHER: "Autre",
};

type Listing = {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  hourlyPrice: number | null;
  currency: string;
  pricingMode: string;
  country: string;
  city: string;
  createdAt: string;
  images: { id: string; url: string; isCover: boolean }[];
  _count: {
    bookings: number;
    favorites: number;
  };
};

type Draft = {
  id: string;
  formData: {
    type: string | null;
    title: string;
    city: string;
    country: string;
    price: number;
  };
  currentStep: string;
  lastSaved: string;
  createdAt: string;
};

type Stats = {
  total: number;
  totalBookings: number;
  totalFavorites: number;
};

type Tab = "published" | "drafts";

export default function HostListingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("published");
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Clé unique par utilisateur pour isoler les brouillons
  const userEmail = session?.user?.email || "";
  const DRAFTS_KEY = userEmail ? `lokroom_listing_drafts_${userEmail}` : "";
  const DRAFT_EXPIRY_DAYS = 90;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/host/listings");
      return;
    }

    if (status === "authenticated") {
      fetchListings();
      loadDrafts();
    }
  }, [status, router]);

  async function fetchListings() {
    try {
      const res = await fetch("/api/host/listings");
      if (!res.ok) {
        const data = await res.json();

        // Si accès refusé, tenter d'activer le mode hôte et réessayer
        if (res.status === 403) {
          const activateRes = await fetch("/api/host/activate", { method: "POST" });
          if (activateRes.ok) {
            // Réessayer de charger les annonces
            const retryRes = await fetch("/api/host/listings");
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              setListings(retryData.listings);
              setStats(retryData.stats);
              setLoading(false);
              return;
            }
          }
        }

        throw new Error(data.error || "Erreur de chargement");
      }
      const data = await res.json();
      setListings(data.listings);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function loadDrafts() {
    if (typeof window === "undefined" || !DRAFTS_KEY) return;
    const savedDrafts = localStorage.getItem(DRAFTS_KEY);
    if (savedDrafts) {
      try {
        const parsed = JSON.parse(savedDrafts);
        if (Array.isArray(parsed)) {
          // Filter out expired drafts (older than 90 days)
          const now = new Date();
          const validDrafts = parsed.filter((draft: Draft) => {
            if (!draft.createdAt) return false;
            const createdDate = new Date(draft.createdAt);
            const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff < DRAFT_EXPIRY_DAYS;
          });

          // Update localStorage if some drafts were filtered out
          if (validDrafts.length !== parsed.length) {
            localStorage.setItem(DRAFTS_KEY, JSON.stringify(validDrafts));
          }

          setDrafts(validDrafts);
        } else {
          setDrafts([]);
        }
      } catch {
        setDrafts([]);
      }
    }
  }

  function deleteDraft(draftId: string) {
    if (typeof window !== "undefined") {
      const updatedDrafts = drafts.filter(d => d.id !== draftId);
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);
    }
  }

  function formatPrice(listing: Listing): string {
    const symbol = listing.currency === "EUR" ? "€" : listing.currency === "CAD" ? "$" : "$";
    if (listing.pricingMode === "HOURLY" && listing.hourlyPrice) {
      return `${listing.hourlyPrice}${symbol}/h`;
    }
    if (listing.pricingMode === "BOTH" && listing.hourlyPrice) {
      return `${listing.price}${symbol}/j · ${listing.hourlyPrice}${symbol}/h`;
    }
    return `${listing.price}${symbol}/nuit`;
  }

  function formatDraftDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return "Hier";
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mes annonces</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gère et modifie tes espaces à louer
          </p>
        </div>
        <Link
          href="/listings/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Créer une annonce
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("published")}
          className={`relative px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "published"
              ? "text-gray-900 border-b-2 border-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Publiées
          {listings.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {listings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("drafts")}
          className={`relative px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "drafts"
              ? "text-gray-900 border-b-2 border-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Brouillons
          {drafts.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {drafts.length}
            </span>
          )}
        </button>
      </div>

      {/* Stats (only for published) */}
      {activeTab === "published" && stats && stats.total > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-gray-500">Annonces</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-gray-500">Réservations</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.totalBookings}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-gray-500">Favoris</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.totalFavorites}</p>
          </div>
        </div>
      )}

      {/* Published listings */}
      {activeTab === "published" && (
        <>
          {listings.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Aucune annonce</h3>
              <p className="mt-2 text-sm text-gray-500">
                Tu n&apos;as pas encore créé d&apos;annonce. Commence à louer ton espace !
              </p>
              <Link
                href="/listings/new"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Créer ma première annonce
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="group flex gap-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm"
                >
                  {/* Image */}
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-32 sm:w-44">
                    {listing.images[0] ? (
                      <Image
                        src={listing.images[0].url}
                        alt={listing.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 128px, 176px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-600">
                            {SPACE_TYPE_LABELS[listing.type] || listing.type}
                          </span>
                          <h3 className="mt-1 font-semibold text-gray-900 group-hover:text-gray-700">
                            {listing.title}
                          </h3>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-gray-900">
                          {formatPrice(listing)}
                        </p>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {listing.city}{listing.city && listing.country ? ", " : ""}{listing.country}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        {listing._count.bookings} réservation{listing._count.bookings !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        {listing._count.favorites} favori{listing._count.favorites !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col justify-center gap-2">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Voir
                    </Link>
                    <Link
                      href={`/listings/${listing.id}/edit`}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Modifier
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Drafts */}
      {activeTab === "drafts" && (
        <>
          {drafts.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Aucun brouillon</h3>
              <p className="mt-2 text-sm text-gray-500">
                Les annonces en cours de création apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {drafts.length} brouillon{drafts.length > 1 ? "s" : ""} · Les brouillons sont automatiquement supprimés après 90 jours
              </p>
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="group flex gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 transition hover:border-amber-300"
                >
                  {/* Draft icon */}
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-amber-100 sm:h-32 sm:w-44 flex items-center justify-center">
                    <svg className="h-12 w-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>

                  {/* Infos */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-800">
                            Brouillon
                          </span>
                          <h3 className="mt-1 font-semibold text-gray-900">
                            {draft.formData.title || "Annonce sans titre"}
                          </h3>
                        </div>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {draft.formData.type ? SPACE_TYPE_LABELS[draft.formData.type] || draft.formData.type : "Type non défini"}
                        {draft.formData.city && ` · ${draft.formData.city}`}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Modifié {formatDraftDate(draft.lastSaved)}
                        {draft.createdAt && (
                          <> · Créé le {new Date(draft.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</>
                        )}
                      </p>
                    </div>

                    <div className="mt-3 text-xs text-amber-700">
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Étape : {draft.currentStep}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col justify-center gap-2">
                    <Link
                      href="/listings/new"
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                    >
                      Continuer
                    </Link>
                    <button
                      onClick={() => deleteDraft(draft.id)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Lien retour */}
      <div className="mt-8">
        <Link
          href="/host"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour au tableau de bord hôte
        </Link>
      </div>
    </div>
  );
}
