"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getDictionaryForLocale, type SupportedLocale } from "@/lib/i18n.client";

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

// ✅ Wrapper avec Suspense pour Next
export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-4 py-6 lg:py-8">
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

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [dict, setDict] = useState(getDictionaryForLocale("fr"));
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>("fr");
  const [cancelModal, setCancelModal] = useState<CancellationPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const created = searchParams.get("created");
  const paid = searchParams.get("paid");
  const processing = searchParams.get("processing");

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

  // Chargement des réservations via /api/bookings
  useEffect(() => {
    async function loadBookings() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/bookings", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          const msg = data?.error ?? (currentLocale === "en"
            ? "Unable to load your bookings."
            : "Impossible de charger vos réservations.");
          setError(msg);
          setLoading(false);
          return;
        }

        const json = (await res.json()) as ApiResponse;
        setBookings(json.bookings ?? []);
      } catch (err) {
        console.error(err);
        setError(
          currentLocale === "en"
            ? "Unexpected error while loading bookings."
            : "Erreur inattendue lors du chargement des réservations."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadBookings();
  }, [currentLocale]);

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
          ? "The booking request has been cancelled."
          : "La demande de réservation a été annulée."
      );
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b)),
      );
    } catch (err) {
      console.error(err);
      toast.error(
        currentLocale === "en"
          ? "Unexpected error while cancelling."
          : "Erreur inattendue lors de l'annulation."
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  // Fetch cancellation preview before showing modal
  async function showCancellationPreview(id: string) {
    setLoadingPreview(true);
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}/cancellation-preview`);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || data?.error || "Impossible de charger les détails d'annulation");
        return;
      }

      setCancelModal(data as CancellationPreview);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoadingPreview(false);
      setActionLoadingId(null);
    }
  }

  // Confirm cancellation after preview
  async function confirmCancellation() {
    if (!cancelModal) return;

    const id = cancelModal.booking.id;
    setActionLoadingId(id);
    setCancelModal(null);

    try {
      const res = await fetch("/api/bookings/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id }),
      });

      const data = (await res.json().catch(() => null)) as
        | {
            error?: string;
            policy?: {
              message?: string;
            };
          }
        | null;

      if (!res.ok) {
        const msg =
          data?.policy?.message ??
          data?.error ??
          (currentLocale === "en"
            ? "Unable to cancel this booking."
            : "Impossible d'annuler cette réservation.");
        toast.error(msg);
        return;
      }

      toast.success(
        data?.policy?.message ??
          (currentLocale === "en"
            ? "The refund request has been sent. Status will be updated shortly."
            : "La demande de remboursement a été envoyée. Le statut sera mis à jour sous peu."),
      );

      setBookings((prev) =>
        prev.map((b) =>
          b.id === id && b.status === "CONFIRMED"
            ? { ...b, status: "CANCELLED" }
            : b,
        ),
      );
    } catch (err) {
      console.error(err);
      toast.error(
        currentLocale === "en"
          ? "Unexpected error while requesting refund."
          : "Erreur inattendue lors de la demande de remboursement."
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [bookings],
  );

  return (
    <main className="mx-auto max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <header className="mb-4 sm:mb-6 lg:mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {t.subtitle}
          </p>
        </div>

        <Link
          href="/listings"
          className="mt-2 inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 sm:mt-0"
        >
          {t.continueExploring}
        </Link>
      </header>

      {loading && (
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
      )}

      {!loading && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && !hasBookings && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-gray-900">
            {t.noBookingsYet}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {t.noBookingsDesc}
          </p>
          <Link
            href="/listings"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900"
          >
            {t.viewListings}
          </Link>
        </div>
      )}

      {!loading && !error && hasBookings && (
        <div className="space-y-4">
          {sortedBookings.map((booking) => {
            const img = booking.listing.images[0]?.url ?? null;
            const totalLabel = formatMoney(
              booking.totalPrice,
              booking.currency,
            );
            const dateRange = formatDateRange(
              booking.startDate,
              booking.endDate,
              currentLocale
            );
            const createdAt = formatDate(booking.createdAt, currentLocale);
            const isPending = booking.status === "PENDING";
            const isConfirmed = booking.status === "CONFIRMED";
            const isCancelled = booking.status === "CANCELLED";

            return (
              <div
                key={booking.id}
                className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-stretch"
              >
                <div className="w-full sm:w-32">
                  <Link
                    href={`/listings/${booking.listing.id}`}
                    className="block overflow-hidden rounded-xl bg-gray-100"
                  >
                    {img ? (
                      <Image
                        src={img}
                        alt={booking.listing.title}
                        width={320}
                        height={240}
                        className="h-24 w-full object-cover sm:h-24"
                      />
                    ) : (
                      <div className="flex h-24 w-full items-center justify-center text-xs text-gray-400">
                        {t.noPhoto}
                      </div>
                    )}
                  </Link>
                </div>

                <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row">
                  <div className="flex-1 space-y-1 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/listings/${booking.listing.id}`}
                        className="line-clamp-1 text-sm font-semibold text-gray-900 hover:underline"
                      >
                        {booking.listing.title}
                      </Link>

                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusBadgeClass(
                          booking.status,
                        )}`}
                      >
                        {statusLabel(booking.status)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600">
                      {t.stay} :{" "}
                      <span className="font-medium text-gray-900">
                        {dateRange}
                      </span>
                    </p>

                    <p className="text-xs text-gray-600">
                      {t.bookedOn}{" "}
                      <span className="font-medium text-gray-900">
                        {createdAt}
                      </span>
                    </p>

                    <p className="text-xs text-gray-600">
                      {t.baseAmount} :{" "}
                      <span className="font-medium text-gray-900">
                        {totalLabel}
                      </span>{" "}
                      <span className="text-[11px] text-gray-500">
                        {t.excludingFees}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-col items-stretch gap-2 sm:w-52 sm:items-end">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => router.push(`/bookings/${booking.id}`)}
                          disabled={actionLoadingId === booking.id}
                          className="inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          {actionLoadingId === booking.id
                            ? t.openingPayment
                            : t.payNow}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            cancelPendingBooking(booking.id)
                          }
                          disabled={actionLoadingId === booking.id}
                          className="inline-flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          {actionLoadingId === booking.id
                            ? t.cancelling
                            : t.cancelRequest}
                        </button>
                      </>
                    )}

                    {isConfirmed && (
                      <>
                        <button
                          type="button"
                          onClick={() => router.push(`/bookings/${booking.id}`)}
                          className="inline-flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 sm:w-auto"
                        >
                          {t.viewManagePayment}
                        </button>

                        <button
                          type="button"
                          onClick={() => showCancellationPreview(booking.id)}
                          disabled={actionLoadingId === booking.id}
                          className="inline-flex w-full items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          {actionLoadingId === booking.id && loadingPreview
                            ? "Chargement..."
                            : actionLoadingId === booking.id
                              ? t.requestInProgress
                              : t.cancelReservation}
                        </button>
                      </>
                    )}

                    {isCancelled && (
                      <p className="text-[11px] font-medium text-gray-500">
                        {t.bookingCancelled}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Annuler cette réservation ?
            </h2>

            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-700">{cancelModal.policy.message}</p>

              <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Montant remboursé</span>
                  <span className="font-semibold text-emerald-600">
                    {formatMoney(cancelModal.policy.refundAmountCents / 100, cancelModal.booking.currency)}
                  </span>
                </div>
                {cancelModal.policy.serviceFeeRetainedCents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frais de service retenus</span>
                    <span className="text-gray-900">
                      {formatMoney(cancelModal.policy.serviceFeeRetainedCents / 100, cancelModal.booking.currency)}
                    </span>
                  </div>
                )}
                {cancelModal.policy.guestPenaltyCents > cancelModal.policy.serviceFeeRetainedCents && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Non remboursé</span>
                    <span className="text-red-600">
                      {formatMoney((cancelModal.policy.guestPenaltyCents - cancelModal.policy.serviceFeeRetainedCents) / 100, cancelModal.booking.currency)}
                    </span>
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-gray-500">
                {cancelModal.policy.policyType === "daily"
                  ? "Politique d'annulation pour réservations journée/nuitée"
                  : "Politique d'annulation pour réservations à l'heure"}
              </p>
            </div>

            {!cancelModal.allowed && (
              <div className="mt-4 rounded-xl bg-red-50 p-3">
                <p className="text-sm font-medium text-red-700">
                  Annulation non autorisée
                </p>
                <p className="mt-1 text-xs text-red-600">
                  {cancelModal.policy.message}
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setCancelModal(null)}
                className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              {cancelModal.allowed && (
                <button
                  type="button"
                  onClick={confirmCancellation}
                  disabled={actionLoadingId !== null}
                  className="flex-1 rounded-full bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {actionLoadingId ? "En cours..." : "Confirmer l'annulation"}
                </button>
              )}
            </div>

            <Link
              href="/help"
              className="mt-4 block text-center text-xs text-gray-500 hover:text-gray-700"
            >
              Voir la politique d&apos;annulation complète
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
