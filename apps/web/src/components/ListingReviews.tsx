// apps/web/src/components/ListingReviews.tsx
"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
  } | null;
};

type ListingReviewsProps = {
  listingId: string;
};

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function ListingReviews({ listingId }: ListingReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/reviews?listingId=${listingId}`);
        if (!res.ok) {
          throw new Error("Erreur lors du chargement des avis.");
        }
        const data = (await res.json()) as { reviews?: Review[] };
        if (!cancelled) {
          setReviews(data.reviews ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Impossible de charger les avis."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const hasReviews = reviews.length > 0;
  const avgRating = hasReviews
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  return (
    <section className="mt-8 border-t pt-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold">Avis</h2>
        {hasReviews && (
          <p className="text-sm text-gray-600">
            Note moyenne{" "}
            <span className="font-semibold">
              {avgRating?.toFixed(1)} / 5
            </span>{" "}
            · {reviews.length} avis
          </p>
        )}
      </div>

      {loading && (
        <p className="mt-3 text-sm text-gray-500">Chargement des avis…</p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && !hasReviews && (
        <p className="mt-3 text-sm text-gray-500">
          Aucun avis pour l’instant. Soyez le premier à en laisser un !
        </p>
      )}

      {!loading && !error && hasReviews && (
        <ul className="mt-4 space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border bg-white/60 px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">
                  {r.author?.name || "Voyageur Lok’Room"}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{"⭐".repeat(r.rating)}</span>
                  <span>{formatDate(r.createdAt)}</span>
                </div>
              </div>
              {r.comment && (
                <p className="mt-1 text-gray-700 whitespace-pre-line">
                  {r.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
