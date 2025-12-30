/**
 * Composants Charts Hôte - Lok'Room
 * Graphiques niveau Airbnb avec Recharts pour le dashboard hôte
 */
"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
} from "recharts";

// Palette de couleurs Lok'Room
const COLORS = {
  revenue: "#10B981", // Vert
  bookings: "#3B82F6", // Bleu
  nights: "#8B5CF6", // Violet
  occupancy: "#EC4899", // Rose
  rating: "#F59E0B", // Orange
  cancelled: "#EF4444", // Rouge
  pending: "#F59E0B", // Orange
  confirmed: "#10B981", // Vert
};

// Types
type MonthlyData = {
  month: string;
  label?: string;
  revenue: number;
  bookings: number;
  nights: number;
};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
  currency?: string;
};

// Tooltip personnalisé niveau Airbnb
const CustomTooltip = ({ active, payload, label, currency = "EUR" }: TooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const formatValue = (value: number, dataKey: string) => {
    if (dataKey === "revenue") {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
      }).format(value);
    }
    if (dataKey === "nights") return `${value} nuits`;
    if (dataKey === "occupancy") return `${(value * 100).toFixed(1)}%`;
    return value.toString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-[160px]">
      <p className="text-sm font-semibold text-gray-900 mb-2 border-b pb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-gray-600">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {formatValue(entry.value, entry.dataKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// REVENUE AREA CHART - Graphique des revenus
// ============================================
export function HostRevenueChart({
  data,
  currency = "EUR",
  height = 280,
  showComparison = false,
}: {
  data: MonthlyData[];
  currency?: string;
  height?: number;
  showComparison?: boolean;
}) {
  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.month + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
  }));

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      notation: value > 10000 ? "compact" : "standard",
    }).format(value);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.revenue} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLORS.revenue} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
            width={70}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenus"
            stroke={COLORS.revenue}
            strokeWidth={2.5}
            fill="url(#revenueGradient)"
            animationDuration={1000}
          />
          {showComparison && (
            <Area
              type="monotone"
              dataKey="previousRevenue"
              name="Période précédente"
              stroke="#9CA3AF"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              fill="none"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// MULTI-METRIC CHART - Revenus + Réservations + Nuits
// ============================================
export function HostPerformanceChart({
  data,
  currency = "EUR",
  height = 320,
  activeMetric = "all",
}: {
  data: MonthlyData[];
  currency?: string;
  height?: number;
  activeMetric?: "all" | "revenue" | "bookings" | "nights";
}) {
  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.month + "-01").toLocaleDateString("fr-FR", { month: "short" }),
  }));

  const formatValue = (value: number, dataKey: string) => {
    if (dataKey === "revenue") {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
      }).format(value);
    }
    return value.toString();
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.revenue} stopOpacity={0.2} />
              <stop offset="100%" stopColor={COLORS.revenue} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatValue(v, "revenue")}
            width={70}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            iconType="circle"
            iconSize={8}
          />

          {(activeMetric === "all" || activeMetric === "revenue") && (
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              name="Revenus"
              stroke={COLORS.revenue}
              strokeWidth={2}
              fill="url(#revenueAreaGradient)"
            />
          )}

          {(activeMetric === "all" || activeMetric === "bookings") && (
            <Bar
              yAxisId="right"
              dataKey="bookings"
              name="Réservations"
              fill={COLORS.bookings}
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
          )}

          {(activeMetric === "all" || activeMetric === "nights") && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="nights"
              name="Nuits"
              stroke={COLORS.nights}
              strokeWidth={2}
              dot={{ fill: COLORS.nights, strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: COLORS.nights }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// BOOKINGS BAR CHART - Réservations par mois
// ============================================
export function HostBookingsChart({
  data,
  height = 250,
}: {
  data: MonthlyData[];
  height?: number;
}) {
  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.month + "-01").toLocaleDateString("fr-FR", { month: "short" }),
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="bookings"
            name="Réservations"
            fill={COLORS.bookings}
            radius={[6, 6, 0, 0]}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// OCCUPANCY DONUT CHART - Taux d'occupation
// ============================================
export function HostOccupancyChart({
  rate,
  bookedNights,
  totalNights,
  height = 200,
}: {
  rate: number;
  bookedNights: number;
  totalNights: number;
  height?: number;
}) {
  const data = [
    { name: "Occupé", value: bookedNights, color: COLORS.occupancy },
    { name: "Disponible", value: totalNights - bookedNights, color: "#E5E7EB" },
  ];

  return (
    <div className="w-full relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={height / 4}
            outerRadius={height / 2.8}
            startAngle={90}
            endAngle={-270}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      {/* Centre du donut */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-gray-900">
          {Math.round(rate * 100)}%
        </span>
        <span className="text-xs text-gray-500">occupé</span>
      </div>
    </div>
  );
}

// ============================================
// BOOKING STATUS PIE CHART - Statuts des réservations
// ============================================
export function HostBookingStatusChart({
  pending,
  confirmed,
  cancelled,
  height = 200,
}: {
  pending: number;
  confirmed: number;
  cancelled: number;
  height?: number;
}) {
  const data = [
    { name: "Confirmées", value: confirmed, color: COLORS.confirmed },
    { name: "En attente", value: pending, color: COLORS.pending },
    { name: "Annulées", value: cancelled, color: COLORS.cancelled },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Aucune réservation
      </div>
    );
  }

  const total = pending + confirmed + cancelled;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={height / 3}
            labelLine={false}
            label={({ percent }: { percent?: number }) => percent && percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend iconType="circle" iconSize={10} />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-2">
        <span className="text-sm text-gray-500">{total} réservation{total > 1 ? "s" : ""} au total</span>
      </div>
    </div>
  );
}

// ============================================
// RATING STARS PROGRESS - Notes par étoiles
// ============================================
export function HostRatingBreakdown({
  ratings,
}: {
  ratings: { stars: number; count: number }[];
}) {
  const total = ratings.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((stars) => {
        const rating = ratings.find((r) => r.stars === stars) || { stars, count: 0 };
        const percentage = total > 0 ? (rating.count / total) * 100 : 0;

        return (
          <div key={stars} className="flex items-center gap-3">
            <div className="flex items-center gap-1 w-16">
              <span className="text-sm font-medium text-gray-700">{stars}</span>
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{rating.count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// LISTINGS PERFORMANCE TABLE
// ============================================
export function HostListingsPerformance({
  listings,
  currency = "EUR",
}: {
  listings: Array<{
    id: string;
    title: string;
    bookings: number;
    revenue: number;
    rating: number;
    occupancy?: number;
  }>;
  currency?: string;
}) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);

  const maxRevenue = Math.max(...listings.map((l) => l.revenue), 1);

  return (
    <div className="space-y-3">
      {listings.map((listing, index) => (
        <div
          key={listing.id}
          className="relative p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
        >
          {/* Progress bar en arrière-plan */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-green-50 to-transparent rounded-xl opacity-50"
            style={{ width: `${(listing.revenue / maxRevenue) * 100}%` }}
          />

          <div className="relative flex items-center gap-4">
            {/* Rang */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              index === 0 ? "bg-amber-100 text-amber-700" :
              index === 1 ? "bg-gray-200 text-gray-700" :
              index === 2 ? "bg-orange-100 text-orange-700" :
              "bg-gray-100 text-gray-500"
            }`}>
              {index + 1}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{listing.title}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-gray-500">
                  {listing.bookings} réservation{listing.bookings > 1 ? "s" : ""}
                </span>
                {listing.occupancy !== undefined && (
                  <span className="text-xs text-gray-500">
                    {Math.round(listing.occupancy * 100)}% occupé
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="text-right">
              <p className="font-semibold text-gray-900">{formatCurrency(listing.revenue)}</p>
              {listing.rating > 0 && (
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-600">{listing.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Export des couleurs
export { COLORS };
