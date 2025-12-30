/**
 * Page Admin - Liste des réservations
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

type Booking = {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  currency: string;
  status: string;
  pricingMode: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    city: string;
    imageUrl: string | null;
  };
  guest: {
    id: string;
    name: string | null;
    email: string;
  };
  hasDispute: boolean;
  hasReview: boolean;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: "Confirmée", color: "bg-green-100 text-green-800" },
  PENDING: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-800" },
};

export default function AdminBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<{ page: number; pageSize: number; total: number; pageCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", searchParams.get("page") || "1");
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/bookings?${params}`);
      const data = await res.json();

      if (data.bookings) setBookings(data.bookings);
      if (data.pagination) setPagination(data.pagination);
    } catch (error) {
      console.error("Erreur chargement bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, searchParams]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    router.push(`/admin/bookings?${params}`);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pagination?.total || 0} réservations au total
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par annonce ou voyageur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="CONFIRMED">Confirmées</option>
            <option value="CANCELLED">Annulées</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Filtrer
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Annonce
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Voyageur
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent mx-auto" />
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Aucune réservation trouvée
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {booking.listing.imageUrl ? (
                            <img
                              src={booking.listing.imageUrl}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <CalendarDaysIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">
                              {booking.listing.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.listing.city}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {booking.guest.name || "Sans nom"}
                        </p>
                        <p className="text-sm text-gray-500">{booking.guest.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p className="text-gray-900">{formatDate(booking.startDate)}</p>
                        <p className="text-gray-500">→ {formatDate(booking.endDate)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">
                          {formatPrice(booking.totalPrice, booking.currency)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.pricingMode === "HOURLY" ? "À l'heure" : "À la nuit"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          {booking.hasDispute && (
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" title="Litige en cours" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          Détails
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pageCount > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} sur {pagination.pageCount}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/admin/bookings?page=${pagination.page - 1}`)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => router.push(`/admin/bookings?page=${pagination.page + 1}`)}
                disabled={pagination.page === pagination.pageCount}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
