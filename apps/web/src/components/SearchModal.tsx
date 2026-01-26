"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LocationAutocomplete, { type LocationAutocompletePlace } from "./LocationAutocomplete";

type SearchHistory = {
  id: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  guests?: number;
  createdAt: Date;
};

type PopularDestination = {
  city: string;
  country: string;
  image: string;
};

const POPULAR_DESTINATIONS: PopularDestination[] = [
  // Paris - Tour Eiffel
  { city: "Paris", country: "France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop&q=80" },
  // Montréal - Vieux-Port et skyline
  { city: "Montréal", country: "Canada", image: "https://images.unsplash.com/photo-1519178614-68673b201f36?w=400&h=400&fit=crop&q=80" },
  // Lyon - Vieux Lyon et Saône
  { city: "Lyon", country: "France", image: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400&h=400&fit=crop&q=80" },
  // Marseille - Notre-Dame de la Garde
  { city: "Marseille", country: "France", image: "https://images.unsplash.com/photo-1602777924012-f8664ffeed27?w=400&h=400&fit=crop&q=80" },
  // Toronto - Skyline avec CN Tower
  { city: "Toronto", country: "Canada", image: "https://images.unsplash.com/photo-1507992781348-310259076fe0?w=400&h=400&fit=crop&q=80" },
  // Bordeaux - Place de la Bourse avec miroir d'eau (Pexels)
  { city: "Bordeaux", country: "France", image: "https://images.pexels.com/photos/2549018/pexels-photo-2549018.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop" },
];

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "destination" | "dates" | "guests";
};

export default function SearchModal({ isOpen, onClose, initialTab = "destination" }: SearchModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const modalRef = useRef<HTMLDivElement>(null);

  // Détecter si on est sur mobile pour éviter l'autoFocus du clavier
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  const [activeTab, setActiveTab] = useState<"destination" | "dates" | "guests">(initialTab);
  const [destination, setDestination] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Voyageurs par type
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  // Total des voyageurs (hors animaux)
  const totalGuests = adults + children;

  // État pour le calendrier
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectingEnd, setSelectingEnd] = useState(false);

  // Mode de réservation : jour ou heure
  const [bookingMode, setBookingMode] = useState<"days" | "hours">("days");
  const [selectedTime, setSelectedTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // Fonctions utilitaires pour le calendrier
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Dimanche

    // Ajuster pour commencer par Lundi (0 = Lundi)
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
      // Nouvelle sélection ou reset
      setStartDate(dateStr);
      setEndDate("");
      setSelectingEnd(true);
    } else if (selectingEnd && dateStr > startDate) {
      // Sélection de la date de fin
      setEndDate(dateStr);
      setSelectingEnd(false);
    } else if (dateStr === startDate) {
      // Clic sur la même date = reset
      setStartDate("");
      setEndDate("");
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

  const DAYS_OF_WEEK = ["L", "M", "M", "J", "V", "S", "D"];
  const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const MONTHS_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

  // Options d'heures
  const TIME_OPTIONS = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
  ];

  // Charger l'historique de recherche si connecté
  useEffect(() => {
    if (session?.user && isOpen) {
      fetch("/api/search-history")
        .then((res) => res.ok ? res.json() : [])
        .then((data) => setSearchHistory(data))
        .catch(() => setSearchHistory([]));
    }
  }, [session, isOpen]);

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Fermer avec Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSearch = async () => {
    const params = new URLSearchParams();

    if (destination) params.set("q", destination);
    if (selectedCity) params.set("city", selectedCity);
    if (selectedCountry) params.set("country", selectedCountry);
    if (startDate) params.set("startDate", startDate);
    if (bookingMode === "days" && endDate) params.set("endDate", endDate);
    if (bookingMode === "hours") {
      params.set("mode", "hourly");
      if (selectedTime) params.set("startTime", selectedTime);
      if (endTime) params.set("endTime", endTime);
    }
    if (totalGuests > 1) params.set("guests", totalGuests.toString());
    if (adults > 1) params.set("adults", adults.toString());
    if (children > 0) params.set("children", children.toString());
    if (pets > 0) params.set("pets", pets.toString());

    // Sauvegarder dans l'historique si connecté
    if (session?.user && destination) {
      try {
        await fetch("/api/search-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destination, startDate, endDate, guests: totalGuests }),
        });
      } catch (e) {
        console.error("Failed to save search history:", e);
      }
    }

    onClose();
    router.push(`/listings?${params.toString()}`);
  };

  // Handler pour la sélection d'une ville via autocomplete
  const handleLocationSelect = (place: LocationAutocompletePlace) => {
    setSelectedCity(place.mainText);
    // Déterminer le pays à partir de la description
    const desc = place.description.toLowerCase();
    if (desc.includes("canada")) {
      setSelectedCountry("Canada");
    } else if (desc.includes("france")) {
      setSelectedCountry("France");
    }
    setActiveTab("dates");
  };

  const handleHistorySelect = (history: SearchHistory) => {
    setDestination(history.destination);
    if (history.startDate) setStartDate(history.startDate);
    if (history.endDate) setEndDate(history.endDate);
    if (history.guests) setAdults(history.guests);
    setActiveTab("dates");
  };

  const clearHistory = async () => {
    try {
      await fetch("/api/search-history", { method: "DELETE" });
      setSearchHistory([]);
    } catch (e) {
      console.error("Failed to clear history:", e);
    }
  };

  if (!isOpen) return null;

  // ============================================
  // VERSION MOBILE - Interface Premium
  // ============================================
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[100] bg-white">
        {/* Header Mobile */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Fermer"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Rechercher</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto h-[calc(100vh-140px)] pb-4">
          {/* Section Destination */}
          <div className="px-4 py-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-rose-100 to-rose-50 rounded-2xl">
                <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Où allez-vous ?</h2>
                <p className="text-sm text-gray-500">Choisissez votre destination</p>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ville, région ou pays..."
                className="w-full px-4 py-4 pl-12 bg-gray-50 border-2 border-gray-100 rounded-2xl text-base placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:bg-white transition-all"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Destinations populaires avec images */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Destinations populaires</h3>
              <div className="grid grid-cols-2 gap-3">
                {POPULAR_DESTINATIONS.slice(0, 6).map((dest) => (
                  <button
                    key={dest.city}
                    onClick={() => {
                      setDestination(dest.city);
                      setSelectedCity(dest.city);
                      setSelectedCountry(dest.country);
                    }}
                    className={`relative overflow-hidden rounded-2xl aspect-[4/3] group ${
                      selectedCity === dest.city ? "ring-2 ring-gray-900" : ""
                    }`}
                  >
                    <img
                      src={dest.image}
                      alt={dest.city}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-semibold text-sm">{dest.city}</p>
                      <p className="text-white/80 text-xs">{dest.country}</p>
                    </div>
                    {selectedCity === dest.city && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Séparateur */}
          <div className="h-2 bg-gray-50" />

          {/* Section Dates */}
          <div className="px-4 py-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Quand ?</h2>
                <p className="text-sm text-gray-500">Sélectionnez vos dates</p>
              </div>
            </div>

            {/* Toggle Jour/Heure */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
              <button
                onClick={() => setBookingMode("days")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  bookingMode === "days" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                }`}
              >
                À la journée
              </button>
              <button
                onClick={() => setBookingMode("hours")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  bookingMode === "hours" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                }`}
              >
                À l&apos;heure
              </button>
            </div>

            {/* Sélection rapide de dates */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4">
              {[
                { label: "Aujourd'hui", date: today },
                { label: "Demain", date: new Date(Date.now() + 86400000).toISOString().split("T")[0] },
                { label: "Ce week-end", date: (() => {
                  const d = new Date();
                  d.setDate(d.getDate() + (6 - d.getDay()));
                  return d.toISOString().split("T")[0];
                })() },
                { label: "Semaine prochaine", date: (() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 7);
                  return d.toISOString().split("T")[0];
                })() },
              ].map((option) => (
                <button
                  key={option.label}
                  onClick={() => {
                    setStartDate(option.date);
                    if (bookingMode === "days") {
                      const end = new Date(option.date);
                      end.setDate(end.getDate() + 1);
                      setEndDate(end.toISOString().split("T")[0]);
                    }
                  }}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    startDate === option.date
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Calendrier simplifié mobile */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={goToPreviousMonth}
                  disabled={!canGoPrevious()}
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
                  onClick={goToNextMonth}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {DAYS_OF_WEEK.map((day, i) => (
                  <div key={i} className="py-2 text-center text-xs font-medium text-gray-400">
                    {day}
                  </div>
                ))}
                {(() => {
                  const { daysInMonth, startingDay, year, month } = getDaysInMonth(calendarMonth);
                  const days = [];
                  for (let i = 0; i < startingDay; i++) {
                    days.push(<div key={`empty-${i}`} className="h-10" />);
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
                        className={`h-10 w-full rounded-xl text-sm font-medium transition-all
                          ${isDisabled ? "text-gray-300" : ""}
                          ${isStart || isEnd ? "bg-gray-900 text-white" : ""}
                          ${isInRange ? "bg-gray-200" : ""}
                          ${!isDisabled && !isStart && !isEnd && !isInRange ? "hover:bg-gray-200" : ""}
                          ${isToday && !isStart && !isEnd ? "ring-2 ring-gray-900 ring-inset" : ""}
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

            {/* Sélection d'heures si mode horaire */}
            {bookingMode === "hours" && startDate && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Heure de début</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-all"
                  >
                    <option value="">Choisir</option>
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Heure de fin</label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-gray-900 transition-all"
                  >
                    <option value="">Choisir</option>
                    {TIME_OPTIONS.filter(t => !selectedTime || t > selectedTime).map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Séparateur */}
          <div className="h-2 bg-gray-50" />

          {/* Section Voyageurs */}
          <div className="px-4 py-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Qui voyage ?</h2>
                <p className="text-sm text-gray-500">Nombre de voyageurs</p>
              </div>
            </div>

            <div className="space-y-1">
              {/* Adultes */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Adultes</p>
                    <p className="text-xs text-gray-500">13 ans et plus</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    disabled={adults <= 1}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 transition-colors hover:border-gray-400"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-8 text-center text-lg font-semibold">{adults}</span>
                  <button
                    onClick={() => setAdults(Math.min(16, adults + 1))}
                    disabled={adults >= 16}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 transition-colors hover:border-gray-400"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Enfants */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Enfants</p>
                    <p className="text-xs text-gray-500">2 à 12 ans</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    disabled={children <= 0}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 transition-colors hover:border-gray-400"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-8 text-center text-lg font-semibold">{children}</span>
                  <button
                    onClick={() => setChildren(Math.min(10, children + 1))}
                    disabled={children >= 10}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 transition-colors hover:border-gray-400"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Animaux */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.744h-.753c-1.036 0-1.896.85-1.683 1.865A4.498 4.498 0 005.749 9.5c.566 0 1.105-.108 1.601-.306m-2.6-5.45c.396-.347.878-.586 1.403-.708M6.75 3.744V1.5m0 2.244a3.001 3.001 0 013 3V9.5m-3-5.756V1.5m0 2.244c-.525.122-1.007.361-1.403.708M17.25 3.744h.753c1.036 0 1.896.85 1.683 1.865a4.498 4.498 0 01-1.435 3.891 4.498 4.498 0 01-1.601-.306m2.6-5.45a3.001 3.001 0 00-1.403-.708m1.403.708V1.5m0 2.244a3.001 3.001 0 00-3 3V9.5m3-5.756V1.5m0 2.244c.525.122 1.007.361 1.403.708M12 12.75a3 3 0 110-6 3 3 0 010 6zm0 0v6.75m-3-3.75h6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Animaux</p>
                    <p className="text-xs text-gray-500">Chiens, chats...</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPets(Math.max(0, pets - 1))}
                    disabled={pets <= 0}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 transition-colors hover:border-gray-400"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-8 text-center text-lg font-semibold">{pets}</span>
                  <button
                    onClick={() => setPets(Math.min(5, pets + 1))}
                    disabled={pets >= 5}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-30 transition-colors hover:border-gray-400"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer fixe avec bouton recherche */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 safe-area-bottom">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setDestination("");
                setSelectedCity("");
                setSelectedCountry("");
                setStartDate("");
                setEndDate("");
                setAdults(1);
                setChildren(0);
                setPets(0);
              }}
              className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Effacer tout
            </button>
            <button
              onClick={handleSearch}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl text-base font-semibold shadow-lg shadow-gray-900/20 active:scale-[0.98] transition-transform"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Rechercher
            </button>
          </div>
        </div>

        <style jsx global>{`
          .safe-area-bottom {
            padding-bottom: max(12px, env(safe-area-inset-bottom));
          }
        `}</style>
      </div>
    );
  }

  // ============================================
  // VERSION DESKTOP - Interface existante
  // ============================================
  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-start justify-center pt-0 sm:pt-10 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] bg-white sm:rounded-3xl shadow-2xl overflow-hidden animate-modal-appear flex flex-col"
      >
        {/* Header avec onglets */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full overflow-x-auto">
            <button
              onClick={() => setActiveTab("destination")}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === "destination"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Destination
            </button>
            <button
              onClick={() => setActiveTab("dates")}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === "dates"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Dates
            </button>
            <button
              onClick={() => setActiveTab("guests")}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === "guests"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Voyageurs
            </button>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer la recherche"
            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Résumé de la recherche */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-100">
          <button
            onClick={() => setActiveTab("destination")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm flex-shrink-0 transition-colors cursor-pointer ${destination ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"}`}
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="whitespace-nowrap">{destination || "Destination"}</span>
          </button>
          <button
            onClick={() => setActiveTab("dates")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm flex-shrink-0 transition-colors cursor-pointer ${startDate ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"}`}
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="whitespace-nowrap">
              {startDate && endDate ? `${new Date(startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} - ${new Date(endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}` : startDate ? new Date(startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "Dates"}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("guests")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm flex-shrink-0 transition-colors cursor-pointer ${totalGuests > 1 || pets > 0 ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"}`}
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="whitespace-nowrap">
              {totalGuests} {totalGuests > 1 ? "voyageurs" : "voyageur"}
              {pets > 0 && ` · ${pets} ${pets > 1 ? "animaux" : "animal"}`}
            </span>
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className="p-4 sm:p-6 min-h-[300px] max-h-[calc(100vh-180px)] sm:max-h-[70vh] overflow-y-auto">
          {activeTab === "destination" && (
            <div className="space-y-6">
              {/* Champ de recherche avec autocomplete */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Où allez-vous ?
                </label>
                <LocationAutocomplete
                  value={destination}
                  onChange={setDestination}
                  onSelect={handleLocationSelect}
                  placeholder="Rechercher une ville, un pays..."
                  autoFocus={!isMobile}
                  popularCities={POPULAR_DESTINATIONS.map(d => ({
                    main: d.city,
                    secondary: d.country,
                    icon: d.image,
                  }))}
                />
              </div>

              {/* Historique de recherche (si connecté) */}
              {session?.user && searchHistory.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Recherches récentes</h3>
                    <button
                      onClick={clearHistory}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Effacer
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.slice(0, 5).map((history) => (
                      <button
                        key={history.id}
                        onClick={() => handleHistorySelect(history)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-700 transition-colors"
                      >
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {history.destination}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "dates" && (
            <div className="space-y-3">
              {/* Toggle Jour / Heure */}
              <div className="flex items-center justify-center gap-1 p-1 bg-gray-100 rounded-full w-fit mx-auto">
                <button
                  onClick={() => setBookingMode("days")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    bookingMode === "days" ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  À la journée
                </button>
                <button
                  onClick={() => setBookingMode("hours")}
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
                      onChange={(e) => setSelectedTime(e.target.value)}
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
                      onChange={(e) => setEndTime(e.target.value)}
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
                        if (!startDate) setStartDate(today);
                        setSelectedTime("09:00");
                        const endH = 9 + slot.hours;
                        setEndTime(`${endH.toString().padStart(2, "0")}:00`);
                      }}
                      className="px-2 py-1 border border-gray-200 hover:border-gray-400 rounded-full text-[10px] font-medium text-gray-600 transition-colors"
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "guests" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Qui voyage ?
                </h3>

                {/* Adultes */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Adultes</p>
                    <p className="text-sm text-gray-500">13 ans et plus</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      disabled={adults <= 1}
                      aria-label="Diminuer le nombre d'adultes"
                      className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-8 text-center text-lg font-semibold text-gray-900">
                      {adults}
                    </span>
                    <button
                      onClick={() => setAdults(Math.min(16, adults + 1))}
                      disabled={adults >= 16}
                      aria-label="Augmenter le nombre d'adultes"
                      className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Enfants */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Enfants</p>
                    <p className="text-sm text-gray-500">Jusqu'à 12 ans</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      disabled={children <= 0}
                      aria-label="Diminuer le nombre d'enfants"
                      className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-8 text-center text-lg font-semibold text-gray-900">
                      {children}
                    </span>
                    <button
                      onClick={() => setChildren(Math.min(10, children + 1))}
                      disabled={children >= 10}
                      aria-label="Augmenter le nombre d'enfants"
                      className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Animaux de compagnie */}
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-gray-900">Animaux de compagnie</p>
                    <p className="text-sm text-gray-500">Chiens, chats...</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setPets(Math.max(0, pets - 1))}
                      disabled={pets <= 0}
                      aria-label="Diminuer le nombre d'animaux"
                      className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-8 text-center text-lg font-semibold text-gray-900">
                      {pets}
                    </span>
                    <button
                      onClick={() => setPets(Math.min(5, pets + 1))}
                      disabled={pets >= 5}
                      aria-label="Augmenter le nombre d'animaux"
                      className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec bouton recherche - compact */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => {
              setDestination("");
              setStartDate("");
              setEndDate("");
              setAdults(1);
              setChildren(0);
              setPets(0);
            }}
            className="text-xs font-medium text-gray-500 hover:text-gray-900 underline"
          >
            Effacer
          </button>
          <button
            onClick={handleSearch}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Rechercher
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modal-appear {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-modal-appear {
          animation: modal-appear 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
