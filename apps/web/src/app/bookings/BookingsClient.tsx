"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getDictionaryForLocale, type SupportedLocale } from "@/lib/i18n.client";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { useSWRFetch } from "@/hooks/useSWRFetch";
import { mutate } from "swr";

type Currency = "EUR" | "CAD";
type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

type ListingThumbnail = {
  id: string;
  title: string;
  price: number;
  currency: Currency;
  images: { id: string; url: string }[];
};

type Booking = {
  id: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  totalPrice: number;
  currency: Currency;
  createdAt: string;
  listing: ListingThumbnail;
};

type ApiResponse = {
  bookings: Booking[];
};

function formatMoney(amount: number, currency: Currency) {
  const locale = currency === "EUR" ? "fr-FR" : "en-CA";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string, locale: SupportedLocale = "fr") {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";
  return d.toLocaleDateString(dateLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateRange(startStr: string, endStr: string, locale: SupportedLocale = "fr") {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return locale === "en" ? "Dates unavailable" : "Dates indisponibles";
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  const optsShort: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
  };
  const optsFull: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  if (sameMonth) {
    const month = start.toLocaleDateString(dateLocale, { month: "short" });
    return `${start.getDate().toString().padStart(2, "0")}–${end
      .getDate()
      .toString()
      .padStart(2, "0")} ${month} ${start.getFullYear()}`;
  }

  if (sameYear) {
    return `${start.toLocaleDateString(
      dateLocale,
      optsShort,
    )} – ${end.toLocaleDateString(dateLocale, optsShort)} ${start.getFullYear()}`;
  }

  return `${start.toLocaleDateString(
    dateLocale,
    optsFull,
  )} – ${end.toLocaleDateString(dateLocale, optsFull)}`;
}

export default function BookingsPage() {
  return (
    <PageErrorBoundary>
      <Suspense
        fallback={
          <main className="mx-auto max-w-5xl 2xl:max-w-6xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <header className="mb-6">
              <div className="h-6 w-48 rounded bg-gray-100" />
              <div className="mt-2 h-4 w-64 rounded bg-gray-100" />
            </header>
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex animate-pulse gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="h-20 w-24 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-gray-100" />
                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                    <div className="h-3 w-1/4 rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        }
      >
        <BookingsPageContent />
      </Suspense>
    </PageErrorBoundary>
  );
}

type CancellationPreview = {
  allowed: boolean;
  booking: {
    id: string;
    totalPriceCents: number;
    currency: Currency;
  };
  policy: {
    message: string;
    refundAmountCents: number;
    serviceFeeRetainedCents: number;
    guestPenaltyCents: number;
    policyType: "daily" | "hourly";
  };
};

function BookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [dict, setDict] = useState(getDictionaryForLocale("fr"));
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>("fr");
  const [cancelModal, setCancelModal] = useState<CancellationPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const created = searchParams.get("created");
  const paid = searchParams.get("paid");
  const processing = searchParams.get("processing");

  // Use SWR for bookings with cache
  const { data, error, isLoading } = useSWRFetch<ApiResponse>('/api/bookings', {
    revalidateOnMount: true,
    refreshInterval: 60000, // Refresh every minute
  });

  const bookings = useMemo(() => data?.bookings ?? [], [data]);

  // Charger le dictionnaire selon la locale du cookie
  useEffect(() => {
    if (typeof document === "undefined") return;
    const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    const locale = (m?.[1] || "fr") as SupportedLocale;
    setCurrentLocale(locale);
    setDict(getDictionaryForLocale(locale));
  }, []);

  const t = dict.bookings;

  // Fonction pour les labels de statut
  function statusLabel(status: BookingStatus) {
    switch (status) {
      case "PENDING":
        return t.pendingPayment;
      case "CONFIRMED":
        return t.confirmed;
      case "CANCELLED":
        return dict.bookings.cancelled;
      default:
        return status;
    }
  }

  function statusBadgeClass(status: BookingStatus) {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 text-amber-800 border border-amber-200";
      case "CONFIRMED":
        return "bg-emerald-50 text-emerald-800 border border-emerald-200";
      case "CANCELLED":
        return "bg-gray-50 text-gray-600 border border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  }

  // Affiche les toasts en fonction des query params
  useEffect(() => {
    if (created === "1") {
      toast.success(
        currentLocale === "en"
          ? "Your booking has been created. Just finalize the payment."
          : "Votre réservation a été créée. Il ne reste plus qu'à finaliser le paiement.",
      );
    }
    if (paid === "1") {
      toast.success(
        currentLocale === "en"
          ? "Payment confirmed, your booking is validated ✅"
          : "Paiement confirmé, votre réservation est validée ✅"
      );
    }
    if (processing === "1") {
      toast(
        currentLocale === "en"
          ? "Payment processing..."
          : "Paiement en cours de traitement…"
      );
    }
  }, [created, paid, processing, currentLocale]);

  const hasBookings = bookings.length > 0;

  async function cancelPendingBooking(id: string) {
    const confirmMsg = currentLocale === "en"
      ? "Cancel this booking request?"
      : "Annuler cette demande de réservation ?";
    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!res.ok) {
        const msg =
          data?.error ?? (currentLocale === "en"
            ? "Unable to cancel this booking."
            : "Impossible d'annuler cette réservation.");
        toast.error(msg);
        return;
      }

      toast.success(
        currentLocale === "en"
          ? "Booking cancelled successfully."
          : "Réservation annulée avec succès."
      );

      // Revalidate cache
      mutate('/api/bookings');
    } catch (err) {
      console.error(err);
      toast.error(
        currentLocale === "en"
          ? "Unexpected error."
          : "Erreur inattendue."
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  async function openCancelModal(bookingId: string) {
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel-preview`);
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(
          data?.error ?? (currentLocale === "en"
            ? "Unable to load cancellation preview."
            : "Impossible de charger l'aperçu d'annulation.")
        );
        return;
      }

      const preview = (await res.json()) as CancellationPreview;
      setCancelModal(preview);
    } catch (err) {
      console.error(err);
      toast.error(
        currentLocale === "en"
          ? "Unexpected error."
          : "Erreur inattendue."
      );
    } finally {
      setLoadingPreview(false);
    }
  }

  async function confirmCancellation() {
    if (!cancelModal) return;

    const bookingId = cancelModal.booking.id;
    setActionLoadingId(bookingId);
    setCancelModal(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        const msg =
          data?.error ?? (currentLocale === "en"
            ? "Unable to cancel this booking."
            : "Impossible d'annuler cette réservation.");
        toast.error(msg);
        return;
      }

      toast.success(
        currentLocale === "en"
          ? "Booking cancelled successfully."
          : "Réservation annulée avec succès."
      );

      // Revalidate cache
      mutate('/api/bookings');
    } catch (err) {
      console.error(err);
      toast.error(
        currentLocale === "en"
          ? "Unexpected error."
          : "Erreur inattendue."
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl 2xl:max-w-6xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <header className="mb-6">
          <div className="h-6 w-48 rounded bg-gray-100 animate-pulse" />
          <div className="mt-2 h-4 w-64 rounded bg-gray-100 animate-pulse" />
        </header>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex animate-pulse gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="h-20 w-24 rounded-xl bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-gray-100" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
                <div className="h-3 w-1/4 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl 2xl:max-w-6xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-800">
            {currentLocale === "en"
              ? "Unable to load your bookings."
              : "Impossible de charger vos réservations."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl 2xl:max-w-6xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{t.title}</h1>
        <p className="mt-1 text-sm text-gray-600">{t.subtitle}</p>
      </header>

      {!hasBookings ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
          <h2 className="mt-4 text-lg font-medium text-gray-900">{t.noBookings}</h2>
          <p className="mt-2 text-sm text-gray-600">{t.noBookingsDesc}</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-rose-500 px-6 py-3 text-sm font-medium text-white hover:bg-rose-600 transition-colors shadow-sm"
          >
            {t.searchListing}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const imageUrl = booking.listing.images[0]?.url;
            const isActionLoading = actionLoadingId === booking.id;

            return (
              <div
                key={booking.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <Link
                  href={`/bookings/${booking.id}`}
                  className="flex flex-col sm:flex-row gap-4 p-4"
                >
                  <div className="relative h-32 sm:h-24 sm:w-32 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={booking.listing.title}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 128px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg
                          className="h-8 w-8 text-gray-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold text-gray-900 truncate">
                          {booking.listing.title}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                          {formatDateRange(booking.startDate, booking.endDate, currentLocale)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(
                          booking.status
                        )}`}
                      >
                        {statusLabel(booking.status)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-lg font-semibold text-gray-900">
                        {formatMoney(booking.totalPrice, booking.currency)}
                      </span>
                      <span className="text-sm text-gray-500">total</span>
                    </div>
                  </div>
                </Link>

                {booking.status === "PENDING" && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        cancelPendingBooking(booking.id);
                      }}
                      disabled={isActionLoading}
                      className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isActionLoading
                        ? (currentLocale === "en" ? "Cancelling..." : "Annulation...")
                        : (currentLocale === "en" ? "Cancel booking" : "Annuler la réservation")}
                    </button>
                  </div>
                )}

                {booking.status === "CONFIRMED" && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        openCancelModal(booking.id);
                      }}
                      disabled={loadingPreview}
                      className="text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingPreview
                        ? (currentLocale === "en" ? "Loading..." : "Chargement...")
                        : (currentLocale === "en" ? "Cancel booking" : "Annuler la réservation")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {currentLocale === "en" ? "Cancel booking" : "Annuler la réservation"}
            </h2>
            <div className="space-y-3 text-sm">
              <p className="text-gray-700">{cancelModal.policy.message}</p>
              <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {currentLocale === "en" ? "Refund amount:" : "Montant remboursé :"}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatMoney(
                      cancelModal.policy.refundAmountCents / 100,
                      cancelModal.booking.currency
                    )}
                  </span>
                </div>
                {cancelModal.policy.serviceFeeRetainedCents > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {currentLocale === "en" ? "Service fee retained:" : "Frais de service retenus :"}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatMoney(
                        cancelModal.policy.serviceFeeRetainedCents / 100,
                        cancelModal.booking.currency
                      )}
                    </span>
                  </div>
                )}
                {cancelModal.policy.guestPenaltyCents > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {currentLocale === "en" ? "Cancellation penalty:" : "Pénalité d'annulation :"}
                    </span>
                    <span className="font-medium text-red-600">
                      {formatMoney(
                        cancelModal.policy.guestPenaltyCents / 100,
                        cancelModal.booking.currency
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setCancelModal(null)}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                {currentLocale === "en" ? "Keep booking" : "Garder la réservation"}
              </button>
              <button
                onClick={confirmCancellation}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-medium text-white hover:bg-red-700 transition"
              >
                {currentLocale === "en" ? "Confirm cancellation" : "Confirmer l'annulation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
