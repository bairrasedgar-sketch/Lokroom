// apps/web/src/components/DateTimePicker.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarDaysIcon, ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";

type DateTimePickerProps = {
  // Labels
  arrivalLabel?: string;
  departureLabel?: string;
  arrivalTimeLabel?: string;
  departureTimeLabel?: string;
  // Values
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  // Callbacks
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  onStartTimeChange?: (time: string) => void;
  onEndTimeChange?: (time: string) => void;
  // Config
  showTimePicker?: boolean;
  minDate?: string;
};

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

export function DateTimePicker({
  arrivalLabel = "Arrivée",
  departureLabel = "Départ",
  arrivalTimeLabel = "Heure d'arrivée",
  departureTimeLabel = "Heure de départ",
  startDate = "",
  endDate = "",
  startTime = "14:00",
  endTime = "11:00",
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  showTimePicker = true,
  minDate,
}: DateTimePickerProps) {
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

  // Format date pour affichage
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

  // Champs cachés pour le formulaire
  const hiddenInputs = (
    <>
      <input type="hidden" name="startDate" value={startDate} />
      <input type="hidden" name="endDate" value={endDate} />
      {showTimePicker && (
        <>
          <input type="hidden" name="startTime" value={startTime} />
          <input type="hidden" name="endTime" value={endTime} />
        </>
      )}
    </>
  );

  return (
    <div ref={containerRef} className="relative">
      {hiddenInputs}

      {/* Bouton déclencheur */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md"
      >
        <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
        <div className="flex flex-1 items-center gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
              {arrivalLabel}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {formatDateDisplay(startDate)}
              {showTimePicker && startTime && (
                <span className="ml-1 text-gray-500">· {startTime}</span>
              )}
            </p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
              {departureLabel}
            </p>
            <p className="text-sm font-medium text-gray-900">
              {formatDateDisplay(endDate)}
              {showTimePicker && endTime && (
                <span className="ml-1 text-gray-500">· {endTime}</span>
              )}
            </p>
          </div>
        </div>
      </button>

      {/* Pop-up de sélection */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[360px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:w-auto">
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
              {showTimePicker && (
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
              )}
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
                      {arrivalLabel}
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      min={minDate}
                      onChange={(e) => onStartDateChange?.(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  {/* Date de départ */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                      {departureLabel}
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || minDate}
                      onChange={(e) => onEndDateChange?.(e.target.value)}
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
                        const today = new Date();
                        let start = new Date();
                        let end = new Date();

                        if (shortcut.days === "weekend") {
                          // Prochain samedi
                          const dayOfWeek = today.getDay();
                          const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
                          start = new Date(today);
                          start.setDate(today.getDate() + daysUntilSaturday);
                          end = new Date(start);
                          end.setDate(start.getDate() + 1);
                        } else {
                          start.setDate(today.getDate() + (shortcut.days as number));
                          end.setDate(start.getDate() + 1);
                        }

                        const formatDate = (d: Date) => d.toISOString().split("T")[0];
                        onStartDateChange?.(formatDate(start));
                        onEndDateChange?.(formatDate(end));
                      }}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition hover:border-gray-900 hover:bg-gray-50"
                    >
                      {shortcut.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "times" && showTimePicker && (
              <div className="space-y-4">
                {/* Heure d'arrivée */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    {arrivalTimeLabel}
                  </label>
                  <div className="flex gap-2">
                    {/* Heures */}
                    <div className="flex-1">
                      <p className="mb-1 text-[10px] text-gray-400">Heure</p>
                      <div className="grid max-h-40 grid-cols-4 gap-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
                        {HOURS.map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => {
                              onStartTimeChange?.(formatTime(h, startTimeObj.minute));
                            }}
                            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
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
                    {/* Minutes */}
                    <div className="w-24">
                      <p className="mb-1 text-[10px] text-gray-400">Minutes</p>
                      <div className="grid grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-gray-50 p-2">
                        {MINUTES.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              onStartTimeChange?.(formatTime(startTimeObj.hour, m));
                            }}
                            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
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
                    {departureTimeLabel}
                  </label>
                  <div className="flex gap-2">
                    {/* Heures */}
                    <div className="flex-1">
                      <p className="mb-1 text-[10px] text-gray-400">Heure</p>
                      <div className="grid max-h-40 grid-cols-4 gap-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
                        {HOURS.map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => {
                              onEndTimeChange?.(formatTime(h, endTimeObj.minute));
                            }}
                            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
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
                    {/* Minutes */}
                    <div className="w-24">
                      <p className="mb-1 text-[10px] text-gray-400">Minutes</p>
                      <div className="grid grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-gray-50 p-2">
                        {MINUTES.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              onEndTimeChange?.(formatTime(endTimeObj.hour, m));
                            }}
                            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
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

                {/* Heures courantes */}
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
                          onStartTimeChange?.(preset.start);
                          onEndTimeChange?.(preset.end);
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
                onStartDateChange?.("");
                onEndDateChange?.("");
                onStartTimeChange?.("14:00");
                onEndTimeChange?.("11:00");
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

export default DateTimePicker;
