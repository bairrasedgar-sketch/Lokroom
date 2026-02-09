// apps/web/src/components/reviews/ReviewStats.tsx
"use client";

import { StarIcon } from "@heroicons/react/24/solid";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from "@heroicons/react/24/outline";

interface ReviewStats {
  totalReviews: number;
  averageRating: number | null;
  averageCleanliness: number | null;
  averageAccuracy: number | null;
  averageCommunication: number | null;
  averageLocation: number | null;
  averageCheckin: number | null;
  averageValue: number | null;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewStatsProps {
  stats: ReviewStats;
  previousStats?: ReviewStats | null;
}

function RatingBar({ rating, count, total }: { rating: number; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 w-12">
        <span className="text-sm font-medium text-gray-900">{rating}</span>
        <StarIcon className="w-3 h-3 text-gray-900" />
      </div>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-900 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-500 w-12 text-right tabular-nums">
        {count}
      </span>
    </div>
  );
}

function CategoryStat({
  label,
  value,
  previousValue,
}: {
  label: string;
  value: number | null;
  previousValue?: number | null;
}) {
  const hasChange = previousValue !== undefined && previousValue !== null && value !== null;
  const change = hasChange ? value - previousValue : 0;
  const changePercent = hasChange && previousValue > 0 ? ((change / previousValue) * 100) : 0;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-900 tabular-nums">
          {value?.toFixed(1) || "-"}
        </span>
        {hasChange && Math.abs(change) > 0.05 && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium ${
              change > 0
                ? "text-green-600"
                : change < 0
                ? "text-red-600"
                : "text-gray-500"
            }`}
          >
            {change > 0 ? (
              <ArrowTrendingUpIcon className="w-3 h-3" />
            ) : change < 0 ? (
              <ArrowTrendingDownIcon className="w-3 h-3" />
            ) : (
              <MinusIcon className="w-3 h-3" />
            )}
            <span>{Math.abs(changePercent).toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReviewStats({ stats, previousStats }: ReviewStatsProps) {
  const categories = [
    { key: "averageCleanliness", label: "Propreté" },
    { key: "averageAccuracy", label: "Exactitude" },
    { key: "averageCommunication", label: "Communication" },
    { key: "averageLocation", label: "Emplacement" },
    { key: "averageCheckin", label: "Arrivée" },
    { key: "averageValue", label: "Rapport qualité/prix" },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Overall rating */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <StarIcon className="w-12 h-12 text-gray-900" />
          <span className="text-5xl font-bold text-gray-900 tabular-nums">
            {stats.averageRating?.toFixed(2) || "-"}
          </span>
        </div>
        <p className="text-gray-600">
          Basé sur {stats.totalReviews} avis
        </p>
      </div>

      {/* Distribution */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Distribution des notes
        </h3>
        {[5, 4, 3, 2, 1].map((rating) => (
          <RatingBar
            key={rating}
            rating={rating}
            count={stats.distribution[rating as keyof typeof stats.distribution]}
            total={stats.totalReviews}
          />
        ))}
      </div>

      {/* Category breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Notes par catégorie
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categories.map(({ key, label }) => (
            <CategoryStat
              key={key}
              label={label}
              value={stats[key]}
              previousValue={previousStats?.[key]}
            />
          ))}
        </div>
      </div>

      {/* Insights */}
      {stats.totalReviews > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Insights
          </h3>
          <ul className="space-y-1 text-sm text-blue-800">
            {stats.averageRating && stats.averageRating >= 4.8 && (
              <li>• Excellente note globale - continuez comme ça !</li>
            )}
            {stats.distribution[5] / stats.totalReviews > 0.7 && (
              <li>• Plus de 70% d'avis 5 étoiles - exceptionnel !</li>
            )}
            {stats.averageCleanliness && stats.averageCleanliness >= 4.9 && (
              <li>• Propreté exemplaire selon vos voyageurs</li>
            )}
            {stats.averageCommunication && stats.averageCommunication >= 4.9 && (
              <li>• Communication excellente - vos voyageurs apprécient votre réactivité</li>
            )}
            {stats.distribution[1] + stats.distribution[2] > stats.totalReviews * 0.1 && (
              <li className="text-orange-700">
                • Plus de 10% d'avis négatifs - identifiez les points d'amélioration
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
