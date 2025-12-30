/**
 * Cartes de statistiques pour le dashboard admin
 */
"use client";

import { cn } from "@/lib/utils";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  HomeModernIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: "users" | "listings" | "bookings" | "revenue" | "disputes" | "reviews";
  loading?: boolean;
}

const ICONS = {
  users: UsersIcon,
  listings: HomeModernIcon,
  bookings: CalendarDaysIcon,
  revenue: CurrencyDollarIcon,
  disputes: ExclamationTriangleIcon,
  reviews: StarIcon,
};

const COLORS = {
  users: "bg-blue-50 text-blue-600",
  listings: "bg-green-50 text-green-600",
  bookings: "bg-purple-50 text-purple-600",
  revenue: "bg-emerald-50 text-emerald-600",
  disputes: "bg-orange-50 text-orange-600",
  reviews: "bg-yellow-50 text-yellow-600",
};

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon = "users",
  loading = false,
}: StatCardProps) {
  const Icon = ICONS[icon];
  const colorClass = COLORS[icon];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-32 bg-gray-200 rounded" />
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
          </p>
          {(subtitle || trend !== undefined) && (
            <div className="mt-2 flex items-center gap-2">
              {trend !== undefined && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    trend >= 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  {trend >= 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4" />
                  )}
                  {Math.abs(trend)}%
                </span>
              )}
              {subtitle && (
                <span className="text-sm text-gray-500">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", colorClass)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

interface StatsGridProps {
  stats: {
    users?: { total: number; growth?: number; newToday?: number };
    listings?: { total: number; active?: number; pending?: number };
    bookings?: { total: number; thisMonth?: number; growth?: number };
    revenue?: { thisMonth: number; growth?: number };
    disputes?: { open: number };
    reviews?: { total: number };
  };
  loading?: boolean;
}

export function StatsGrid({ stats, loading }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <StatCard
        title="Utilisateurs"
        value={stats.users?.total || 0}
        trend={stats.users?.growth}
        subtitle={
          stats.users?.newToday
            ? `+${stats.users.newToday} aujourd&apos;hui`
            : "ce mois"
        }
        icon="users"
        loading={loading}
      />
      <StatCard
        title="Annonces actives"
        value={stats.listings?.active || 0}
        subtitle={
          stats.listings?.pending
            ? `${stats.listings.pending} en attente`
            : undefined
        }
        icon="listings"
        loading={loading}
      />
      <StatCard
        title="Réservations"
        value={stats.bookings?.thisMonth || 0}
        trend={stats.bookings?.growth}
        subtitle="ce mois"
        icon="bookings"
        loading={loading}
      />
      <StatCard
        title="Revenus"
        value={`${((stats.revenue?.thisMonth || 0)).toLocaleString("fr-FR")} $`}
        trend={stats.revenue?.growth}
        subtitle="ce mois"
        icon="revenue"
        loading={loading}
      />
      <StatCard
        title="Litiges ouverts"
        value={stats.disputes?.open || 0}
        icon="disputes"
        loading={loading}
      />
      <StatCard
        title="Avis"
        value={stats.reviews?.total || 0}
        icon="reviews"
        loading={loading}
      />
    </div>
  );
}
