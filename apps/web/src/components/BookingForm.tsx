// apps/web/src/components/BookingForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { BoltIcon } from "@heroicons/react/24/solid";
import type { Currency } from "@/lib/currency";
import { useTranslation } from "@/hooks/useTranslation";
import { InstantBookIndicator } from "@/components/InstantBookBadge";

type BookingFormProps = {
  listingId: string;
  price: number; // prix par nuit
  currency: Currency;
  isInstantBook?: boolean;
};

type PreviewLine = {
  code: "base" | "service_guest" | "taxes" | "total" | "promo";
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
  isInstantBook = false,
}: BookingFormProps) {
  const router = useRouter();
  const { status } = useSession();
  const { t } = useTranslation();
  const isLoggedIn = status === "authenticated";

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewBreakdown | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Instant Book eligibility
  const [instantBookEligible, setInstantBookEligible] = useState<boolean | null>(null);
  const [instantBookReasons, setInstantBookReasons] = useState<string[]>([]);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Code promo
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [validPromo, setValidPromo] = useState<{
    id: string;
    code: string;
    type: string;
    value: number;
    discountAmountCents: number;
    discountLabel: string;
  } | null>(null);

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
        "La date de départ doit être postérieure à la date d'arrivée.",
      );
      return;
    }

    const controller = new AbortController();

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
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const msg =
            data?.error ?? "Impossible de calculer le détail du prix.";
          setPreview(null);
          setPreviewError(msg);
          return;
        }

        const json = (await res.json()) as PreviewResponse;
        setPreview(json.breakdown);
        setPreviewError(null);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error(err);
        setPreview(null);
        setPreviewError("Erreur lors du calcul du prix.");
      } finally {
        setPreviewLoading(false);
      }
    }

    void loadPreview();

    return () => controller.abort();
  }, [startDate, endDate, listingId]);

  // Vérifier l'éligibilité instant book quand les dates changent
  useEffect(() => {
    if (!isInstantBook || !startDate || !endDate || !isLoggedIn) {
      setInstantBookEligible(isInstantBook ? null : false);
      setInstantBookReasons([]);
      return;
    }

    const controller = new AbortController();

    async function checkEligibility() {
      setCheckingEligibility(true);

      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
        });

        const res = await fetch(
          `/api/listings/${listingId}/instant-book/eligibility?${params}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          setInstantBookEligible(false);
          setInstantBookReasons(["Impossible de vérifier l'éligibilité"]);
          return;
        }

        const data = await res.json();
        setInstantBookEligible(data.eligible);
        setInstantBookReasons(data.reasons || []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error(err);
        setInstantBookEligible(false);
        setInstantBookReasons(["Erreur lors de la vérification"]);
      } finally {
        setCheckingEligibility(false);
      }
    }

    void checkEligibility();

    return () => controller.abort();
  }, [isInstantBook, startDate, endDate, listingId, isLoggedIn]);

  // Validation du code promo
  async function validatePromoCode() {
    if (!promoCode.trim()) {
      setPromoError("Veuillez entrer un code promo");
      return;
    }

    if (!isLoggedIn) {
      setPromoError("Connectez-vous pour utiliser un code promo");
      return;
    }

    setPromoLoading(true);
    setPromoError(null);

    try {
      const bookingAmountCents = preview?.basePriceCents || 0;

      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim(),
          listingId,
          bookingAmountCents,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setPromoError(data.error || "Code promo invalide");
        setValidPromo(null);
        return;
      }

      setValidPromo(data.promoCode);
      setPromoError(null);
      toast.success(`Code promo "${data.promoCode.code}" appliqué !`);
    } catch (error) {
      console.error("Error validating promo code:", error);
      setPromoError("Erreur lors de la validation");
    } finally {
      setPromoLoading(false);
    }
  }

  function removePromoCode() {
    setValidPromo(null);
    setPromoCode("");
    setPromoError(null);
  }

  function mapServerErrorToMessage(code: string | undefined): string {
    const bf = t.components.bookingForm;
    if (!code) {
      return bf.bookingCreationError;
    }

    switch (code) {
      case "UNAUTHENTICATED":
      case "unauthorized":
        return bf.loginRequired;
      case "LISTING_NOT_FOUND":
      case "Listing not found":
        return bf.listingNotFound;
      case "CANNOT_BOOK_OWN_LISTING":
      case "You cannot book your own listing.":
        return bf.cannotBookOwn;
      case "PROVINCE_REQUIRED":
        return bf.provinceRequired;
      case "DATES_NOT_AVAILABLE":
      case "Dates not available for this listing.":
        return bf.datesUnavailable;
      case "INVALID_DATES":
      case "Invalid date range":
      case "INVALID_NIGHTS":
        return bf.invalidDates;
      default:
        return code;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const bf = t.components.bookingForm;

    // Si non connecté, afficher la modale de connexion
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    if (!startDate || !endDate) {
      toast.error(bf.selectDates);
      return;
    }

    if (endDate <= startDate) {
      toast.error(bf.departureAfterArrival);
      return;
    }

    setSubmitting(true);

    try {
      // Utiliser l'API instant book si éligible
      const useInstantBook = isInstantBook && instantBookEligible === true;
      const endpoint = useInstantBook ? "/api/bookings/instant" : "/api/bookings/create";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          startDate,
          endDate,
          promoCodeId: validPromo?.id,
        }),
      });

      const data = await res.json().catch(() => null) as {
        booking?: { id?: string; status?: string };
        error?: string;
        success?: boolean;
      } | null;

      if (!res.ok) {
        const msg = mapServerErrorToMessage(data?.error);
        toast.error(msg);
        setSubmitting(false);
        return;
      }

      // data = { booking, fees, hostUserId, nights }
      const bookingId: string | undefined = data?.booking?.id;
      const isConfirmed = data?.booking?.status === "CONFIRMED";

      if (useInstantBook && isConfirmed) {
        toast.success("Réservation confirmée instantanément !");
      } else {
        toast.success(bf.bookingCreated);
      }

      // Redirige vers la page de paiement de cette réservation
      if (bookingId) {
        router.push(`/bookings/${bookingId}`);
      } else {
        router.push("/bookings");
      }
    } catch (err) {
      console.error(err);
      toast.error(bf.bookingCreationError);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  }

  const bf = t.components.bookingForm;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {/* Dates */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">
              {bf.arrivalLabel}
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
              {bf.departureLabel}
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
          <p className="font-medium text-gray-900">{bf.priceDetail}</p>

          {/* Tarif de base par nuit (utilise les props) */}
          <p className="text-[11px] text-gray-500">
            {bf.baseRate}{" "}
            <span className="font-medium text-gray-900">
              {basePerNightLabel}
            </span>{" "}
            {bf.perNightExcludingFees}
          </p>

          {previewLoading && (
            <p className="text-[11px] text-gray-500">
              {bf.calculatingTotal}
            </p>
          )}

          {previewError && (
            <p className="text-[11px] text-red-600">{previewError}</p>
          )}

          {!previewLoading && !preview && !previewError && (
            <p className="text-[11px] text-gray-500">
              {bf.selectDatesForPrice}
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

              {/* Afficher la réduction du code promo */}
              {validPromo && validPromo.discountAmountCents > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span>Réduction ({validPromo.code})</span>
                  <span>-{formatMoney(validPromo.discountAmountCents, preview.currency)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Champ code promo */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => document.getElementById("promo-input")?.focus()}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 underline"
          >
            Vous avez un code promo ?
          </button>

          {!validPromo ? (
            <div className="flex gap-2">
              <input
                id="promo-input"
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Entrez votre code"
                className="flex-1 h-9 rounded-lg border border-gray-300 px-3 text-sm uppercase outline-none focus:border-black focus:ring-1 focus:ring-black"
                disabled={promoLoading}
              />
              <button
                type="button"
                onClick={validatePromoCode}
                disabled={promoLoading || !promoCode.trim()}
                className="px-4 h-9 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {promoLoading ? "..." : "Appliquer"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm font-medium text-green-700">
                  {validPromo.code} - {validPromo.discountLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={removePromoCode}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Retirer
              </button>
            </div>
          )}

          {promoError && (
            <p className="text-xs text-red-600">{promoError}</p>
          )}
        </div>

        {/* Indicateur Instant Book */}
        {isInstantBook && startDate && endDate && (
          <div className="mt-2">
            {checkingEligibility ? (
              <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-amber-500" />
                <span className="text-gray-600">Vérification de l&apos;éligibilité...</span>
              </div>
            ) : (
              <InstantBookIndicator
                eligible={instantBookEligible}
                reasons={instantBookReasons}
              />
            )}
          </div>
        )}

        {/* Bouton submit */}
        {isInstantBook && instantBookEligible === true ? (
          <button
            type="submit"
            disabled={submitting || !startDate || !endDate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            <BoltIcon className="h-4 w-4" />
            {submitting ? "Réservation en cours..." : "Réserver instantanément"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting || !startDate || !endDate}
            className="inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? bf.creating : bf.continueButton}
          </button>
        )}

        <p className="text-[11px] text-gray-500">
          {isInstantBook && instantBookEligible === true
            ? "Votre réservation sera confirmée immédiatement après le paiement."
            : bf.securePaymentNote}
        </p>
      </form>

      {/* Modale de connexion requise */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {t.errors.loginRequired}
              </h2>
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="mb-6 text-sm text-gray-600">
              {t.errors.loginRequiredDesc}
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: window.location.href })}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                {t.auth.continueGoogle}
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-900"
              >
                {t.errors.loginRequiredAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
