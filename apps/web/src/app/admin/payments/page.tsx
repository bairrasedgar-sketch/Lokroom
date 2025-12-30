/**
 * Page Admin - Dashboard Paiements
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BanknotesIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  UserCircleIcon,
  HomeModernIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { RevenueAreaChart, COLORS } from "@/components/admin/Charts";

type Payment = {
  id: string;
  type: string;
  amount: number;
  guestFee: number;
  hostFee: number;
  platformNet: number;
  currency: string;
  status: string;
  refunded: number;
  stripePaymentId: string | null;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    city: string;
    owner: {
      id: string;
      name: string | null;
      email: string;
      hostProfile: { stripeAccountId: string | null; payoutsEnabled: boolean } | null;
    };
  };
  guest: {
    id: string;
    name: string | null;
    email: string;
  };
  payoutReady: boolean;
  payoutEnabled: boolean;
};

type TopHost = {
  listingId: string;
  listingTitle: string;
  host: {
    id: string;
    name: string | null;
    email: string;
    profile?: { avatarUrl: string | null };
  };
  revenue: number;
  bookings: number;
};

type ChartDataPoint = {
  date: string;
  label: string;
  revenue: number;
  fees: number;
  count: number;
};

type Stats = {
  totalRevenue: number;
  totalGuestFees: number;
  totalHostFees: number;
  platformNet: number;
  bookingsCount: number;
  pendingPayouts: number;
  completedPayouts: number;
  refundedAmount: number;
  refundedCount: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "En attente", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  CONFIRMED: { label: "Payé", color: "text-green-700", bgColor: "bg-green-100" },
  CANCELLED: { label: "Annulé", color: "text-red-700", bgColor: "bg-red-100" },
};

export default function AdminPaymentsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [topHosts, setTopHosts] = useState<TopHost[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7" | "30" | "90">("30");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPayments();
  }, [period, statusFilter]);

  const fetchPayments = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();

      setStats(data.stats);
      setPayments(data.payments);
      setChartData(data.chartData);
      setTopHosts(data.topHosts);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number, currency = "EUR") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(cents / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.listing.title.toLowerCase().includes(query) ||
      p.guest.name?.toLowerCase().includes(query) ||
      p.guest.email.toLowerCase().includes(query) ||
      p.listing.owner.name?.toLowerCase().includes(query) ||
      p.listing.owner.email.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query)
    );
  });

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestion des paiements, remboursements et versements
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { value: "7", label: "7j" },
              { value: "30", label: "30j" },
              { value: "90", label: "90j" },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value as typeof period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  period === p.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-100 rounded-xl">
              <BanknotesIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-900">
                {stats ? formatCurrency(stats.totalRevenue) : "0 €"}
              </p>
              <p className="text-sm text-gray-500">Volume total</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {stats?.bookingsCount || 0} réservation(s) sur la période
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-900">
                {stats ? formatCurrency(stats.platformNet) : "0 €"}
              </p>
              <p className="text-sm text-gray-500">Revenus plateforme</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Frais voyageur:</span>
            <span className="font-medium">{stats ? formatCurrency(stats.totalGuestFees) : "0 €"}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-yellow-100 rounded-xl">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-900">
                {stats ? formatCurrency(stats.pendingPayouts) : "0 €"}
              </p>
              <p className="text-sm text-gray-500">Payouts en attente</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">À verser aux hôtes</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-orange-100 rounded-xl">
              <ArrowPathIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-900">
                {stats ? formatCurrency(stats.refundedAmount) : "0 €"}
              </p>
              <p className="text-sm text-gray-500">Remboursé</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {stats?.refundedCount || 0} remboursement(s)
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueAreaChart
            data={chartData}
            dataKey="revenue"
            title="Évolution des revenus"
            showFees={true}
            height={280}
          />
        </div>

        {/* Top Hosts */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Hôtes (Revenus)</h3>
          <div className="space-y-3">
            {topHosts.map((host, index) => (
              <Link
                key={host.listingId}
                href={`/admin/users/${host.host.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                {host.host.profile?.avatarUrl ? (
                  <img
                    src={host.host.profile.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    {host.host.name?.charAt(0) || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {host.host.name || host.host.email}
                  </p>
                  <p className="text-xs text-gray-500">{host.bookings} résa.</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(host.revenue)}
                </p>
              </Link>
            ))}
            {topHosts.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Aucune donnée</p>
            )}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par annonce, voyageur, hôte..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tous les statuts</option>
            <option value="CONFIRMED">Payé</option>
            <option value="PENDING">En attente</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Réservation
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Voyageur
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Hôte
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Montant
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Plateforme
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Payout
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((payment) => {
                const statusConfig = STATUS_CONFIG[payment.status] || STATUS_CONFIG.PENDING;
                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bookings/${payment.id}`}
                        className="flex items-center gap-3"
                      >
                        <HomeModernIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                            {payment.listing.title}
                          </p>
                          <p className="text-xs text-gray-500">{payment.listing.city}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${payment.guest.id}`}
                        className="text-sm text-gray-900 hover:text-red-600"
                      >
                        {payment.guest.name || payment.guest.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${payment.listing.owner.id}`}
                        className="text-sm text-gray-900 hover:text-red-600"
                      >
                        {payment.listing.owner.name || payment.listing.owner.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount + payment.guestFee, payment.currency)}
                      </p>
                      {payment.refunded > 0 && (
                        <p className="text-xs text-orange-600">
                          -{formatCurrency(payment.refunded)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(payment.platformNet, payment.currency)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {payment.status === "CONFIRMED" ? (
                        payment.payoutReady ? (
                          payment.payoutEnabled ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircleIcon className="h-4 w-4" />
                              Prêt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                              <ClockIcon className="h-4 w-4" />
                              Stripe requis
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">En cours</span>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">
                      {formatDate(payment.createdAt)}
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Aucun paiement trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} sur {pagination.totalPages} ({pagination.total} résultats)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchPayments(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => fetchPayments(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircleIcon className="h-6 w-6 text-green-200" />
            <p className="text-green-100 text-sm">Payouts complétés</p>
          </div>
          <p className="text-2xl font-bold">
            {stats ? formatCurrency(stats.completedPayouts) : "0 €"}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <ArrowTrendingUpIcon className="h-6 w-6 text-blue-200" />
            <p className="text-blue-100 text-sm">Commission moyenne</p>
          </div>
          <p className="text-2xl font-bold">
            {stats && stats.bookingsCount > 0
              ? formatCurrency(stats.platformNet / stats.bookingsCount)
              : "0 €"}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <BanknotesIcon className="h-6 w-6 text-purple-200" />
            <p className="text-purple-100 text-sm">Panier moyen</p>
          </div>
          <p className="text-2xl font-bold">
            {stats && stats.bookingsCount > 0
              ? formatCurrency(stats.totalRevenue / stats.bookingsCount)
              : "0 €"}
          </p>
        </div>
      </div>
    </div>
  );
}
