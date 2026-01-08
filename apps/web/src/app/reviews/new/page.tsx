"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { StarIcon, ChevronLeftIcon, CheckIcon, CameraIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

// Highlights disponibles pour les voyageurs
const GUEST_HIGHLIGHTS = [
  { id: "clean", label: "Très propre", icon: "✨" },
  { id: "accurate", label: "Conforme aux photos", icon: "📸" },
  { id: "communication", label: "Excellente communication", icon: "💬" },
  { id: "location", label: "Super emplacement", icon: "📍" },
  { id: "checkin", label: "Arrivée facile", icon: "🔑" },
  { id: "value", label: "Bon rapport qualité/prix", icon: "💰" },
  { id: "quiet", label: "Calme", icon: "🤫" },
  { id: "cozy", label: "Confortable", icon: "🛋️" },
  { id: "equipped", label: "Bien équipé", icon: "🔧" },
  { id: "host", label: "Hôte attentionné", icon: "❤️" },
];

// Highlights disponibles pour les hôtes
const HOST_HIGHLIGHTS = [
  { id: "respectful", label: "Respectueux", icon: "🤝" },
  { id: "clean", label: "A laissé propre", icon: "✨" },
  { id: "communication", label: "Bonne communication", icon: "💬" },
  { id: "punctual", label: "Ponctuel", icon: "⏰" },
  { id: "quiet", label: "Discret", icon: "🤫" },
  { id: "friendly", label: "Sympathique", icon: "😊" },
  { id: "rules", label: "A respecté les règles", icon: "📋" },
  { id: "recommend", label: "Je recommande", icon: "👍" },
];

// Catégories de notation pour les voyageurs
const GUEST_RATING_CATEGORIES = [
  { key: "ratingCleanliness", label: "Propreté", description: "L'espace était-il propre ?" },
  { key: "ratingAccuracy", label: "Exactitude", description: "L'annonce correspondait-elle à la réalité ?" },
  { key: "ratingCommunication", label: "Communication", description: "L'hôte était-il réactif ?" },
  { key: "ratingLocation", label: "Emplacement", description: "L'emplacement était-il pratique ?" },
  { key: "ratingCheckin", label: "Arrivée", description: "L'arrivée s'est-elle bien passée ?" },
  { key: "ratingValue", label: "Rapport qualité/prix", description: "Le prix était-il justifié ?" },
];

// Catégories de notation pour les hôtes
const HOST_RATING_CATEGORIES = [
  { key: "ratingRespect", label: "Respect des règles", description: "Le voyageur a-t-il respecté les règles ?" },
  { key: "ratingTidiness", label: "Propreté laissée", description: "L'espace était-il propre au départ ?" },
  { key: "ratingCommunication", label: "Communication", description: "Le voyageur était-il réactif ?" },
];

interface BookingData {
  id: string;
  bookingId: string;
  startDate: string;
  endDate: string;
  listing: {
    id: string;
    title: string;
    city: string;
    country: string;
    imageUrl: string | null;
  };
  targetUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  type: "GUEST_TO_HOST" | "HOST_TO_GUEST";
  daysRemaining: number;
}

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [overallRating, setOverallRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  const isGuestReview = booking?.type === "GUEST_TO_HOST";
  const highlights = isGuestReview ? GUEST_HIGHLIGHTS : HOST_HIGHLIGHTS;
  const ratingCategories = isGuestReview ? GUEST_RATING_CATEGORIES : HOST_RATING_CATEGORIES;

  useEffect(() => {
    if (!bookingId) {
      router.push("/bookings");
      return;
    }

    // Charger les données de la réservation
    fetch(`/api/reviews/pending`)
      .then((res) => res.json())
      .then((data) => {
        const found = data.pendingReviews?.find(
          (r: BookingData) => r.bookingId === bookingId
        );
        if (found) {
          setBooking(found);
        } else {
          setError("Cette réservation n'est pas disponible pour un avis.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur lors du chargement.");
        setLoading(false);
      });
  }, [bookingId, router]);

  const handleSubmit = async () => {
    if (!booking || overallRating === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          rating: overallRating,
          comment: comment.trim() || null,
          highlights: selectedHighlights,
          wouldRecommend: wouldRecommend ?? true,
          ...categoryRatings,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      // Succès - rediriger vers la page de confirmation
      router.push(`/reviews/success?bookingId=${booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setSubmitting(false);
    }
  };

  const toggleHighlight = (id: string) => {
    setSelectedHighlights((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id].slice(0, 5)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/bookings" className="text-gray-900 underline">
          Retour aux réservations
        </Link>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <span className="text-sm text-gray-500">
            Étape {step} sur 4
          </span>
          <div className="w-10" />
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gray-900 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Booking info */}
        <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-xl">
          {booking.listing.imageUrl ? (
            <Image
              src={booking.listing.imageUrl}
              alt={booking.listing.title}
              width={80}
              height={80}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-200 rounded-lg" />
          )}
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{booking.listing.title}</h3>
            <p className="text-sm text-gray-500">
              {booking.listing.city}, {booking.listing.country}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(booking.startDate).toLocaleDateString("fr-FR")} -{" "}
              {new Date(booking.endDate).toLocaleDateString("fr-FR")}
            </p>
          </div>
          {booking.targetUser.avatarUrl ? (
            <Image
              src={booking.targetUser.avatarUrl}
              alt={booking.targetUser.name || ""}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium">
              {booking.targetUser.name?.charAt(0) || "?"}
            </div>
          )}
        </div>

        {/* Step 1: Overall rating */}
        {step === 1 && (
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {isGuestReview
                ? "Comment s'est passé votre séjour ?"
                : `Comment s'est passé le séjour de ${booking.targetUser.name} ?`}
            </h1>
            <p className="text-gray-500 mb-8">
              {isGuestReview
                ? "Notez votre expérience globale"
                : "Notez ce voyageur"}
            </p>

            <div className="flex justify-center gap-3 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setOverallRating(star)}
                  className="p-2 transition-transform hover:scale-110"
                >
                  <StarIconSolid
                    className={`w-12 h-12 ${
                      star <= overallRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            <p className="text-lg font-medium text-gray-900">
              {overallRating === 0 && "Sélectionnez une note"}
              {overallRating === 1 && "Terrible"}
              {overallRating === 2 && "Mauvais"}
              {overallRating === 3 && "Correct"}
              {overallRating === 4 && "Bien"}
              {overallRating === 5 && "Excellent"}
            </p>

            <button
              onClick={() => setStep(2)}
              disabled={overallRating === 0}
              className="mt-8 w-full py-3 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition"
            >
              Continuer
            </button>
          </div>
        )}

        {/* Step 2: Category ratings */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Notez chaque aspect
            </h1>
            <p className="text-gray-500 mb-8">
              Ces notes aident les autres utilisateurs
            </p>

            <div className="space-y-6">
              {ratingCategories.map((cat) => (
                <div key={cat.key} className="border-b border-gray-100 pb-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{cat.label}</h3>
                      <p className="text-sm text-gray-500">{cat.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() =>
                          setCategoryRatings((prev) => ({
                            ...prev,
                            [cat.key]: star,
                          }))
                        }
                        className="p-1"
                      >
                        <StarIconSolid
                          className={`w-8 h-8 ${
                            star <= (categoryRatings[cat.key] || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Retour
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Highlights & Comment */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Qu'avez-vous apprécié ?
            </h1>
            <p className="text-gray-500 mb-6">
              Sélectionnez jusqu'à 5 points forts (optionnel)
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {highlights.map((h) => (
                <button
                  key={h.id}
                  onClick={() => toggleHighlight(h.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
                    selectedHighlights.includes(h.id)
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <span>{h.icon}</span>
                  <span className="text-sm">{h.label}</span>
                  {selectedHighlights.includes(h.id) && (
                    <CheckIcon className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre commentaire (optionnel)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  isGuestReview
                    ? "Décrivez votre expérience pour aider les futurs voyageurs..."
                    : "Décrivez votre expérience avec ce voyageur..."
                }
                rows={5}
                maxLength={2000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {comment.length}/2000
              </p>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Retour
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Recommendation & Submit */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {isGuestReview
                ? "Recommanderiez-vous cet espace ?"
                : "Recommanderiez-vous ce voyageur ?"}
            </h1>
            <p className="text-gray-500 mb-8">
              Votre recommandation aide la communauté
            </p>

            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setWouldRecommend(true)}
                className={`flex-1 py-6 rounded-xl border-2 transition ${
                  wouldRecommend === true
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-4xl mb-2 block">👍</span>
                <span className="font-medium">Oui</span>
              </button>
              <button
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 py-6 rounded-xl border-2 transition ${
                  wouldRecommend === false
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-4xl mb-2 block">👎</span>
                <span className="font-medium">Non</span>
              </button>
            </div>

            {/* Résumé */}
            <div className="bg-gray-50 rounded-xl p-4 mb-8">
              <h3 className="font-medium text-gray-900 mb-3">Résumé de votre avis</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Note globale</span>
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{overallRating}/5</span>
                  </div>
                </div>
                {selectedHighlights.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Points forts</span>
                    <span className="font-medium">{selectedHighlights.length} sélectionnés</span>
                  </div>
                )}
                {comment && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Commentaire</span>
                    <span className="font-medium">{comment.length} caractères</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || wouldRecommend === null}
                className="flex-1 py-3 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition"
              >
                {submitting ? "Envoi..." : "Publier l'avis"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
