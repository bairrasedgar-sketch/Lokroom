/**
 * Page Admin - Analytics avec Graphiques
 */
"use client";

import { useState, useEffect } from "react";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  HomeModernIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import {
  RevenueAreaChart,
  BookingsBarChart,
  DistributionPieChart,
  TopListingsChart,
  StatusDistributionChart,
  MultiLineChart,
  COLORS,
} from "@/components/admin/Charts";

type Stats = {
  users: { total: number; thisMonth: number; lastMonth: number; growth: number };
  listings: { total: number; active: number; pending: number };
  bookings: { total: number; thisMonth: number; growth: number };
  revenue: { thisMonth: number; lastMonth: number; growth: number };
};

type ChartDataPoint = {
  date: string;
  label: string;
  bookings: number;
  users: number;
  revenue: number;
  fees: number;
};

type CountryData = {
  country: string;
  bookings: number;
  revenue: number;
};

type TypeData = {
  type: string;
  count: number;
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

type ChartsData = {
  chartData: ChartDataPoint[];
  countryData: CountryData[];
  typeData: TypeData[];
  topListings: TopListing[];
  statusData: StatusData[];
  conversionRate: number;
  period: number;
};

const TYPE_LABELS: Record<string, string> = {
  STUDIO: "Studio Photo",
  OFFICE: "Bureau",
  EVENT_SPACE: "Espace Événementiel",
  COWORKING: "Coworking",
  MEETING_ROOM: "Salle de Réunion",
  OTHER: "Autre",
};

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7" | "30" | "90">("30");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((res) => res.json()),
      fetch(`/api/admin/analytics/charts?period=${period}`).then((res) => res.json()),
    ])
      .then(([statsData, charts]) => {
        setStats(statsData);
        setChartsData(charts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? <ArrowTrendingUpIcon className="h-4 w-4" /> : <ArrowTrendingDownIcon className="h-4 w-4" />}
        {isPositive ? "+" : ""}{growth.toFixed(1)}%
      </div>
    );
  };

  const handleExportCSV = async () => {
    if (!chartsData) return;
    setExporting(true);

    try {
      // Préparer les données CSV
      const headers = ["Date", "Réservations", "Nouveaux utilisateurs", "Revenus (€)", "Frais plateforme (€)"];
      const rows = chartsData.chartData.map((d) => [
        d.date,
        d.bookings,
        d.users,
        d.revenue,
        d.fees,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      // Télécharger
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `lokroom-analytics-${period}j-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  // Transformer les données pour les graphiques
  const typeChartData = chartsData?.typeData.map((t) => ({
    name: TYPE_LABELS[t.type] || t.type,
    count: t.count,
  })) || [];

  const countryChartData = chartsData?.countryData.map((c) => ({
    name: c.country,
    count: c.bookings,
    revenue: c.revenue,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue d&apos;ensemble des performances de la plateforme
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
          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={exporting || !chartsData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            {exporting ? "Export..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Users */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <UsersIcon className="h-5 w-5 text-blue-600" />
            </div>
            {stats && formatGrowth(stats.users.growth)}
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-0.5">
            {stats?.users.total.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500">Utilisateurs totaux</p>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
            <span className="text-gray-500">Ce mois : <span className="font-medium text-gray-900">+{stats?.users.thisMonth || 0}</span></span>
            <span className="text-gray-400">Dernier : +{stats?.users.lastMonth || 0}</span>
          </div>
        </div>

        {/* Listings */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-purple-100 rounded-xl">
              <HomeModernIcon className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-0.5">
            {stats?.listings.total.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500">Annonces totales</p>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
            <span className="text-green-600 font-medium">{stats?.listings.active || 0} actives</span>
            <span className="text-yellow-600">{stats?.listings.pending || 0} en attente</span>
          </div>
        </div>

        {/* Bookings */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-green-100 rounded-xl">
              <CalendarDaysIcon className="h-5 w-5 text-green-600" />
            </div>
            {stats && formatGrowth(stats.bookings.growth)}
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-0.5">
            {stats?.bookings.total.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500">Réservations totales</p>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
            <span className="text-gray-500">Ce mois : <span className="font-medium text-gray-900">{stats?.bookings.thisMonth || 0}</span></span>
            {chartsData && (
              <span className="text-gray-400">Taux conv. : {chartsData.conversionRate}%</span>
            )}
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-yellow-100 rounded-xl">
              <CurrencyDollarIcon className="h-5 w-5 text-yellow-600" />
            </div>
            {stats && formatGrowth(stats.revenue.growth)}
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-0.5">
            {stats ? formatCurrency(stats.revenue.thisMonth) : "0 €"}
          </p>
          <p className="text-sm text-gray-500">Revenus ce mois</p>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
            <span className="text-gray-500">Mois dernier : <span className="text-gray-400">{stats ? formatCurrency(stats.revenue.lastMonth) : "0 €"}</span></span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        {chartsData && (
          <RevenueAreaChart
            data={chartsData.chartData}
            dataKey="revenue"
            title="Évolution des revenus"
            showFees={true}
            height={280}
          />
        )}

        {/* Bookings Chart */}
        {chartsData && (
          <BookingsBarChart
            data={chartsData.chartData}
            title="Réservations par jour"
            height={280}
          />
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Users + Bookings Multi Line */}
        {chartsData && (
          <div className="lg:col-span-2">
            <MultiLineChart
              data={chartsData.chartData}
              lines={[
                { dataKey: "users", name: "Nouveaux utilisateurs", color: COLORS.secondary },
                { dataKey: "bookings", name: "Réservations", color: COLORS.primary },
              ]}
              title="Activité utilisateurs"
              height={280}
            />
          </div>
        )}

        {/* Booking Status */}
        {chartsData && chartsData.statusData.length > 0 && (
          <StatusDistributionChart
            data={chartsData.statusData}
            title="Statuts des réservations"
          />
        )}
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Listings */}
        {chartsData && (
          <TopListingsChart
            data={chartsData.topListings}
            title="Top 5 Annonces (Revenus)"
            height={320}
          />
        )}

        {/* Type Distribution */}
        {typeChartData.length > 0 && (
          <DistributionPieChart
            data={typeChartData}
            dataKey="count"
            nameKey="name"
            title="Types d'espaces"
            height={320}
          />
        )}

        {/* Country Distribution */}
        {countryChartData.length > 0 ? (
          <DistributionPieChart
            data={countryChartData}
            dataKey="count"
            nameKey="name"
            title="Réservations par pays"
            height={320}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Réservations par pays</h3>
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm">Pas assez de données</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white">
          <p className="text-red-100 text-sm mb-1">Revenu total période</p>
          <p className="text-2xl font-bold">
            {chartsData ? formatCurrency(chartsData.chartData.reduce((sum, d) => sum + d.revenue, 0)) : "0 €"}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <p className="text-blue-100 text-sm mb-1">Frais plateforme</p>
          <p className="text-2xl font-bold">
            {chartsData ? formatCurrency(chartsData.chartData.reduce((sum, d) => sum + d.fees, 0)) : "0 €"}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <p className="text-green-100 text-sm mb-1">Réservations période</p>
          <p className="text-2xl font-bold">
            {chartsData ? chartsData.chartData.reduce((sum, d) => sum + d.bookings, 0) : 0}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <p className="text-purple-100 text-sm mb-1">Nouveaux inscrits</p>
          <p className="text-2xl font-bold">
            {chartsData ? chartsData.chartData.reduce((sum, d) => sum + d.users, 0) : 0}
          </p>
        </div>
      </div>
    </div>
  );
}
