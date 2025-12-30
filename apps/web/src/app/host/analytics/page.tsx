"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  StarIcon,
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  ChartPieIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

// Import des graphiques Recharts
import {
  HostPerformanceChart,
  HostOccupancyChart,
  HostBookingStatusChart,
  HostRatingBreakdown,
  HostListingsPerformance,
} from "@/components/host/HostCharts";

type MonthlyData = {
  month: string;
  revenue: number;
  bookings: number;
  nights: number;
};

type AnalyticsData = {
  summary: {
    totalBookings: number;
    upcomingBookings: number;
    pastBookings: number;
    cancelledBookings?: number;
    cancellationRate: number;
    averageRating: number;
    totalReviews: number;
  };
  monthlyRevenue: {
    currency: string;
    data: MonthlyData[];
  }[];
  occupancy: {
    rate: number;
    bookedNights: number;
    totalCapacity: number;
    period: string;
  };
  listings: {
    id: string;
    title: string;
    bookings: number;
    revenue: number;
    currency: string;
    rating: number;
    occupancy?: number;
  }[];
  comparison?: {
    revenueChange: number;
    bookingsChange: number;
    occupancyChange: number;
    ratingChange: number;
  };
  topPerformers?: {
    id: string;
    title: string;
    revenue: number;
    bookings: number;
    growth: number;
  }[];
  guestStats?: {
    newGuests: number;
    returningGuests: number;
    avgStayLength: number;
    avgLeadTime: number;
  };
  ratingBreakdown?: {
    stars: number;
    count: number;
  }[];
};

type PeriodFilter = "7d" | "30d" | "90d" | "1y" | "all";

export default function HostAnalyticsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`/api/host/analytics?period=${period}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/host/analytics");
      return;
    }

    if (status === "authenticated") {
      fetchAnalytics();
    }
  }, [status, router, fetchAnalytics]);

  function formatCurrency(amount: number, currency: string = "EUR") {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function formatPercent(value: number) {
    return `${Math.round(value * 100)}%`;
  }

  async function handleExport(format: "csv" | "json") {
    try {
      const res = await fetch(`/api/host/analytics/export?period=${period}&format=${format}`);
      if (!res.ok) throw new Error("Erreur");

      if (format === "csv") {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-${period}.csv`;
        a.click();
      } else {
        const jsonData = await res.json();
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-${period}.json`;
        a.click();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Composant pour afficher le changement en pourcentage
  const ChangeIndicator = ({ value, showLabel = false }: { value: number; showLabel?: boolean }) => {
    const isPositive = value >= 0;
    return (
      <div className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? (
          <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
        ) : (
          <ArrowTrendingDownIcon className="h-3.5 w-3.5" />
        )}
        <span>{isPositive ? "+" : ""}{value.toFixed(1)}%</span>
        {showLabel && <span className="text-gray-400 font-normal ml-1">vs période préc.</span>}
      </div>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
          <p className="text-sm text-gray-500">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">Erreur de chargement</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchAnalytics()}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Calculer le total des revenus
  const totalRevenue = data?.monthlyRevenue.reduce((acc, curr) => {
    const total = curr.data.reduce((sum, m) => sum + m.revenue, 0);
    return acc + total;
  }, 0) || 0;

  const primaryCurrency = data?.monthlyRevenue[0]?.currency || "EUR";
  const chartData = data?.monthlyRevenue[0]?.data || [];

  // Calcul des bookings cancelled pour le pie chart
  const confirmedBookings = data?.summary.pastBookings || 0;
  const pendingBookings = data?.summary.upcomingBookings || 0;
  const cancelledBookings = data?.summary.cancelledBookings || Math.round((data?.summary.totalBookings || 0) * (data?.summary.cancellationRate || 0));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/host" className="hover:text-gray-700 transition-colors">Tableau de bord</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Performances et statistiques de vos annonces
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Refresh button */}
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </button>

          {/* Period filter */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
            <option value="1y">Cette année</option>
            <option value="all">Tout</option>
          </select>

          {/* Export buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport("csv")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => handleExport("json")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* KPI Cards - Niveau Airbnb */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total revenue */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                </div>
                {data.comparison && (
                  <ChangeIndicator value={data.comparison.revenueChange} />
                )}
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Revenus totaux</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalRevenue, primaryCurrency)}
              </p>
            </div>

            {/* Bookings */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
                </div>
                {data.comparison && (
                  <ChangeIndicator value={data.comparison.bookingsChange} />
                )}
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Réservations</p>
              <p className="text-3xl font-bold text-gray-900">
                {data.summary.totalBookings}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                  {data.summary.upcomingBookings} à venir
                </span>
                <span className="text-gray-500">{data.summary.pastBookings} passées</span>
              </div>
            </div>

            {/* Occupancy */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <HomeIcon className="h-6 w-6 text-purple-600" />
                </div>
                {data.comparison && (
                  <ChangeIndicator value={data.comparison.occupancyChange} />
                )}
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Taux d&apos;occupation</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPercent(data.occupancy.rate)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {data.occupancy.bookedNights} / {data.occupancy.totalCapacity} nuits
              </p>
            </div>

            {/* Rating */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <StarIcon className="h-6 w-6 text-amber-600" />
                </div>
                {data.comparison && data.comparison.ratingChange !== 0 && (
                  <ChangeIndicator value={data.comparison.ratingChange} />
                )}
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Note moyenne</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">
                  {data.summary.averageRating > 0 ? data.summary.averageRating.toFixed(1) : "—"}
                </p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(data.summary.averageRating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">{data.summary.totalReviews} avis</p>
            </div>
          </div>

          {/* Guest Statistics - Style Airbnb */}
          {data.guestStats && (
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 p-5">
                <UsersIcon className="h-6 w-6 text-blue-600 mb-3" />
                <p className="text-2xl font-bold text-gray-900">{data.guestStats.newGuests}</p>
                <p className="text-sm text-gray-600">Nouveaux voyageurs</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50 p-5">
                <UsersIcon className="h-6 w-6 text-green-600 mb-3" />
                <p className="text-2xl font-bold text-gray-900">{data.guestStats.returningGuests}</p>
                <p className="text-sm text-gray-600">Voyageurs fidèles</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 p-5">
                <ClockIcon className="h-6 w-6 text-purple-600 mb-3" />
                <p className="text-2xl font-bold text-gray-900">{data.guestStats.avgStayLength.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Nuits en moyenne</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 p-5">
                <CalendarDaysIcon className="h-6 w-6 text-amber-600 mb-3" />
                <p className="text-2xl font-bold text-gray-900">{data.guestStats.avgLeadTime}</p>
                <p className="text-sm text-gray-600">Jours d&apos;anticipation</p>
              </div>
            </div>
          )}

          {/* Main Chart - Performance avec Recharts */}
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Évolution des performances</h2>
                <p className="text-sm text-gray-500 mt-0.5">Revenus, réservations et nuits sur la période</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-gray-600">Revenus</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gray-600">Réservations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-gray-600">Nuits</span>
                </div>
              </div>
            </div>

            {chartData.length > 0 ? (
              <HostPerformanceChart
                data={chartData}
                currency={primaryCurrency}
                height={350}
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-gray-500">
                <div className="text-center">
                  <ChartBarIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>Aucune donnée pour cette période</p>
                </div>
              </div>
            )}

            {/* Summary stats */}
            {chartData.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-green-50">
                  <p className="text-sm font-medium text-gray-600">Revenus totaux</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {formatCurrency(chartData.reduce((sum, m) => sum + m.revenue, 0), primaryCurrency)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-50">
                  <p className="text-sm font-medium text-gray-600">Réservations</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {chartData.reduce((sum, m) => sum + m.bookings, 0)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-xl bg-purple-50">
                  <p className="text-sm font-medium text-gray-600">Nuits réservées</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {chartData.reduce((sum, m) => sum + m.nights, 0)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Two column layout - Occupancy & Status */}
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            {/* Occupancy Donut */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-6">
                <ChartPieIcon className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Taux d&apos;occupation</h3>
              </div>
              <HostOccupancyChart
                rate={data.occupancy.rate}
                bookedNights={data.occupancy.bookedNights}
                totalNights={data.occupancy.totalCapacity}
                height={220}
              />
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div className="p-3 rounded-xl bg-pink-50">
                  <p className="text-sm text-gray-600">Nuits réservées</p>
                  <p className="text-lg font-bold text-gray-900">{data.occupancy.bookedNights}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-sm text-gray-600">Capacité totale</p>
                  <p className="text-lg font-bold text-gray-900">{data.occupancy.totalCapacity}</p>
                </div>
              </div>
            </div>

            {/* Booking Status */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-6">
                <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Statut des réservations</h3>
              </div>
              <HostBookingStatusChart
                pending={pendingBookings}
                confirmed={confirmedBookings}
                cancelled={cancelledBookings}
                height={220}
              />
              <div className="mt-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <span className="text-sm text-gray-600">Taux d&apos;annulation</span>
                  <span className={`text-sm font-bold ${
                    data.summary.cancellationRate > 0.1 ? "text-red-600" : "text-green-600"
                  }`}>
                    {formatPercent(data.summary.cancellationRate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ratings breakdown */}
          {data.ratingBreakdown && data.ratingBreakdown.length > 0 && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-6">
                <StarIcon className="h-5 w-5 text-amber-400" />
                <h3 className="font-semibold text-gray-900">Répartition des notes</h3>
              </div>
              <div className="max-w-md">
                <HostRatingBreakdown ratings={data.ratingBreakdown} />
              </div>
            </div>
          )}

          {/* Performance par annonce */}
          {data.listings.length > 0 && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <HomeIcon className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Performance par annonce</h3>
                </div>
                <Link
                  href="/host/listings"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Voir toutes les annonces →
                </Link>
              </div>
              <HostListingsPerformance
                listings={data.listings}
                currency={primaryCurrency}
              />
            </div>
          )}

          {/* Top Performers */}
          {data.topPerformers && data.topPerformers.length > 0 && (
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Meilleures performances</h3>
                </div>
              </div>
              <div className="space-y-4">
                {data.topPerformers.map((listing, idx) => (
                  <div key={listing.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? "bg-amber-100 text-amber-700" :
                      idx === 1 ? "bg-gray-100 text-gray-700" :
                      idx === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-50 text-gray-500"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/listings/${listing.id}`} className="font-medium text-gray-900 hover:text-blue-600 truncate block">
                        {listing.title}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {listing.bookings} réservation{listing.bookings > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(listing.revenue, primaryCurrency)}
                      </p>
                      {listing.growth !== 0 && (
                        <ChangeIndicator value={listing.growth} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick links */}
      <div className="mt-8 pt-8 border-t border-gray-200 flex flex-wrap gap-4">
        <Link
          href="/host"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour au tableau de bord
        </Link>
        <Link
          href="/host/calendar"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <CalendarDaysIcon className="h-4 w-4" />
          Calendrier
        </Link>
        <Link
          href="/host/bookings"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <HomeIcon className="h-4 w-4" />
          Réservations
        </Link>
      </div>
    </div>
  );
}
