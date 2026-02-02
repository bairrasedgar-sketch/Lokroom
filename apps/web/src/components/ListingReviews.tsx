// apps/web/src/components/ListingReviews.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { StarIcon, XMarkIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { useTranslation } from "@/hooks/useTranslation";

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

// Rating categories configuration - labels are translation keys
type RatingCategoryKey = "cleanliness" | "accuracy" | "communication" | "location" | "checkIn" | "value";
const RATING_CATEGORIES: { key: keyof ReviewStats; labelKey: RatingCategoryKey }[] = [
  { key: "averageCleanliness", labelKey: "cleanliness" },
  { key: "averageAccuracy", labelKey: "accuracy" },
  { key: "averageCommunication", labelKey: "communication" },
  { key: "averageLocation", labelKey: "location" },
  { key: "averageCheckin", labelKey: "checkIn" },
  { key: "averageValue", labelKey: "value" },
];

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
    });
  } catch {
    return dateStr;
  }
}

// Progress bar component for rating categories
function RatingProgressBar({ value, max = 5 }: { value: number | null; max?: number }) {
  const percentage = value ? (value / max) * 100 : 0;

  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-900 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-900 w-6 text-right tabular-nums">
        {value?.toFixed(1) || "-"}
      </span>
    </div>
  );
}

// Small star rating display
function SmallStarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIconSolid
          key={star}
          className={`w-3 h-3 ${
            star <= rating ? "text-gray-900" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

// Type for the listingReviews translations
type ListingReviewsTranslations = {
  loadError: string;
  loadErrorMessage: string;
  title: string;
  averageRating: string;
  outOf5: string;
  reviewsCount: string;
  loading: string;
  loadMore: string;
  noReviews: string;
  defaultTraveler: string;
  showMore: string;
  hostResponse: string;
  noReviewsTitle: string;
  noReviewsDescription: string;
  retry: string;
  showAllReviews: string;
  serverError: string;
  reviewsNotFound: string;
  requestTimeout: string;
};

// Type for reviews translations
type ReviewsTranslations = {
  cleanliness: string;
  accuracy: string;
  communication: string;
  location: string;
  checkIn: string;
  value: string;
};

// Individual review card component
function ReviewCard({
  review,
  onShowMore,
  translations,
}: {
  review: Review;
  onShowMore?: () => void;
  translations: ListingReviewsTranslations;
}) {
  const [showResponse, setShowResponse] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const commentLength = review.comment?.length || 0;
  const shouldTruncate = commentLength > 200;

  return (
    <div className="flex flex-col gap-3">
      {/* Author header */}
      <div className="flex items-center gap-3">
        {review.author?.profile?.avatarUrl ? (
          <Image
            src={review.author.profile.avatarUrl}
            alt={`Photo de profil de ${review.author.name || "utilisateur"}`}
            width={48}
            height={48}
            className="rounded-full object-cover w-12 h-12"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
            {review.author?.name?.charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">
            {review.author?.name || translations.defaultTraveler}
          </span>
          <span className="text-sm text-gray-500">
            {formatDate(review.createdAt)}
          </span>
        </div>
      </div>

      {/* Star rating */}
      <SmallStarRating rating={review.rating} />

      {/* Review text */}
      {review.comment && (
        <div className="relative">
          <p
            className={`text-gray-700 leading-relaxed ${
              !isExpanded && shouldTruncate ? "line-clamp-4" : ""
            }`}
          >
            {review.comment}
          </p>
          {shouldTruncate && !isExpanded && (
            <button
              onClick={() => {
                setIsExpanded(true);
                onShowMore?.();
              }}
              className="mt-1 text-gray-900 font-semibold underline underline-offset-2 hover:text-gray-700 transition-colors text-sm"
            >
              {translations.showMore}
            </button>
          )}
        </div>
      )}

      {/* Host response */}
      {review.response && (
        <div className="mt-2">
          <button
            onClick={() => setShowResponse(!showResponse)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChatBubbleLeftIcon className="w-4 h-4" />
            <span className="font-medium">{translations.hostResponse}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                showResponse ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showResponse ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
            }`}
          >
            <div className="pl-4 border-l-2 border-gray-300 bg-gray-50 rounded-r-lg p-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                {review.response}
              </p>
              {review.responseAt && (
                <p className="text-xs text-gray-400 mt-2">
                  {formatDate(review.responseAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal component for all reviews
function ReviewsModal({
  isOpen,
  onClose,
  reviews,
  stats,
  onLoadMore,
  hasMore,
  loading,
  translations,
  reviewsTranslations,
}: {
  isOpen: boolean;
  onClose: () => void;
  reviews: Review[];
  stats: ReviewStats | null;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  translations: ListingReviewsTranslations;
  reviewsTranslations: ReviewsTranslations;
}) {
  // Prevent body scroll when modal is open with robust cleanup
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] mx-4 flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <StarIconSolid className="w-6 h-6 text-gray-900" />
            <span className="text-xl font-semibold text-gray-900">
              {stats?.averageRating?.toFixed(2) || "-"}
            </span>
            <span className="text-xl text-gray-400 mx-1">.</span>
            <span className="text-xl font-semibold text-gray-900">
              {stats?.totalReviews || 0} {translations.reviewsCount}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Rating categories in modal */}
          {stats && stats.totalReviews > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 pb-8 border-b border-gray-100">
              {RATING_CATEGORIES.map(({ key, labelKey }) => {
                const value = stats[key] as number | null;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-24 flex-shrink-0">
                      {reviewsTranslations[labelKey]}
                    </span>
                    <RatingProgressBar value={value} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Reviews list */}
          <div className="space-y-8">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} translations={translations} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={onLoadMore}
                disabled={loading}
                className="px-6 py-3 border border-gray-900 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? translations.loading : translations.loadMore}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({ translations }: { translations: ListingReviewsTranslations }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <StarIcon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {translations.noReviewsTitle}
      </h3>
      <p className="text-gray-500 text-center max-w-sm">
        {translations.noReviewsDescription}
      </p>
    </div>
  );
}

// Main component
export default function ListingReviews({ listingId }: ListingReviewsProps) {
  const { t } = useTranslation();
  const translations = t.components.listingReviews as ListingReviewsTranslations;
  const reviewsTranslations = t.reviews as ReviewsTranslations;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadReviews = useCallback(async (pageNum: number, append: boolean = false) => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(
        `/api/reviews?listingId=${listingId}&page=${pageNum}&limit=6`,
        { signal: controller.signal }
      );

      if (!res.ok) {
        const statusText = res.status === 500
          ? translations.serverError
          : res.status === 404
          ? translations.reviewsNotFound
          : `${translations.loadError} (code: ${res.status})`;
        throw new Error(statusText);
      }

      const data = await res.json();

      if (append) {
        setReviews((prev) => [...prev, ...(data.reviews ?? [])]);
      } else {
        setReviews(data.reviews ?? []);
      }

      setStats(data.stats);
      setHasMore(data.pagination?.page < data.pagination?.totalPages);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setError(translations.requestTimeout);
        return;
      }
      setError(e instanceof Error ? e.message : translations.loadErrorMessage);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [listingId, translations.loadError, translations.loadErrorMessage]);

  useEffect(() => {
    loadReviews(1);
  }, [loadReviews]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadReviews(nextPage, true);
  };

  const hasReviews = reviews.length > 0;
  // Afficher les 6 premiers avis sur la page principale (les autres sont dans la modal)
  const displayedReviews = reviews.slice(0, Math.min(6, reviews.length));

  return (
    <section id="reviews" className="py-12 border-t border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <StarIconSolid className="w-7 h-7 text-gray-900" />
        <h2 className="text-2xl font-semibold text-gray-900">
          {stats?.averageRating?.toFixed(2) || "-"}
        </h2>
        <span className="text-2xl text-gray-400 mx-0.5">.</span>
        <h2 className="text-2xl font-semibold text-gray-900">
          {stats?.totalReviews || 0} {translations.reviewsCount}
        </h2>
      </div>

      {/* Rating categories grid */}
      {stats && stats.totalReviews > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-4 mb-10">
          {RATING_CATEGORIES.map(({ key, labelKey }) => {
            const value = stats[key] as number | null;
            return (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600 flex-shrink-0">
                  {reviewsTranslations[labelKey]}
                </span>
                <RatingProgressBar value={value} />
              </div>
            );
          })}
        </div>
      )}

      {/* Loading state */}
      {loading && reviews.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="py-8 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => loadReviews(1)}
            className="mt-4 text-gray-900 font-medium underline hover:text-gray-700"
          >
            {translations.retry}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !hasReviews && <EmptyState translations={translations} />}

      {/* Reviews grid */}
      {!loading && !error && hasReviews && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            {displayedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} translations={translations} />
            ))}
          </div>

          {/* Show all reviews button */}
          {stats && stats.totalReviews > 6 && (
            <div className="mt-10">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 border border-gray-900 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                {translations.showAllReviews.replace("{count}", String(stats.totalReviews))}
              </button>
            </div>
          )}
        </>
      )}

      {/* Reviews modal */}
      <ReviewsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reviews={reviews}
        stats={stats}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        loading={loading}
        translations={translations}
        reviewsTranslations={reviewsTranslations}
      />
    </section>
  );
}
