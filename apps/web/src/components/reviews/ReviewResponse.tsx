// apps/web/src/components/reviews/ReviewResponse.tsx
"use client";

import { useState } from "react";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";

interface ReviewResponseProps {
  reviewId: string;
  existingResponse?: string | null;
  responseAt?: string | null;
  onResponseAdded?: (response: string) => void;
}

export default function ReviewResponse({
  reviewId,
  existingResponse,
  responseAt,
  onResponseAdded,
}: ReviewResponseProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!response.trim()) {
      setError("La réponse ne peut pas être vide");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          response: response.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      const data = await res.json();
      onResponseAdded?.(data.review.response);
      setIsEditing(false);
      setResponse("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  };

  // Si une réponse existe déjà, l'afficher
  if (existingResponse) {
    return (
      <div className="mt-4 pl-4 border-l-2 border-gray-300 bg-gray-50 rounded-r-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <ChatBubbleLeftIcon className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Réponse de l'hôte</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{existingResponse}</p>
        {responseAt && (
          <p className="text-xs text-gray-400 mt-2">
            {new Date(responseAt).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>
    );
  }

  // Sinon, afficher le formulaire de réponse
  return (
    <div className="mt-4">
      {!isEditing ? (
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          <ChatBubbleLeftIcon className="w-4 h-4" />
          <span className="font-medium">Répondre à cet avis</span>
        </button>
      ) : (
        <div className="space-y-3">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Écrivez votre réponse..."
            rows={4}
            maxLength={1000}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {response.length}/1000 caractères
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setResponse("");
                  setError(null);
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !response.trim()}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Envoi..." : "Publier"}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
