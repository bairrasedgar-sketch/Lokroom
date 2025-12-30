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
} from "@heroicons/react/24/outline";

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
  }[];
  // Nouvelles données avancées
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
};

type PeriodFilter = "7d" | "30d" | "90d" | "1y" | "all";
type ChartView = "revenue" | "bookings" | "occupancy";

export default function HostAnalyticsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [chartView, setChartView] = useState<ChartView>("revenue");
  const [showComparison] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/host/analytics?period=${period}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
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
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
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

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
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

  // Données pour le graphique - multi-vue
  const chartData = data?.monthlyRevenue[0]?.data || [];
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);
  const maxBookings = Math.max(...chartData.map((d) => d.bookings), 1);
  const maxNights = Math.max(...chartData.map((d) => d.nights), 1);

  // Composant pour afficher le changement en pourcentage
  const ChangeIndicator = ({ value, label }: { value: number; label?: string }) => {
    const isPositive = value >= 0;
    return (
      <div className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? (
          <ArrowTrendingUpIcon className="h-3 w-3" />
        ) : (
          <ArrowTrendingDownIcon className="h-3 w-3" />
        )}
        <span>{isPositive ? "+" : ""}{value.toFixed(1)}%</span>
        {label && <span className="text-gray-400 font-normal">vs période préc.</span>}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/host" className="hover:text-gray-700">Tableau de bord</Link>
            <span>/</span>
            <span className="text-gray-900">Analytics</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Performances et statistiques de vos annonces
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period filter */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
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
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => handleExport("json")}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* KPI Cards with comparison indicators */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total revenue */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Revenus totaux</span>
                <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(totalRevenue, primaryCurrency)}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-gray-500">Sur la période</span>
                {data.comparison && showComparison && (
                  <ChangeIndicator value={data.comparison.revenueChange} />
                )}
              </div>
            </div>

            {/* Bookings */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Réservations</span>
                <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {data.summary.totalBookings}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-600">{data.summary.upcomingBookings} à venir</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">{data.summary.pastBookings} passées</span>
                </div>
                {data.comparison && showComparison && (
                  <ChangeIndicator value={data.comparison.bookingsChange} />
                )}
              </div>
            </div>

            {/* Occupancy */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Taux d&apos;occupation</span>
                <HomeIcon className="h-5 w-5 text-purple-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatPercent(data.occupancy.rate)}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {data.occupancy.bookedNights} / {data.occupancy.totalCapacity} nuits
                </span>
                {data.comparison && showComparison && (
                  <ChangeIndicator value={data.comparison.occupancyChange} />
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Note moyenne</span>
                <StarIcon className="h-5 w-5 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {data.summary.averageRating > 0 ? data.summary.averageRating.toFixed(1) : "—"}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-gray-500">{data.summary.totalReviews} avis</span>
                {data.comparison && showComparison && data.comparison.ratingChange !== 0 && (
                  <ChangeIndicator value={data.comparison.ratingChange} />
                )}
              </div>
            </div>
          </div>

          {/* Guest Statistics (Airbnb style) */}
          {data.guestStats && (
            <div className="mb-8 grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-4">
                <UsersIcon className="h-5 w-5 text-blue-500 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{data.guestStats.newGuests}</p>
                <p className="text-xs text-gray-500">Nouveaux voyageurs</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-white p-4">
                <UsersIcon className="h-5 w-5 text-green-500 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{data.guestStats.returningGuests}</p>
                <p className="text-xs text-gray-500">Voyageurs fidèles</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-purple-50 to-white p-4">
                <ClockIcon className="h-5 w-5 text-purple-500 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{data.guestStats.avgStayLength.toFixed(1)}</p>
                <p className="text-xs text-gray-500">Nuits en moyenne</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-amber-50 to-white p-4">
                <CalendarDaysIcon className="h-5 w-5 text-amber-500 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{data.guestStats.avgLeadTime}</p>
                <p className="text-xs text-gray-500">Jours d&apos;anticipation</p>
              </div>
            </div>
          )}

          {/* Interactive Chart with tabs */}
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Évolution des performances</h2>

              {/* Chart view selector */}
              <div className="inline-flex rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setChartView("revenue")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                    chartView === "revenue"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Revenus
                </button>
                <button
                  onClick={() => setChartView("bookings")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                    chartView === "bookings"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Réservations
                </button>
                <button
                  onClick={() => setChartView("occupancy")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                    chartView === "occupancy"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Occupation
                </button>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="space-y-4">
                {/* Interactive multi-view bar chart */}
                <div className="flex items-end gap-2 h-56">
                  {chartData.map((month, idx) => {
                    // Calculer la valeur selon la vue sélectionnée
                    let value: number;
                    let maxValue: number;
                    let displayValue: string;
                    let barColor: string;

                    switch (chartView) {
                      case "revenue":
                        value = month.revenue;
                        maxValue = maxRevenue;
                        displayValue = value > 0 ? formatCurrency(value, primaryCurrency) : "—";
                        barColor = "from-green-600 to-green-400";
                        break;
                      case "bookings":
                        value = month.bookings;
                        maxValue = maxBookings;
                        displayValue = value > 0 ? String(value) : "—";
                        barColor = "from-blue-600 to-blue-400";
                        break;
                      case "occupancy":
                        value = month.nights;
                        maxValue = maxNights;
                        displayValue = value > 0 ? `${value} nuits` : "—";
                        barColor = "from-purple-600 to-purple-400";
                        break;
                    }

                    const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                      >
                        <div className="w-full flex flex-col items-center relative">
                          {/* Tooltip on hover */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                            {displayValue}
                          </div>
                          <span className="text-[10px] font-medium text-gray-700 mb-1 truncate max-w-full">
                            {displayValue.length <= 8 ? displayValue : ""}
                          </span>
                          <div
                            className={`w-full bg-gradient-to-t ${barColor} rounded-t transition-all duration-500 hover:opacity-80`}
                            style={{ height: `${Math.max(height, 4)}%`, minHeight: "4px" }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1">
                          {new Date(month.month + "-01").toLocaleDateString("fr-FR", { month: "short" })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Summary stats */}
                <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
                  <div className={`p-3 rounded-lg ${chartView === "revenue" ? "bg-green-50" : "bg-gray-50"}`}>
                    <p className="text-sm font-medium text-gray-500">Revenus totaux</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(chartData.reduce((sum, m) => sum + m.revenue, 0), primaryCurrency)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${chartView === "bookings" ? "bg-blue-50" : "bg-gray-50"}`}>
                    <p className="text-sm font-medium text-gray-500">Réservations</p>
                    <p className="text-lg font-bold text-gray-900">
                      {chartData.reduce((sum, m) => sum + m.bookings, 0)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${chartView === "occupancy" ? "bg-purple-50" : "bg-gray-50"}`}>
                    <p className="text-sm font-medium text-gray-500">Nuits réservées</p>
                    <p className="text-lg font-bold text-gray-900">
                      {chartData.reduce((sum, m) => sum + m.nights, 0)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-gray-500">
                Aucune donnée pour cette période
              </div>
            )}
          </div>

          {/* Top Performers (like Airbnb Insights) */}
          {data.topPerformers && data.topPerformers.length > 0 && (
            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Meilleures performances</h2>
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {data.topPerformers.map((listing, idx) => (
                  <div key={listing.id} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
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
                      <p className="text-xs text-gray-500">
                        {listing.bookings} réservations
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

          {/* Performance by listing */}
          {data.listings.length > 0 && (
            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance par annonce</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase">Annonce</th>
                      <th className="py-3 text-right text-xs font-medium text-gray-500 uppercase">Réservations</th>
                      <th className="py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenus</th>
                      <th className="py-3 text-right text-xs font-medium text-gray-500 uppercase">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.listings.map((listing) => (
                      <tr key={listing.id} className="hover:bg-gray-50">
                        <td className="py-3">
                          <Link
                            href={`/listings/${listing.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {listing.title}
                          </Link>
                        </td>
                        <td className="py-3 text-right text-sm text-gray-600">
                          {listing.bookings}
                        </td>
                        <td className="py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(listing.revenue, listing.currency)}
                        </td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-sm">
                            <StarIcon className="h-4 w-4 text-amber-500" />
                            {listing.rating > 0 ? listing.rating.toFixed(1) : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cancellation & occupancy stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Cancellation rate */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Taux d&apos;annulation</h3>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke={data.summary.cancellationRate > 0.1 ? "#ef4444" : "#22c55e"}
                      strokeWidth="3"
                      strokeDasharray={`${data.summary.cancellationRate * 100}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">
                      {formatPercent(data.summary.cancellationRate)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-medium ${data.summary.cancellationRate > 0.1 ? "text-red-600" : "text-green-600"}`}>
                    {data.summary.cancellationRate > 0.1 ? "Taux élevé" : "Bon taux"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.summary.cancellationRate > 0.1
                      ? "Pensez à améliorer votre politique d&apos;annulation"
                      : "Vos voyageurs sont satisfaits"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Occupancy breakdown */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Occupation ({data.occupancy.period})</h3>
              <div className="space-y-3">
                <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${data.occupancy.rate * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {data.occupancy.bookedNights} nuits réservées
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatPercent(data.occupancy.rate)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Capacité totale: {data.occupancy.totalCapacity} nuits disponibles
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick links */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <Link
          href="/host"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
