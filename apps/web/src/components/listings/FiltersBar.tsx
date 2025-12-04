// apps/web/src/components/listings/FiltersBar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { getDictionaryForLocale, type SupportedLocale } from "@/lib/i18n.client";
import { CalendarDaysIcon, ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";

type FiltersBarProps = {
  q: string;
  country: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  sort: string;
  hasPhoto: boolean;
  locale?: SupportedLocale;
};

// ────────────────────────────────────────────────────────────────────────────
// Composant DateTimePicker inline (style Airbnb)
// ────────────────────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

function formatHour(hour: number): string {
  return hour.toString().padStart(2, "0");
}

function formatMinute(minute: number): string {
  return minute.toString().padStart(2, "0");
}

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map(Number);
  return { hour: h || 0, minute: m || 0 };
}

function formatTime(hour: number, minute: number): string {
  return `${formatHour(hour)}:${formatMinute(minute)}`;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "—";
  }
}

type DateTimePickerInlineProps = {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onStartTimeChange: (v: string) => void;
  onEndTimeChange: (v: string) => void;
  labels: {
    arrival: string;
    departure: string;
    datesAndTimes: string;
  };
};

function DateTimePickerInline({
  startDate,
  endDate,
  startTime,
  endTime,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  labels,
}: DateTimePickerInlineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dates" | "times">("dates");
  const containerRef = useRef<HTMLDivElement>(null);

  const startTimeObj = parseTime(startTime);
  const endTimeObj = parseTime(endTime);

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Bouton déclencheur */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 text-left"
      >
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {labels.datesAndTimes}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase text-gray-400">
                {labels.arrival}
              </span>
              <span className="font-medium text-gray-900">
                {formatDateDisplay(startDate)}
                {startTime && (
                  <span className="ml-1 text-gray-500">· {startTime}</span>
                )}
              </span>
            </div>
            <span className="text-gray-300">→</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase text-gray-400">
                {labels.departure}
              </span>
              <span className="font-medium text-gray-900">
                {formatDateDisplay(endDate)}
                {endTime && (
                  <span className="ml-1 text-gray-500">· {endTime}</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Pop-up de sélection */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[400px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {/* Header avec onglets */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("dates")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  activeTab === "dates"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <CalendarDaysIcon className="h-3.5 w-3.5" />
                Dates
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("times")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  activeTab === "times"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <ClockIcon className="h-3.5 w-3.5" />
                Heures
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Contenu selon l'onglet */}
          <div className="p-4">
            {activeTab === "dates" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Date d'arrivée */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                      {labels.arrival}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      min={today}
                      onChange={(e) => onStartDateChange(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  {/* Date de départ */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                      {labels.departure}
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || today}
                      onChange={(e) => onEndDateChange(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>

                {/* Raccourcis */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Aujourd'hui", days: 0 },
                    { label: "Demain", days: 1 },
                    { label: "Ce week-end", days: "weekend" },
                    { label: "Semaine pro", days: 7 },
                  ].map((shortcut) => (
                    <button
                      key={shortcut.label}
                      type="button"
                      onClick={() => {
                        const todayDate = new Date();
                        let start = new Date();
                        let end = new Date();

                        if (shortcut.days === "weekend") {
                          const dayOfWeek = todayDate.getDay();
                          const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
                          start = new Date(todayDate);
                          start.setDate(todayDate.getDate() + daysUntilSaturday);
                          end = new Date(start);
                          end.setDate(start.getDate() + 1);
                        } else {
                          start.setDate(todayDate.getDate() + (shortcut.days as number));
                          end.setDate(start.getDate() + 1);
                        }

                        const fmtDate = (d: Date) => d.toISOString().split("T")[0];
                        onStartDateChange(fmtDate(start));
                        onEndDateChange(fmtDate(end));
                      }}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition hover:border-gray-900 hover:bg-gray-50"
                    >
                      {shortcut.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "times" && (
              <div className="space-y-4">
                {/* Heure d'arrivée */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Heure d&apos;arrivée
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <p className="mb-1 text-[10px] text-gray-400">Heure</p>
                      <div className="grid max-h-32 grid-cols-6 gap-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
                        {HOURS.map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => onStartTimeChange(formatTime(h, startTimeObj.minute))}
                            className={`rounded-lg px-2 py-1 text-xs font-medium transition ${
                              startTimeObj.hour === h
                                ? "bg-gray-900 text-white"
                                : "text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {formatHour(h)}h
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="w-20">
                      <p className="mb-1 text-[10px] text-gray-400">Min</p>
                      <div className="grid grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-gray-50 p-2">
                        {MINUTES.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => onStartTimeChange(formatTime(startTimeObj.hour, m))}
                            className={`rounded-lg px-2 py-1 text-xs font-medium transition ${
                              startTimeObj.minute === m
                                ? "bg-gray-900 text-white"
                                : "text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            :{formatMinute(m)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Heure de départ */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Heure de départ
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <p className="mb-1 text-[10px] text-gray-400">Heure</p>
                      <div className="grid max-h-32 grid-cols-6 gap-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
                        {HOURS.map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => onEndTimeChange(formatTime(h, endTimeObj.minute))}
                            className={`rounded-lg px-2 py-1 text-xs font-medium transition ${
                              endTimeObj.hour === h
                                ? "bg-gray-900 text-white"
                                : "text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {formatHour(h)}h
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="w-20">
                      <p className="mb-1 text-[10px] text-gray-400">Min</p>
                      <div className="grid grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-gray-50 p-2">
                        {MINUTES.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => onEndTimeChange(formatTime(endTimeObj.hour, m))}
                            className={`rounded-lg px-2 py-1 text-xs font-medium transition ${
                              endTimeObj.minute === m
                                ? "bg-gray-900 text-white"
                                : "text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            :{formatMinute(m)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Créneaux courants */}
                <div>
                  <p className="mb-2 text-[10px] font-medium text-gray-400">
                    Créneaux courants
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Matin (9h-12h)", start: "09:00", end: "12:00" },
                      { label: "Après-midi (14h-18h)", start: "14:00", end: "18:00" },
                      { label: "Journée (9h-18h)", start: "09:00", end: "18:00" },
                      { label: "Soirée (18h-22h)", start: "18:00", end: "22:00" },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          onStartTimeChange(preset.start);
                          onEndTimeChange(preset.end);
                        }}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition hover:border-gray-900 hover:bg-gray-50"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                onStartDateChange("");
                onEndDateChange("");
                onStartTimeChange("");
                onEndTimeChange("");
              }}
              className="text-xs font-medium text-gray-600 hover:text-gray-900 hover:underline"
            >
              Effacer
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-black"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// FiltersBar principal
// ────────────────────────────────────────────────────────────────────────────
export default function FiltersBar(props: FiltersBarProps) {
  const {
    q,
    country,
    city,
    minPrice,
    maxPrice,
    minRating,
    sort,
    hasPhoto,
    locale = "fr",
  } = props;

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // États pour dates/heures
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const t = getDictionaryForLocale(locale);
  const fb = t.components.filtersBar;

  return (
    <section className="space-y-3">
      {/* ⚠️ Un seul form GET pour tout (barre + gros pop-up filtres) */}
      <form method="GET" className="space-y-3">
        {/* ====== BARRE PRINCIPALE (destination / dates / heures / voyageurs) ====== */}
        <div className="rounded-3xl border border-gray-200 bg-white px-3 py-3 shadow-sm lg:px-5 lg:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Destination */}
            <div className="flex flex-1 items-center gap-3 border-b border-gray-100 pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-black" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {fb.whereGoing}
                </p>
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder={fb.locationPlaceholder}
                  className="w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Dates + Heures - Nouveau composant style Airbnb */}
            <div className="flex flex-1 items-stretch gap-3 border-b border-gray-100 pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:px-4">
              <DateTimePickerInline
                startDate={startDate}
                endDate={endDate}
                startTime={startTime}
                endTime={endTime}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onStartTimeChange={setStartTime}
                onEndTimeChange={setEndTime}
                labels={{
                  arrival: fb.arrival,
                  departure: fb.departure,
                  datesAndTimes: fb.datesAndTimes,
                }}
              />
              {/* Champs cachés pour le formulaire */}
              <input type="hidden" name="startDate" value={startDate} />
              <input type="hidden" name="endDate" value={endDate} />
              <input type="hidden" name="startTime" value={startTime} />
              <input type="hidden" name="endTime" value={endTime} />
            </div>

            {/* Voyageurs */}
            <div className="flex flex-[0.9] items-center gap-3 lg:px-4">
              <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm sm:flex">
                <span className="h-4 w-4 rounded-full border border-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {fb.travelers}
                </p>
                <input
                  type="text"
                  readOnly
                  placeholder={fb.travelersPlaceholder}
                  className="w-full cursor-not-allowed border-none bg-transparent text-sm text-gray-400 focus:outline-none focus:ring-0"
                />
              </div>

              {/* Bouton Rechercher */}
              <button
                type="submit"
                className="ml-3 inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-xs font-medium text-white shadow-sm hover:bg-gray-900"
              >
                {fb.searchButton}
              </button>
            </div>

            {/* On garde country / city si déjà dans l'URL */}
            {country && (
              <input type="hidden" name="country" defaultValue={country} />
            )}
            {city && <input type="hidden" name="city" defaultValue={city} />}
          </div>
        </div>

        {/* ====== RANGÉE DE PILULES (Filtres, Populaires, Tarifs, Trier) ====== */}
        <div className="flex flex-wrap gap-2 text-xs">
          {/* Bouton qui ouvre le GRAND panneau de filtres façon Airbnb */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[13px] text-gray-800 shadow-sm transition hover:border-black hover:bg-gray-50"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 text-[10px]">
              ●
            </span>
            {fb.filtersButton}
          </button>

          {/* Populaires → tri par meilleure note */}
          <button
            type="submit"
            name="sort"
            value="rating_desc"
            className={`rounded-full border px-3 py-1.5 shadow-sm transition ${
              sort === "rating_desc"
                ? "border-black bg-black text-white"
                : "border-gray-300 bg-white text-gray-800 hover:border-black"
            }`}
          >
            {fb.popular}
          </button>

          {/* Tarifs : résumé (édition dans le panneau de filtres) */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[13px] text-gray-800 shadow-sm transition hover:border-black hover:bg-gray-50"
          >
            {fb.pricing}
            {minPrice || maxPrice ? (
              <span className="ml-1 text-[11px] text-gray-500">
                {minPrice || "0"} – {maxPrice || fb.maxPrice}
              </span>
            ) : (
              <span className="ml-1 text-[11px] text-gray-400">
                {fb.priceScale}
              </span>
            )}
          </button>

          {/* Pièces & espaces (placeholder) */}
          <button
            type="button"
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[13px] text-gray-400 shadow-sm"
          >
            {fb.roomsAndSpaces}
          </button>

          {/* Trier par : capsule avec select customisé */}
          <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 shadow-sm">
            <span className="hidden text-[13px] text-gray-600 sm:inline">
              {fb.sortBy}
            </span>
            <div className="relative">
              <select
                name="sort"
                defaultValue={sort}
                className="h-7 appearance-none rounded-full border border-gray-200 bg-gray-50 pl-3 pr-6 text-[11px] font-medium text-gray-800 focus:border-black focus:outline-none"
              >
                <option value="newest">{fb.sortNewest}</option>
                <option value="price_asc">{fb.sortPriceAsc}</option>
                <option value="price_desc">{fb.sortPriceDesc}</option>
                <option value="rating_desc">{fb.sortBestRated}</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-gray-400">
                ▾
              </span>
            </div>
          </div>
        </div>

        {/* ====== POP-UP DE FILTRES (GRAND MODAL TYPE AIRBNB) ====== */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-100"
                >
                  ✕
                </button>
                <h2 className="text-sm font-semibold">{fb.filtersTitle}</h2>
                <div className="w-8" />
              </div>

              {/* Contenu scrollable */}
              <div className="max-h-[70vh] space-y-8 overflow-y-auto px-6 py-5 text-sm text-gray-800">
                {/* Échelle de prix */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">{fb.priceScale2}</h3>
                  <p className="text-xs text-gray-500">
                    {fb.priceScaleDesc}
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-[11px] text-gray-500">
                        {fb.minimum}
                      </span>
                      <input
                        type="number"
                        name="minPrice"
                        min={0}
                        defaultValue={minPrice}
                        placeholder={fb.minPlaceholder}
                        className="h-9 rounded-xl border border-gray-300 bg-gray-50 px-3 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-[11px] text-gray-500">
                        {fb.maximum}
                      </span>
                      <input
                        type="number"
                        name="maxPrice"
                        min={0}
                        defaultValue={maxPrice}
                        placeholder={fb.maxPlaceholder}
                        className="h-9 rounded-xl border border-gray-300 bg-gray-50 px-3 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>
                </section>

                {/* Note minimale */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">{fb.minRating}</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "", label: fb.allRatings },
                      { value: "3", label: fb.rating3Plus },
                      { value: "4", label: fb.rating4Plus },
                      { value: "5", label: fb.rating5Only },
                    ].map((opt) => (
                      <label
                        key={opt.value || "all"}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs ${
                          (minRating || "") === opt.value
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-gray-800"
                        }`}
                      >
                        <input
                          type="radio"
                          name="minRating"
                          value={opt.value}
                          defaultChecked={(minRating || "") === opt.value}
                          className="hidden"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>

                  <label className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      name="hasPhoto"
                      value="1"
                      defaultChecked={hasPhoto}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span>{fb.onlyWithPhotos}</span>
                  </label>
                </section>

                {/* Chambres et lits (placeholder, côté UX) */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">{fb.roomsAndBeds}</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { key: "chambres", label: fb.bedrooms },
                      { key: "lits", label: fb.beds },
                      { key: "sallesDeBain", label: fb.bathrooms },
                    ].map((item) => (
                      <div key={item.key} className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">
                          {item.label}
                        </span>
                        <input
                          type="number"
                          min={0}
                          name={item.key}
                          className="h-9 rounded-xl border border-gray-300 bg-gray-50 px-3 text-sm focus:border-black focus:outline-none"
                          placeholder={fb.anyOption}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Commodités (checkbox "chips" – backend pourra les gérer plus tard) */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">{fb.amenities}</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "wifi", label: fb.wifi },
                      { key: "stationnement_gratuit", label: fb.freeParking },
                      { key: "arrivée_autonome", label: fb.selfCheckIn },
                      { key: "climatisation", label: fb.airConditioning },
                      { key: "chauffage", label: fb.heating },
                      { key: "télévision", label: fb.tv },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="cursor-pointer rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 hover:border-black"
                      >
                        <input
                          type="checkbox"
                          name="amenities"
                          value={item.key}
                          className="hidden"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </section>

                {/* Options de réservation (placeholder) */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">
                    {fb.bookingOptions}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "réservation_instantanée", label: fb.instantBooking },
                      { key: "arrivée_autonome", label: fb.selfCheckIn },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="cursor-pointer rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 hover:border-black"
                      >
                        <input
                          type="checkbox"
                          name="bookingOptions"
                          value={item.key}
                          className="hidden"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </section>

                {/* Type de logement (chips) */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold">{fb.propertyType}</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "maison", label: fb.house },
                      { key: "appartement", label: fb.apartment },
                      { key: "bureau", label: fb.office },
                      { key: "parking", label: fb.parking },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="cursor-pointer rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 hover:border-black"
                      >
                        <input
                          type="checkbox"
                          name="spaceType"
                          value={item.key}
                          className="hidden"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </section>
              </div>

              {/* Footer du modal */}
              <div className="flex items-center justify-between gap-4 border-t px-6 py-4">
                <button
                  type="reset"
                  className="text-xs font-medium text-gray-600 hover:underline"
                  onClick={() => {
                    // On laisse le reset du form faire son job, on ferme juste le panneau
                    setIsFilterOpen(false);
                  }}
                >
                  {fb.clearAll}
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-gray-900"
                  onClick={() => setIsFilterOpen(false)}
                >
                  {fb.showResults}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
