// apps/web/src/app/help/issue/page.tsx
// Page de signalement de problème style UberEats
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserGroupIcon,
  NoSymbolIcon,
  SpeakerWaveIcon,
  WrenchIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  MapPinIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import DisputeAssistant from "@/components/DisputeAssistant";

// Types de problèmes disponibles
const ISSUE_CATEGORIES = [
  {
    id: "property",
    label: "Problème avec le logement",
    icon: HomeIcon,
    color: "bg-blue-100 text-blue-600",
    issues: [
      { id: "PROPERTY_NOT_AS_DESCRIBED", label: "Le logement ne correspond pas à l'annonce", icon: HomeIcon },
      { id: "CLEANLINESS_ISSUE", label: "Problème de propreté", icon: HomeIcon },
      { id: "AMENITIES_MISSING", label: "Équipements manquants ou défectueux", icon: WrenchIcon },
    ],
  },
  {
    id: "host",
    label: "Problème avec l'hôte",
    icon: UserGroupIcon,
    color: "bg-purple-100 text-purple-600",
    issues: [
      { id: "HOST_UNRESPONSIVE", label: "L'hôte ne répond pas", icon: ChatBubbleLeftRightIcon },
      { id: "CANCELLATION_DISPUTE", label: "Annulation par l'hôte", icon: NoSymbolIcon },
    ],
  },
  {
    id: "safety",
    label: "Sécurité",
    icon: ShieldCheckIcon,
    color: "bg-red-100 text-red-600",
    issues: [
      { id: "SAFETY_CONCERN", label: "Problème de sécurité", icon: ShieldCheckIcon },
      { id: "UNAUTHORIZED_GUESTS", label: "Personnes non autorisées", icon: UserGroupIcon },
    ],
  },
  {
    id: "payment",
    label: "Paiement",
    icon: CreditCardIcon,
    color: "bg-green-100 text-green-600",
    issues: [
      { id: "PAYMENT_ISSUE", label: "Problème de paiement", icon: CreditCardIcon },
    ],
  },
  {
    id: "nuisance",
    label: "Nuisances",
    icon: SpeakerWaveIcon,
    color: "bg-orange-100 text-orange-600",
    issues: [
      { id: "NOISE_COMPLAINT", label: "Nuisances sonores", icon: SpeakerWaveIcon },
    ],
  },
  {
    id: "other",
    label: "Autre problème",
    icon: QuestionMarkCircleIcon,
    color: "bg-gray-100 text-gray-600",
    issues: [
      { id: "OTHER", label: "Autre problème", icon: QuestionMarkCircleIcon },
    ],
  },
];

type Booking = {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  currency: string;
  listing: {
    id: string;
    title: string;
    city: string;
    country: string;
    imageUrl: string | null;
  };
  host: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
};

export default function ReportIssuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBookingId = searchParams.get("bookingId");

  const [step, setStep] = useState(preselectedBookingId ? 2 : 1);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger les réservations de l'utilisateur
  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await fetch("/api/bookings?status=all&limit=20");
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings || []);

          // Si un bookingId est préselectionné
          if (preselectedBookingId && data.bookings) {
            const found = data.bookings.find((b: Booking) => b.id === preselectedBookingId);
            if (found) {
              setSelectedBooking(found);
            }
          }
        }
      } catch (error) {
        console.error("Erreur chargement réservations:", error);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [preselectedBookingId]);

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setStep(2);
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep(3);
  };

  const handleSelectIssue = (issueId: string) => {
    setSelectedIssue(issueId);
    // Rediriger vers la page de création de litige avec les paramètres
    router.push(`/disputes/new?bookingId=${selectedBooking?.id}&reason=${issueId}`);
  };

  const handleContactHost = () => {
    if (selectedBooking) {
      router.push(`/messages?listingId=${selectedBooking.listing.id}`);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const currentCategory = ISSUE_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              if (step === 1) {
                router.push("/help");
              } else if (step === 2 && !preselectedBookingId) {
                setStep(1);
                setSelectedBooking(null);
              } else if (step === 3) {
                setStep(2);
                setSelectedCategory(null);
              } else {
                router.push("/help");
              }
            }}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="font-semibold text-gray-900">Signaler un problème</h1>
          <div className="w-10" />
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gray-900 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Step 1: Sélectionner une réservation */}
        {step === 1 && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Quelle réservation concerne votre problème ?
              </h2>
              <p className="text-gray-500 mt-1">
                Sélectionnez la réservation pour laquelle vous souhaitez signaler un problème
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Vous n'avez aucune réservation</p>
                <Link
                  href="/"
                  className="text-gray-900 underline hover:no-underline"
                >
                  Découvrir des espaces
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() => handleSelectBooking(booking)}
                    className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition text-left"
                  >
                    {booking.listing.imageUrl ? (
                      <Image
                        src={booking.listing.imageUrl}
                        alt={booking.listing.title}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <HomeIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {booking.listing.title}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPinIcon className="w-3 h-3" />
                        {booking.listing.city}, {booking.listing.country}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          booking.status === "CONFIRMED"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {booking.status === "CONFIRMED" ? "Confirmée" :
                           booking.status === "PENDING" ? "En attente" : "Annulée"}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(booking.totalPrice, booking.currency)}
                        </span>
                      </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Option sans réservation */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3">
                Vous avez un problème général ?
              </p>
              <Link
                href="/messages?support=true"
                className="flex items-center justify-center gap-2 w-full py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                Contacter le support
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Sélectionner une catégorie de problème */}
        {step === 2 && selectedBooking && (
          <div>
            {/* Résumé de la réservation */}
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 mb-6">
              {selectedBooking.listing.imageUrl ? (
                <Image
                  src={selectedBooking.listing.imageUrl}
                  alt={selectedBooking.listing.title}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <HomeIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {selectedBooking.listing.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDate(selectedBooking.startDate)} - {formatDate(selectedBooking.endDate)}
                </p>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Quel type de problème rencontrez-vous ?
              </h2>
              <p className="text-gray-500 mt-1">
                Sélectionnez la catégorie qui correspond le mieux
              </p>
            </div>

            <div className="space-y-3">
              {ISSUE_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleSelectCategory(category.id)}
                    className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition text-left"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${category.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{category.label}</h3>
                      <p className="text-sm text-gray-500">
                        {category.issues.length} option{category.issues.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </button>
                );
              })}
            </div>

            {/* Option contacter l'hôte */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3">
                Vous préférez résoudre le problème directement ?
              </p>
              <button
                onClick={handleContactHost}
                className="flex items-center justify-center gap-2 w-full py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                Contacter l'hôte
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Sélectionner le problème spécifique */}
        {step === 3 && selectedBooking && currentCategory && (
          <div>
            {/* Résumé */}
            <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg mb-6">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentCategory.color}`}>
                <currentCategory.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Catégorie</p>
                <p className="font-medium text-gray-900">{currentCategory.label}</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Précisez votre problème
              </h2>
              <p className="text-gray-500 mt-1">
                Sélectionnez l'option qui décrit le mieux votre situation
              </p>
            </div>

            <div className="space-y-3">
              {currentCategory.issues.map((issue) => {
                const Icon = issue.icon;
                return (
                  <button
                    key={issue.id}
                    onClick={() => handleSelectIssue(issue.id)}
                    className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{issue.label}</h3>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </button>
                );
              })}
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800 font-medium">
                    Avant d'ouvrir un litige
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Nous vous recommandons de contacter d'abord l'hôte pour essayer de résoudre
                    le problème à l'amiable. Si aucune solution n'est trouvée, vous pourrez
                    ouvrir un litige.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Assistant IA - visible quand une réservation est sélectionnée */}
      {selectedBooking && (
        <DisputeAssistant
          bookingContext={{
            listingTitle: selectedBooking.listing.title,
            startDate: formatDate(selectedBooking.startDate),
            endDate: formatDate(selectedBooking.endDate),
            hostName: selectedBooking.host?.name || undefined,
            totalPrice: selectedBooking.totalPrice,
          }}
          onSummaryReady={(summary) => {
            // Mapper la catégorie IA vers l'ID de catégorie
            const categoryMap: Record<string, string> = {
              "PROPERTY_NOT_AS_DESCRIBED": "property",
              "CLEANLINESS_ISSUE": "property",
              "AMENITIES_MISSING": "property",
              "HOST_UNRESPONSIVE": "host",
              "CANCELLATION_DISPUTE": "host",
              "GUEST_DAMAGE": "other",
              "GUEST_VIOLATION": "other",
              "PAYMENT_ISSUE": "payment",
              "SAFETY_CONCERN": "safety",
              "NOISE_COMPLAINT": "nuisance",
              "UNAUTHORIZED_GUESTS": "safety",
              "OTHER": "other",
            };

            const categoryId = categoryMap[summary.category] || "other";
            setSelectedCategory(categoryId);

            // Rediriger vers la page de création de litige avec le résumé
            const params = new URLSearchParams({
              bookingId: selectedBooking.id,
              reason: summary.category || "OTHER",
              aiSummary: summary.problem,
              aiDetails: summary.details,
              priority: summary.priority,
            });
            router.push(`/disputes/new?${params.toString()}`);
          }}
        />
      )}
    </div>
  );
}
