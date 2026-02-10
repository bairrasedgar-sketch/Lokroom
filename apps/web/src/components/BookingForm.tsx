// apps/web/src/components/BookingForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { BoltIcon, StarIcon, XMarkIcon, ChevronDownIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/solid";
import type { Currency } from "@/lib/currency";
import { useTranslation } from "@/hooks/useTranslation";
import { InstantBookIndicator } from "@/components/InstantBookBadge";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useTracking } from "@/hooks/useTracking";

type BookingFormProps = {
  listingId: string;
  price: number;
  currency: Currency;
  displayCurrency?: Currency;
  priceFormatted?: string;
  isInstantBook?: boolean;
  rating?: number | null;
  reviewCount?: number;
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
    maximumFractionDigits: 0,
  }).format(value);
}

export default function BookingForm({
  listingId,
  price,
  currency,
  displayCurrency,
  priceFormatted,
  isInstantBook = false,
  rating,
  reviewCount = 0,
}: BookingFormProps) {
  const router = useRouter();
  const { status } = useSession();
  const { t } = useTranslation();
  const { logBeginCheckout, logBookingCompleted } = useAnalytics();
  const { trackBooking } = useTracking();
  const isLoggedIn = status === "authenticated";

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });

  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewBreakdown | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [instantBookEligible, setInstantBookEligible] = useState<boolean | null>(null);
  const [instantBookReasons, setInstantBookReasons] = useState<string[]>([]);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [validPromo, setValidPromo] = useState<{
    id: string;
    code: string;
    type: string;
    value: number;
    discountAmountCents: number;
    discountLabel: string;
  } | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const totalGuests = guests.adults + guests.children;

  useEffect(() => {
    if (!startDate || !endDate) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    if (endDate <= startDate) {
      setPreview(null);
      setPreviewError(t.components.bookingForm.departureAfterArrival);
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
          body: JSON.stringify({ listingId, startDate, endDate }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setPreview(null);
          setPreviewError(data?.error ?? t.components.bookingForm.priceCalculationError);
          return;
        }

        const json = (await res.json()) as PreviewResponse;
        setPreview(json.breakdown);
        setPreviewError(null);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setPreview(null);
        setPreviewError(t.components.bookingForm.priceCalculationFailed);
      } finally {
        setPreviewLoading(false);
      }
    }

    void loadPreview();
    return () => controller.abort();
  }, [startDate, endDate, listingId]);

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
        const params = new URLSearchParams({ startDate, endDate });
        const res = await fetch(
          `/api/listings/${listingId}/instant-book/eligibility?${params}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          setInstantBookEligible(false);
          setInstantBookReasons([t.components.bookingForm.eligibilityCheckError || "Impossible de vérifier l'éligibilité"]);
          return;
        }

        const data = await res.json();
        setInstantBookEligible(data.eligible);
        setInstantBookReasons(data.reasons || []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setInstantBookEligible(false);
        setInstantBookReasons([t.components.bookingForm.verificationError || "Erreur lors de la vérification"]);
      } finally {
        setCheckingEligibility(false);
      }
    }

    void checkEligibility();
    return () => controller.abort();
  }, [isInstantBook, startDate, endDate, listingId, isLoggedIn, t.components.bookingForm]);

  async function validatePromoCode() {
    if (!promoCode.trim()) {
      setPromoError(t.components.bookingForm.enterPromoCode || "Veuillez entrer un code promo");
      return;
    }

    if (!isLoggedIn) {
      setPromoError(t.components.bookingForm.loginForPromo || "Connectez-vous pour utiliser un code promo");
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
        setPromoError(data.error || t.components.bookingForm.invalidPromoCode || "Code promo invalide");
        setValidPromo(null);
        return;
      }

      setValidPromo(data.promoCode);
      setPromoError(null);
      toast.success(t.components.bookingForm.promoApplied?.replace("{code}", data.promoCode.code) || `Code "${data.promoCode.code}" appliqué`);
    } catch {
      setPromoError(t.components.bookingForm.promoValidationError || "Erreur lors de la validation");
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
    if (!code) return bf.bookingCreationError;

    switch (code) {
      case "UNAUTHENTICATED":
      case "unauthorized":
        return bf.loginRequired;
      case "LISTING_NOT_FOUND":
        return bf.listingNotFound;
      case "CANNOT_BOOK_OWN_LISTING":
        return bf.cannotBookOwn;
      case "PROVINCE_REQUIRED":
        return bf.provinceRequired;
      case "DATES_NOT_AVAILABLE":
        return bf.datesUnavailable;
      case "INVALID_DATES":
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

    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    if (!startDate || !endDate) {
      toast.error(bf.selectDates);
      return;
    }

    // Vérifier que les dates ne sont pas dans le passé (UTC pour cohérence avec l'API)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const start = new Date(startDate + "T00:00:00Z");
    const end = new Date(endDate + "T00:00:00Z");

    if (start < today) {
      toast.error(bf.arrivalNotInPast || "La date d'arrivée ne peut pas être dans le passé");
      return;
    }

    if (end <= start) {
      toast.error(bf.departureAfterArrival);
      return;
    }

    setSubmitting(true);

    // Track begin checkout
    const totalPrice = preview?.lines.find(l => l.code === 'total')?.amountCents || 0;
    const totalGuests = guests.adults + guests.children;

    logBeginCheckout({
      listingId,
      listingTitle: '',
      startDate,
      endDate,
      totalPrice: totalPrice / 100,
      guests: totalGuests,
    });

    try {
      const useInstantBook = isInstantBook && instantBookEligible === true;
      const endpoint = useInstantBook ? "/api/bookings/instant" : "/api/bookings/create";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          startDate,
          endDate,
          guests,
          promoCodeId: validPromo?.id,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        booking?: { id?: string; status?: string };
        error?: string;
      } | null;

      if (!res.ok) {
        toast.error(mapServerErrorToMessage(data?.error));
        setSubmitting(false);
        return;
      }

      const bookingId = data?.booking?.id;
      const isConfirmed = data?.booking?.status === "CONFIRMED";

      // Track booking completed (conversion)
      if (bookingId) {
        logBookingCompleted({
          bookingId,
          listingId,
          listingTitle: '',
          startDate,
          endDate,
          totalPrice: totalPrice / 100,
          guests: totalGuests,
          paymentMethod: useInstantBook ? 'instant_book' : 'standard',
        });
        // Track for recommendations
        trackBooking(listingId, bookingId);
      }

      if (useInstantBook && isConfirmed) {
        toast.success(bf.instantBookConfirmed || "Réservation confirmée instantanément");
      } else {
        toast.success(bf.bookingCreated);
      }

      router.push(bookingId ? `/bookings/${bookingId}` : "/bookings");
    } catch {
      toast.error(t.components.bookingForm.bookingCreationError);
    } finally {
      setSubmitting(false);
    }
  }

  const bf = t.components.bookingForm;

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        {/* Header: Prix + Rating */}
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <span className="text-2xl font-semibold text-gray-900">
              {priceFormatted || `${Math.round(price)} ${currency}`}
            </span>
            <span className="text-base text-gray-600 ml-1">{t.common.perNight}</span>
          </div>
          {rating && reviewCount > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <StarIcon className="h-4 w-4 text-gray-900" />
              <span className="font-medium text-gray-900">{rating.toFixed(2)}</span>
              <span className="text-gray-500">({reviewCount})</span>
            </div>
          )}
        </div>

        {/* Currency notice */}
        {displayCurrency && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              💳 Vous serez débité en <strong>{displayCurrency}</strong>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Picker - Airbnb style */}
          <div className="rounded-xl border border-gray-300 overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-gray-300">
              <div className="p-3">
                <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1">
                  {bf.arrivalLabel}
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={todayStr}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm text-gray-900 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                />
              </div>
              <div className="p-3">
                <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1">
                  {bf.departureLabel}
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || todayStr}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm text-gray-900 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Guest Selector */}
            <div className="border-t border-gray-300">
              <button
                type="button"
                onClick={() => setShowGuestPicker(!showGuestPicker)}
                className="w-full p-3 flex items-center justify-between text-left"
              >
                <div>
                  <span className="block text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1">
                    {bf.travelersLabel || t.common.guests}
                  </span>
                  <span className="text-sm text-gray-900">
                    {totalGuests} {totalGuests > 1 ? t.common.guests : t.common.guest}
                    {guests.infants > 0 && `, ${guests.infants} ${bf.infantsLabel || (guests.infants > 1 ? "bébés" : "bébé")}`}
                  </span>
                </div>
                <ChevronDownIcon className={`h-5 w-5 text-gray-600 transition-transform ${showGuestPicker ? "rotate-180" : ""}`} />
              </button>

              {showGuestPicker && (
                <div className="border-t border-gray-200 p-4 space-y-4">
                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{bf.adultsLabel || "Adultes"}</p>
                      <p className="text-xs text-gray-500">{bf.adultsDesc || "13 ans et plus"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGuests((g) => ({ ...g, adults: Math.max(1, g.adults - 1) }))}
                        disabled={guests.adults <= 1}
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:border-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{guests.adults}</span>
                      <button
                        type="button"
                        onClick={() => setGuests((g) => ({ ...g, adults: g.adults + 1 }))}
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:border-gray-900"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{bf.childrenLabel || "Enfants"}</p>
                      <p className="text-xs text-gray-500">{bf.childrenDesc || "2 à 12 ans"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGuests((g) => ({ ...g, children: Math.max(0, g.children - 1) }))}
                        disabled={guests.children <= 0}
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:border-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{guests.children}</span>
                      <button
                        type="button"
                        onClick={() => setGuests((g) => ({ ...g, children: g.children + 1 }))}
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:border-gray-900"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Infants */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{bf.infantsLabelPicker || "Bébés"}</p>
                      <p className="text-xs text-gray-500">{bf.infantsDesc || "Moins de 2 ans"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGuests((g) => ({ ...g, infants: Math.max(0, g.infants - 1) }))}
                        disabled={guests.infants <= 0}
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:border-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{guests.infants}</span>
                      <button
                        type="button"
                        onClick={() => setGuests((g) => ({ ...g, infants: g.infants + 1 }))}
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:border-gray-900"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instant Book Indicator */}
          {isInstantBook && startDate && endDate && (
            <div>
              {checkingEligibility ? (
                <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-amber-500" />
                  <span className="text-gray-600">{bf.checking || "Vérification..."}</span>
                </div>
              ) : (
                <InstantBookIndicator eligible={instantBookEligible} reasons={instantBookReasons} />
              )}
            </div>
          )}

          {/* Submit Button */}
          {isInstantBook && instantBookEligible === true ? (
            <button
              type="submit"
              disabled={submitting || !startDate || !endDate}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-base flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <BoltIcon className="h-5 w-5" />
              {submitting ? (bf.reserving || "Réservation...") : (bf.reserveInstantly || "Réserver instantanément")}
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting || !startDate || !endDate}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold text-base hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (bf.reserving || "Réservation...") : (bf.reserve || "Réserver")}
            </button>
          )}

          <p className="text-center text-xs text-gray-500">
            {bf.noChargeYet || "Aucun montant ne sera débité pour le moment"}
          </p>

          {/* Legal Notice - BEFORE payment */}
          {preview && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Conditions importantes</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    <strong>Annulation :</strong> Gratuite jusqu'à 72h avant l'arrivée (remboursement à 100%)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    <strong>Paiement :</strong> Sécurisé via Stripe. Vous serez débité en {displayCurrency || currency}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    <strong>Litige :</strong> En cas de problème, contactez support@lokroom.com sous 48h
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="text-xs text-gray-600">
                    J'accepte les{" "}
                    <a href="/legal/terms" target="_blank" className="underline hover:text-gray-900">
                      Conditions Générales
                    </a>
                    , la{" "}
                    <a href="/legal/cancellation" target="_blank" className="underline hover:text-gray-900">
                      Politique d'annulation
                    </a>
                    {" "}et la{" "}
                    <a href="/legal/privacy" target="_blank" className="underline hover:text-gray-900">
                      Politique de confidentialité
                    </a>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          {preview && (
            <div className="pt-4 space-y-3">
              {preview.lines
                .filter((line) => !line.emphasize)
                .map((line) => (
                  <div key={line.code} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 underline decoration-dotted underline-offset-4 cursor-help">
                      {line.label}
                    </span>
                    <span className="text-gray-900">{formatMoney(line.amountCents, preview.currency)}</span>
                  </div>
                ))}

              {validPromo && validPromo.discountAmountCents > 0 && (
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span>{bf.discount || "Réduction"} ({validPromo.code})</span>
                  <span>-{formatMoney(validPromo.discountAmountCents, preview.currency)}</span>
                </div>
              )}

              {preview.lines
                .filter((line) => line.emphasize)
                .map((line) => (
                  <div key={line.code} className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">{line.label}</span>
                    <span className="font-semibold text-gray-900">{formatMoney(line.amountCents, preview.currency)}</span>
                  </div>
                ))}
            </div>
          )}

          {previewLoading && (
            <div className="text-center text-sm text-gray-500">{bf.calculatingPrice || "Calcul du prix..."}</div>
          )}

          {previewError && (
            <div className="text-center text-sm text-red-600">{previewError}</div>
          )}

          {/* Promo Code */}
          {!showPromoInput && !validPromo && (
            <button
              type="button"
              onClick={() => setShowPromoInput(true)}
              className="w-full text-center text-sm font-medium text-gray-900 underline hover:text-gray-600"
            >
              {bf.addPromoCode || "Ajouter un code promo"}
            </button>
          )}

          {showPromoInput && !validPromo && (
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder={bf.promoCodePlaceholder || "Code promo"}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm uppercase focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                disabled={promoLoading}
              />
              <button
                type="button"
                onClick={validatePromoCode}
                disabled={promoLoading || !promoCode.trim()}
                className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {promoLoading ? "..." : "OK"}
              </button>
            </div>
          )}

          {validPromo && (
            <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 px-4 py-3">
              <span className="text-sm font-medium text-green-700">
                {validPromo.code} - {validPromo.discountLabel}
              </span>
              <button type="button" onClick={removePromoCode} className="text-sm text-gray-500 hover:text-gray-700">
                {bf.removePromo || "Retirer"}
              </button>
            </div>
          )}

          {promoError && <p className="text-center text-xs text-red-600">{promoError}</p>}
        </form>
      </div>

      {/* Login Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{bf.loginRequiredTitle || "Connexion requise"}</h2>
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <p className="mb-6 text-sm text-gray-600">
              {bf.loginRequiredDesc || "Connectez-vous pour réserver ce logement."}
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: window.location.href })}
                className="w-full py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 hover:bg-gray-50 transition"
              >
                {t.auth.continueGoogle}
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
                }}
                className="w-full py-3 rounded-xl bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 transition"
              >
                {bf.loginButton || "Se connecter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
