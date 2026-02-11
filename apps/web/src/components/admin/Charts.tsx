/**
 * Composants Charts Admin - Lok'Room
 * Graphiques réutilisables avec Recharts
 */
"use client";

import Image from "next/image";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Couleurs de la palette Lok'Room
const COLORS = {
  primary: "#EF4444", // Rouge Lok'Room
  secondary: "#3B82F6", // Bleu
  success: "#10B981", // Vert
  warning: "#F59E0B", // Orange
  purple: "#8B5CF6",
  pink: "#EC4899",
  indigo: "#6366F1",
  teal: "#14B8A6",
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.purple,
  COLORS.pink,
  COLORS.indigo,
  COLORS.teal,
];

type ChartData = {
  date?: string;
  label?: string;
  [key: string]: string | number | undefined;
};

// Tooltip personnalisé
const CustomTooltip = ({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatter?: (value: number, name: string) => string;
}) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}:{" "}
          <span className="font-semibold">
            {formatter ? formatter(entry.value, entry.name) : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
};

// ============================================
// AREA CHART - Revenus avec dégradé
// ============================================
export function RevenueAreaChart({
  data,
  dataKey = "revenue",
  title,
  color = COLORS.primary,
  height = 300,
  showFees = false,
}: {
  data: ChartData[];
  dataKey?: string;
  title?: string;
  color?: string;
  height?: number;
  showFees?: boolean;
}) {
  const formatCurrency = (value: number) => `${value.toLocaleString()} €`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            {showFees && (
              <linearGradient id="feesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
              </linearGradient>
            )}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            tickFormatter={(value) => `${value}€`}
          />
          <Tooltip
            content={
              <CustomTooltip formatter={(value) => formatCurrency(value)} />
            }
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            name="Revenus"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#revenueGradient)"
          />
          {showFees && (
            <Area
              type="monotone"
              dataKey="fees"
              name="Frais plateforme"
              stroke={COLORS.success}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#feesGradient)"
            />
          )}
          <Legend />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// BAR CHART - Réservations
// ============================================
export function BookingsBarChart({
  data,
  title,
  height = 300,
}: {
  data: ChartData[];
  title?: string;
  height?: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="bookings"
            name="Réservations"
            fill={COLORS.primary}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// LINE CHART - Multi-métriques
// ============================================
export function MultiLineChart({
  data,
  lines,
  title,
  height = 300,
}: {
  data: ChartData[];
  lines: Array<{ dataKey: string; name: string; color: string }>;
  title?: string;
  height?: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={{ fill: line.color, strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// PIE CHART - Distribution
// ============================================
export function DistributionPieChart({
  data,
  dataKey = "count",
  nameKey = "name",
  title,
  height = 300,
  showLegend = true,
}: {
  data: Array<{ [key: string]: string | number }>;
  dataKey?: string;
  nameKey?: string;
  title?: string;
  height?: number;
  showLegend?: boolean;
}) {
  const RADIAN = Math.PI / 180;
  
  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    if (cx == null || cy == null || midAngle == null || innerRadius == null || outerRadius == null || percent == null) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={height / 3}
            labelLine={false}
            label={renderCustomLabel}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// HORIZONTAL BAR CHART - Top Listings
// ============================================
export function TopListingsChart({
  data,
  title,
  height = 300,
}: {
  data: Array<{
    id: string;
    title: string;
    location: string;
    image: string | null;
    bookings: number;
    revenue: number;
  }>;
  title?: string;
  height?: number;
}) {
  const formatCurrency = (value: number) => `${value.toLocaleString()} €`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div className="space-y-3" style={{ minHeight: height }}>
        {data.map((listing, index) => (
          <div
            key={listing.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-medium">
              {index + 1}
            </span>
            {listing.image ? (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={listing.image}
                  alt={`Image de ${listing.title}`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {listing.title}
              </p>
              <p className="text-xs text-gray-500">{listing.location}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(listing.revenue)}
              </p>
              <p className="text-xs text-gray-500">
                {listing.bookings} réservation{listing.bookings > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Aucune donnée disponible
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// STATUS BADGES CHART
// ============================================
export function StatusDistributionChart({
  data,
  title,
}: {
  data: Array<{ status: string; count: number }>;
  title?: string;
}) {
  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const statusLabels: Record<string, string> = {
    PENDING: "En attente",
    CONFIRMED: "Confirmées",
    CANCELLED: "Annulées",
  };

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div className="space-y-3">
        {data.map((item) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div key={item.status} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    statusColors[item.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {statusLabels[item.status] || item.status}
                </span>
                <span className="text-gray-600">
                  {item.count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.status === "CONFIRMED"
                      ? "bg-green-500"
                      : item.status === "PENDING"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Export des couleurs pour utilisation externe
export { COLORS, PIE_COLORS };
