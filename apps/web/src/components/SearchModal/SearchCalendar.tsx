"use client";

import {
  DAYS_OF_WEEK, MONTHS, MONTHS_SHORT, TIME_OPTIONS,
  getDaysInMonth, formatDateString, getNextMonth,
} from "./useSearchModal";

type SearchCalendarProps = {
  calendarMonth: Date;
  startDate: string;
  endDate: string;
  today: string;
  bookingMode: "days" | "hours";
  selectedTime: string;
  endTime: string;
  compact?: boolean; // mobile = true, desktop = false
  onDateClick: (dateStr: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoPrev: () => boolean;
  isDateDisabled: (dateStr: string) => boolean;
  isDateInRange: (dateStr: string) => boolean;
  onBookingModeChange: (mode: "days" | "hours") => void;
  onTimeChange: (start: string, end: string) => void;
};

function CalendarGrid({
  month,
  startDate,
  endDate,
  today,
  onDateClick,
  isDateDisabled,
  isDateInRange,
  compact,
  prefix,
}: {
  month: Date;
  startDate: string;
  endDate: string;
  today: string;
  onDateClick: (d: string) => void;
  isDateDisabled: (d: string) => boolean;
  isDateInRange: (d: string) => boolean;
  compact: boolean;
  prefix: string;
}) {
  const { daysInMonth, startingDay, year, month: m } = getDaysInMonth(month);
  const days = [];

  for (let i = 0; i < startingDay; i++) {
    days.push(<div key={`${prefix}-e-${i}`} className={compact ? "h-10" : "h-7"} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateString(year, m, day);
    const isDisabled = isDateDisabled(dateStr);
    const isStart = dateStr === startDate;
    const isEnd = dateStr === endDate;
    const isInRange = isDateInRange(dateStr);
    const isToday = dateStr === today;

    days.push(
      <button
        key={`${prefix}-${day}`}
        onClick={() => onDateClick(dateStr)}
        disabled={isDisabled}
        className={`${compact ? "h-10" : "h-7"} w-full ${compact ? "rounded-xl" : "rounded-full"} ${compact ? "text-sm" : "text-[11px]"} font-medium transition-all
          ${isDisabled ? (compact ? "text-gray-300" : "text-gray-300 cursor-not-allowed") : (compact ? "" : "hover:bg-gray-100 cursor-pointer")}
          ${isStart || isEnd ? (compact ? "bg-gray-900 text-white" : "bg-gray-900 text-white hover:bg-gray-800") : ""}
          ${isInRange ? (compact ? "bg-gray-200" : "bg-gray-100") : ""}
          ${!isDisabled && !isStart && !isEnd && !isInRange && compact ? "hover:bg-gray-200" : ""}
          ${isToday && !isStart && !isEnd ? (compact ? "ring-2 ring-gray-900 ring-inset" : "ring-1 ring-gray-900") : ""}
        `}
      >
        {day}
      </button>
    );
  }

  return <>{days}</>;
}

export default function SearchCalendar({
  calendarMonth, startDate, endDate, today,
  bookingMode, selectedTime, endTime, compact = false,
  onDateClick, onPrevMonth, onNextMonth, canGoPrev,
  isDateDisabled, isDateInRange,
  onBookingModeChange, onTimeChange,
}: SearchCalendarProps) {
  const nextMonth = getNextMonth(calendarMonth);

  return (
    <div className="space-y-3">
      {/* Toggle Jour/Heure */}
      <div className={`flex p-1 bg-gray-100 ${compact ? "rounded-xl" : "rounded-full w-fit mx-auto"}`}>
        <button
          onClick={() => onBookingModeChange("days")}
          className={`${compact ? "flex-1" : "px-4"} py-${compact ? "2" : "1.5"} rounded-${compact ? "lg" : "full"} text-${compact ? "sm" : "xs"} font-medium transition-all ${
            bookingMode === "days" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
          }`}
        >
          À la journée
        </button>
        <button
          onClick={() => onBookingModeChange("hours")}
          className={`${compact ? "flex-1" : "px-4"} py-${compact ? "2" : "1.5"} rounded-${compact ? "lg" : "full"} text-${compact ? "sm" : "xs"} font-medium transition-all ${
            bookingMode === "hours" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
          }`}
        >
          À l&apos;heure
        </button>
      </div>

      {compact ? (
        // Mobile: single month
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onPrevMonth}
              disabled={!canGoPrev()}
              aria-label="Mois précédent"
              className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-30 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-900">
              {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
            </span>
            <button
              onClick={onNextMonth}
              aria-label="Mois suivant"
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((day, i) => (
              <div key={i} className="py-2 text-center text-xs font-medium text-gray-500">{day}</div>
            ))}
            <CalendarGrid
              month={calendarMonth} startDate={startDate} endDate={endDate}
              today={today} onDateClick={onDateClick}
              isDateDisabled={isDateDisabled} isDateInRange={isDateInRange}
              compact={true} prefix="m"
            />
          </div>
        </div>
      ) : (
        // Desktop: two months side by side
        <div className="flex gap-2">
          <button
            onClick={onPrevMonth}
            disabled={!canGoPrev()}
            className="p-1 self-start mt-6 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Mois précédent"
          >
            <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {[calendarMonth, nextMonth].map((month, idx) => (
            <div key={idx} className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 text-center mb-1">
                {MONTHS_SHORT[month.getMonth()]} {month.getFullYear()}
              </p>
              <div className="grid grid-cols-7 gap-0">
                {DAYS_OF_WEEK.map((day, i) => (
                  <div key={`d${idx}-${i}`} className="py-1 text-center text-[10px] font-medium text-gray-500">{day}</div>
                ))}
                <CalendarGrid
                  month={month} startDate={startDate} endDate={endDate}
                  today={today} onDateClick={onDateClick}
                  isDateDisabled={isDateDisabled} isDateInRange={isDateInRange}
                  compact={false} prefix={`m${idx}`}
                />
              </div>
            </div>
          ))}

          <button
            onClick={onNextMonth}
            className="p-1 self-start mt-6 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Mois suivant"
          >
            <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Sélection d'heures */}
      {bookingMode === "hours" && startDate && (
        <div className={`${compact ? "mt-4 grid grid-cols-2 gap-3" : "flex gap-3 pt-2"}`}>
          <div className={compact ? "" : "flex-1"}>
            <label className={`block ${compact ? "text-xs" : "text-[10px]"} font-medium text-gray-500 mb-${compact ? "2" : "1"}`}>
              {compact ? "Heure de début" : "Début"}
            </label>
            <select
              value={selectedTime}
              onChange={(e) => onTimeChange(e.target.value, endTime)}
              className={`w-full ${compact ? "px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm" : "px-2 py-1.5 border border-gray-200 rounded-lg text-xs"} focus:outline-none focus:${compact ? "border-gray-900" : "ring-1 focus:ring-gray-900"} transition-all`}
            >
              <option value="">{compact ? "Choisir" : "Heure"}</option>
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          <div className={compact ? "" : "flex-1"}>
            <label className={`block ${compact ? "text-xs" : "text-[10px]"} font-medium text-gray-500 mb-${compact ? "2" : "1"}`}>
              {compact ? "Heure de fin" : "Fin"}
            </label>
            <select
              value={endTime}
              onChange={(e) => onTimeChange(selectedTime, e.target.value)}
              className={`w-full ${compact ? "px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm" : "px-2 py-1.5 border border-gray-200 rounded-lg text-xs"} focus:outline-none focus:${compact ? "border-gray-900" : "ring-1 focus:ring-gray-900"} transition-all`}
            >
              <option value="">{compact ? "Choisir" : "Heure"}</option>
              {TIME_OPTIONS.filter(t => !selectedTime || t > selectedTime).map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Raccourcis heures (desktop only) */}
      {!compact && bookingMode === "hours" && (
        <div className="flex flex-wrap gap-1">
          {[
            { label: "2h", hours: 2 },
            { label: "4h", hours: 4 },
            { label: "Demi-journée", hours: 5 },
            { label: "Journée", hours: 9 },
          ].map((slot) => (
            <button
              key={slot.label}
              onClick={() => {
                onTimeChange("09:00", `${(9 + slot.hours).toString().padStart(2, "0")}:00`);
              }}
              className="px-2 py-1 border border-gray-200 hover:border-gray-400 rounded-full text-[10px] font-medium text-gray-600 transition-colors"
            >
              {slot.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
