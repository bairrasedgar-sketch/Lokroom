"use client";

import { useState, useEffect } from "react";
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
};

export default function MobileBookingModal({
  listingId,
  price,
  currency,
  priceFormatted,
  isInstantBook = false,
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

  const todayStr = new Date().toISOString().slice(0, 10);
  const totalGuests = guests.adults + guests.children;

  const bf = t.components.bookingForm;

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
          setInstantBookEligible(false);
          setInstantBookReasons([bf.priceCalculationError]);
          return;
        }

        const data = await res.json();
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
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim(),
          listingId,
          bookingAmountCents: 0,
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
      toast.success(`Code "${data.promoCode.code}" appliqué`);
    } catch {
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

  async function handleSubmit() {
    if (!isLoggedIn) {
      signIn("google", { callbackUrl: window.location.href });
      return;
    }

    if (!startDate || !endDate) {
      toast.error(bf.selectDates);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);

    if (start < today) {
      toast.error("La date d'arrivée ne peut pas être dans le passé");
      return;
    }

    if (endDate <= startDate) {
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
          guests: totalGuests,
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
        toast.success("Réservation confirmée instantanément");
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
            <p className="text-xs text-gray-500">Taxes et frais inclus</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold rounded-xl shadow-lg"
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
                <p className="text-sm font-medium text-gray-900 mb-3">Type de réservation</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPricingMode("hour")}
                    className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition ${
                      pricingMode === "hour"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    À l&apos;heure
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode("day")}
                    className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition ${
                      pricingMode === "day"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    À la journée
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode("night")}
                    className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition ${
                      pricingMode === "night"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    À la nuit
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
                      onChange={(e) => setStartDate(e.target.value)}
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
                      onChange={(e) => setEndDate(e.target.value)}
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
                      <p className="text-sm font-medium text-gray-900">Adultes</p>
                      <p className="text-xs text-gray-500">13 ans et plus</p>
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

                  {/* Enfants */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Enfants</p>
                      <p className="text-xs text-gray-500">2 à 12 ans</p>
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

                  {/* Bébés */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Bébés</p>
                      <p className="text-xs text-gray-500">Moins de 2 ans</p>
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
              </div>

              {/* Promo Code */}
              {!showPromoInput && !validPromo && (
                <button
                  type="button"
                  onClick={() => setShowPromoInput(true)}
                  className="w-full text-center text-sm font-medium text-gray-900 underline hover:text-gray-600"
                >
                  Ajouter un code promo
                </button>
              )}

              {showPromoInput && !validPromo && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Code promo"
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
                    {t.common.delete}
                  </button>
                </div>
              )}

              {promoError && <p className="text-center text-xs text-red-600">{promoError}</p>}

              {/* Bouton réserver */}
              {isInstantBook && instantBookEligible === true ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !startDate || !endDate}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-base font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <BoltIcon className="h-5 w-5" />
                  {submitting ? bf.creating : "Réserver instantanément"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !startDate || !endDate}
                  className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-base font-semibold rounded-xl shadow-lg disabled:opacity-50"
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
