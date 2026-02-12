"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamicImport from "next/dynamic";
import {
import { logger } from "@/lib/logger";

  UsersIcon,
  HomeModernIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// Lazy load charts - heavy Recharts library
const RevenueAreaChart = dynamicImport(
  () => import("@/components/admin").then((mod) => ({ default: mod.RevenueAreaChart })),
  { loading: () => <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" />, ssr: false }
);
const BookingsBarChart = dynamicImport(
  () => import("@/components/admin").then((mod) => ({ default: mod.BookingsBarChart })),
  { loading: () => <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" />, ssr: false }
);
const TopListingsChart = dynamicImport(
  () => import("@/components/admin").then((mod) => ({ default: mod.TopListingsChart })),
  { loading: () => <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" />, ssr: false }
);
const StatusDistributionChart = dynamicImport(
  () => import("@/components/admin").then((mod) => ({ default: mod.StatusDistributionChart })),
  { loading: () => <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" />, ssr: false }
);

type DashboardStats = {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    growth: number;
  };
  listings: {
    total: number;
    pending: number;
    published: number;
    growth: number;
  };
  bookings: {
    total: number;
    todayValue: number;
    weeklyValue: number;
    monthlyValue: number;
    growth: number;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
    total: number;
    growth: number;
    currency: string;
  };
  disputes: {
    open: number;
    pending: number;
    resolved: number;
  };
};

type RecentActivity = {
  id: string;
  type: "booking" | "user" | "listing" | "dispute" | "review";
  title: string;
  description: string;
  timestamp: string;
  status?: "success" | "warning" | "error" | "info";
};

type PendingItem = {
  id: string;
  type: "listing" | "dispute" | "payout";
  title: string;
  subtitle: string;
  createdAt: string;
  priority: "high" | "medium" | "low";
  link: string;
};

type ChartData = {
  date: string;
  label: string;
  bookings: number;
  users: number;
  revenue: number;
  fees: number;
};

type TopListing = {
  id: string;
  title: string;
  location: string;
  image: string | null;
  bookings: number;
  revenue: number;
};

type StatusData = {
  status: string;
  count: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState("30");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topListings, setTopListings] = useState<TopListing[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  const fetchDashboard = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/admin/analytics/dashboard", { signal });
      const data = await res.json();
      if (data.stats) setStats(data.stats);
      if (data.activities) setActivities(data.activities);
      if (data.pendingItems) setPendingItems(data.pendingItems);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      logger.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChartData = useCallback(async (signal?: AbortSignal) => {
    setChartLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/charts?period=${chartPeriod}`, { signal });
      const data = await res.json();
      if (data.chartData) setChartData(data.chartData);
      if (data.topListings) setTopListings(data.topListings);
      if (data.statusData) setStatusData(data.statusData);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      logger.error("Error fetching charts:", error);
    } finally {
      setChartLoading(false);
    }
  }, [chartPeriod]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboard(controller.signal);
    // Refresh every 30 seconds
    const interval = setInterval(() => fetchDashboard(), 30000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchDashboard]);

  useEffect(() => {
    const controller = new AbortController();
    fetchChartData(controller.signal);
    return () => controller.abort();
  }, [fetchChartData]);

  const formatCurrency = (amount: number, currency = "EUR") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatGrowth = (value: number) => {
    const isPositive = value >= 0;
    return (
      <span className={`inline-flex items-center text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? (
          <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
        ) : (
          <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
        )}
        {isPositive ? "+" : ""}{value.toFixed(1)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue d&apos;ensemble de la plateforme Lok&apos;Room
          </p>
        </div>
        <button
          onClick={() => { fetchDashboard(); fetchChartData(); }}
          aria-label="Actualiser le tableau de bord"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            {stats && formatGrowth(stats.users.growth)}
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {stats?.users.total.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500">Utilisateurs totaux</p>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <span className="text-green-600">+{stats?.users.newToday || 0} aujourd&apos;hui</span>
            <span className="text-gray-400">|</span>
            <span className="text-blue-600">+{stats?.users.newThisWeek || 0} cette semaine</span>
          </div>
        </div>

        {/* Listings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 rounded-lg">
              <HomeModernIcon className="h-6 w-6 text-purple-600" />
            </div>
            {stats && formatGrowth(stats.listings.growth)}
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {stats?.listings.total.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500">Annonces totales</p>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <span className="text-green-600">{stats?.listings.published || 0} publiées</span>
            <span className="text-gray-400">|</span>
            <span className="text-yellow-600">{stats?.listings.pending || 0} en attente</span>
          </div>
        </div>

        {/* Bookings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-green-600" />
            </div>
            {stats && formatGrowth(stats.bookings.growth)}
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {stats?.bookings.total.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500">Réservations totales</p>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <span className="text-green-600">{stats?.bookings.todayValue || 0} aujourd&apos;hui</span>
            <span className="text-gray-400">|</span>
            <span className="text-blue-600">{stats?.bookings.weeklyValue || 0} cette semaine</span>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            {stats && formatGrowth(stats.revenue.growth)}
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {stats ? formatCurrency(stats.revenue.month, stats.revenue.currency) : "0 €"}
          </p>
          <p className="text-sm text-gray-500">Revenus ce mois</p>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <span className="text-green-600">{stats ? formatCurrency(stats.revenue.today) : "0 €"} aujourd&apos;hui</span>
            <span className="text-gray-400">|</span>
            <span className="text-blue-600">{stats ? formatCurrency(stats.revenue.week) : "0 €"} semaine</span>
          </div>
        </div>
      </div>

      {/* Disputes Alert */}
      {stats && stats.disputes.open > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            <div>
              <p className="font-semibold text-red-800">
                {stats.disputes.open} litige{stats.disputes.open > 1 ? "s" : ""} en cours
              </p>
              <p className="text-sm text-red-600">
                {stats.disputes.pending} en attente de réponse
              </p>
            </div>
          </div>
          <Link
            href="/admin/disputes"
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
          >
            Voir les litiges
          </Link>
        </div>
      )}

      {/* Charts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-gray-500" />
            Graphiques de performance
          </h2>
          <select
            value={chartPeriod}
            onChange={(e) => setChartPeriod(e.target.value)}
            aria-label="Selectionner la periode des graphiques"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="7">7 derniers jours</option>
            <option value="14">14 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">3 derniers mois</option>
          </select>
        </div>

        {chartLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white rounded-xl border border-gray-200 p-4 h-80 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 h-80 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueAreaChart
              data={chartData}
              title="Évolution des revenus"
              showFees
              height={280}
            />
            <BookingsBarChart
              data={chartData}
              title="Réservations par jour"
              height={280}
            />
          </div>
        )}
      </div>

      {/* Secondary Charts & Top Listings */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopListingsChart
            data={topListings}
            title="Top annonces par revenus"
            height={280}
          />
        </div>
        <StatusDistributionChart
          data={statusData}
          title="Statut des réservations"
        />
      </div>

      {/* Main Grid - Pending & Activities */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Items */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Actions requises</h2>
            <span className="text-sm text-gray-500">{pendingItems.length} éléments</span>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p>Aucune action requise</p>
              </div>
            ) : (
              pendingItems.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={item.link}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    item.priority === "high" ? "bg-red-500" :
                    item.priority === "medium" ? "bg-yellow-500" : "bg-gray-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                      item.type === "dispute" ? "bg-red-100 text-red-700" :
                      item.type === "listing" ? "bg-yellow-100 text-yellow-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {item.type === "dispute" ? "Litige" :
                       item.type === "listing" ? "Annonce" : "Paiement"}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
          {pendingItems.length > 5 && (
            <div className="p-4 border-t border-gray-200">
              <Link
                href="/admin/disputes"
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Voir tous les éléments →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Activité récente</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ClockIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p>Aucune activité récente</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-full ${
                      activity.status === "success" ? "bg-green-100" :
                      activity.status === "warning" ? "bg-yellow-100" :
                      activity.status === "error" ? "bg-red-100" :
                      "bg-blue-100"
                    }`}>
                      {activity.status === "success" ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : activity.status === "error" ? (
                        <XCircleIcon className="h-4 w-4 text-red-600" />
                      ) : activity.status === "warning" ? (
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/listings?status=PENDING_REVIEW"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all"
        >
          <div className="p-2 bg-yellow-100 rounded-lg">
            <HomeModernIcon className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Modérer annonces</p>
            <p className="text-sm text-gray-500">{stats?.listings.pending || 0} en attente</p>
          </div>
        </Link>

        <Link
          href="/admin/disputes?status=OPEN"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all"
        >
          <div className="p-2 bg-red-100 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Résoudre litiges</p>
            <p className="text-sm text-gray-500">{stats?.disputes.open || 0} ouverts</p>
          </div>
        </Link>

        <Link
          href="/admin/users?sort=newest"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all"
        >
          <div className="p-2 bg-blue-100 rounded-lg">
            <UsersIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Nouveaux utilisateurs</p>
            <p className="text-sm text-gray-500">{stats?.users.newToday || 0} aujourd&apos;hui</p>
          </div>
        </Link>

        <Link
          href="/admin/analytics"
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all"
        >
          <div className="p-2 bg-purple-100 rounded-lg">
            <ArrowTrendingUpIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Voir analytics</p>
            <p className="text-sm text-gray-500">Rapports détaillés</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
