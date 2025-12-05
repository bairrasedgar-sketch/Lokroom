"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ============================================================================
// TYPES
// ============================================================================

type ListingCard = {
  id: string;
  title: string;
  city: string | null;
  country: string;
  type: string;
  createdAt: Date;
  images: { id: string; url: string }[];
  priceFormatted: string;
  ownerName: string | null;
  maxGuests: number | null;
  beds: number | null;
  isInstantBook: boolean;
};

type Category = {
  key: string;
  label: string;
  icon: string;
  count: number;
};

type Stats = {
  totalListings: number;
  totalUsers: number;
  totalCountries: number;
};

type HomeClientProps = {
  cards: ListingCard[];
  categories: Category[];
  stats: Stats;
  translations: Record<string, unknown>;
  displayCurrency: string;
};

// ============================================================================
// CATEGORY ICONS WITH UNIQUE ANIMATIONS
// ============================================================================

type CategoryIconProps = {
  category: string;
  isActive: boolean;
  isAnimating: boolean;
};

function CategoryIcon({ category, isActive, isAnimating }: CategoryIconProps) {
  const baseClass = `h-6 w-6 transition-colors duration-300 ${isActive ? "text-gray-900" : "text-gray-500"}`;

  // Each category has its own unique animation class
  const animationClass = isAnimating ? `animate-${category.toLowerCase()}` : "";

  const icons: Record<string, React.ReactNode> = {
    APARTMENT: (
      <svg className={`${baseClass} ${animationClass}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
    HOUSE: (
      <svg className={`${baseClass} ${animationClass}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    STUDIO: (
      <svg className={`${baseClass} ${animationClass}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
    OFFICE: (
      <svg className={`${baseClass} ${animationClass}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
      </svg>
    ),
    COWORKING: (
      <svg className={`${baseClass} ${animationClass}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    PARKING: (
      <svg className={`${baseClass} ${animationClass}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    EVENT_SPACE: (
      <svg className={`${baseClass} ${animationClass}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
    RECORDING_STUDIO: (
      <svg className={`${baseClass} ${animationClass}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    ),
    ALL: (
      <svg className={`${baseClass} ${animationClass}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  };

  return icons[category] || icons.ALL;
}

// ============================================================================
// SEARCH BAR COMPONENT
// ============================================================================

function SearchBar() {
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"location" | "dates" | "guests">("location");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState(1);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (guests > 1) params.set("guests", guests.toString());
    router.push(`/listings?${params.toString()}`);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div ref={searchRef} className="relative w-full max-w-3xl mx-auto z-50">
      {/* Main Search Bar */}
      <div
        className={`relative rounded-full border bg-white transition-all duration-300 ${
          searchFocused
            ? "border-gray-300 shadow-lg"
            : "border-gray-200 shadow-md hover:shadow-lg"
        }`}
      >
        <div className="flex items-center">
          {/* Location */}
          <button
            type="button"
            onClick={() => { setSearchFocused(true); setActiveTab("location"); }}
            className={`flex-1 px-6 py-4 text-left rounded-l-full transition-colors ${
              searchFocused && activeTab === "location" ? "bg-gray-50" : "hover:bg-gray-50"
            }`}
          >
            <p className="text-xs font-semibold text-gray-900">Destination</p>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { setSearchFocused(true); setActiveTab("location"); }}
              placeholder="Rechercher une destination"
              className="w-full bg-transparent text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none"
            />
          </button>

          <div className="h-8 w-px bg-gray-200" />

          {/* Dates */}
          <button
            type="button"
            onClick={() => { setSearchFocused(true); setActiveTab("dates"); }}
            className={`flex-1 px-6 py-4 text-left transition-colors ${
              searchFocused && activeTab === "dates" ? "bg-gray-50" : "hover:bg-gray-50"
            }`}
          >
            <p className="text-xs font-semibold text-gray-900">Arrivée</p>
            <p className="text-sm text-gray-400">
              {startDate
                ? new Date(startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                : "Quand ?"}
            </p>
          </button>

          <div className="h-8 w-px bg-gray-200" />

          {/* End Date */}
          <button
            type="button"
            onClick={() => { setSearchFocused(true); setActiveTab("dates"); }}
            className={`flex-1 px-6 py-4 text-left transition-colors ${
              searchFocused && activeTab === "dates" ? "bg-gray-50" : "hover:bg-gray-50"
            }`}
          >
            <p className="text-xs font-semibold text-gray-900">Départ</p>
            <p className="text-sm text-gray-400">
              {endDate
                ? new Date(endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                : "Quand ?"}
            </p>
          </button>

          <div className="h-8 w-px bg-gray-200" />

          {/* Guests */}
          <button
            type="button"
            onClick={() => { setSearchFocused(true); setActiveTab("guests"); }}
            className={`flex-1 px-6 py-4 text-left rounded-r-full transition-colors ${
              searchFocused && activeTab === "guests" ? "bg-gray-50" : "hover:bg-gray-50"
            }`}
          >
            <p className="text-xs font-semibold text-gray-900">Voyageurs</p>
            <p className="text-sm text-gray-400">
              {guests > 1 ? `${guests} voyageurs` : "Combien ?"}
            </p>
          </button>

          {/* Search Button - Gris clair agréable */}
          <div className="pr-2">
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 rounded-full bg-gray-800 px-4 py-3 text-white transition-all hover:bg-gray-900 active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Search Panel - Z-index élevé */}
      {searchFocused && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl">
            {activeTab === "location" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Destinations populaires</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { city: "Paris", country: "France" },
                    { city: "Montréal", country: "Canada" },
                    { city: "Lyon", country: "France" },
                    { city: "Toronto", country: "Canada" },
                  ].map((dest) => (
                    <button
                      key={dest.city}
                      onClick={() => {
                        setQuery(dest.city);
                        setActiveTab("dates");
                      }}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition-all hover:border-gray-300 hover:bg-gray-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{dest.city}</p>
                        <p className="text-xs text-gray-500">{dest.country}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "dates" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Sélectionnez vos dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">Arrivée</label>
                    <input
                      type="date"
                      value={startDate}
                      min={today}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">Départ</label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || today}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    { label: "Ce week-end", type: "weekend" as const },
                    { label: "Semaine prochaine", type: "week" as const },
                    { label: "Ce mois-ci", type: "month" as const },
                  ].map((shortcut) => (
                    <button
                      key={shortcut.label}
                      onClick={() => {
                        const todayDate = new Date();
                        const start = new Date();
                        const end = new Date();

                        if (shortcut.type === "weekend") {
                          const dayOfWeek = todayDate.getDay();
                          const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
                          start.setDate(todayDate.getDate() + daysUntilSaturday);
                          end.setDate(start.getDate() + 1);
                        } else if (shortcut.type === "week") {
                          start.setDate(todayDate.getDate() + 1);
                          end.setDate(start.getDate() + 7);
                        } else {
                          start.setDate(todayDate.getDate() + 1);
                          end.setDate(start.getDate() + 30);
                        }

                        setStartDate(start.toISOString().split("T")[0]);
                        setEndDate(end.toISOString().split("T")[0]);
                        setActiveTab("guests");
                      }}
                      className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
                    >
                      {shortcut.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "guests" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Combien de voyageurs ?</h3>
                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                  <div>
                    <p className="font-medium text-gray-900">Voyageurs</p>
                    <p className="text-sm text-gray-500">Nombre de personnes</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-8 text-center text-lg font-semibold">{guests}</span>
                    <button
                      onClick={() => setGuests(Math.min(16, guests + 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  className="w-full rounded-xl bg-gray-900 py-3 font-medium text-white transition-all hover:bg-black"
                >
                  Rechercher
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LISTING CARD
// ============================================================================

function ListingCard({ card, index }: { card: ListingCard; index: number }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const images = card.images || [];
  const hasMultipleImages = images.length > 1;

  return (
    <div
      className="group relative animate-fade-in"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setImageIndex(0); }}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Link href={`/listings/${card.id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
          {images.length > 0 ? (
            <>
              <Image
                src={images[imageIndex]?.url || images[0]?.url}
                alt={card.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />

              {/* Image Navigation Dots */}
              {hasMultipleImages && isHovered && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.slice(0, 5).map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.preventDefault(); setImageIndex(i); }}
                      className={`h-1.5 rounded-full transition-all ${
                        i === imageIndex ? "w-4 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Navigation Arrows */}
              {hasMultipleImages && isHovered && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorited(!isFavorited);
            }}
            className="absolute right-3 top-3 z-10 transition-transform hover:scale-110 active:scale-95"
          >
            <svg
              className={`h-6 w-6 drop-shadow-md transition-colors ${
                isFavorited ? "fill-gray-900 text-gray-900" : "fill-black/30 text-white"
              }`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>

          {/* Instant Book Badge */}
          {card.isInstantBook && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-900 shadow-md">
              <svg className="h-3 w-3 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Instantané
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="mt-3 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-medium text-gray-900">
              {card.title}
            </h3>
          </div>
          <p className="text-sm text-gray-500">
            {card.city ? `${card.city}, ` : ""}{card.country}
          </p>
          {(card.maxGuests || card.beds) && (
            <p className="text-sm text-gray-400">
              {card.maxGuests && `${card.maxGuests} voyageurs`}
              {card.maxGuests && card.beds && " · "}
              {card.beds && `${card.beds} lit${card.beds > 1 ? "s" : ""}`}
            </p>
          )}
          <p className="pt-1">
            <span className="font-semibold text-gray-900">{card.priceFormatted}</span>
            <span className="text-gray-500"> / nuit</span>
          </p>
        </div>
      </Link>
    </div>
  );
}

// ============================================================================
// CATEGORY BUTTON WITH UNIQUE ANIMATION
// ============================================================================

function CategoryButton({
  category,
  label,
  isActive,
  onClick,
}: {
  category: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    // Only animate if clicking to activate (not deactivate)
    if (!isActive) {
      setIsAnimating(true);
      // Reset animation state after animation completes
      setTimeout(() => {
        setIsAnimating(false);
      }, 2500);
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`flex flex-col items-center gap-2 px-4 py-3 transition-all duration-300 ${
        isActive
          ? "border-b-2 border-gray-900"
          : "border-b-2 border-transparent opacity-60 hover:opacity-100"
      }`}
    >
      <div className="relative">
        <CategoryIcon category={category} isActive={isActive} isAnimating={isAnimating} />
      </div>
      <span className={`whitespace-nowrap text-xs font-medium ${isActive ? "text-gray-900" : "text-gray-600"}`}>
        {label}
      </span>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HomeClient({ cards, categories }: HomeClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const filteredCards = activeCategory
    ? cards.filter((card) => card.type === activeCategory)
    : cards;

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      {/* Custom styles for unique animations per category */}
      <style jsx global>{`
        /* Animation pour TOUS - Grille qui pulse */
        @keyframes all-anim {
          0% { transform: scale(1); }
          20% { transform: scale(1.1); }
          40% { transform: scale(1); }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-all { animation: all-anim 0.8s ease-out; }

        /* Animation APARTMENT - Building qui s'élève */
        @keyframes apartment-anim {
          0% { transform: translateY(0); }
          25% { transform: translateY(-6px); }
          50% { transform: translateY(-3px); }
          75% { transform: translateY(-5px); }
          100% { transform: translateY(0); }
        }
        .animate-apartment { animation: apartment-anim 0.7s ease-out; }

        /* Animation HOUSE - Maison qui rebondit */
        @keyframes house-anim {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(-3deg); }
          50% { transform: translateY(-4px) rotate(2deg); }
          75% { transform: translateY(-6px) rotate(-1deg); }
        }
        .animate-house { animation: house-anim 0.8s ease-out; }

        /* Animation STUDIO - Pinceau qui trace une ligne ondulée */
        @keyframes studio-anim {
          0% { transform: translateX(0) rotate(0deg); }
          15% { transform: translateX(4px) rotate(8deg); }
          30% { transform: translateX(-4px) rotate(-8deg); }
          45% { transform: translateX(3px) rotate(5deg); }
          60% { transform: translateX(-3px) rotate(-5deg); }
          75% { transform: translateX(2px) rotate(3deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
        .animate-studio { animation: studio-anim 1s ease-out; }

        /* Animation OFFICE - Valise qui s'ouvre */
        @keyframes office-anim {
          0% { transform: scaleY(1); }
          30% { transform: scaleY(1.15); }
          50% { transform: scaleY(0.95); }
          70% { transform: scaleY(1.05); }
          100% { transform: scaleY(1); }
        }
        .animate-office { animation: office-anim 0.7s ease-out; }

        /* Animation COWORKING - Personnes qui bougent ensemble */
        @keyframes coworking-anim {
          0% { transform: scale(1) translateY(0); }
          25% { transform: scale(1.1) translateY(-4px); }
          50% { transform: scale(1.05) translateY(-2px); }
          75% { transform: scale(1.08) translateY(-3px); }
          100% { transform: scale(1) translateY(0); }
        }
        .animate-coworking { animation: coworking-anim 0.8s ease-out; }

        /* Animation PARKING - Voiture qui arrive et s'arrête */
        @keyframes parking-anim {
          0% { transform: translateX(-20px); opacity: 0.5; }
          40% { transform: translateX(5px); opacity: 1; }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(1px); }
          100% { transform: translateX(0); }
        }
        .animate-parking { animation: parking-anim 0.9s ease-out; }

        /* Animation EVENT_SPACE - Fusée qui décolle */
        @keyframes event_space-anim {
          0% { transform: translateY(0) rotate(0deg); }
          30% { transform: translateY(-10px) rotate(-5deg); }
          50% { transform: translateY(-6px) rotate(3deg); }
          70% { transform: translateY(-8px) rotate(-2deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        .animate-event_space { animation: event_space-anim 0.8s ease-out; }

        /* Animation RECORDING_STUDIO - Micro qui pulse */
        @keyframes recording_studio-anim {
          0%, 100% { transform: scale(1); }
          20% { transform: scale(1.15); }
          40% { transform: scale(1); }
          60% { transform: scale(1.1); }
          80% { transform: scale(1); }
        }
        .animate-recording_studio { animation: recording_studio-anim 0.9s ease-out; }

        /* Fade in pour les cards */
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      {/* HERO SECTION */}
      <section className="bg-[#FAFAFA] pb-6 pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero Content */}
          <div className={`mx-auto max-w-3xl text-center transition-all duration-700 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Trouvez l&apos;espace parfait
            </h1>
            <p className="mt-4 text-lg text-gray-500">
              Appartements, bureaux, studios, espaces événementiels...
              <br className="hidden sm:block" />
              Réservez des espaces uniques en quelques clics.
            </p>
          </div>

          {/* Search Bar */}
          <div className={`mt-8 transition-all delay-150 duration-700 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <SearchBar />
          </div>
        </div>
      </section>

      {/* CATEGORIES - Z-index plus bas que la recherche */}
      <section className="border-b border-gray-200 bg-white sticky top-16 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            <CategoryButton
              category="ALL"
              label="Tous"
              isActive={activeCategory === null}
              onClick={() => setActiveCategory(null)}
            />
            {categories.map((cat) => (
              <CategoryButton
                key={cat.key}
                category={cat.key}
                label={cat.label}
                isActive={activeCategory === cat.key}
                onClick={() => setActiveCategory(cat.key === activeCategory ? null : cat.key)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* LISTINGS GRID */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {activeCategory ? categories.find(c => c.key === activeCategory)?.label : "Découvrez nos espaces"}
            </h2>
          </div>
          <Link
            href="/listings"
            className="group flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            Voir tout
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {filteredCards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900">Aucun espace dans cette catégorie</h3>
            <p className="mt-1 text-sm text-gray-500">Essayez une autre catégorie ou explorez tous nos espaces</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCards.map((card, i) => (
              <ListingCard key={card.id} card={card} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* DECORATIVE VISUAL SECTION - Sobre et premium */}
      <section className="py-16 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                Des espaces pour chaque besoin
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Que vous cherchiez un appartement pour vos vacances, un bureau pour votre équipe,
                ou un studio pour votre projet créatif, trouvez l&apos;espace idéal parmi notre sélection.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Paiement sécurisé</p>
                    <p className="text-sm text-gray-500">Transactions protégées</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Hôtes vérifiés</p>
                    <p className="text-sm text-gray-500">Identité contrôlée</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Réservation rapide</p>
                    <p className="text-sm text-gray-500">En quelques clics</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Support réactif</p>
                    <p className="text-sm text-gray-500">Équipe disponible</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Grid - Sobre et premium */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <div className="h-full w-full flex items-center justify-center">
                      <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={0.75} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                      </svg>
                    </div>
                  </div>
                  <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-gray-50 to-gray-150 overflow-hidden">
                    <div className="h-full w-full flex items-center justify-center">
                      <svg className="h-20 w-20 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <div className="h-full w-full flex items-center justify-center">
                      <svg className="h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                      </svg>
                    </div>
                  </div>
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-gray-50 to-gray-150 overflow-hidden">
                    <div className="h-full w-full flex items-center justify-center">
                      <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={0.75} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              {/* Subtle decorative circles */}
              <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-gray-100/50 blur-2xl" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-gray-100/50 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-[#FAFAFA] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gray-900 px-8 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Vous avez un espace à louer ?
            </h2>
            <p className="mt-3 text-gray-400">
              Rejoignez notre communauté d&apos;hôtes et commencez à générer des revenus.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/become-host"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-gray-900 transition-all hover:bg-gray-100"
              >
                Devenir hôte
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/listings"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-6 py-3 font-medium text-white transition-all hover:bg-gray-800"
              >
                Explorer les espaces
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
