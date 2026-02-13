// apps/web/src/components/reviews/ReviewModeration.tsx
"use client";

import { useState } from "react";
import { FlagIcon, EyeSlashIcon, TrashIcon, CheckIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { logger } from "@/lib/logger";


interface Review {
  id: string;
  rating: number;
  comment: string | null;
  status: "PENDING" | "PUBLISHED" | "FLAGGED" | "HIDDEN" | "DELETED";
  createdAt: string;
  author: {
    id: string;
    name: string | null;
  };
  listing: {
    id: string;
    title: string;
  };
}

interface ReviewModerationProps {
  reviews: Review[];
  onStatusChange: (reviewId: string, newStatus: Review["status"]) => void;
}

const STATUS_LABELS = {
  PENDING: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  PUBLISHED: { label: "Publié", color: "bg-green-100 text-green-800" },
  FLAGGED: { label: "Signalé", color: "bg-red-100 text-red-800" },
  HIDDEN: { label: "Masqué", color: "bg-gray-100 text-gray-800" },
  DELETED: { label: "Supprimé", color: "bg-red-100 text-red-800" },
};

function ReviewCard({
  review,
  onStatusChange,
}: {
  review: Review;
  onStatusChange: (newStatus: Review["status"]) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleStatusChange = async (newStatus: Review["status"]) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      onStatusChange(newStatus);
      setShowActions(false);
    } catch (err) {
      logger.error("Failed to update review status", { error: err instanceof Error ? err.message : String(err) });
      alert("Erreur lors de la mise à jour du statut");
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = STATUS_LABELS[review.status];

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">
              {review.author.name || "Utilisateur"}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {review.listing.title}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(review.createdAt).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`w-4 h-4 ${
                i < review.rating ? "text-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-gray-700 mb-4 line-clamp-3">
          {review.comment}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowActions(!showActions)}
          disabled={loading}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50"
        >
          {showActions ? "Annuler" : "Actions"}
        </button>

        {showActions && (
          <div className="flex items-center gap-2 ml-2">
            {review.status !== "PUBLISHED" && (
              <button
                onClick={() => handleStatusChange("PUBLISHED")}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition disabled:opacity-50"
              >
                <CheckIcon className="w-3 h-3" />
                Publier
              </button>
            )}
            {review.status !== "FLAGGED" && (
              <button
                onClick={() => handleStatusChange("FLAGGED")}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition disabled:opacity-50"
              >
                <FlagIcon className="w-3 h-3" />
                Signaler
              </button>
            )}
            {review.status !== "HIDDEN" && (
              <button
                onClick={() => handleStatusChange("HIDDEN")}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition disabled:opacity-50"
              >
                <EyeSlashIcon className="w-3 h-3" />
                Masquer
              </button>
            )}
            {review.status !== "DELETED" && (
              <button
                onClick={() => {
                  if (confirm("Êtes-vous sûr de vouloir supprimer cet avis ?")) {
                    handleStatusChange("DELETED");
                  }
                }}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition disabled:opacity-50"
              >
                <TrashIcon className="w-3 h-3" />
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReviewModeration({
  reviews,
  onStatusChange,
}: ReviewModerationProps) {
  const [filter, setFilter] = useState<Review["status"] | "ALL">("ALL");

  const filteredReviews =
    filter === "ALL" ? reviews : reviews.filter((r) => r.status === filter);

  const counts = {
    ALL: reviews.length,
    PENDING: reviews.filter((r) => r.status === "PENDING").length,
    PUBLISHED: reviews.filter((r) => r.status === "PUBLISHED").length,
    FLAGGED: reviews.filter((r) => r.status === "FLAGGED").length,
    HIDDEN: reviews.filter((r) => r.status === "HIDDEN").length,
    DELETED: reviews.filter((r) => r.status === "DELETED").length,
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "PENDING", "PUBLISHED", "FLAGGED", "HIDDEN", "DELETED"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status === "ALL" ? "Tous" : STATUS_LABELS[status].label} ({counts[status]})
            </button>
          )
        )}
      </div>

      {/* Reviews list */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Aucun avis dans cette catégorie
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onStatusChange={(newStatus) => onStatusChange(review.id, newStatus)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
