// apps/web/src/app/bookings/[id]/confirmation/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircleIcon, CalendarDaysIcon, MapPinIcon, UserIcon, ChatBubbleLeftRightIcon, HomeIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "@/hooks/useTranslation";
import confetti from "canvas-confetti";

type BookingDetails = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  currency: string;
  listing: {
    id: string;
    title: string;
    city: string | null;
    country: string;
    images: { url: string }[];
    owner: {
      name: string | null;
      profile?: {
        avatarUrl: string | null;
      } | null;
    };
  };
  conversation?: {
    id: string;
  } | null;
};

export default function BookingConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les détails de la réservation
  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch(`/api/bookings/${params.id}`);
        if (!res.ok) {
          throw new Error("Réservation introuvable");
        }
        const data = await res.json();
        setBooking(data.booking);

        // Lancer les confettis si la réservation est confirmée
        if (data.booking?.status === "CONFIRMED") {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
            });
          }, 300);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        setLoading(false);
      }
    }

    void loadBooking();
  }, [params.id]);

  // Formater les dates
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Calculer le nombre de nuits
  const calculateNights = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-500" />
          <span className="text-gray-600">Chargement...</span>
        </div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Réservation introuvable"}</p>
          <Link
            href="/bookings"
            className="text-sm text-gray-600 underline hover:text-gray-900"
          >
            Voir mes réservations
          </Link>
        </div>
      </main>
    );
  }

  const nights = calculateNights(booking.startDate, booking.endDate);
  const locationLabel = [booking.listing.city, booking.listing.country].filter(Boolean).join(", ");
  const listingImage = booking.listing.images?.[0]?.url || "/placeholder.jpg";
  const hostName = booking.listing.owner?.name || "Votre hôte";
  const hostInitial = hostName.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header de succès */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <CheckCircleIcon className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Réservation confirmée !</h1>
          <p className="mt-2 text-emerald-100">
            Votre voyage est réservé. Préparez vos valises !
          </p>
          <p className="mt-4 text-sm text-emerald-200">
            Numéro de confirmation : <span className="font-mono font-semibold">{booking.id.slice(-8).toUpperCase()}</span>
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Carte du logement */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            <div className="relative h-48 sm:h-auto sm:w-48 flex-shrink-0">
              <Image
                src={listingImage}
                alt={booking.listing.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Infos */}
            <div className="flex-1 p-5">
              <h2 className="text-lg font-semibold text-gray-900">{booking.listing.title}</h2>
              <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <MapPinIcon className="h-4 w-4" />
                <span>{locationLabel}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Arrivée</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(booking.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Départ</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(booking.endDate)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {nights} nuit{nights > 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {booking.totalPrice.toFixed(0)} {booking.currency === "EUR" ? "€" : booking.currency}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Carte de l'hôte */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Votre hôte</h3>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {booking.listing.owner?.profile?.avatarUrl ? (
                <Image
                  src={booking.listing.owner.profile.avatarUrl}
                  alt={hostName}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white text-lg font-semibold">
                  {hostInitial}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{hostName}</p>
                <p className="text-sm text-gray-500">Hôte vérifié</p>
              </div>
            </div>
            <Link
              href={booking.conversation ? `/messages/${booking.conversation.id}` : `/messages?listingId=${booking.listing.id}`}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black transition"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              Contacter
            </Link>
          </div>
        </div>

        {/* Prochaines étapes */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Prochaines étapes</h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-600">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Consultez votre email</p>
                <p className="text-xs text-gray-500">Un email de confirmation avec tous les détails vous a été envoyé</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-600">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Contactez votre hôte</p>
                <p className="text-xs text-gray-500">Présentez-vous et posez vos questions sur le logement</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-600">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Préparez votre voyage</p>
                <p className="text-xs text-gray-500">L'adresse exacte vous sera communiquée avant votre arrivée</p>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href={`/bookings/${booking.id}`}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-medium text-white hover:bg-black transition"
          >
            Voir ma réservation
          </Link>
          <Link
            href="/listings"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <HomeIcon className="h-4 w-4" />
            Continuer à explorer
          </Link>
        </div>

        {/* Note de remerciement */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Merci d'avoir choisi Lok'Room pour votre réservation. Bon voyage ! 🌍
        </p>
      </div>
    </main>
  );
}
