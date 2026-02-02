"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { XMarkIcon, MinusIcon, PlusIcon, BoltIcon } from "@heroicons/react/24/solid";
import type { Currency } from "@/lib/currency";
import { useTranslation } from "@/hooks/useTranslation";
import { InstantBookIndicator } from "@/components/InstantBookBadge";

type MobileBookingModalProps = {
  listingId: string;
  price: number;
  currency: Currency;
  priceFormatted: string;
  isInstantBook?: boolean;
  maxGuests?: number;
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

function formatMoney(amountCents: number, curr: Currency) {
  const value = amountCents / 100;
  const locale = curr === "EUR" ? "fr-FR" : "en-CA";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: curr,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function MobileBookingModal({
  listingId,
  price,
  currency,
  priceFormatted,
  isInstantBook = false,
  maxGuests,
}: MobileBookingModalProps) {
  const router = useRouter();
  const { status } = useSession();
  const { t } = useTranslation();
  const isLoggedIn = status === "authenticated";

  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pricingMode, setPricingMode] = useState<"night" | "day" | "hour">("night");
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });
  const [submitting, setSubmitting] = useState(false);

  // Instant Book state
  const [instantBookEligible, setInstantBookEligible] = useState<boolean | null>(null);
  const [instantBookReasons, setInstantBookReasons] = useState<string[]>([]);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Price preview state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewBreakdown | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Promo code state
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

  // Date d'aujourd'hui en format UTC (YYYY-MM-DD)
  const todayStr = new Date().toISOString().slice(0, 10);
  const totalGuests = guests.adults + guests.children + guests.infants;

  const bf = t.components.bookingForm;

  const closeModal = useCallback(() => setIsOpen(false), []);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeModal]);

  // Get pricing mode label
  const getPricingModeLabel = () => {
    switch (pricingMode) {
      case "hour":
        return t.common.perHour;
      case "day":
        return t.common.perDay;
      case "night":
      default:
        return t.common.perNight;
    }
  };

  // Load price preview when dates change
  useEffect(() => {
    if (!startDate || !endDate) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    if (endDate <= startDate) {
      setPreview(null);
      setPreviewError(bf.departureAfterArrival);
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
          if (controller.signal.aborted) return;
          setPreview(null);
          setPreviewError(data?.error ?? bf.priceCalculationError);
          return;
        }

        const json = (await res.json()) as PreviewResponse;
        if (controller.signal.aborted) return;
        setPreview(json.breakdown);
        setPreviewError(null);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (controller.signal.aborted) return;
        setPreview(null);
        setPreviewError(bf.priceCalculationFailed);
      } finally {
        if (!controller.signal.aborted) {
          setPreviewLoading(false);
        }
      }
    }

    void loadPreview();
    return () => controller.abort();
  }, [startDate, endDate, listingId, bf.departureAfterArrival, bf.priceCalculationError, bf.priceCalculationFailed]);

  // Check Instant Book eligibility
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
          let errorData = null;
          try {
            errorData = await res.json();
          } catch {
            // JSON parsing failed, ignore
          }
          if (controller.signal.aborted) return;
          setInstantBookEligible(false);
          setInstantBookReasons([errorData?.error ?? bf.priceCalculationError]);
          return;
        }

        let data;
        try {
          data = await res.json();
        } catch {
          if (controller.signal.aborted) return;
          setInstantBookEligible(false);
          setInstantBookReasons([bf.priceCalculationFailed]);
          return;
        }
        if (controller.signal.aborted) return;
        setInstantBookEligible(data.eligible);
        setInstantBookReasons(data.reasons || []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setInstantBookEligible(false);
        setInstantBookReasons([bf.priceCalculationFailed]);
      } finally {
        setCheckingEligibility(false);
      }
    }

    void checkEligibility();
    return () => controller.abort();
  }, [isInstantBook, startDate, endDate, listingId, isLoggedIn, bf.priceCalculationError, bf.priceCalculationFailed]);

  // Validate promo code
  async function validatePromoCode() {
    if (!promoCode.trim()) {
      setPromoError(bf.enterPromoCode);
      return;
    }

    if (!isLoggedIn) {
      setPromoError(bf.loginForPromo);
      return;
    }

    setPromoLoading(true);
    setPromoError(null);

    try {
      // Use the preview basePriceCents if available, otherwise calculate from price and nights
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
        setPromoError(data.error || bf.invalidPromoCode);
        setValidPromo(null);
        return;
      }

      setValidPromo(data.promoCode);
      setPromoError(null);
      toast.success(bf.promoApplied.replace("{code}", data.promoCode.code));
    } catch {
      setPromoError(bf.promoValidationError);
    } finally {
      setPromoLoading(false);
    }
  }

  function removePromoCode() {
    setValidPromo(null);
    setPromoCode("");
    setPromoError(null);
  }

  async function handleSubmit() {
    if (!isLoggedIn) {
      signIn("google", { callbackUrl: window.location.href });
      return;
    }

    if (!startDate || !endDate) {
      toast.error(bf.selectDates);
      return;
    }

    // Validate guests count
    if (totalGuests <= 0) {
      toast.error(bf.selectGuests);
      return;
    }

    // Validate max guests if provided
    if (maxGuests && totalGuests > maxGuests) {
      toast.error(bf.tooManyGuests.replace("{max}", String(maxGuests)));
      return;
    }

    // Vérifier que les dates ne sont pas dans le passé (UTC pour cohérence avec l'API)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const start = new Date(startDate + "T00:00:00Z");
    const end = new Date(endDate + "T00:00:00Z");

    if (start < today) {
      toast.error(bf.arrivalNotInPast);
      return;
    }

    // Strict validation: endDate must be strictly greater than startDate (at least 1 night)
    if (end <= start) {
      toast.error(bf.departureAfterArrival);
      return;
    }

    setSubmitting(true);

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
          pricingMode,
          guests: {
            adults: guests.adults,
            children: guests.children,
            infants: guests.infants,
          },
          promoCodeId: validPromo?.id,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        booking?: { id?: string; status?: string };
        error?: string;
      } | null;

      if (!res.ok) {
        toast.error(data?.error || bf.bookingCreationError);
        setSubmitting(false);
        return;
      }

      const bookingId = data?.booking?.id;
      const isConfirmed = data?.booking?.status === "CONFIRMED";

      if (useInstantBook && isConfirmed) {
        toast.success(bf.instantBookConfirmed);
      } else {
        toast.success(bf.bookingCreated);
      }

      setIsOpen(false);
      router.push(bookingId ? `/bookings/${bookingId}` : "/bookings");
    } catch {
      toast.error(bf.bookingCreationError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Barre sticky en bas */}
      <div className="fixed bottom-[60px] left-0 right-0 z-20 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {priceFormatted}
              <span className="text-sm font-normal text-gray-500"> {getPricingModeLabel()}</span>
            </p>
            <p className="text-xs text-gray-500">{bf.taxesAndFeesIncluded}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold rounded-xl shadow-lg"
            aria-label={bf.continueButton}
          >
            {bf.continueButton}
          </button>
        </div>
      </div>

      {/* Modal de réservation */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{bf.continueButton}</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
                aria-label={t.common.close}
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Prix */}
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">
                  {priceFormatted}
                  <span className="text-base font-normal text-gray-500"> {getPricingModeLabel()}</span>
                </p>
              </div>

              {/* Mode de tarification */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-3">{bf.bookingType}</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPricingMode("hour")}
                    className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition ${
                      pricingMode === "hour"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                    aria-label={bf.perHourOption}
                  >
                    {bf.perHourOption}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode("day")}
                    className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition ${
                      pricingMode === "day"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                    aria-label={bf.perDayOption}
                  >
                    {bf.perDayOption}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode("night")}
                    className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition ${
                      pricingMode === "night"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                    aria-label={bf.perNightOption}
                  >
                    {bf.perNightOption}
                  </button>
                </div>
              </div>

              {/* Dates */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-3">{t.home.dates}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-300 p-3">
                    <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1">
                      {bf.arrivalLabel}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      min={todayStr}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val < todayStr) return; // Empêcher les dates passées
                        setStartDate(val);
                      }}
                      className="w-full text-sm text-gray-900 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                    />
                  </div>
                  <div className="rounded-xl border border-gray-300 p-3">
                    <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1">
                      {bf.departureLabel}
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || todayStr}
                      onChange={(e) => {
                        const val = e.target.value;
                        const minDate = startDate || todayStr;
                        if (val <= minDate) return; // Empêcher les dates avant l'arrivée
                        setEndDate(val);
                      }}
                      className="w-full text-sm text-gray-900 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>
              </div>

              {/* Instant Book Indicator */}
              {isInstantBook && startDate && endDate && (
                <div>
                  {checkingEligibility ? (
                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-amber-500" />
                      <span className="text-gray-600">{t.common.loading}</span>
                    </div>
                  ) : (
                    <InstantBookIndicator eligible={instantBookEligible} reasons={instantBookReasons} />
                  )}
                </div>
              )}

              {/* Voyageurs */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-3">{t.common.guests}</p>
                <div className="space-y-4">
                  {/* Adultes */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{bf.adultsLabel}</p>
                      <p className="text-xs text-gray-500">{bf.adultsDesc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGuests((g) => ({ ...g, adults: Math.max(1, g.adults - 1) }))}
                        disabled={guests.adults <= 1}
                        className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 text-gray-600 hover:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={bf.adultsLabel + " -"}
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{guests.adults}</span>
                      <button
                        type="button"
                        onClick={() => setGuests((g) => ({ ...g, adults: g.adults + 1 }))}
                        disabled={maxGuests ? totalGuests >= maxGuests : false}
                        className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 text-gray-600 hover:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={bf.adultsLabel + " +"}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Enfants */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{bf.childrenLabel}</p>
                      <p className="text-xs text-gray-500">{bf.childrenDesc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGuests((g) => ({ ...g, children: Math.max(0, g.children - 1) }))}
                        disabled={guests.children <= 0}
                        className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 text-gray-600 hover:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={bf.childrenLabel + " -"}
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{guests.children}</span>
                      <button
                        type="button"
                        onClick={() => setGuests((g) => ({ ...g, children: g.children + 1 }))}
                        disabled={maxGuests ? totalGuests >= maxGuests : false}
                        className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 text-gray-600 hover:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={bf.childrenLabel + " +"}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bébés */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{bf.infantsLabelPicker}</p>
                      <p className="text-xs text-gray-500">{bf.infantsDesc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGuests((g) => ({ ...g, infants: Math.max(0, g.infants - 1) }))}
                        disabled={guests.infants <= 0}
                        className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 text-gray-600 hover:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={bf.infantsLabelPicker + " -"}
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{guests.infants}</span>
                      <button
                        type="button"
                        onClick={() => setGuests((g) => ({ ...g, infants: g.infants + 1 }))}
                        disabled={maxGuests ? totalGuests >= maxGuests : false}
                        className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 text-gray-600 hover:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={bf.infantsLabelPicker + " +"}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Max guests info */}
                  {maxGuests && (
                    <p className="text-xs text-gray-500 text-center">
                      {bf.maxGuestsInfo.replace("{max}", String(maxGuests))}
                    </p>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              {preview && (
                <div className="space-y-3 pt-2">
                  {preview.lines
                    .filter((line) => !line.emphasize)
                    .map((line) => (
                      <div key={line.code} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 underline decoration-dotted underline-offset-4">
                          {line.label}
                        </span>
                        <span className="text-gray-900">{formatMoney(line.amountCents, preview.currency)}</span>
                      </div>
                    ))}

                  {validPromo && validPromo.discountAmountCents > 0 && (
                    <div className="flex items-center justify-between text-sm text-green-600">
                      <span>{bf.discount} ({validPromo.code})</span>
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
                <div className="text-center text-sm text-gray-500">{bf.calculatingPrice}</div>
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
                  aria-label={bf.addPromoCode}
                >
                  {bf.addPromoCode}
                </button>
              )}

              {showPromoInput && !validPromo && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder={bf.promoCodePlaceholder}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm uppercase focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    disabled={promoLoading}
                  />
                  <button
                    type="button"
                    onClick={validatePromoCode}
                    disabled={promoLoading || !promoCode.trim()}
                    className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                    aria-label={bf.addPromoCode}
                  >
                    {promoLoading ? "..." : t.common.ok}
                  </button>
                </div>
              )}

              {validPromo && (
                <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 px-4 py-3">
                  <span className="text-sm font-medium text-green-700">
                    {validPromo.code} - {validPromo.discountLabel}
                  </span>
                  <button type="button" onClick={removePromoCode} className="text-sm text-gray-500 hover:text-gray-700" aria-label={t.common.delete}>
                    {t.common.delete}
                  </button>
                </div>
              )}

              {promoError && <p className="text-center text-sm text-red-600">{promoError}</p>}

              {/* Bouton réserver */}
              {isInstantBook && instantBookEligible === true ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !startDate || !endDate}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-base font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  aria-label={submitting ? bf.creating : bf.reserveInstantly}
                >
                  <BoltIcon className="h-5 w-5" />
                  {submitting ? bf.creating : bf.reserveInstantly}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !startDate || !endDate}
                  className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-base font-semibold rounded-xl shadow-lg disabled:opacity-50"
                  aria-label={submitting ? bf.creating : t.common.confirm}
                >
                  {submitting ? bf.creating : t.common.confirm}
                </button>
              )}

              {/* Note */}
              <p className="text-xs text-gray-500 text-center">
                {bf.securePaymentNote}
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
