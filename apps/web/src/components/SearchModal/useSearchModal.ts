"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { logger } from "@/lib/logger";
import { fetchWithCsrf } from "@/lib/csrf-client";
import type { LocationAutocompletePlace } from "../LocationAutocomplete";

export type SearchHistory = {
  id: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  guests?: number;
  createdAt: Date;
};

export const POPULAR_DESTINATIONS = [
  { city: "Paris", country: "France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop&q=80" },
  { city: "Montréal", country: "Canada", image: "https://images.unsplash.com/photo-1519178614-68673b201f36?w=400&h=400&fit=crop&q=80" },
  { city: "Lyon", country: "France", image: "/images/lyon.webp" },
  { city: "Marseille", country: "France", image: "/images/marseille.webp" },
  { city: "Toronto", country: "Canada", image: "https://images.unsplash.com/photo-1507992781348-310259076fe0?w=400&h=400&fit=crop&q=80" },
  { city: "Bordeaux", country: "France", image: "/images/bordeaux.webp" },
];

export const CATEGORIES = [
  { key: "HOUSE", label: "Maison" },
  { key: "APARTMENT", label: "Appartement" },
  { key: "PARKING", label: "Parking" },
  { key: "ROOM", label: "Chambre" },
  { key: "GARAGE", label: "Garage" },
  { key: "STORAGE", label: "Stockage" },
  { key: "OFFICE", label: "Bureau" },
  { key: "MEETING_ROOM", label: "Salle de réunion" },
  { key: "COWORKING", label: "Coworking" },
  { key: "EVENT_SPACE", label: "Événementiel" },
  { key: "RECORDING_STUDIO", label: "Studios" },
  { key: "OTHER", label: "Autre" },
];

export const DAYS_OF_WEEK = ["L", "M", "M", "J", "V", "S", "D"];
export const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
export const MONTHS_SHORT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
export const TIME_OPTIONS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
];

export function getDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();
  const adjustedStartingDay = startingDay === 0 ? 6 : startingDay - 1;
  return { daysInMonth, startingDay: adjustedStartingDay, year, month };
}

export function formatDateString(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getNextMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export function useSearchModal(isOpen: boolean, onClose: () => void, initialTab: "destination" | "dates" | "guests" = "destination") {
  const router = useRouter();
  const { data: session } = useSession();
  const modalRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"destination" | "dates" | "guests">(initialTab);
  const [destination, setDestination] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [animatingCategory, setAnimatingCategory] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<"destination" | "dates" | "guests" | null>("destination");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [bookingMode, setBookingMode] = useState<"days" | "hours">("days");
  const [selectedTime, setSelectedTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const totalGuests = adults + children;

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  useEffect(() => {
    if (session?.user && isOpen) {
      fetch("/api/search-history")
        .then((res) => res.ok ? res.json() : [])
        .then((data) => setSearchHistory(data))
        .catch(() => setSearchHistory([]));
    }
  }, [session, isOpen]);

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

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleOpenSection = (section: "destination" | "dates" | "guests") => {
    if (openSection === section) {
      setOpenSection(null);
    } else {
      setOpenSection(section);
      setTimeout(() => {
        const refs = { destination: destinationRef, dates: datesRef, guests: guestsRef };
        refs[section].current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const isDateDisabled = (dateStr: string) => dateStr < today;

  const isDateInRange = (dateStr: string) => {
    if (!startDate || !endDate) return false;
    return dateStr > startDate && dateStr < endDate;
  };

  const handleDateClick = (dateStr: string) => {
    if (isDateDisabled(dateStr)) return;
    if (!startDate || (startDate && endDate) || (!selectingEnd && dateStr < startDate)) {
      setStartDate(dateStr);
      setEndDate("");
      setSelectingEnd(true);
    } else if (selectingEnd && dateStr > startDate) {
      setEndDate(dateStr);
      setSelectingEnd(false);
    } else if (dateStr === startDate) {
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

  const handleLocationSelect = (place: LocationAutocompletePlace) => {
    setSelectedCity(place.mainText);
    if (place.placeId) setSelectedPlaceId(place.placeId);
    const desc = place.description.toLowerCase();
    if (desc.includes("canada")) setSelectedCountry("Canada");
    else if (desc.includes("france")) setSelectedCountry("France");
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
      await fetchWithCsrf("/api/search-history", { method: "DELETE" });
      setSearchHistory([]);
    } catch (e) {
      logger.error("Failed to clear history:", e);
    }
  };

  const handleSearch = async () => {
    const params = new URLSearchParams();
    if (destination) params.set("q", destination);
    if (selectedCity) params.set("city", selectedCity);
    if (selectedCountry) params.set("country", selectedCountry);
    if (selectedPlaceId) params.set("placeId", selectedPlaceId);
    if (selectedCategory) params.set("type", selectedCategory);
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

    if (session?.user && destination) {
      try {
        await fetchWithCsrf("/api/search-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destination, startDate, endDate, guests: totalGuests }),
        });
      } catch (e) {
        logger.error("Failed to save search history:", e);
      }
    }

    onClose();
    router.push(`/listings?${params.toString()}`);
  };

  const clearAll = () => {
    setDestination("");
    setSelectedCity("");
    setSelectedCountry("");
    setStartDate("");
    setEndDate("");
    setAdults(1);
    setChildren(0);
    setPets(0);
  };

  return {
    // refs
    modalRef, destinationRef, datesRef, guestsRef,
    // state
    isMobile, activeTab, setActiveTab,
    destination, setDestination,
    selectedCity, setSelectedCity,
    selectedCountry, setSelectedCountry,
    selectedPlaceId, setSelectedPlaceId,
    startDate, setStartDate, endDate, setEndDate,
    adults, setAdults,
    children, setChildren,
    pets, setPets,
    searchHistory,
    selectedCategory, setSelectedCategory,
    animatingCategory, setAnimatingCategory,
    openSection,
    calendarMonth,
    bookingMode, setBookingMode,
    selectedTime, setSelectedTime,
    endTime, setEndTime,
    today, totalGuests,
    // handlers
    handleOpenSection,
    isDateDisabled, isDateInRange, handleDateClick,
    goToPreviousMonth, goToNextMonth, canGoPrevious,
    handleLocationSelect, handleHistorySelect,
    clearHistory, handleSearch, clearAll,
  };
}
