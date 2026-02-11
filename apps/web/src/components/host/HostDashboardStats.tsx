"use client";

import { useHostDashboard } from "@/hooks/useHost";

type Props = {
  labels: {
    hostStatus: string;
    hostActive: string;
    hostActiveDesc: string;
    listingsLabel: string;
    listingsDesc: string;
    estimatedEarnings: string;
    estimatedEarningsDesc: string;
  };
};

export default function HostDashboardStats({ labels }: Props) {
  const { stats, loading } = useHostDashboard();

  function formatCurrency(amount: number, currency: string = "EUR") {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  if (loading) {
    return (
      <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm animate-pulse"
          >
            <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
            <div className="h-6 w-12 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-32 bg-gray-200 rounded" />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
        <p className="text-[10px] sm:text-xs font-medium uppercase text-gray-500">
          {labels.hostStatus}
        </p>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm">{labels.hostActive}</p>
        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-500">
          {labels.hostActiveDesc}
        </p>
      </div>

      <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
        <p className="text-[10px] sm:text-xs font-medium uppercase text-gray-500">
          Annonces actives
        </p>
        <div className="mt-1.5 sm:mt-2 flex items-baseline gap-2">
          <p className="text-xl sm:text-2xl font-semibold">
            {stats?.activeListings ?? 0}
          </p>
          {stats && stats.totalListings > stats.activeListings && (
            <span className="text-xs text-gray-400">
              / {stats.totalListings} total
            </span>
          )}
        </div>
        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-500">
          {stats?.activeListings === 0
            ? "Aucune annonce publiée"
            : stats?.activeListings === 1
            ? "annonce visible sur Lok'Room"
            : "annonces visibles sur Lok'Room"}
        </p>
      </div>

      <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm sm:col-span-2 md:col-span-1">
        <p className="text-[10px] sm:text-xs font-medium uppercase text-gray-500">
          {labels.estimatedEarnings}
        </p>
        <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold">
          {stats ? formatCurrency(stats.totalRevenue, stats.currency) : "0 €"}
        </p>
        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-500">
          {stats && stats.thisMonthRevenue > 0
            ? `+${formatCurrency(stats.thisMonthRevenue, stats.currency)} ce mois`
            : labels.estimatedEarningsDesc}
        </p>
      </div>
    </section>
  );
}
