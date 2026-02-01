"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { XMarkIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/solid";
import type { Currency } from "@/lib/currency";

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
  const isLoggedIn = status === "authenticated";

  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pricingMode, setPricingMode] = useState<"night" | "day" | "hour">("night");
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });
  const [submitting, setSubmitting] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const totalGuests = guests.adults + guests.children;

  async function handleSubmit() {
    if (!isLoggedIn) {
      signIn("google", { callbackUrl: window.location.href });
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Veuillez sélectionner les dates");
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
      toast.error("La date de départ doit être après la date d'arrivée");
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

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.error || "Erreur lors de la réservation");
        setSubmitting(false);
        return;
      }

      toast.success("Réservation créée !");
      setIsOpen(false);
      router.push(data?.booking?.id ? `/bookings/${data.booking.id}` : "/bookings");
    } catch {
      toast.error("Erreur lors de la réservation");
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
              <span className="text-sm font-normal text-gray-500"> / nuit</span>
            </p>
            <p className="text-xs text-gray-500">Taxes et frais inclus</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold rounded-xl shadow-lg"
          >
            Réserver
          </button>
        </div>
      </div>

      {/* Modal de réservation */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Réserver</h2>
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
                  <span className="text-base font-normal text-gray-500"> / nuit</span>
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
                <p className="text-sm font-medium text-gray-900 mb-3">Dates</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-300 p-3">
                    <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1">
                      Arrivée
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
                      Départ
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

              {/* Voyageurs */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-3">Voyageurs</p>
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

              {/* Bouton réserver */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !startDate || !endDate}
                className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-base font-semibold rounded-xl shadow-lg disabled:opacity-50"
              >
                {submitting ? "Réservation en cours..." : "Confirmer la réservation"}
              </button>

              {/* Note */}
              <p className="text-xs text-gray-500 text-center">
                Vous ne serez pas débité maintenant
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
