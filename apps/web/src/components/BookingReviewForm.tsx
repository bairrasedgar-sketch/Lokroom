// apps/web/src/components/BookingReviewForm.tsx
"use client";

import { useState } from "react";

type Props = {
  bookingId: string;
  listingTitle: string;
};

export default function BookingReviewForm({ bookingId, listingTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setMessageType(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const err =
          (data && (data.error || data.message)) ||
          "Impossible d’enregistrer l’avis.";
        setMessage(err);
        setMessageType("error");
        return;
      }

      setMessage("Avis enregistré ✅");
      setMessageType("success");
    } catch {
      setMessage("Erreur réseau. Réessayez plus tard.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 underline"
      >
        {open ? "Fermer le formulaire d’avis" : "Laisser un avis sur ce séjour"}
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="rounded-md border bg-gray-50/80 px-3 py-2 space-y-2"
        >
          <p className="text-xs text-gray-700">
            Avis pour <span className="font-medium">{listingTitle}</span>
          </p>

          <div className="flex items-center gap-2 text-xs">
            <label className="font-medium" htmlFor={`rating-${bookingId}`}>
              Note :
            </label>
            <select
              id={`rating-${bookingId}`}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="rounded border px-1 py-0.5 text-xs"
            >
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Très bien</option>
              <option value={3}>3 - Correct</option>
              <option value={2}>2 - Moyen</option>
              <option value={1}>1 - Mauvais</option>
            </select>
            <span className="text-yellow-500 text-sm">
              {"⭐".repeat(rating)}
            </span>
          </div>

          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Votre commentaire (facultatif)…"
              className="w-full rounded border px-2 py-1 text-xs"
              rows={3}
            />
          </div>

          {message && (
            <p
              className={`text-xs ${
                messageType === "success" ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Enregistrement…" : "Envoyer l’avis"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
