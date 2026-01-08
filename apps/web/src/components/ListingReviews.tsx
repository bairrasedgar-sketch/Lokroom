// apps/web/src/components/ListingReviews.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { StarIcon, ChevronDownIcon, ChevronUpIcon, HandThumbUpIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  response: string | null;
  responseAt: string | null;
  ratingCleanliness: number | null;
  ratingAccuracy: number | null;
  ratingCommunication: number | null;
  ratingLocation: number | null;
  ratingCheckin: number | null;
  ratingValue: number | null;
  highlights: string[];
  wouldRecommend: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    profile?: {
      avatarUrl: string | null;
    };
  } | null;
};

type ReviewStats = {
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
};

type ListingReviewsProps = {
  listingId: string;
};

// Labels pour les highlights
const HIGHLIGHT_LABELS: Record<string, { label: string; icon: string }> = {
  clean: { label: "Très propre", icon: "✨" },
  accurate: { label: "Conforme aux photos", icon: "📸" },
  communication: { label: "Excellente communication", icon: "💬" },
  location: { label: "Super emplacement", icon: "📍" },
  checkin: { label: "Arrivée facile", icon: "🔑" },
  value: { label: "Bon rapport qualité/prix", icon: "💰" },
  quiet: { label: "Calme", icon: "🤫" },
  cozy: { label: "Confortable", icon: "🛋️" },
  equipped: { label: "Bien équipé", icon: "🔧" },
  host: { label: "Hôte attentionné", icon: "❤️" },
};

// Labels pour les catégories de notation
const CATEGORY_LABELS: Record<string, string> = {
  averageCleanliness: "Propreté",
  averageAccuracy: "Exactitude",
  averageCommunication: "Communication",
  averageLocation: "Emplacement",
  averageCheckin: "Arrivée",
  averageValue: "Rapport qualité/prix",
};

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
    });
  } catch {
    return dateStr;
  }
}

function RatingBar({ value, max = 5 }: { value: number | null; max?: number }) {
  const percentage = value ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-900 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-900 w-8">
        {value?.toFixed(1) || "-"}
      </span>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [showResponse, setShowResponse] = useState(false);

  return (
    <div className="py-6 border-b border-gray-100 last:border-0">
      {/* Author info */}
      <div className="flex items-start gap-4">
        {review.author?.profile?.avatarUrl ? (
          <Image
            src={review.author.profile.avatarUrl}
            alt={review.author.name || ""}
            width={48}
            height={48}
            className="rounded-full"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-lg">
            {review.author?.name?.charAt(0) || "?"}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">
                {review.author?.name || "Voyageur Lok'Room"}
              </h4>
              <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIconSolid
                  key={star}
                  className={`w-4 h-4 ${
                    star <= review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Highlights */}
          {review.highlights && review.highlights.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {review.highlights.map((h) => {
                const highlight = HIGHLIGHT_LABELS[h];
                if (!highlight) return null;
                return (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
                  >
                    <span>{highlight.icon}</span>
                    {highlight.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Comment */}
          {review.comment && (
            <p className="mt-3 text-gray-700 whitespace-pre-line leading-relaxed">
              {review.comment}
            </p>
          )}

          {/* Recommendation */}
          {review.wouldRecommend && (
            <div className="mt-3 flex items-center gap-2 text-green-600">
              <HandThumbUpIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Recommande cet espace</span>
            </div>
          )}

          {/* Host response */}
          {review.response && (
            <div className="mt-4">
              <button
                onClick={() => setShowResponse(!showResponse)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                Réponse de l'hôte
                {showResponse ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </button>
              {showResponse && (
                <div className="mt-2 pl-4 border-l-2 border-gray-200">
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {review.response}
                  </p>
                  {review.responseAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(review.responseAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListingReviews({ listingId }: ListingReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/reviews?listingId=${listingId}&page=${page}&limit=5`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error("Erreur lors du chargement des avis.");
        }
        const data = await res.json();
        if (page === 1) {
          setReviews(data.reviews ?? []);
        } else {
          setReviews((prev) => [...prev, ...(data.reviews ?? [])]);
        }
        setStats(data.stats);
        setHasMore(data.pagination?.page < data.pagination?.totalPages);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Impossible de charger les avis.");
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [listingId, page]);

  const hasReviews = reviews.length > 0;
  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <section id="reviews" className="mt-8 border-t pt-8">
      {/* Header with stats */}
      <div className="flex items-center gap-3 mb-6">
        <StarIconSolid className="w-6 h-6 fill-yellow-400 text-yellow-400" />
        <h2 className="text-xl font-semibold text-gray-900">
          {stats?.averageRating?.toFixed(2) || "-"} · {stats?.totalReviews || 0} avis
        </h2>
      </div>

      {/* Rating breakdown */}
      {stats && stats.totalReviews > 0 && (
        <div className="grid sm:grid-cols-2 gap-x-16 gap-y-3 mb-8">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const value = stats[key as keyof ReviewStats] as number | null;
            return (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">{label}</span>
                <div className="w-32">
                  <RatingBar value={value} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Distribution */}
      {stats && stats.totalReviews > 0 && (
        <div className="mb-8 p-4 bg-gray-50 rounded-xl">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Distribution des notes</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star as keyof typeof stats.distribution] || 0;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-4">{star}</span>
                  <StarIconSolid className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading && page === 1 && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}

      {error && <p className="text-sm text-red-600 py-4">{error}</p>}

      {!loading && !error && !hasReviews && (
        <div className="text-center py-8">
          <StarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            Aucun avis pour l'instant. Soyez le premier à en laisser un !
          </p>
        </div>
      )}

      {/* Reviews list */}
      {!loading && !error && hasReviews && (
        <>
          <div className="divide-y divide-gray-100">
            {displayedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {/* Show more button */}
          {reviews.length > 3 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-6 w-full py-3 border border-gray-900 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Afficher les {reviews.length} avis
            </button>
          )}

          {/* Load more button */}
          {showAll && hasMore && (
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={loading}
              className="mt-6 w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              {loading ? "Chargement..." : "Charger plus d'avis"}
            </button>
          )}
        </>
      )}
    </section>
  );
}
