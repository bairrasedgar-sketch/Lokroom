/**
 * Page Admin - Modération des avis
 * Voir, filtrer et modérer les avis des utilisateurs
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  StarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  FlagIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftEllipsisIcon,
  UserCircleIcon,
  HomeModernIcon,
  CalendarDaysIcon,
  EyeSlashIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    profile: { avatarUrl: string | null } | null;
    _count: { reviewsWritten: number };
  };
  targetUser: {
    id: string;
    name: string | null;
    email: string;
  };
  listing: {
    id: string;
    title: string;
    city: string;
  };
  booking: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  coverImage: string | null;
  flags: string[];
  isFlagged: boolean;
};

type Stats = {
  total: number;
  averageRating: number;
  oneStarCount: number;
  twoStarCount: number;
  lowRatingsCount: number;
  thisWeek: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const FLAG_LABELS: Record<string, string> = {
  comment_too_short: "Commentaire trop court",
  all_caps: "Tout en majuscules",
  first_review_5_stars: "1er avis 5 étoiles",
  very_negative: "Très négatif",
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [actionType, setActionType] = useState<string>("");
  const [actionReason, setActionReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchReviews();
  }, [ratingFilter, sortBy]);

  const fetchReviews = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
      });
      if (ratingFilter) params.set("rating", ratingFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/reviews?${params}`);
      const data = await res.json();

      setReviews(data.reviews || []);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedReview || !actionType) return;
    setSaving(true);
    try {
      if (actionType === "delete") {
        const res = await fetch(`/api/admin/reviews?id=${selectedReview.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: actionReason }),
        });
        if (res.ok) {
          fetchReviews(pagination?.page || 1);
          setShowActionModal(false);
          resetModal();
        }
      } else {
        const res = await fetch("/api/admin/reviews", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewId: selectedReview.id,
            action: actionType,
            reason: actionReason,
          }),
        });
        if (res.ok) {
          fetchReviews(pagination?.page || 1);
          setShowActionModal(false);
          resetModal();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const resetModal = () => {
    setSelectedReview(null);
    setActionType("");
    setActionReason("");
  };

  const openActionModal = (review: Review, action: string) => {
    setSelectedReview(review);
    setActionType(action);
    setShowActionModal(true);
  };

  const toggleExpand = (reviewId: string) => {
    setExpandedReviews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReviews(1);
  };

  const filteredReviews = showFlaggedOnly
    ? reviews.filter((r) => r.isFlagged)
    : reviews;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modération des avis</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consultez et modérez les avis des utilisateurs
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
              <p className="text-sm text-gray-500">Total avis</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-100 rounded-xl">
              <StarIconSolid className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.averageRating?.toFixed(1) || "0.0"}
              </p>
              <p className="text-sm text-gray-500">Note moyenne</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setRatingFilter("1")}
          className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${
            ratingFilter === "1" ? "border-red-500 ring-2 ring-red-200" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 rounded-xl">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.oneStarCount || 0}</p>
              <p className="text-sm text-gray-500">1 étoile</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            setRatingFilter("");
            setShowFlaggedOnly(true);
          }}
          className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${
            showFlaggedOnly ? "border-orange-500 ring-2 ring-orange-200" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 rounded-xl">
              <FlagIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {reviews.filter((r) => r.isFlagged).length}
              </p>
              <p className="text-sm text-gray-500">Signalés</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-xl">
              <CalendarDaysIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.thisWeek || 0}</p>
              <p className="text-sm text-gray-500">Cette semaine</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans les avis..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          />
        </form>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setShowFlaggedOnly(false);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">Toutes les notes</option>
            <option value="5">5 étoiles</option>
            <option value="4">4 étoiles</option>
            <option value="3">3 étoiles</option>
            <option value="2">2 étoiles</option>
            <option value="1">1 étoile</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="recent">Plus récents</option>
            <option value="rating_low">Note croissante</option>
            <option value="rating_high">Note décroissante</option>
          </select>
          {showFlaggedOnly && (
            <button
              onClick={() => setShowFlaggedOnly(false)}
              className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm flex items-center gap-1"
            >
              Signalés uniquement
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const isExpanded = expandedReviews.has(review.id);

            return (
              <div
                key={review.id}
                className={`bg-white rounded-xl border overflow-hidden ${
                  review.isFlagged ? "border-orange-300" : "border-gray-200"
                }`}
              >
                {/* Flags Banner */}
                {review.isFlagged && (
                  <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center gap-2 flex-wrap">
                    <FlagIcon className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">Signalements :</span>
                    {review.flags.map((flag) => (
                      <span
                        key={flag}
                        className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs"
                      >
                        {FLAG_LABELS[flag] || flag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Listing Image */}
                    <Link href={`/admin/listings/${review.listing.id}`} className="flex-shrink-0">
                      {review.coverImage ? (
                        <img
                          src={review.coverImage}
                          alt=""
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                          <HomeModernIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </Link>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            href={`/admin/listings/${review.listing.id}`}
                            className="font-semibold text-gray-900 hover:text-red-600"
                          >
                            {review.listing.title}
                          </Link>
                          <p className="text-sm text-gray-500">{review.listing.city}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIconSolid
                              key={star}
                              className={`h-5 w-5 ${
                                star <= review.rating ? "text-yellow-500" : "text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Author info */}
                      <div className="mt-2 flex items-center gap-3">
                        <Link
                          href={`/admin/users/${review.author.id}`}
                          className="flex items-center gap-2 text-sm hover:text-red-600"
                        >
                          {review.author.profile?.avatarUrl ? (
                            <img
                              src={review.author.profile.avatarUrl}
                              alt=""
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <UserCircleIcon className="h-6 w-6 text-gray-400" />
                          )}
                          <span className="font-medium text-gray-900">
                            {review.author.name || "Anonyme"}
                          </span>
                        </Link>
                        <span className="text-xs text-gray-400">
                          {review.author._count.reviewsWritten} avis au total
                        </span>
                        <span className="text-xs text-gray-400">
                          → pour{" "}
                          <Link
                            href={`/admin/users/${review.targetUser.id}`}
                            className="text-gray-600 hover:text-red-600"
                          >
                            {review.targetUser.name || review.targetUser.email}
                          </Link>
                        </span>
                      </div>

                      {/* Comment */}
                      {review.comment && (
                        <div className="mt-3">
                          <p
                            className={`text-gray-700 ${
                              !isExpanded && review.comment.length > 200 ? "line-clamp-2" : ""
                            }`}
                          >
                            {review.comment}
                          </p>
                          {review.comment.length > 200 && (
                            <button
                              onClick={() => toggleExpand(review.id)}
                              className="text-sm text-red-600 hover:text-red-700 mt-1 flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  Réduire <ChevronUpIcon className="h-4 w-4" />
                                </>
                              ) : (
                                <>
                                  Voir plus <ChevronDownIcon className="h-4 w-4" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Posté le {formatDate(review.createdAt)}</span>
                          <Link
                            href={`/admin/bookings/${review.booking.id}`}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Voir la réservation →
                          </Link>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openActionModal(review, "warn_author")}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Avertir l'auteur"
                          >
                            <ExclamationTriangleIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openActionModal(review, "hide")}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Masquer l'avis"
                          >
                            <EyeSlashIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openActionModal(review, "delete")}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Supprimer l'avis"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredReviews.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <ChatBubbleLeftEllipsisIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">Aucun avis trouvé</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} résultats)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchReviews(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() => fetchReviews(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {actionType === "delete" && "Supprimer l'avis"}
                {actionType === "hide" && "Masquer l'avis"}
                {actionType === "warn_author" && "Avertir l'auteur"}
              </h3>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  resetModal();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Review preview */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIconSolid
                    key={star}
                    className={`h-4 w-4 ${
                      star <= selectedReview.rating ? "text-yellow-500" : "text-gray-200"
                    }`}
                  />
                ))}
                <span className="text-sm text-gray-500 ml-2">
                  par {selectedReview.author.name || "Anonyme"}
                </span>
              </div>
              {selectedReview.comment && (
                <p className="text-sm text-gray-600 line-clamp-3">{selectedReview.comment}</p>
              )}
            </div>

            {actionType === "delete" && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                  Cette action est irréversible. L&apos;avis sera définitivement supprimé et les notes seront recalculées.
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raison {actionType !== "warn_author" && "(sera envoyée à l'auteur)"}
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Expliquez la raison de cette action..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  resetModal();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAction}
                disabled={saving}
                className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                  actionType === "delete"
                    ? "bg-red-500 hover:bg-red-600"
                    : actionType === "warn_author"
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-gray-500 hover:bg-gray-600"
                }`}
              >
                {saving ? "..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
