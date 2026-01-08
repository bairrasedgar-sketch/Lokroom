"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import DisputeAssistant from "@/components/DisputeAssistant";

// Raisons de litige avec icônes et descriptions
const DISPUTE_REASONS = [
  {
    id: "PROPERTY_NOT_AS_DESCRIBED",
    label: "Espace non conforme",
    description: "L'espace ne correspondait pas à l'annonce",
    icon: HomeIcon,
    forGuest: true,
    forHost: false,
  },
  {
    id: "CLEANLINESS_ISSUE",
    label: "Problème de propreté",
    description: "L'espace n'était pas propre à l'arrivée",
    icon: HomeIcon,
    forGuest: true,
    forHost: false,
  },
  {
    id: "AMENITIES_MISSING",
    label: "Équipements manquants",
    description: "Des équipements annoncés n'étaient pas disponibles",
    icon: HomeIcon,
    forGuest: true,
    forHost: false,
  },
  {
    id: "HOST_UNRESPONSIVE",
    label: "Hôte injoignable",
    description: "L'hôte ne répond pas aux messages",
    icon: ChatBubbleLeftRightIcon,
    forGuest: true,
    forHost: false,
  },
  {
    id: "GUEST_DAMAGE",
    label: "Dégâts causés",
    description: "Le voyageur a endommagé l'espace",
    icon: ExclamationTriangleIcon,
    forGuest: false,
    forHost: true,
  },
  {
    id: "GUEST_VIOLATION",
    label: "Non-respect des règles",
    description: "Le voyageur n'a pas respecté les règles",
    icon: XCircleIcon,
    forGuest: false,
    forHost: true,
  },
  {
    id: "PAYMENT_ISSUE",
    label: "Problème de paiement",
    description: "Problème avec le paiement ou le remboursement",
    icon: CreditCardIcon,
    forGuest: true,
    forHost: true,
  },
  {
    id: "CANCELLATION_DISPUTE",
    label: "Litige d'annulation",
    description: "Désaccord sur une annulation",
    icon: XCircleIcon,
    forGuest: true,
    forHost: true,
  },
  {
    id: "SAFETY_CONCERN",
    label: "Problème de sécurité",
    description: "Situation dangereuse ou préoccupante",
    icon: ShieldCheckIcon,
    forGuest: true,
    forHost: true,
  },
  {
    id: "NOISE_COMPLAINT",
    label: "Nuisances sonores",
    description: "Le voyageur a causé des nuisances",
    icon: UserGroupIcon,
    forGuest: false,
    forHost: true,
  },
  {
    id: "UNAUTHORIZED_GUESTS",
    label: "Invités non autorisés",
    description: "Le voyageur a invité des personnes non déclarées",
    icon: UserGroupIcon,
    forGuest: false,
    forHost: true,
  },
  {
    id: "OTHER",
    label: "Autre problème",
    description: "Un problème non listé ci-dessus",
    icon: QuestionMarkCircleIcon,
    forGuest: true,
    forHost: true,
  },
];

interface BookingData {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  currency: string;
  listing: {
    id: string;
    title: string;
    city: string;
    imageUrl: string | null;
    ownerId: string;
  };
  guest: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  isGuest: boolean;
}

export default function NewDisputePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const preselectedReason = searchParams.get("reason");
  const aiSummary = searchParams.get("aiSummary");
  const aiDetails = searchParams.get("aiDetails");
  const aiPriority = searchParams.get("priority");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showAiSummary, setShowAiSummary] = useState(!!aiSummary);

  // Form state
  const [selectedReason, setSelectedReason] = useState<string | null>(preselectedReason);
  const [description, setDescription] = useState(
    aiSummary && aiDetails
      ? `${aiSummary}\n\nDétails: ${aiDetails}`
      : aiSummary || ""
  );
  const [claimedAmount, setClaimedAmount] = useState("");
  const [wantsRefund, setWantsRefund] = useState<boolean | null>(null);

  useEffect(() => {
    if (!bookingId) {
      router.push("/bookings");
      return;
    }

    // Charger les données de la réservation
    fetch(`/api/bookings/${bookingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.booking) {
          setBooking(data.booking);
        } else {
          setError("Réservation introuvable.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur lors du chargement.");
        setLoading(false);
      });
  }, [bookingId, router]);

  // Si on a un résumé IA, passer directement à l'étape 2
  useEffect(() => {
    if (aiSummary && selectedReason && step === 1) {
      setStep(2);
    }
  }, [aiSummary, selectedReason, step]);

  const availableReasons = DISPUTE_REASONS.filter((r) =>
    booking?.isGuest ? r.forGuest : r.forHost
  );

  const handleSubmit = async () => {
    if (!booking || !selectedReason || !description.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          reason: selectedReason,
          description: description.trim(),
          claimedAmountCents: wantsRefund && claimedAmount
            ? Math.round(parseFloat(claimedAmount) * 100)
            : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "dispute_already_exists") {
          router.push(`/disputes/${data.disputeId}`);
          return;
        }
        throw new Error(data.error || "Erreur lors de la création");
      }

      // Succès - rediriger vers le litige
      router.push(`/disputes/${data.dispute.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setSubmitting(false);
    }
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
            Ouvrir un litige
          </span>
          <div className="w-10" />
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
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
            <p className="text-sm text-gray-500">{booking.listing.city}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(booking.startDate).toLocaleDateString("fr-FR")} -{" "}
              {new Date(booking.endDate).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <div className="flex gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Avant d'ouvrir un litige</h4>
              <p className="text-sm text-amber-700 mt-1">
                Nous vous recommandons d'abord de contacter{" "}
                {booking.isGuest ? "l'hôte" : "le voyageur"} via la messagerie.
                La plupart des problèmes peuvent être résolus directement.
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: Select reason */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Quel est le problème ?
            </h1>
            <p className="text-gray-500 mb-6">
              Sélectionnez la raison principale de votre litige
            </p>

            <div className="space-y-3">
              {availableReasons.map((reason) => {
                const Icon = reason.icon;
                return (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition ${
                      selectedReason === reason.id
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        selectedReason === reason.id
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{reason.label}</h3>
                      <p className="text-sm text-gray-500">{reason.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedReason}
              className="mt-8 w-full py-3 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition"
            >
              Continuer
            </button>
          </div>
        )}

        {/* Step 2: Description */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Décrivez le problème
            </h1>
            <p className="text-gray-500 mb-6">
              Donnez-nous le plus de détails possible
            </p>

            {/* Indicateur IA */}
            {showAiSummary && aiSummary && (
              <div className="mb-6 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                <div className="flex items-center gap-2 text-violet-700 font-medium mb-2">
                  <SparklesIcon className="w-4 h-4" />
                  Pré-rempli par l'assistant IA
                </div>
                <p className="text-sm text-violet-600">
                  L'assistant a analysé votre problème et pré-rempli la description.
                  Vous pouvez la modifier si nécessaire.
                </p>
                <button
                  onClick={() => setShowAiSummary(false)}
                  className="mt-2 text-xs text-violet-500 hover:text-violet-700 underline"
                >
                  Masquer ce message
                </button>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description détaillée *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Expliquez ce qui s'est passé, quand, et ce que vous avez déjà essayé pour résoudre le problème..."
                rows={6}
                maxLength={5000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {description.length}/5000
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Demandez-vous un remboursement ?
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setWantsRefund(true)}
                  className={`flex-1 py-3 rounded-lg border-2 font-medium transition ${
                    wantsRefund === true
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  Oui
                </button>
                <button
                  onClick={() => setWantsRefund(false)}
                  className={`flex-1 py-3 rounded-lg border-2 font-medium transition ${
                    wantsRefund === false
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  Non
                </button>
              </div>
            </div>

            {wantsRefund && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant demandé ({booking.currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={claimedAmount}
                    onChange={(e) => setClaimedAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    max={booking.totalPrice}
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum : {booking.totalPrice.toFixed(2)} {booking.currency}
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Retour
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!description.trim() || wantsRefund === null}
                className="flex-1 py-3 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Confirmer le litige
            </h1>
            <p className="text-gray-500 mb-6">
              Vérifiez les informations avant de soumettre
            </p>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-4">
              <div>
                <span className="text-sm text-gray-500">Raison</span>
                <p className="font-medium text-gray-900">
                  {DISPUTE_REASONS.find((r) => r.id === selectedReason)?.label}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Description</span>
                <p className="text-gray-900 text-sm mt-1">
                  {description.substring(0, 200)}
                  {description.length > 200 && "..."}
                </p>
              </div>
              {wantsRefund && claimedAmount && (
                <div>
                  <span className="text-sm text-gray-500">Montant demandé</span>
                  <p className="font-medium text-gray-900">
                    {parseFloat(claimedAmount).toFixed(2)} {booking.currency}
                  </p>
                </div>
              )}
            </div>

            {/* What happens next */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-blue-800 mb-2">Que se passe-t-il ensuite ?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• {booking.isGuest ? "L'hôte" : "Le voyageur"} sera notifié et aura 72h pour répondre</li>
                <li>• Vous pourrez échanger des messages et ajouter des preuves</li>
                <li>• Si aucun accord n'est trouvé, notre équipe interviendra</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition"
              >
                {submitting ? "Envoi..." : "Ouvrir le litige"}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Assistant IA */}
      {booking && (
        <DisputeAssistant
          bookingContext={{
            listingTitle: booking.listing.title,
            startDate: new Date(booking.startDate).toLocaleDateString("fr-FR"),
            endDate: new Date(booking.endDate).toLocaleDateString("fr-FR"),
            totalPrice: booking.totalPrice,
          }}
          onSummaryReady={(summary) => {
            // Mettre à jour le formulaire avec le résumé de l'IA
            if (summary.category) {
              setSelectedReason(summary.category);
            }
            if (summary.problem || summary.details) {
              const newDesc = summary.details
                ? `${summary.problem}\n\nDétails: ${summary.details}`
                : summary.problem;
              setDescription(newDesc);
            }
            setShowAiSummary(true);
            // Passer à l'étape 2 si on était à l'étape 1
            if (step === 1 && summary.category) {
              setStep(2);
            }
          }}
        />
      )}
    </div>
  );
}
