"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
// PREMIUM ANIMATED CATEGORY ICONS - Vraies animations SVG
// ============================================================================

type CategoryIconProps = {
  category: string;
  isActive: boolean;
  isAnimating: boolean;
};

function CategoryIcon({ category, isActive, isAnimating }: CategoryIconProps) {
  const color = isActive ? "#111827" : "#6B7280";

  // Animation wrapper classes
  const wrapperClass = `relative transition-all duration-300 ${isAnimating ? "scale-110" : ""}`;

  const icons: Record<string, React.ReactNode> = {
    // TOUS - Grille avec carrés qui s'assemblent
    ALL: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <rect
            x="3" y="3" width="7" height="7" rx="1.5"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-grid-tl" : ""}
          />
          <rect
            x="14" y="3" width="7" height="7" rx="1.5"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-grid-tr" : ""}
          />
          <rect
            x="3" y="14" width="7" height="7" rx="1.5"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-grid-bl" : ""}
          />
          <rect
            x="14" y="14" width="7" height="7" rx="1.5"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-grid-br" : ""}
          />
        </svg>
      </div>
    ),

    // APPARTEMENT - Building avec fenêtres qui s'allument
    APARTMENT: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Building structure */}
          <path
            d="M3 21V5a2 2 0 012-2h8a2 2 0 012 2v16"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-building-rise" : ""}
          />
          <path
            d="M15 21V10a2 2 0 012-2h2a2 2 0 012 2v11"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-building-rise-delay" : ""}
          />
          <line x1="3" y1="21" x2="21" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          {/* Windows that light up */}
          <rect x="6" y="6" width="2" height="2" rx="0.5" fill={color} className={isAnimating ? "animate-window-1" : ""} />
          <rect x="10" y="6" width="2" height="2" rx="0.5" fill={color} className={isAnimating ? "animate-window-2" : ""} />
          <rect x="6" y="10" width="2" height="2" rx="0.5" fill={color} className={isAnimating ? "animate-window-3" : ""} />
          <rect x="10" y="10" width="2" height="2" rx="0.5" fill={color} className={isAnimating ? "animate-window-4" : ""} />
          <rect x="6" y="14" width="2" height="2" rx="0.5" fill={color} className={isAnimating ? "animate-window-5" : ""} />
          <rect x="10" y="14" width="2" height="2" rx="0.5" fill={color} className={isAnimating ? "animate-window-6" : ""} />
        </svg>
      </div>
    ),

    // MAISON - Toit qui se pose, porte qui s'ouvre
    HOUSE: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Roof */}
          <path
            d="M3 11L12 3L21 11"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isAnimating ? "animate-roof-drop" : ""}
          />
          {/* House body */}
          <path
            d="M5 10V19a2 2 0 002 2h10a2 2 0 002-2V10"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-house-body" : ""}
          />
          {/* Door that opens */}
          <path
            d="M10 21V15a2 2 0 012-2h0a2 2 0 012 2v6"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-door-open" : ""}
          />
          {/* Chimney with smoke */}
          <path
            d="M16 6V3"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-chimney" : ""}
          />
          {isAnimating && (
            <>
              <circle cx="16" cy="1" r="0.5" fill={color} className="animate-smoke-1" />
              <circle cx="17" cy="-1" r="0.5" fill={color} className="animate-smoke-2" />
              <circle cx="15" cy="-2" r="0.5" fill={color} className="animate-smoke-3" />
            </>
          )}
        </svg>
      </div>
    ),

    // STUDIO - Pinceau qui peint une ligne arc-en-ciel
    STUDIO: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Paint stroke being drawn */}
          {isAnimating && (
            <path
              d="M3 18C5 16 7 17 9 15C11 13 13 14 15 12"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-paint-stroke"
              strokeDasharray="20"
              strokeDashoffset="20"
            />
          )}
          {/* Brush */}
          <g className={isAnimating ? "animate-brush-paint" : ""}>
            <path
              d="M18.37 2.63L14 7L17 10L21.37 5.63A2.12 2.12 0 1018.37 2.63Z"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 7L5.5 15.5C4.67 16.33 4.67 17.67 5.5 18.5C6.33 19.33 7.67 19.33 8.5 18.5L17 10"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="6" cy="18" r="1" fill={color} className={isAnimating ? "animate-paint-drop" : ""} />
          </g>
        </svg>
      </div>
    ),

    // BUREAU - Valise qui s'ouvre avec documents
    OFFICE: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Briefcase body */}
          <rect
            x="2" y="7" width="20" height="13" rx="2"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-briefcase" : ""}
          />
          {/* Handle */}
          <path
            d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-handle" : ""}
          />
          {/* Center line (opening) */}
          <path
            d="M2 12h20"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-briefcase-open" : ""}
          />
          {/* Documents flying out */}
          {isAnimating && (
            <>
              <rect x="9" y="9" width="6" height="4" rx="0.5" fill={color} className="animate-doc-1" />
              <rect x="10" y="10" width="4" height="3" rx="0.5" fill={color} className="animate-doc-2" />
            </>
          )}
        </svg>
      </div>
    ),

    // COWORKING - Personnes qui se connectent
    COWORKING: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Center person */}
          <circle cx="12" cy="7" r="2.5" stroke={color} strokeWidth="1.5" className={isAnimating ? "animate-person-center" : ""} />
          <path d="M8 21v-2a4 4 0 014-4h0a4 4 0 014 4v2" stroke={color} strokeWidth="1.5" className={isAnimating ? "animate-person-center" : ""} />

          {/* Left person */}
          <circle cx="5" cy="9" r="2" stroke={color} strokeWidth="1.5" className={isAnimating ? "animate-person-left" : ""} />
          <path d="M1 21v-1a3 3 0 013-3h2" stroke={color} strokeWidth="1.5" className={isAnimating ? "animate-person-left" : ""} />

          {/* Right person */}
          <circle cx="19" cy="9" r="2" stroke={color} strokeWidth="1.5" className={isAnimating ? "animate-person-right" : ""} />
          <path d="M23 21v-1a3 3 0 00-3-3h-2" stroke={color} strokeWidth="1.5" className={isAnimating ? "animate-person-right" : ""} />

          {/* Connection lines */}
          {isAnimating && (
            <>
              <line x1="7" y1="8" x2="9.5" y2="7" stroke={color} strokeWidth="1" className="animate-connect-left" />
              <line x1="17" y1="8" x2="14.5" y2="7" stroke={color} strokeWidth="1" className="animate-connect-right" />
            </>
          )}
        </svg>
      </div>
    ),

    // PARKING - Voiture qui se gare avec effet perspective
    PARKING: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Parking spot lines */}
          <path d="M4 20V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" className={isAnimating ? "animate-parking-line" : ""} />
          <path d="M20 20V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" className={isAnimating ? "animate-parking-line" : ""} />

          {/* Car body */}
          <g className={isAnimating ? "animate-car-park" : ""}>
            <path
              d="M6 15h12a2 2 0 012 2v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2a2 2 0 012-2z"
              stroke={color}
              strokeWidth="1.5"
            />
            <path
              d="M7 15l1.5-4h7l1.5 4"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Wheels */}
            <circle cx="7.5" cy="18" r="1" fill={color} />
            <circle cx="16.5" cy="18" r="1" fill={color} />
            {/* Windows */}
            <path d="M9 12h6" stroke={color} strokeWidth="1" strokeLinecap="round" />
          </g>

          {/* Headlights */}
          {isAnimating && (
            <>
              <circle cx="7" cy="16" r="0.5" fill={color} className="animate-headlight" />
              <circle cx="17" cy="16" r="0.5" fill={color} className="animate-headlight" />
            </>
          )}
        </svg>
      </div>
    ),

    // EVENT SPACE - Confettis et étoiles qui explosent
    EVENT_SPACE: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Party popper base */}
          <path
            d="M5.8 17.2L2 22l4.8-3.8"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-popper-base" : ""}
          />
          <path
            d="M6 16l2-2"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-popper" : ""}
          />

          {/* Confetti explosion */}
          {isAnimating ? (
            <>
              <circle cx="10" cy="10" r="1" fill={color} className="animate-confetti-1" />
              <circle cx="14" cy="8" r="0.8" fill={color} className="animate-confetti-2" />
              <circle cx="18" cy="12" r="1" fill={color} className="animate-confetti-3" />
              <circle cx="12" cy="5" r="0.8" fill={color} className="animate-confetti-4" />
              <circle cx="16" cy="4" r="1" fill={color} className="animate-confetti-5" />
              <path d="M11 7l1-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="animate-confetti-6" />
              <path d="M15 6l2-1" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="animate-confetti-7" />
              <path d="M17 9l2 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="animate-confetti-8" />
              {/* Stars */}
              <path d="M20 5l0.5 1 1 0.5-1 0.5-0.5 1-0.5-1-1-0.5 1-0.5z" fill={color} className="animate-star-1" />
              <path d="M8 3l0.3 0.7 0.7 0.3-0.7 0.3-0.3 0.7-0.3-0.7-0.7-0.3 0.7-0.3z" fill={color} className="animate-star-2" />
            </>
          ) : (
            <>
              <circle cx="12" cy="10" r="1" fill={color} />
              <circle cx="16" cy="8" r="0.8" fill={color} />
              <circle cx="14" cy="5" r="1" fill={color} />
            </>
          )}
        </svg>
      </div>
    ),

    // RECORDING STUDIO - Micro avec ondes sonores
    RECORDING_STUDIO: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Microphone */}
          <rect
            x="9" y="2" width="6" height="10" rx="3"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-mic-pulse" : ""}
          />
          <path d="M12 14v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 18h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M5 10a7 7 0 0014 0"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-mic-stand" : ""}
          />

          {/* Sound waves */}
          {isAnimating && (
            <>
              <path d="M2 8v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="animate-wave-1" />
              <path d="M4 6v8" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="animate-wave-2" />
              <path d="M20 6v8" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="animate-wave-3" />
              <path d="M22 8v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="animate-wave-4" />
            </>
          )}
        </svg>
      </div>
    ),
  };

  return icons[category] || icons.ALL;
}

// ============================================================================
// STICKY SEARCH BAR COMPONENT - Airbnb style
// ============================================================================

function SearchBar({ isCompact, onExpand }: { isCompact: boolean; onExpand: () => void }) {
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

  // Compact search bar (when scrolled)
  if (isCompact && !searchFocused) {
    return (
      <div className="w-full flex justify-center">
        <button
          onClick={() => {
            onExpand();
            setSearchFocused(true);
          }}
          className="flex items-center gap-4 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-md transition-all hover:shadow-lg"
        >
          <span className="text-sm font-medium text-gray-900">Destination</span>
          <span className="h-6 w-px bg-gray-200" />
          <span className="text-sm text-gray-500">Dates</span>
          <span className="h-6 w-px bg-gray-200" />
          <span className="text-sm text-gray-500">Voyageurs</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-3xl mx-auto">
      {/* Main Search Bar */}
      <div
        className={`relative rounded-full border bg-white transition-all duration-300 ${
          searchFocused
            ? "border-gray-300 shadow-xl"
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

          {/* Search Button */}
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

      {/* Expanded Search Panel - Z-index très élevé */}
      {searchFocused && (
        <div className="absolute left-0 right-0 top-full mt-3" style={{ zIndex: 9999 }}>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
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
                      style={{ position: "relative", zIndex: 10000 }}
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
                      style={{ position: "relative", zIndex: 10000 }}
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
// CATEGORY BUTTON WITH PREMIUM ANIMATION
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
    if (!isActive) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [forceExpandSearch, setForceExpandSearch] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Scroll detection for sticky search bar
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setIsScrolled(heroBottom < 80);
        if (heroBottom >= 80) {
          setForceExpandSearch(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredCards = activeCategory
    ? cards.filter((card) => card.type === activeCategory)
    : cards;

  const handleExpandSearch = useCallback(() => {
    setForceExpandSearch(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      {/* Premium Animation Styles */}
      <style jsx global>{`
        /* ============================================
           GRID ANIMATION - Tous
           ============================================ */
        @keyframes grid-assemble-tl {
          0% { transform: translate(-10px, -10px) rotate(-10deg); opacity: 0; }
          50% { transform: translate(2px, 2px) rotate(5deg); opacity: 1; }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes grid-assemble-tr {
          0% { transform: translate(10px, -10px) rotate(10deg); opacity: 0; }
          50% { transform: translate(-2px, 2px) rotate(-5deg); opacity: 1; }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes grid-assemble-bl {
          0% { transform: translate(-10px, 10px) rotate(10deg); opacity: 0; }
          50% { transform: translate(2px, -2px) rotate(-5deg); opacity: 1; }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes grid-assemble-br {
          0% { transform: translate(10px, 10px) rotate(-10deg); opacity: 0; }
          50% { transform: translate(-2px, -2px) rotate(5deg); opacity: 1; }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .animate-grid-tl { animation: grid-assemble-tl 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-grid-tr { animation: grid-assemble-tr 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards; }
        .animate-grid-bl { animation: grid-assemble-bl 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards; }
        .animate-grid-br { animation: grid-assemble-br 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards; }

        /* ============================================
           APARTMENT - Building rises with windows lighting up
           ============================================ */
        @keyframes building-rise {
          0% { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-building-rise { animation: building-rise 0.6s ease-out forwards; }
        .animate-building-rise-delay { animation: building-rise 0.6s ease-out 0.2s forwards; opacity: 0; }

        @keyframes window-light {
          0%, 30% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 1; }
        }
        .animate-window-1 { animation: window-light 0.3s ease-out 0.3s forwards; opacity: 0.3; }
        .animate-window-2 { animation: window-light 0.3s ease-out 0.4s forwards; opacity: 0.3; }
        .animate-window-3 { animation: window-light 0.3s ease-out 0.5s forwards; opacity: 0.3; }
        .animate-window-4 { animation: window-light 0.3s ease-out 0.6s forwards; opacity: 0.3; }
        .animate-window-5 { animation: window-light 0.3s ease-out 0.7s forwards; opacity: 0.3; }
        .animate-window-6 { animation: window-light 0.3s ease-out 0.8s forwards; opacity: 0.3; }

        /* ============================================
           HOUSE - Roof drops, smoke rises
           ============================================ */
        @keyframes roof-drop {
          0% { transform: translateY(-15px); opacity: 0; }
          60% { transform: translateY(2px); }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes house-body-appear {
          0% { transform: scaleY(0); transform-origin: bottom; }
          100% { transform: scaleY(1); }
        }
        @keyframes door-swing {
          0% { transform: perspective(100px) rotateY(0deg); }
          50% { transform: perspective(100px) rotateY(-30deg); }
          100% { transform: perspective(100px) rotateY(0deg); }
        }
        @keyframes smoke-rise {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          30% { opacity: 0.8; }
          100% { transform: translateY(-8px) scale(1.5); opacity: 0; }
        }
        .animate-roof-drop { animation: roof-drop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-house-body { animation: house-body-appear 0.5s ease-out 0.2s forwards; }
        .animate-door-open { animation: door-swing 0.8s ease-in-out 0.5s forwards; }
        .animate-chimney { animation: building-rise 0.4s ease-out forwards; }
        .animate-smoke-1 { animation: smoke-rise 1.5s ease-out 0.6s infinite; }
        .animate-smoke-2 { animation: smoke-rise 1.5s ease-out 0.9s infinite; }
        .animate-smoke-3 { animation: smoke-rise 1.5s ease-out 1.2s infinite; }

        /* ============================================
           STUDIO - Brush painting stroke
           ============================================ */
        @keyframes brush-paint {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-8px, 8px) rotate(-15deg); }
          50% { transform: translate(-4px, 4px) rotate(-10deg); }
          75% { transform: translate(-2px, 2px) rotate(-5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes paint-stroke-draw {
          0% { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes paint-drop {
          0%, 50% { transform: scale(1); }
          75% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .animate-brush-paint { animation: brush-paint 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-paint-stroke { animation: paint-stroke-draw 1s ease-out forwards; }
        .animate-paint-drop { animation: paint-drop 0.6s ease-out 0.8s forwards; }

        /* ============================================
           OFFICE - Briefcase opens with documents
           ============================================ */
        @keyframes briefcase-bounce {
          0% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
          50% { transform: translateY(0); }
          70% { transform: translateY(-3px); }
          100% { transform: translateY(0); }
        }
        @keyframes briefcase-open-line {
          0% { stroke-dasharray: 20; stroke-dashoffset: 20; }
          100% { stroke-dasharray: 20; stroke-dashoffset: 0; }
        }
        @keyframes doc-fly {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-12px) rotate(-10deg); opacity: 0; }
        }
        .animate-briefcase { animation: briefcase-bounce 0.8s ease-out forwards; }
        .animate-handle { animation: building-rise 0.4s ease-out forwards; }
        .animate-briefcase-open { animation: briefcase-open-line 0.5s ease-out 0.3s forwards; }
        .animate-doc-1 { animation: doc-fly 0.8s ease-out 0.4s forwards; }
        .animate-doc-2 { animation: doc-fly 0.8s ease-out 0.5s forwards; }

        /* ============================================
           COWORKING - People connect
           ============================================ */
        @keyframes person-appear-center {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes person-appear-left {
          0% { transform: translateX(-10px) scale(0.5); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes person-appear-right {
          0% { transform: translateX(10px) scale(0.5); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes connect-line {
          0% { stroke-dasharray: 10; stroke-dashoffset: 10; opacity: 0; }
          50% { opacity: 1; }
          100% { stroke-dasharray: 10; stroke-dashoffset: 0; opacity: 1; }
        }
        .animate-person-center { animation: person-appear-center 0.5s ease-out forwards; }
        .animate-person-left { animation: person-appear-left 0.5s ease-out 0.2s forwards; opacity: 0; }
        .animate-person-right { animation: person-appear-right 0.5s ease-out 0.2s forwards; opacity: 0; }
        .animate-connect-left { animation: connect-line 0.6s ease-out 0.5s forwards; }
        .animate-connect-right { animation: connect-line 0.6s ease-out 0.5s forwards; }

        /* ============================================
           PARKING - Car drives in
           ============================================ */
        @keyframes parking-line-appear {
          0% { stroke-dasharray: 12; stroke-dashoffset: 12; }
          100% { stroke-dasharray: 12; stroke-dashoffset: 0; }
        }
        @keyframes car-drive-in {
          0% { transform: translateX(-30px) scale(0.8); opacity: 0; }
          60% { transform: translateX(3px) scale(1); opacity: 1; }
          80% { transform: translateX(-1px); }
          100% { transform: translateX(0); }
        }
        @keyframes headlight-flash {
          0%, 40% { opacity: 0; }
          50% { opacity: 1; }
          60% { opacity: 0.3; }
          70% { opacity: 1; }
          100% { opacity: 1; }
        }
        .animate-parking-line { animation: parking-line-appear 0.4s ease-out forwards; }
        .animate-car-park { animation: car-drive-in 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-headlight { animation: headlight-flash 1s ease-out forwards; }

        /* ============================================
           EVENT SPACE - Confetti explosion
           ============================================ */
        @keyframes popper-shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        @keyframes confetti-burst-1 {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translate(5px, -15px) scale(1); opacity: 0; }
        }
        @keyframes confetti-burst-2 {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translate(10px, -10px) scale(1); opacity: 0; }
        }
        @keyframes confetti-burst-3 {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translate(12px, -5px) scale(1); opacity: 0; }
        }
        @keyframes confetti-burst-4 {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translate(3px, -18px) scale(1); opacity: 0; }
        }
        @keyframes confetti-burst-5 {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translate(8px, -12px) scale(1); opacity: 0; }
        }
        @keyframes confetti-line {
          0% { transform: scale(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        @keyframes star-twinkle {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
          100% { transform: scale(1) rotate(360deg); opacity: 1; }
        }
        .animate-popper-base { animation: popper-shake 0.5s ease-out forwards; }
        .animate-popper { animation: popper-shake 0.3s ease-out forwards; }
        .animate-confetti-1 { animation: confetti-burst-1 0.8s ease-out forwards; }
        .animate-confetti-2 { animation: confetti-burst-2 0.8s ease-out 0.1s forwards; }
        .animate-confetti-3 { animation: confetti-burst-3 0.8s ease-out 0.15s forwards; }
        .animate-confetti-4 { animation: confetti-burst-4 0.8s ease-out 0.05s forwards; }
        .animate-confetti-5 { animation: confetti-burst-5 0.8s ease-out 0.2s forwards; }
        .animate-confetti-6 { animation: confetti-line 0.6s ease-out 0.1s forwards; }
        .animate-confetti-7 { animation: confetti-line 0.6s ease-out 0.15s forwards; }
        .animate-confetti-8 { animation: confetti-line 0.6s ease-out 0.2s forwards; }
        .animate-star-1 { animation: star-twinkle 0.8s ease-out 0.3s forwards; }
        .animate-star-2 { animation: star-twinkle 0.8s ease-out 0.4s forwards; }

        /* ============================================
           RECORDING STUDIO - Mic with sound waves
           ============================================ */
        @keyframes mic-glow {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.05); filter: brightness(1.2); }
        }
        @keyframes sound-wave {
          0% { transform: scaleY(0.5); opacity: 0; }
          50% { transform: scaleY(1); opacity: 1; }
          100% { transform: scaleY(0.5); opacity: 0; }
        }
        .animate-mic-pulse { animation: mic-glow 1s ease-in-out infinite; }
        .animate-mic-stand { animation: building-rise 0.5s ease-out forwards; }
        .animate-wave-1 { animation: sound-wave 0.8s ease-in-out infinite; }
        .animate-wave-2 { animation: sound-wave 0.8s ease-in-out 0.1s infinite; }
        .animate-wave-3 { animation: sound-wave 0.8s ease-in-out 0.2s infinite; }
        .animate-wave-4 { animation: sound-wave 0.8s ease-in-out 0.3s infinite; }

        /* ============================================
           GENERAL ANIMATIONS
           ============================================ */
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      {/* STICKY SEARCH BAR HEADER */}
      <div
        className={`fixed left-0 right-0 bg-white/95 backdrop-blur-md transition-all duration-300 ${
          isScrolled ? "top-16 z-[9998] shadow-md py-3" : "top-0 -translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SearchBar isCompact={isScrolled && !forceExpandSearch} onExpand={handleExpandSearch} />
        </div>
      </div>

      {/* HERO SECTION */}
      <section ref={heroRef} className="bg-[#FAFAFA] pb-6 pt-8">
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

          {/* Main Search Bar */}
          <div className={`mt-8 transition-all delay-150 duration-700 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`} style={{ position: "relative", zIndex: 9999 }}>
            <SearchBar isCompact={false} onExpand={() => {}} />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-b border-gray-200 bg-white sticky top-16 z-30">
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

      {/* DECORATIVE VISUAL SECTION */}
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

            {/* Visual Grid */}
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
