// apps/web/src/components/BookingForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Currency = "EUR" | "CAD";

type BookingFormProps = {
  listingId: string;
  price: number; // prix par nuit
  currency: Currency;
};

type PreviewLine = {
  code: "base" | "service_guest" | "taxes" | "total";
  label: string;
  amountCents: number;
  emphasize?: boolean;
};

type PreviewBreakdown = {
  currency: Currency;
  nights: number;
  basePriceCents: number;
  lines: PreviewLine[];
};

type PreviewResponse = {
  listing: {
    id: string;
    title: string;
    pricePerNight: number;
    currency: Currency;
  };
  nights: number;
  checkIn: string;
  checkOut: string;
  breakdown: PreviewBreakdown;
};

function formatMoney(amountCents: number, currency: Currency) {
  const value = amountCents / 100;
  const locale = currency === "EUR" ? "fr-FR" : "en-CA";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function BookingForm({
  listingId,
  price,
  currency,
}: BookingFormProps) {
  const router = useRouter();

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewBreakdown | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // 💰 Label "tarif de base" par nuit — utilise price & currency
  const pricePerNightCents = Math.round(price * 100);
  const basePerNightLabel = formatMoney(pricePerNightCents, currency);

  // Min pour les dates = aujourd'hui (évite les résas dans le passé)
  const todayStr = new Date().toISOString().slice(0, 10);

  // Quand les dates changent -> on appelle /api/bookings/preview
  useEffect(() => {
    if (!startDate || !endDate) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    // check rapide côté client : départ après arrivée
    if (endDate <= startDate) {
      setPreview(null);
      setPreviewError(
        "La date de départ doit être postérieure à la date d’arrivée.",
      );
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      setPreviewLoading(true);
      setPreviewError(null);

      try {
        const res = await fetch("/api/bookings/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId,
            startDate,
            endDate,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const msg =
            data?.error ?? "Impossible de calculer le détail du prix.";
          if (!cancelled) {
            setPreview(null);
            setPreviewError(msg);
          }
          return;
        }

        const json = (await res.json()) as PreviewResponse;
        if (!cancelled) {
          setPreview(json.breakdown);
          setPreviewError(null);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setPreview(null);
          setPreviewError("Erreur lors du calcul du prix.");
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, listingId]);

  function mapServerErrorToMessage(code: string | undefined): string {
    if (!code) {
      return "Impossible de créer la réservation pour le moment.";
    }

    switch (code) {
      case "UNAUTHENTICATED":
      case "unauthorized":
        return "Vous devez être connecté pour réserver.";
      case "LISTING_NOT_FOUND":
      case "Listing not found":
        return "Cette annonce n’existe plus.";
      case "CANNOT_BOOK_OWN_LISTING":
      case "You cannot book your own listing.":
        return "Vous ne pouvez pas réserver votre propre annonce.";
      case "PROVINCE_REQUIRED":
        return "Cette annonce est au Canada : la province doit être renseignée par l’hôte avant de pouvoir réserver.";
      case "DATES_NOT_AVAILABLE":
      case "Dates not available for this listing.":
        return "Ces dates ne sont plus disponibles. Essayez un autre créneau.";
      case "INVALID_DATES":
      case "Invalid date range":
      case "INVALID_NIGHTS":
        return "Les dates sélectionnées ne sont pas valides.";
      default:
        return code;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!startDate || !endDate) {
      toast.error("Merci de choisir une date d’arrivée et de départ.");
      return;
    }

    if (endDate <= startDate) {
      toast.error(
        "La date de départ doit être postérieure à la date d’arrivée.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          startDate,
          endDate,
        }),
      });

      const data = await res.json().catch(() => null as any);

      if (!res.ok) {
        const msg = mapServerErrorToMessage(data?.error);
        toast.error(msg);
        setSubmitting(false);
        return;
      }

      // data = { booking, fees, hostUserId, nights }
      const bookingId: string | undefined = data?.booking?.id;

      toast.success(
        "Votre réservation a été créée. Il ne reste plus qu’à finaliser le paiement.",
      );

      // 🔁 Redirige vers la page de paiement de cette réservation
      if (bookingId) {
        router.push(`/bookings/${bookingId}`);
      } else {
        router.push("/bookings");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        "Erreur inattendue lors de la création de la réservation.",
      );
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      {/* Dates */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-700">
            Arrivée
          </label>
          <input
            type="date"
            value={startDate}
            min={todayStr}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-700">
            Départ
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate || todayStr}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      {/* Résumé du prix façon Airbnb */}
      <div className="space-y-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
        <p className="font-medium text-gray-900">Détail du prix</p>

        {/* Tarif de base par nuit (utilise les props) */}
        <p className="text-[11px] text-gray-500">
          Tarif de base :{" "}
          <span className="font-medium text-gray-900">
            {basePerNightLabel}
          </span>{" "}
          / nuit (hors frais Lok&apos;Room).
        </p>

        {previewLoading && (
          <p className="text-[11px] text-gray-500">
            Calcul du montant total…
          </p>
        )}

        {previewError && (
          <p className="text-[11px] text-red-600">{previewError}</p>
        )}

        {!previewLoading && !preview && !previewError && (
          <p className="text-[11px] text-gray-500">
            Choisis tes dates pour voir le détail du prix.
          </p>
        )}

        {preview && (
          <div className="space-y-1">
            {preview.lines.map((line) => (
              <div
                key={line.code}
                className={`flex items-center justify-between ${
                  line.emphasize ? "border-t border-gray-200 pt-1 mt-1" : ""
                }`}
              >
                <span
                  className={
                    line.emphasize
                      ? "font-semibold text-gray-900"
                      : "text-gray-700"
                  }
                >
                  {line.label}
                </span>
                <span
                  className={
                    line.emphasize
                      ? "font-semibold text-gray-900"
                      : "text-gray-800"
                  }
                >
                  {formatMoney(line.amountCents, preview.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton submit */}
      <button
        type="submit"
        disabled={submitting || !startDate || !endDate}
        className="inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting
          ? "Création de la réservation…"
          : "Continuer"}
      </button>

      <p className="text-[11px] text-gray-500">
        Le paiement est sécurisé via Lok&apos;Room. Aucun paiement en
        dehors de la plateforme.
      </p>
    </form>
  );
}
