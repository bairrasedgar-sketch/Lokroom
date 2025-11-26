"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

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

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateRange(startStr: string, endStr: string) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Dates indisponibles";
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
    const month = start.toLocaleDateString("fr-FR", { month: "short" });
    return `${start.getDate().toString().padStart(2, "0")}–${end
      .getDate()
      .toString()
      .padStart(2, "0")} ${month} ${start.getFullYear()}`;
  }

  if (sameYear) {
    return `${start.toLocaleDateString("fr-FR", optsShort)} – ${end.toLocaleDateString(
      "fr-FR",
      optsShort,
    )} ${start.getFullYear()}`;
  }

  return `${start.toLocaleDateString("fr-FR", optsFull)} – ${end.toLocaleDateString(
    "fr-FR",
    optsFull,
  )}`;
}

function statusLabel(status: BookingStatus) {
  switch (status) {
    case "PENDING":
      return "En attente de paiement";
    case "CONFIRMED":
      return "Confirmée";
    case "CANCELLED":
      return "Annulée";
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

export default function BookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const created = searchParams.get("created");
  const paid = searchParams.get("paid");
  const processing = searchParams.get("processing");

  // Affiche les toasts en fonction des query params
  useEffect(() => {
    if (created === "1") {
      toast.success(
        "Votre réservation a été créée. Il ne reste plus qu’à finaliser le paiement.",
      );
    }
    if (paid === "1") {
      toast.success("Paiement confirmé, votre réservation est validée ✅");
    }
    if (processing === "1") {
      toast("Paiement en cours de traitement…");
    }
  }, [created, paid, processing]);

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
          const msg = data?.error ?? "Impossible de charger vos réservations.";
          setError(msg);
          setLoading(false);
          return;
        }

        const json = (await res.json()) as ApiResponse;
        setBookings(json.bookings ?? []);
      } catch (err) {
        console.error(err);
        setError("Erreur inattendue lors du chargement des réservations.");
      } finally {
        setLoading(false);
      }
    }

    void loadBookings();
  }, []);

  const hasBookings = bookings.length > 0;

  async function cancelPendingBooking(id: string) {
    if (!window.confirm("Annuler cette demande de réservation ?")) return;

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        const msg = data?.error ?? "Impossible d’annuler cette réservation.";
        toast.error(msg);
        return;
      }

      toast.success("La demande de réservation a été annulée.");
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b)),
      );
    } catch (err) {
      console.error(err);
      toast.error("Erreur inattendue lors de l’annulation.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function requestRefund(id: string) {
    if (
      !window.confirm(
        "Tu veux vraiment annuler cette réservation confirmée ? Un remboursement partiel ou total sera appliqué selon la politique d’annulation.",
      )
    ) {
      return;
    }

    setActionLoadingId(id);
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
          "Impossible d’annuler cette réservation.";
        toast.error(msg);
        return;
      }

      toast.success(
        data?.policy?.message ??
          "La demande de remboursement a été envoyée. Le statut sera mis à jour sous peu.",
      );

      // On ne force pas forcément CANCELLED tout de suite,
      // c’est le webhook Stripe qui fait foi, mais on peut marquer
      // que la réservation est en cours d’annulation.
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id && b.status === "CONFIRMED" ? { ...b, status: "CANCELLED" } : b,
        ),
      );
    } catch (err) {
      console.error(err);
      toast.error("Erreur inattendue lors de la demande de remboursement.");
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
    <main className="mx-auto max-w-5xl px-4 py-6 lg:py-8">
      <header className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Mes réservations
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Retrouve toutes tes demandes, réservations confirmées et annulées.
          </p>
        </div>

        <Link
          href="/listings"
          className="mt-2 inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 sm:mt-0"
        >
          Continuer à explorer Lok&apos;Room
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
            Tu n’as pas encore de réservation.
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Explore les annonces Lok&apos;Room et réserve ton premier séjour,
            bureau ou parking.
          </p>
          <Link
            href="/listings"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900"
          >
            Voir les annonces
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
            );
            const createdAt = formatDate(booking.createdAt);
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
                        Pas de photo
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
                      Séjour :{" "}
                      <span className="font-medium text-gray-900">
                        {dateRange}
                      </span>
                    </p>

                    <p className="text-xs text-gray-600">
                      Réservé le{" "}
                      <span className="font-medium text-gray-900">
                        {createdAt}
                      </span>
                    </p>

                    <p className="text-xs text-gray-600">
                      Montant de base :{" "}
                      <span className="font-medium text-gray-900">
                        {totalLabel}
                      </span>{" "}
                      <span className="text-[11px] text-gray-500">
                        (hors frais Lok&apos;Room)
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
                            ? "Ouverture du paiement…"
                            : "Payer maintenant"}
                        </button>

                        <button
                          type="button"
                          onClick={() => cancelPendingBooking(booking.id)}
                          disabled={actionLoadingId === booking.id}
                          className="inline-flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          {actionLoadingId === booking.id
                            ? "Annulation…"
                            : "Annuler la demande"}
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
                          Voir / gérer le paiement
                        </button>

                        <button
                          type="button"
                          onClick={() => requestRefund(booking.id)}
                          disabled={actionLoadingId === booking.id}
                          className="inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          {actionLoadingId === booking.id
                            ? "Demande en cours…"
                            : "Annuler la réservation"}
                        </button>
                      </>
                    )}

                    {isCancelled && (
                      <p className="text-[11px] font-medium text-gray-500">
                        Cette réservation a été annulée.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
