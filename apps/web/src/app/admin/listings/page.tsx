/**
 * Page Admin - Liste des annonces
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
import { logger } from "@/lib/logger";

  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

type Listing = {
  id: string;
  title: string;
  type: string;
  price: number;
  currency: string;
  city: string;
  country: string;
  isActive: boolean;
  createdAt: string;
  status: string;
  reportCount: number;
  isFeatured: boolean;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  imageUrl: string | null;
  bookingsCount: number;
  reviewsCount: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircleIcon }> = {
  APPROVED: { label: "Approuvée", color: "bg-green-100 text-green-800", icon: CheckCircleIcon },
  PENDING_REVIEW: { label: "En attente", color: "bg-yellow-100 text-yellow-800", icon: ClockIcon },
  REJECTED: { label: "Rejetée", color: "bg-red-100 text-red-800", icon: XCircleIcon },
  SUSPENDED: { label: "Suspendue", color: "bg-red-100 text-red-800", icon: ExclamationTriangleIcon },
  DRAFT: { label: "Brouillon", color: "bg-gray-100 text-gray-800", icon: ClockIcon },
};

const TYPE_LABELS: Record<string, string> = {
  ROOM: "Chambre",
  STUDIO: "Studio",
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  OFFICE: "Bureau",
  COWORKING: "Coworking",
  MEETING_ROOM: "Salle de réunion",
  PARKING: "Parking",
  GARAGE: "Garage",
  STORAGE: "Stockage",
  EVENT_SPACE: "Espace événement",
  RECORDING_STUDIO: "Studios",
  OTHER: "Autre",
};

export default function AdminListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<{ page: number; pageSize: number; total: number; pageCount: number } | null>(null);
  const [stats, setStats] = useState<{ pending: number; reported: number }>({ pending: 0, reported: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  const fetchListings = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", searchParams.get("page") || "1");
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/listings?${params}`, { signal });
      const data = await res.json();

      if (data.listings) setListings(data.listings);
      if (data.pagination) setPagination(data.pagination);
      if (data.stats) setStats(data.stats);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      logger.error("Erreur chargement listings:", error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    fetchListings(controller.signal);
    return () => controller.abort();
  }, [fetchListings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    router.push(`/admin/listings?${params}`);
  };

  const handleAction = async (id: string, action: string, reason?: string) => {
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });

      if (res.ok) {
        fetchListings();
      }
    } catch (error) {
      logger.error("Erreur action:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Annonces</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination?.total || 0} annonces au total
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-4 py-2 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-yellow-700">En attente</p>
          </div>
          <div className="text-center px-4 py-2 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{stats.reported}</p>
            <p className="text-xs text-red-700">Signalées</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre, ville ou hote..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Rechercher par titre, ville ou hote"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrer par statut"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING_REVIEW">En attente</option>
            <option value="APPROVED">Approuvées</option>
            <option value="REJECTED">Rejetées</option>
            <option value="SUSPENDED">Suspendues</option>
          </select>
          <button
            type="submit"
            aria-label="Filtrer les annonces"
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Filtrer
          </button>
        </form>
      </div>

      {/* Listings Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent mx-auto" />
          </div>
        ) : listings.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">
            Aucune annonce trouvée
          </div>
        ) : (
          listings.map((listing) => {
            const statusConfig = STATUS_CONFIG[listing.status] || STATUS_CONFIG.DRAFT;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={listing.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="relative h-40 bg-gray-100">
                  {listing.imageUrl ? (
                    <Image
                      src={listing.imageUrl}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Pas d&apos;image
                    </div>
                  )}
                  {listing.isFeatured && (
                    <span className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                      <StarIcon className="h-3 w-3" /> Mise en avant
                    </span>
                  )}
                  {listing.reportCount > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                      {listing.reportCount} signalement(s)
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {listing.title}
                    </h3>
                    <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig.label}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    {listing.city}, {listing.country}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-medium text-gray-900">
                      {listing.price} {listing.currency}/nuit
                    </span>
                    <span className="text-xs text-gray-500">
                      {TYPE_LABELS[listing.type] || listing.type}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Par {listing.owner.name || listing.owner.email}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    {listing.status === "PENDING_REVIEW" && (
                      <>
                        <button
                          onClick={() => handleAction(listing.id, "approve")}
                          aria-label={`Approuver l'annonce ${listing.title}`}
                          className="flex-1 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Raison du rejet:");
                            if (reason) handleAction(listing.id, "reject", reason);
                          }}
                          aria-label={`Rejeter l'annonce ${listing.title}`}
                          className="flex-1 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        >
                          Rejeter
                        </button>
                      </>
                    )}
                    {listing.status === "APPROVED" && (
                      <button
                        onClick={() => handleAction(listing.id, "suspend")}
                        aria-label={`Suspendre l'annonce ${listing.title}`}
                        className="flex-1 py-1.5 border border-red-500 text-red-500 rounded text-sm hover:bg-red-50"
                      >
                        Suspendre
                      </button>
                    )}
                    {listing.status === "SUSPENDED" && (
                      <button
                        onClick={() => handleAction(listing.id, "unsuspend")}
                        aria-label={`Reactiver l'annonce ${listing.title}`}
                        className="flex-1 py-1.5 border border-green-500 text-green-500 rounded text-sm hover:bg-green-50"
                      >
                        Reactiver
                      </button>
                    )}
                    <Link
                      href={`/admin/listings/${listing.id}`}
                      aria-label={`Voir les details de l'annonce ${listing.title}`}
                      className="py-1.5 px-3 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => router.push(`/admin/listings?page=${pagination.page - 1}`)}
            disabled={pagination.page === 1}
            aria-label="Page precedente"
            className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Precedent
          </button>
          <span className="px-4 py-2">
            {pagination.page} / {pagination.pageCount}
          </span>
          <button
            onClick={() => router.push(`/admin/listings?page=${pagination.page + 1}`)}
            disabled={pagination.page === pagination.pageCount}
            aria-label="Page suivante"
            className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
