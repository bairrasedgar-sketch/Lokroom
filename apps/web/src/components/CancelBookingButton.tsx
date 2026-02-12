// apps/web/src/components/CancelBookingButton.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";


type PreviewResponse = {
  allowed: boolean;
  role: "guest" | "host";
  booking: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    totalPriceCents: number;
    currency: "EUR" | "CAD";
    listing: {
      id: string;
      title: string;
    };
  };
  policy: {
    reasonCode: string;
    message: string;
    refundRatio: number;
    refundAmountCents: number;
    guestPenaltyCents: number;
  };
};

type CancelBookingButtonProps = {
  bookingId: string;
  /**
   * Optionnel : callback pour mettre à jour la liste côté parent
   * (par ex. retirer la réservation annulée de l'UI).
   */
  onCancelled?: (bookingId: string) => void;
  /**
   * Label custom pour le bouton (par défaut : "Annuler la réservation").
   */
  label?: string;
  className?: string;
};

function formatMoneyFromCents(
  cents: number,
  currency: "EUR" | "CAD" = "EUR",
) {
  const value = cents / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function CancelBookingButton({
  bookingId,
  onCancelled,
  label = "Annuler la réservation",
  className = "",
}: CancelBookingButtonProps) {
  const [open, setOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingRefund, setLoadingRefund] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openModal() {
    setOpen(true);
    setError(null);
    setPreview(null);
    setLoadingPreview(true);

    try {
      const res = await fetch(
        `/api/bookings/${encodeURIComponent(
          bookingId,
        )}/cancellation-preview`,
      );

      const data = await res.json();

      if (!res.ok) {
        setError(
          data?.message ||
            data?.error ||
            "Impossible de prévisualiser l'annulation.",
        );
        setLoadingPreview(false);
        return;
      }

      setPreview(data as PreviewResponse);
    } catch (e) {
      logger.error(e);
      setError("Erreur réseau lors de la prévisualisation.");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function confirmCancel() {
    if (!preview) return;

    setLoadingRefund(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data?.message ||
            data?.error ||
            "Échec de l'annulation / remboursement.",
        );
        setLoadingRefund(false);
        return;
      }

      toast.success("Réservation annulée et remboursement lancé.");

      if (onCancelled) {
        onCancelled(bookingId);
      }

      setOpen(false);
      setPreview(null);
    } catch (e) {
      logger.error(e);
      toast.error("Erreur réseau lors du remboursement.");
    } finally {
      setLoadingRefund(false);
    }
  }

  const currency = preview?.booking.currency ?? "EUR";
  const refundAmount =
    preview?.policy?.refundAmountCents != null
      ? formatMoneyFromCents(preview.policy.refundAmountCents, currency)
      : null;
  const penaltyAmount =
    preview?.policy?.guestPenaltyCents != null
      ? formatMoneyFromCents(preview.policy.guestPenaltyCents, currency)
      : null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`inline-flex items-center rounded-lg border border-red-500 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        disabled={loadingPreview || loadingRefund}
      >
        {loadingPreview || loadingRefund ? "Veuillez patienter..." : label}
      </button>

      {!open ? null : (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Confirmer l&apos;annulation
                </h2>
                {preview && (
                  <p className="mt-1 text-xs text-gray-500">
                    Annonce : {preview.booking.listing.title}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!loadingRefund) {
                    setOpen(false);
                  }
                }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <span className="sr-only">Fermer</span>×
              </button>
            </div>

            {/* Contenu */}
            {loadingPreview ? (
              <p className="text-sm text-gray-600">
                Calcul des frais d&apos;annulation…
              </p>
            ) : error ? (
              <div className="space-y-3">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            ) : !preview ? (
              <p className="text-sm text-gray-600">
                Aucune donnée de prévisualisation.
              </p>
            ) : (
              <>
                <div className="space-y-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  <p className="font-medium">{preview.policy.message}</p>

                  <p>
                    <span className="font-medium">
                      Montant remboursé au voyageur :
                    </span>{" "}
                    {refundAmount}
                  </p>

                  <p>
                    <span className="font-medium">
                      Frais / pénalité d&apos;annulation :
                    </span>{" "}
                    {penaltyAmount}
                  </p>

                  <p className="text-xs text-gray-500">
                    Rôle :{" "}
                    {preview.role === "host"
                      ? "annulation par l'hôte"
                      : "annulation par le voyageur"}
                  </p>
                </div>

                {!preview.allowed && (
                  <p className="mt-2 text-sm text-red-600">
                    L&apos;annulation n&apos;est pas autorisée avec la
                    politique actuelle.
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    disabled={loadingRefund}
                  >
                    Fermer
                  </button>

                  <button
                    type="button"
                    onClick={confirmCancel}
                    disabled={!preview.allowed || loadingRefund}
                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingRefund
                      ? "Annulation en cours…"
                      : "Confirmer l'annulation"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
