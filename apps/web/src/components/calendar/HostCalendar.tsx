"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  LockClosedIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

type Booking = {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  guest: { name: string | null; email: string } | null;
  totalPriceCents: number;
  currency: string;
};

type BlockedPeriod = {
  id: string;
  start: string;
  end: string;
  reason: string | null;
};

type CustomPrice = {
  id: string;
  date: string;
  dailyPrice: number | null;
  hourlyPrice: number | null;
  minNights: number | null;
  note: string | null;
};

type CalendarSync = {
  id: string;
  name: string;
  externalUrl: string;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
};

type CalendarData = {
  listing: {
    id: string;
    title: string;
    price: number;
    currency: string;
    minNights: number | null;
    maxNights: number | null;
  };
  bookings: Booking[];
  blockedPeriods: BlockedPeriod[];
  customPrices: CustomPrice[];
  calendarSyncs: CalendarSync[];
};

type HostCalendarProps = {
  listingId: string;
  initialData?: CalendarData;
};

type DayInfo = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  booking: Booking | null;
  isBlocked: boolean;
  blockReason: string | null;
  customPrice: CustomPrice | null;
  isSelected: boolean;
  isPast: boolean;
};

export default function HostCalendar({ listingId, initialData }: HostCalendarProps) {
  const [data, setData] = useState<CalendarData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showModal, setShowModal] = useState<"block" | "price" | "sync" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [blockReason, setBlockReason] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [syncUrl, setSyncUrl] = useState("");
  const [syncName, setSyncName] = useState("");

  const fetchCalendar = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);

      const res = await fetch(
        `/api/host/calendar?listingId=${listingId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!res.ok) throw new Error("Erreur de chargement");

      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [listingId, currentMonth]);

  useEffect(() => {
    if (!initialData) {
      fetchCalendar();
    }
  }, [fetchCalendar, initialData]);

  // Générer les jours du calendrier
  const calendarDays = useMemo(() => {
    if (!data) return [];

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lundi = 0

    const days: DayInfo[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Jours du mois précédent
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(getDayInfo(date, false, today));
    }

    // Jours du mois courant
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push(getDayInfo(date, true, today));
    }

    // Jours du mois suivant pour compléter la grille
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push(getDayInfo(date, false, today));
    }

    return days;

    function getDayInfo(date: Date, isCurrentMonth: boolean, today: Date): DayInfo {
      const dateStr = date.toISOString().split("T")[0];

      // Trouver une réservation pour cette date
      const booking = data!.bookings.find((b) => {
        const start = new Date(b.startDate);
        const end = new Date(b.endDate);
        return date >= start && date < end;
      }) || null;

      // Vérifier si bloqué
      const block = data!.blockedPeriods.find((b) => {
        const start = new Date(b.start);
        const end = new Date(b.end);
        return date >= start && date < end;
      });

      // Prix personnalisé
      const customPriceObj = data!.customPrices.find(
        (p) => p.date.split("T")[0] === dateStr
      ) || null;

      return {
        date,
        isCurrentMonth,
        isToday: date.getTime() === today.getTime(),
        booking,
        isBlocked: !!block,
        blockReason: block?.reason || null,
        customPrice: customPriceObj,
        isSelected: selectedDates.some((d) => d.getTime() === date.getTime()),
        isPast: date < today,
      };
    }
  }, [data, currentMonth, selectedDates]);

  // Actions
  async function handleBlockDates() {
    if (selectedDates.length === 0) return;
    setActionLoading(true);

    try {
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
      const startDate = sortedDates[0];
      const endDate = new Date(sortedDates[sortedDates.length - 1]);
      endDate.setDate(endDate.getDate() + 1);

      const res = await fetch("/api/host/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          action: "block_period",
          data: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            reason: blockReason || "MANUAL_BLOCK",
          },
        }),
      });

      if (!res.ok) throw new Error("Erreur");

      setShowModal(null);
      setSelectedDates([]);
      setBlockReason("");
      fetchCalendar();
    } catch {
      setError("Erreur lors du blocage");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSetPrice() {
    if (selectedDates.length === 0 || !customPrice) return;
    setActionLoading(true);

    try {
      const res = await fetch("/api/host/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          action: "set_custom_price",
          data: {
            dates: selectedDates.map((d) => d.toISOString()),
            dailyPrice: parseFloat(customPrice),
          },
        }),
      });

      if (!res.ok) throw new Error("Erreur");

      setShowModal(null);
      setSelectedDates([]);
      setCustomPrice("");
      fetchCalendar();
    } catch {
      setError("Erreur lors de la modification du prix");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSyncCalendar() {
    if (!syncUrl) return;
    setActionLoading(true);

    try {
      const res = await fetch("/api/host/ical/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          icalUrl: syncUrl,
          name: syncName || "Calendrier externe",
        }),
      });

      if (!res.ok) throw new Error("Erreur");

      setShowModal(null);
      setSyncUrl("");
      setSyncName("");
      fetchCalendar();
    } catch {
      setError("Erreur lors de la synchronisation");
    } finally {
      setActionLoading(false);
    }
  }

  function toggleDateSelection(date: Date) {
    const dayInfo = calendarDays.find((d) => d.date.getTime() === date.getTime());
    if (!dayInfo || dayInfo.isPast || dayInfo.booking) return;

    setSelectedDates((prev) => {
      const exists = prev.some((d) => d.getTime() === date.getTime());
      if (exists) {
        return prev.filter((d) => d.getTime() !== date.getTime());
      }
      return [...prev, date];
    });
  }

  // Format currency helper (available for custom price display)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function formatCurrency(cents: number, currency: string) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(cents / 100);
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error || "Erreur de chargement"}</p>
        <button
          onClick={fetchCalendar}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{data.listing.title}</h2>
          <p className="text-sm text-gray-500">
            Prix de base: {data.listing.price} {data.listing.currency}/nuit
            {data.listing.minNights && ` · Min ${data.listing.minNights} nuits`}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowModal("sync")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Synchroniser
          </button>
          <a
            href={`/api/host/ical/export/${listingId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <CalendarDaysIcon className="h-4 w-4" />
            Exporter iCal
          </a>
        </div>
      </div>

      {/* Calendar navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="rounded-lg p-2 hover:bg-gray-100"
          aria-label="Mois précédent"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>

        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="rounded-lg p-2 hover:bg-gray-100"
          aria-label="Mois suivant"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Week days header */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {weekDays.map((day) => (
            <div key={day} className="py-3 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            let bgClass = "bg-white";
            let textClass = day.isCurrentMonth ? "text-gray-900" : "text-gray-400";
            let borderClass = "";

            if (day.isPast) {
              bgClass = "bg-gray-50";
              textClass = "text-gray-400";
            } else if (day.booking) {
              bgClass = day.booking.status === "CONFIRMED" ? "bg-green-100" : "bg-amber-100";
              textClass = day.booking.status === "CONFIRMED" ? "text-green-800" : "text-amber-800";
            } else if (day.isBlocked) {
              bgClass = "bg-gray-200";
              textClass = "text-gray-600";
            } else if (day.customPrice) {
              bgClass = "bg-blue-50";
            }

            if (day.isSelected) {
              borderClass = "ring-2 ring-inset ring-black";
            }

            if (day.isToday) {
              borderClass += " ring-2 ring-inset ring-gray-400";
            }

            return (
              <button
                key={idx}
                onClick={() => toggleDateSelection(day.date)}
                disabled={day.isPast || !!day.booking}
                className={`
                  relative min-h-[80px] border-b border-r border-gray-100 p-1 text-left transition
                  ${bgClass} ${borderClass}
                  ${!day.isPast && !day.booking ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"}
                `}
              >
                <span className={`text-sm font-medium ${textClass}`}>
                  {day.date.getDate()}
                </span>

                {/* Booking indicator */}
                {day.booking && (
                  <div className="mt-1">
                    <span className="block truncate text-[10px] font-medium">
                      {day.booking.guest?.name || "Voyageur"}
                    </span>
                  </div>
                )}

                {/* Blocked indicator */}
                {day.isBlocked && !day.booking && (
                  <div className="mt-1 flex items-center gap-1">
                    <LockClosedIcon className="h-3 w-3 text-gray-500" />
                    <span className="text-[10px] text-gray-500">Bloqué</span>
                  </div>
                )}

                {/* Custom price */}
                {day.customPrice && !day.booking && !day.isBlocked && (
                  <div className="mt-1">
                    <span className="text-[10px] font-semibold text-blue-600">
                      {day.customPrice.dailyPrice} {data.listing.currency}
                    </span>
                  </div>
                )}

                {/* Selection indicator */}
                {day.isSelected && (
                  <div className="absolute top-1 right-1">
                    <CheckCircleIcon className="h-4 w-4 text-black" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-green-100" />
          <span>Confirmée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-amber-100" />
          <span>En attente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-200" />
          <span>Bloqué</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-blue-50 border border-blue-200" />
          <span>Prix personnalisé</span>
        </div>
      </div>

      {/* Action buttons */}
      {selectedDates.length > 0 && (
        <div className="sticky bottom-4 flex items-center justify-between rounded-xl bg-gray-900 p-4 text-white shadow-lg">
          <div>
            <p className="font-medium">{selectedDates.length} date{selectedDates.length > 1 ? "s" : ""} sélectionnée{selectedDates.length > 1 ? "s" : ""}</p>
            <p className="text-sm text-gray-400">
              {selectedDates.sort((a, b) => a.getTime() - b.getTime())[0].toLocaleDateString("fr-FR")}
              {selectedDates.length > 1 && ` → ${selectedDates.sort((a, b) => a.getTime() - b.getTime())[selectedDates.length - 1].toLocaleDateString("fr-FR")}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDates([])}
              className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-800"
            >
              Annuler
            </button>
            <button
              onClick={() => setShowModal("price")}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              <CurrencyDollarIcon className="h-4 w-4" />
              Modifier prix
            </button>
            <button
              onClick={() => setShowModal("block")}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
            >
              <LockClosedIcon className="h-4 w-4" />
              Bloquer
            </button>
          </div>
        </div>
      )}

      {/* Synced calendars */}
      {data.calendarSyncs.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="font-medium text-gray-900 mb-3">Calendriers synchronisés</h4>
          <div className="space-y-2">
            {data.calendarSyncs.map((sync) => (
              <div key={sync.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{sync.name}</span>
                  <span className="ml-2 text-gray-500">
                    {sync.lastSyncAt
                      ? `Synchro: ${new Date(sync.lastSyncAt).toLocaleDateString("fr-FR")}`
                      : "Jamais synchronisé"}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    sync.lastSyncStatus === "SUCCESS"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {sync.lastSyncStatus || "En attente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Block dates */}
      {showModal === "block" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bloquer les dates</h3>
              <button onClick={() => setShowModal(null)} className="rounded-lg p-1 hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {selectedDates.length} date{selectedDates.length > 1 ? "s" : ""} seront bloquées et indisponibles à la réservation.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raison (optionnel)
              </label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ex: Maintenance, Usage personnel..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleBlockDates}
                disabled={actionLoading}
                className="flex-1 rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
              >
                {actionLoading ? "..." : "Bloquer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Set price */}
      {showModal === "price" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Modifier le prix</h3>
              <button onClick={() => setShowModal(null)} className="rounded-lg p-1 hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Définir un prix personnalisé pour {selectedDates.length} date{selectedDates.length > 1 ? "s" : ""}.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix par nuit ({data.listing.currency})
              </label>
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder={String(data.listing.price)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              <p className="mt-1 text-xs text-gray-500">
                Prix de base: {data.listing.price} {data.listing.currency}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSetPrice}
                disabled={actionLoading || !customPrice}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? "..." : "Appliquer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Sync calendar */}
      {showModal === "sync" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Synchroniser un calendrier</h3>
              <button onClick={() => setShowModal(null)} className="rounded-lg p-1 hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Importez vos calendriers depuis Airbnb, Booking.com ou toute autre plateforme.
            </p>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL du calendrier iCal
                </label>
                <input
                  type="url"
                  value={syncUrl}
                  onChange={(e) => setSyncUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom (optionnel)
                </label>
                <input
                  type="text"
                  value={syncName}
                  onChange={(e) => setSyncName(e.target.value)}
                  placeholder="Ex: Airbnb, Booking..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSyncCalendar}
                disabled={actionLoading || !syncUrl}
                className="flex-1 rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
              >
                {actionLoading ? "..." : "Synchroniser"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
