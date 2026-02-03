// apps/web/src/app/bookings/[id]/details/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDaysIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  HomeIcon,
  UserIcon,
  CreditCardIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "@/hooks/useTranslation";

type BookingDetails = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  currency: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    city: string | null;
    country: string;
    addressFull?: string;
    images: { url: string }[];
    owner: {
      id: string;
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

export default function BookingDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { t } = useTranslation();
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
      year: "numeric",
    });
  };

  const formatDateLong = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const calculateNights = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return {
          label: "Confirmée",
          color: "bg-emerald-100 text-emerald-700",
          icon: CheckCircleIcon,
        };
      case "PENDING":
        return {
          label: "En attente de paiement",
          color: "bg-amber-100 text-amber-700",
          icon: ClockIcon,
        };
      case "CANCELLED":
        return {
          label: "Annulée",
          color: "bg-red-100 text-red-700",
          icon: XCircleIcon,
        };
      default:
        return {
          label: status,
          color: "bg-gray-100 text-gray-700",
          icon: ClockIcon,
        };
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
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
  const statusConfig = getStatusConfig(booking.status);
  const StatusIcon = statusConfig.icon;

  const isPast = new Date(booking.endDate) < new Date();
  const isUpcoming = new Date(booking.startDate) > new Date();
  const isOngoing = !isPast && !isUpcoming;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Mes réservations
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
          {/* Colonne principale */}
          <div className="space-y-6">
            {/* Statut et titre */}
            <div>
              <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${statusConfig.color}`}>
                <StatusIcon className="h-4 w-4" />
                {statusConfig.label}
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-gray-900">
                {isUpcoming ? "Votre prochain voyage" : isPast ? "Voyage terminé" : "Voyage en cours"}
              </h1>
              <p className="mt-1 text-gray-500">
                Réservation #{booking.id.slice(-8).toUpperCase()}
              </p>
            </div>

            {/* Carte du logement */}
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="relative h-48 sm:h-64">
                <Image
                  src={listingImage}
                  alt={booking.listing.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <Link href={`/listings/${booking.listing.id}`} className="hover:underline">
                  <h2 className="text-lg font-semibold text-gray-900">{booking.listing.title}</h2>
                </Link>
                <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{locationLabel}</span>
                </div>
              </div>
            </div>

            {/* Détails du séjour */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Détails du séjour</h3>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Arrivée</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDateLong(booking.startDate)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">À partir de 15h00</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Départ</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDateLong(booking.endDate)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Avant 11h00</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {nights} nuit{nights > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Adresse (si confirmée) */}
            {booking.status === "CONFIRMED" && booking.listing.addressFull && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Adresse</h3>
                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">{booking.listing.addressFull}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      L'adresse exacte vous a été envoyée par email
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hôte */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Votre hôte</h3>
              <div className="flex items-center justify-between">
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
                    <p className="text-sm text-gray-500">Hôte</p>
                  </div>
                </div>
                <Link
                  href={booking.conversations?.[0] ? `/messages/${booking.conversations[0].id}` : `/messages?listingId=${booking.listing.id}`}
                  className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  Contacter
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Récapitulatif prix */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 sticky top-4">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Récapitulatif</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{nights} nuit{nights > 1 ? "s" : ""}</span>
                  <span className="text-gray-900">{booking.totalPrice.toFixed(0)} {booking.currency === "EUR" ? "€" : booking.currency}</span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-semibold text-gray-900">
                      {booking.totalPrice.toFixed(0)} {booking.currency === "EUR" ? "€" : booking.currency}
                    </span>
                  </div>
                </div>
              </div>

              {booking.status === "CONFIRMED" && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm text-emerald-700">Paiement effectué</span>
                </div>
              )}

              {booking.status === "PENDING" && (
                <Link
                  href={`/bookings/${booking.id}`}
                  className="mt-4 block w-full rounded-xl bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-black transition"
                >
                  Procéder au paiement
                </Link>
              )}
            </div>

            {/* Actions */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Actions</h3>
              <div className="space-y-2">
                <Link
                  href={`/listings/${booking.listing.id}`}
                  className="flex items-center gap-3 rounded-xl p-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <HomeIcon className="h-5 w-5 text-gray-400" />
                  Voir l'annonce
                </Link>
                <Link
                  href={booking.conversations?.[0] ? `/messages/${booking.conversations[0].id}` : `/messages?listingId=${booking.listing.id}`}
                  className="flex items-center gap-3 rounded-xl p-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
                  Messages
                </Link>
                {booking.status === "CONFIRMED" && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                    Télécharger le reçu
                  </button>
                )}
              </div>
            </div>

            {/* Aide */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Besoin d'aide ?</h3>
              <p className="text-sm text-gray-500 mb-3">
                Notre équipe est disponible pour vous aider
              </p>
              <Link
                href="/help"
                className="text-sm font-medium text-gray-900 underline hover:no-underline"
              >
                Centre d'aide
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
