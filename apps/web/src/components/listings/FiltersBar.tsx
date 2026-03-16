// apps/web/src/components/listings/FiltersBar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { getDictionaryForLocale, type SupportedLocale } from "@/lib/i18n.client";
import { CalendarDaysIcon, ClockIcon, XMarkIcon, MapPinIcon } from "@heroicons/react/24/outline";
import LocationAutocomplete, { type LocationAutocompletePlace } from "@/components/LocationAutocomplete";
import MobileFiltersModal from "./MobileFiltersModal";
import CategoryFilters, { EMPTY_CATEGORY_FILTERS, type CategoryFiltersState } from "./CategoryFilters";

type FiltersBarProps = {
  q: string;
  country: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  sort: string;
  hasPhoto: boolean;
  startDate?: string;
  endDate?: string;
  guests?: string;
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
        <div className="absolute left-0 right-0 sm:left-auto sm:right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-[400px] sm:w-[360px] md:w-[400px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
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
              aria-label="Fermer"
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
                    <div className="flex-1 min-w-0">
                      <p className="mb-1 text-[10px] text-gray-400">Heure</p>
                      <div className="grid max-h-32 grid-cols-4 sm:grid-cols-6 gap-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
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
                    <div className="w-16 sm:w-20 flex-shrink-0">
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
                    <div className="flex-1 min-w-0">
                      <p className="mb-1 text-[10px] text-gray-400">Heure</p>
                      <div className="grid max-h-32 grid-cols-4 sm:grid-cols-6 gap-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
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
                    <div className="w-16 sm:w-20 flex-shrink-0">
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
    startDate: initialStartDate = "",
    endDate: initialEndDate = "",
    guests: initialGuests = "",
    locale = "fr",
  } = props;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isGuestsOpen, setIsGuestsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);

  // Détecter mobile (< 768px)
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // État pour la destination (autocomplétion)
  const [destination, setDestination] = useState(q);
  const [selectedCity, setSelectedCity] = useState(city);
  const [selectedCountry, setSelectedCountry] = useState(country);

  // États pour dates/heures - initialisés avec les valeurs de l'URL
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [adults, setAdults] = useState(Math.max(1, parseInt(initialGuests) || 1));
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const [currentSort, setCurrentSort] = useState(sort || "newest");

  // ── États contrôlés du modal filtres ──
  const [fMinPrice, setFMinPrice] = useState(minPrice);
  const [fMaxPrice, setFMaxPrice] = useState(maxPrice);
  const [fMinRating, setFMinRating] = useState(minRating || "");
  const [fHasPhoto, setFHasPhoto] = useState(hasPhoto);
  const [fInstantBook, setFInstantBook] = useState(false);
  const [catFilters, setCatFilters] = useState<CategoryFiltersState>({
    ...EMPTY_CATEGORY_FILTERS,
  });

  const patchCatFilters = (patch: Partial<CategoryFiltersState>) =>
    setCatFilters((prev) => ({ ...prev, ...patch }));

  const resetFilters = () => {
    setFMinPrice("");
    setFMaxPrice("");
    setFMinRating("");
    setFHasPhoto(false);
    setFInstantBook(false);
    setCatFilters({ ...EMPTY_CATEGORY_FILTERS });
  };

  // Compte les filtres actifs pour le badge
  const activeFilterCount = [
    fMinPrice,
    fMaxPrice,
    fMinRating,
    fHasPhoto,
    fInstantBook,
    catFilters.spaceType,
    catFilters.spaceSubtype,
    catFilters.minBedrooms > 0,
    catFilters.minBeds > 0,
    catFilters.minBathrooms > 0,
    catFilters.hasGarden,
    catFilters.hasPool,
    catFilters.hasTerrace,
    catFilters.hasSpa,
    catFilters.petsAllowed,
    catFilters.smokingAllowed,
    catFilters.minDesks > 0,
    catFilters.hasProjector,
    catFilters.hasWhiteboard,
    catFilters.hasVideoConf,
    catFilters.hasKitchen,
    catFilters.hasReception,
    catFilters.minCapacity > 0,
    catFilters.hasCatering,
    catFilters.hasStage,
    catFilters.hasSoundSystem,
    catFilters.hasLighting,
    catFilters.hasSoundproofing,
    catFilters.hasGreenScreen,
    catFilters.hasMixingDesk,
    catFilters.hasMicrophones,
    catFilters.parkingCovered,
    catFilters.parkingSecured,
    catFilters.hasEVCharger,
    catFilters.storageClimatized,
    catFilters.storageSecured,
    catFilters.minStorageSize > 0,
  ].filter(Boolean).length;

  // Total voyageurs pour le champ caché
  const totalGuests = adults + children;
  const guestsLabel = (() => {
    const parts: string[] = [];
    if (adults > 0) parts.push(`${adults} adulte${adults > 1 ? "s" : ""}`);
    if (children > 0) parts.push(`${children} enfant${children > 1 ? "s" : ""}`);
    if (pets > 0) parts.push(`${pets} animal${pets > 1 ? "x" : ""}`);
    return parts.length > 0 ? parts.join(", ") : null;
  })();

  const t = getDictionaryForLocale(locale);
  const fb = t.components.filtersBar;

  // Fermer le dropdown tri au clic extérieur
  useEffect(() => {
    if (!isSortOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSortOpen]);

  // Fermer le dropdown voyageurs au clic extérieur
  useEffect(() => {
    if (!isGuestsOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (guestsRef.current && !guestsRef.current.contains(e.target as Node)) {
        setIsGuestsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isGuestsOpen]);

  // Handler pour la sélection d'une ville
  const handleLocationSelect = (place: LocationAutocompletePlace) => {
    setSelectedCity(place.mainText);
    // Déterminer le pays à partir de la description
    const desc = place.description.toLowerCase();
    if (desc.includes("canada")) {
      setSelectedCountry("Canada");
    } else if (desc.includes("france")) {
      setSelectedCountry("France");
    }
  };

  return (
    <section className="space-y-3">
      {/* ⚠️ Un seul form GET pour tout (barre + gros pop-up filtres) */}
      <form method="GET" className="space-y-3">
        {/* ====== BARRE PRINCIPALE ====== */}
        <div className="rounded-3xl border border-gray-200 bg-white px-3 py-3 shadow-sm lg:px-5 lg:py-4">
          <div className="flex flex-col gap-0 lg:flex-row lg:items-center lg:divide-x lg:divide-gray-100">
            {/* Destination */}
            <div className="flex flex-[1.4] items-center gap-3 py-2 lg:py-0 lg:pr-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <MapPinIcon className="h-4 w-4 text-gray-600" />
              </div>
              <LocationAutocomplete
                value={destination}
                onChange={setDestination}
                onSelect={handleLocationSelect}
                placeholder={fb.locationPlaceholder}
                label={fb.whereGoing}
                compact
              />
              <input type="hidden" name="q" value={destination} />
              {selectedCity && <input type="hidden" name="city" value={selectedCity} />}
              {selectedCountry && <input type="hidden" name="country" value={selectedCountry} />}
            </div>

            {/* Dates + Heures */}
            <div className="flex flex-[1.2] items-stretch py-2 lg:py-0 lg:px-4">
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
              <input type="hidden" name="startDate" value={startDate} />
              <input type="hidden" name="endDate" value={endDate} />
              <input type="hidden" name="startTime" value={startTime} />
              <input type="hidden" name="endTime" value={endTime} />
            </div>

            {/* Voyageurs + Rechercher */}
            <div className="relative flex flex-[0.8] items-center gap-2 py-2 lg:py-0 lg:pl-4 min-w-0" ref={guestsRef}>
              <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 sm:flex">
                <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => setIsGuestsOpen((v) => !v)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {fb.travelers}
                </p>
                <p className="truncate text-sm text-gray-900">
                  {guestsLabel ?? <span className="text-gray-400">{fb.travelersPlaceholder}</span>}
                </p>
              </button>

              <input type="hidden" name="guests" value={totalGuests > 0 ? String(totalGuests) : ""} />

              {/* Bouton Rechercher */}
              <button
                type="submit"
                className="shrink-0 inline-flex h-10 items-center justify-center rounded-full bg-black px-5 text-xs font-semibold text-white shadow-sm hover:bg-gray-900 transition"
              >
                {fb.searchButton}
              </button>

              {/* Dropdown voyageurs */}
              {isGuestsOpen && (
                <div className="absolute left-0 top-full z-[60] mt-2 w-80 rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
                  {/* Adultes */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Adultes</p>
                      <p className="text-xs text-gray-500">13 ans et plus</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setAdults((v) => Math.max(1, v - 1))}
                        disabled={adults <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-gray-900 disabled:opacity-30"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                      </button>
                      <span className="w-5 text-center text-sm font-medium">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults((v) => Math.min(16, v + 1))}
                        disabled={adults + children >= 16}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-gray-900 disabled:opacity-30"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Enfants */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Enfants</p>
                      <p className="text-xs text-gray-500">Jusqu&apos;à 12 ans</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setChildren((v) => Math.max(0, v - 1))}
                        disabled={children <= 0}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-gray-900 disabled:opacity-30"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                      </button>
                      <span className="w-5 text-center text-sm font-medium">{children}</span>
                      <button
                        type="button"
                        onClick={() => setChildren((v) => Math.min(10, v + 1))}
                        disabled={adults + children >= 16}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-gray-900 disabled:opacity-30"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Animaux */}
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Animaux</p>
                      <p className="text-xs text-gray-500">Chiens, chats…</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPets((v) => Math.max(0, v - 1))}
                        disabled={pets <= 0}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-gray-900 disabled:opacity-30"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                      </button>
                      <span className="w-5 text-center text-sm font-medium">{pets}</span>
                      <button
                        type="button"
                        onClick={() => setPets((v) => Math.min(5, v + 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:border-gray-900 disabled:opacity-30"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsGuestsOpen(false)}
                    className="mt-2 w-full rounded-xl bg-gray-900 py-2.5 text-xs font-medium text-white hover:bg-black"
                  >
                    Appliquer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ====== BARRE FILTRES STYLE AIRBNB ====== */}
        <div className="flex items-center gap-2">
          {/* Bouton Filtres avec badge dynamique */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition hover:border-gray-900 hover:bg-gray-50 ${
              activeFilterCount > 0
                ? "border-gray-900 bg-gray-900 text-white hover:bg-gray-800 hover:border-gray-800"
                : "border-gray-300 bg-white text-gray-800"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            {fb.filtersButton}
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-gray-900">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Séparateur */}
          <div className="h-6 w-px bg-gray-200" />

          {/* Trier par — bulle dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen((v) => !v)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition hover:border-gray-900 hover:bg-gray-50 ${
                isSortOpen ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-800"
              }`}
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M6 12h12M9 17h6" />
              </svg>
              <span>
                {[
                  { value: "newest", label: fb.sortNewest },
                  { value: "price_asc", label: fb.sortPriceAsc },
                  { value: "price_desc", label: fb.sortPriceDesc },
                  { value: "rating_desc", label: fb.sortBestRated },
                ].find((o) => o.value === currentSort)?.label ?? fb.sortNewest}
              </span>
              <svg className={`h-3 w-3 shrink-0 transition-transform ${isSortOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Champ caché pour le submit du form */}
            <input type="hidden" name="sort" value={currentSort} />

            {isSortOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                {[
                  { value: "newest", label: fb.sortNewest },
                  { value: "price_asc", label: fb.sortPriceAsc },
                  { value: "price_desc", label: fb.sortPriceDesc },
                  { value: "rating_desc", label: fb.sortBestRated },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setCurrentSort(opt.value);
                      setIsSortOpen(false);
                      // Soumettre le form après le prochain render
                      setTimeout(() => {
                        const form = sortRef.current?.closest("form");
                        if (form) form.requestSubmit();
                      }, 0);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-3 text-sm transition hover:bg-gray-50 ${
                      currentSort === opt.value ? "font-semibold text-gray-900" : "text-gray-700"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {currentSort === opt.value && (
                      <svg className="h-4 w-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ====== POP-UP DE FILTRES ====== */}
        {isFilterOpen && isMobile && (
          <MobileFiltersModal
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
          />
        )}
        {isFilterOpen && !isMobile && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/30 p-0 sm:p-4">
            <div className="relative w-full max-w-3xl max-h-[90vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between border-b px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  aria-label="Fermer les filtres"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 className="text-sm font-semibold">{fb.filtersTitle}</h2>
                <div className="w-8" />
              </div>

              {/* Contenu scrollable */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-8">

                {/* ── Type d'espace + filtres spécifiques ── */}
                <CategoryFilters filters={catFilters} onChange={patchCatFilters} />

                {/* ── Prix ── */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-gray-900">{fb.priceScale2}</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-[11px] text-gray-500">{fb.minimum}</span>
                      <input
                        type="number"
                        min={0}
                        value={fMinPrice}
                        onChange={(e) => setFMinPrice(e.target.value)}
                        placeholder={fb.minPlaceholder}
                        className="h-9 rounded-xl border border-gray-300 bg-gray-50 px-3 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                    <span className="mt-5 text-gray-400">–</span>
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-[11px] text-gray-500">{fb.maximum}</span>
                      <input
                        type="number"
                        min={0}
                        value={fMaxPrice}
                        onChange={(e) => setFMaxPrice(e.target.value)}
                        placeholder={fb.maxPlaceholder}
                        className="h-9 rounded-xl border border-gray-300 bg-gray-50 px-3 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>
                </section>

                {/* ── Note minimale ── */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-gray-900">{fb.minRating}</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "", label: fb.allRatings },
                      { value: "3", label: fb.rating3Plus },
                      { value: "4", label: fb.rating4Plus },
                      { value: "5", label: fb.rating5Only },
                    ].map((opt) => (
                      <button
                        key={opt.value || "all"}
                        type="button"
                        onClick={() => setFMinRating(opt.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          fMinRating === opt.value
                            ? "border-gray-700 bg-gray-100 text-gray-900 ring-1 ring-gray-700"
                            : "border-gray-300 bg-white text-gray-800 hover:border-gray-500"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* ── Options de réservation ── */}
                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-gray-900">{fb.bookingOptions}</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFInstantBook((v) => !v)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        fInstantBook
                          ? "border-gray-700 bg-gray-100 text-gray-900 ring-1 ring-gray-700"
                          : "border-gray-300 bg-white text-gray-800 hover:border-gray-500"
                      }`}
                    >
                      {fb.instantBooking}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFHasPhoto((v) => !v)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        fHasPhoto
                          ? "border-gray-700 bg-gray-100 text-gray-900 ring-1 ring-gray-700"
                          : "border-gray-300 bg-white text-gray-800 hover:border-gray-500"
                      }`}
                    >
                      {fb.onlyWithPhotos}
                    </button>
                  </div>
                </section>
              </div>

              {/* Champs cachés pour le form GET */}
              <input type="hidden" name="minPrice" value={fMinPrice} />
              <input type="hidden" name="maxPrice" value={fMaxPrice} />
              <input type="hidden" name="minRating" value={fMinRating} />
              <input type="hidden" name="hasPhoto" value={fHasPhoto ? "1" : ""} />
              <input type="hidden" name="type" value={catFilters.spaceType} />
              {catFilters.spaceSubtype && <input type="hidden" name="spaceSubtype" value={catFilters.spaceSubtype} />}
              {catFilters.minBedrooms > 0 && <input type="hidden" name="minBedrooms" value={String(catFilters.minBedrooms)} />}
              {catFilters.minBeds > 0 && <input type="hidden" name="minBeds" value={String(catFilters.minBeds)} />}
              {catFilters.minBathrooms > 0 && <input type="hidden" name="minBathrooms" value={String(catFilters.minBathrooms)} />}
              {catFilters.minDesks > 0 && <input type="hidden" name="minDesks" value={String(catFilters.minDesks)} />}
              {catFilters.minCapacity > 0 && <input type="hidden" name="minCapacity" value={String(catFilters.minCapacity)} />}
              {catFilters.minParkingSpaces > 1 && <input type="hidden" name="minParkingSpaces" value={String(catFilters.minParkingSpaces)} />}
              {catFilters.minStorageSize > 0 && <input type="hidden" name="minStorageSize" value={String(catFilters.minStorageSize)} />}
              {catFilters.hasGarden && <input type="hidden" name="hasGarden" value="1" />}
              {catFilters.hasPool && <input type="hidden" name="hasPool" value="1" />}
              {catFilters.hasTerrace && <input type="hidden" name="hasTerrace" value="1" />}
              {catFilters.hasSpa && <input type="hidden" name="hasSpa" value="1" />}
              {catFilters.petsAllowed && <input type="hidden" name="petsAllowed" value="1" />}
              {catFilters.smokingAllowed && <input type="hidden" name="smokingAllowed" value="1" />}
              {catFilters.hasProjector && <input type="hidden" name="hasProjector" value="1" />}
              {catFilters.hasWhiteboard && <input type="hidden" name="hasWhiteboard" value="1" />}
              {catFilters.hasVideoConf && <input type="hidden" name="hasVideoConf" value="1" />}
              {catFilters.hasKitchen && <input type="hidden" name="hasKitchen" value="1" />}
              {catFilters.hasReception && <input type="hidden" name="hasReception" value="1" />}
              {catFilters.hasCatering && <input type="hidden" name="hasCatering" value="1" />}
              {catFilters.hasStage && <input type="hidden" name="hasStage" value="1" />}
              {catFilters.hasSoundSystem && <input type="hidden" name="hasSoundSystem" value="1" />}
              {catFilters.hasLighting && <input type="hidden" name="hasLighting" value="1" />}
              {catFilters.hasSoundproofing && <input type="hidden" name="hasSoundproofing" value="1" />}
              {catFilters.hasGreenScreen && <input type="hidden" name="hasGreenScreen" value="1" />}
              {catFilters.hasMixingDesk && <input type="hidden" name="hasMixingDesk" value="1" />}
              {catFilters.hasMicrophones && <input type="hidden" name="hasMicrophones" value="1" />}
              {catFilters.parkingCovered && <input type="hidden" name="parkingCovered" value="1" />}
              {catFilters.parkingSecured && <input type="hidden" name="parkingSecured" value="1" />}
              {catFilters.hasEVCharger && <input type="hidden" name="hasEVCharger" value="1" />}
              {catFilters.storageClimatized && <input type="hidden" name="storageClimatized" value="1" />}
              {catFilters.storageSecured && <input type="hidden" name="storageSecured" value="1" />}
              {fInstantBook && <input type="hidden" name="instantBook" value="1" />}

              {/* Footer */}
              <div className="flex items-center justify-between gap-4 border-t px-6 py-4">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-medium text-gray-600 underline-offset-2 hover:underline"
                >
                  {fb.clearAll}
                </button>
                <button
                  type="submit"
                  onClick={() => setIsFilterOpen(false)}
                  className="inline-flex items-center justify-center rounded-full bg-black px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-gray-900"
                >
                  {fb.showResults}
                  {activeFilterCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
