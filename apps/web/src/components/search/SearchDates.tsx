"use client";

import { useState } from "react";

type BookingMode = "days" | "hours";

type SearchDatesProps = {
  bookingMode: BookingMode;
  startDate: string;
  endDate: string;
  selectedTime: string;
  endTime: string;
  onBookingModeChange: (mode: BookingMode) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
};

const TIME_OPTIONS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
];

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const MONTHS_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const DAYS_OF_WEEK = ["L", "M", "M", "J", "V", "S", "D"];

export function SearchDates({
  bookingMode,
  startDate,
  endDate,
  selectedTime,
  endTime,
  onBookingModeChange,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
}: SearchDatesProps) {
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectingEnd, setSelectingEnd] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const adjustedStartingDay = startingDay === 0 ? 6 : startingDay - 1;
    return { daysInMonth, startingDay: adjustedStartingDay, year, month };
  };

  const formatDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const isDateDisabled = (dateStr: string) => {
    return dateStr < today;
  };

  const isDateInRange = (dateStr: string) => {
    if (!startDate || !endDate) return false;
    return dateStr > startDate && dateStr < endDate;
  };

  const handleDateClick = (dateStr: string) => {
    if (isDateDisabled(dateStr)) return;

    if (!startDate || (startDate && endDate) || (!selectingEnd && dateStr < startDate)) {
      onStartDateChange(dateStr);
      onEndDateChange("");
      setSelectingEnd(true);
    } else if (selectingEnd && dateStr > startDate) {
      onEndDateChange(dateStr);
      setSelectingEnd(false);
    } else if (dateStr === startDate) {
      onStartDateChange("");
      onEndDateChange("");
      setSelectingEnd(false);
    }
  };

  const goToPreviousMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const canGoPrevious = () => {
    const currentMonth = new Date();
    return calendarMonth.getFullYear() > currentMonth.getFullYear() ||
      (calendarMonth.getFullYear() === currentMonth.getFullYear() && calendarMonth.getMonth() > currentMonth.getMonth());
  };

  const getNextMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
  };

  return (
    <div className="space-y-3">
      {/* Toggle Jour / Heure */}
      <div className="flex items-center justify-center gap-1 p-1 bg-gray-100 rounded-full w-fit mx-auto">
        <button
          onClick={() => onBookingModeChange("days")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
            bookingMode === "days" ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          À la journée
        </button>
        <button
          onClick={() => onBookingModeChange("hours")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
            bookingMode === "hours" ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          À l&apos;heure
        </button>
      </div>

      {/* Calendriers - 2 mois côte à côte */}
      <div className="flex gap-2">
        {/* Navigation gauche */}
        <button
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious()}
          className="p-1 self-start mt-6 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Mois précédent"
        >
          <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Mois 1 */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 text-center mb-1">
            {MONTHS_SHORT[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
          </p>
          <div className="grid grid-cols-7 gap-0">
            {DAYS_OF_WEEK.map((day, i) => (
              <div key={`d1-${i}`} className="py-1 text-center text-[10px] font-medium text-gray-400">
                {day}
              </div>
            ))}
            {(() => {
              const { daysInMonth, startingDay, year, month } = getDaysInMonth(calendarMonth);
              const days = [];
              for (let i = 0; i < startingDay; i++) {
                days.push(<div key={`e1-${i}`} className="h-7" />);
              }
              for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = formatDateString(year, month, day);
                const isDisabled = isDateDisabled(dateStr);
                const isStart = dateStr === startDate;
                const isEnd = dateStr === endDate;
                const isInRange = isDateInRange(dateStr);
                const isToday = dateStr === today;
                days.push(
                  <button
                    key={day}
                    onClick={() => handleDateClick(dateStr)}
                    disabled={isDisabled}
                    className={`h-7 w-full rounded-full text-[11px] font-medium transition-all
                      ${isDisabled ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100 cursor-pointer"}
                      ${isStart || isEnd ? "bg-gray-900 text-white hover:bg-gray-800" : ""}
                      ${isInRange ? "bg-gray-100" : ""}
                      ${isToday && !isStart && !isEnd ? "ring-1 ring-gray-900" : ""}
                    `}
                  >
                    {day}
                  </button>
                );
              }
              return days;
            })()}
          </div>
        </div>

        {/* Mois 2 */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 text-center mb-1">
            {MONTHS_SHORT[getNextMonth(calendarMonth).getMonth()]} {getNextMonth(calendarMonth).getFullYear()}
          </p>
          <div className="grid grid-cols-7 gap-0">
            {DAYS_OF_WEEK.map((day, i) => (
              <div key={`d2-${i}`} className="py-1 text-center text-[10px] font-medium text-gray-400">
                {day}
              </div>
            ))}
            {(() => {
              const nextMonth = getNextMonth(calendarMonth);
              const { daysInMonth, startingDay, year, month } = getDaysInMonth(nextMonth);
              const days = [];
              for (let i = 0; i < startingDay; i++) {
                days.push(<div key={`e2-${i}`} className="h-7" />);
              }
              for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = formatDateString(year, month, day);
                const isDisabled = isDateDisabled(dateStr);
                const isStart = dateStr === startDate;
                const isEnd = dateStr === endDate;
                const isInRange = isDateInRange(dateStr);
                const isToday = dateStr === today;
                days.push(
                  <button
                    key={day}
                    onClick={() => handleDateClick(dateStr)}
                    disabled={isDisabled}
                    className={`h-7 w-full rounded-full text-[11px] font-medium transition-all
                      ${isDisabled ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100 cursor-pointer"}
                      ${isStart || isEnd ? "bg-gray-900 text-white hover:bg-gray-800" : ""}
                      ${isInRange ? "bg-gray-100" : ""}
                      ${isToday && !isStart && !isEnd ? "ring-1 ring-gray-900" : ""}
                    `}
                  >
                    {day}
                  </button>
                );
              }
              return days;
            })()}
          </div>
        </div>

        {/* Navigation droite */}
        <button
          onClick={goToNextMonth}
          className="p-1 self-start mt-6 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Mois suivant"
        >
          <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Sélection d'heures (si mode heure) */}
      {bookingMode === "hours" && startDate && (
        <div className="flex gap-3 pt-2">
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-gray-500 mb-1">Début</label>
            <select
              value={selectedTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Heure</option>
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-gray-500 mb-1">Fin</label>
            <select
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Heure</option>
              {TIME_OPTIONS.filter(t => !selectedTime || t > selectedTime).map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Raccourcis */}
      {bookingMode === "hours" && (
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
                if (!startDate) onStartDateChange(today);
                onStartTimeChange("09:00");
                const endH = 9 + slot.hours;
                onEndTimeChange(`${endH.toString().padStart(2, "0")}:00`);
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
