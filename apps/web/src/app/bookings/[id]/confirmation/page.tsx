// apps/web/src/app/bookings/[id]/confirmation/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDaysIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
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
  conversations?: {
    id: string;
  }[] | null;
};

export default function BookingConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch(`/api/bookings/${params.id}`);
        if (!res.ok) {
          throw new Error("Réservation introuvable");
        }
        const data = await res.json();
        setBooking(data.booking);

        // Lancer les confettis
        if (data.booking?.status === "CONFIRMED") {
          setTimeout(() => {
            // Confettis gauche
            confetti({
              particleCount: 50,
              angle: 60,
              spread: 55,
              origin: { x: 0, y: 0.7 },
              colors: ["#10b981", "#34d399", "#fbbf24", "#f59e0b"],
            });
            // Confettis droite
            confetti({
              particleCount: 50,
              angle: 120,
              spread: 55,
              origin: { x: 1, y: 0.7 },
              colors: ["#10b981", "#34d399", "#fbbf24", "#f59e0b"],
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const calculateNights = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-500" />
        </div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Réservation introuvable"}</p>
          <Link href="/bookings" className="text-sm text-gray-600 underline">
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
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Animation de succès */}
        <div className="text-center mb-10">
          {/* Cercle animé avec check */}
          <div className="relative mx-auto w-24 h-24 mb-6">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#10b981"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset="0"
                className="animate-[draw_1s_ease-out_forwards]"
                style={{
                  animation: "draw 1s ease-out forwards",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center animate-[scale_0.3s_ease-out_0.5s_forwards] opacity-0" style={{ animation: "scale 0.3s ease-out 0.5s forwards" }}>
                <CheckIcon className="w-7 h-7 text-white" strokeWidth={3} />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            C'est confirmé !
          </h1>
          <p className="text-gray-500">
            Votre réservation est enregistrée. Préparez vos valises !
          </p>
        </div>

        {/* Carte de réservation */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-6">
          {/* Image du logement */}
          <div className="relative h-52">
            <Image
              src={listingImage}
              alt={booking.listing.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h2 className="text-xl font-semibold">{booking.listing.title}</h2>
              <div className="flex items-center gap-1 text-sm text-white/90 mt-1">
                <MapPinIcon className="h-4 w-4" />
                <span>{locationLabel}</span>
              </div>
            </div>
          </div>

          {/* Détails */}
          <div className="p-5">
            {/* Dates */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Arrivée</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {formatDate(booking.startDate)}
                </p>
              </div>
              <div className="flex items-center gap-2 px-4">
                <div className="h-px w-8 bg-gray-300" />
                <span className="text-sm text-gray-500">{nights} nuit{nights > 1 ? "s" : ""}</span>
                <div className="h-px w-8 bg-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Départ</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {formatDate(booking.endDate)}
                </p>
              </div>
            </div>

            {/* Hôte */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-3">
                {booking.listing.owner?.profile?.avatarUrl ? (
                  <Image
                    src={booking.listing.owner.profile.avatarUrl}
                    alt={hostName}
                    width={44}
                    height={44}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-white font-semibold">
                    {hostInitial}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{hostName}</p>
                  <p className="text-xs text-gray-500">Votre hôte</p>
                </div>
              </div>
              <Link
                href={booking.conversations?.[0] ? `/messages/${booking.conversations[0].id}` : `/messages?listingId=${booking.listing.id}`}
                className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                Message
              </Link>
            </div>
          </div>
        </div>

        {/* Numéro de confirmation */}
        <div className="rounded-2xl bg-gray-50 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Numéro de confirmation</p>
              <p className="text-lg font-mono font-semibold text-gray-900 mt-0.5">
                {booking.id.slice(-8).toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total payé</p>
              <p className="text-lg font-semibold text-gray-900 mt-0.5">
                {booking.totalPrice.toFixed(0)} {booking.currency === "EUR" ? "€" : booking.currency}
              </p>
            </div>
          </div>
        </div>

        {/* Prochaines étapes */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Prochaines étapes</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-semibold mt-0.5">
                1
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">Consultez votre email</span> — Un récapitulatif complet vous a été envoyé
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-semibold mt-0.5">
                2
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">Présentez-vous à {hostName}</span> — Envoyez un message pour vous présenter
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-semibold mt-0.5">
                3
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">Préparez votre voyage</span> — L'adresse exacte sera disponible avant l'arrivée
              </p>
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex flex-col gap-3">
          <Link
            href={`/bookings/${booking.id}/details`}
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-4 text-sm font-semibold text-white hover:bg-black transition"
          >
            Voir ma réservation
          </Link>
          <Link
            href="/listings"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <HomeIcon className="h-4 w-4" />
            Continuer à explorer
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-400">
          Merci d'avoir choisi Lok'Room ✨
        </p>
      </div>

      {/* CSS pour les animations */}
      <style jsx global>{`
        @keyframes draw {
          from {
            stroke-dashoffset: 283;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes scale {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
