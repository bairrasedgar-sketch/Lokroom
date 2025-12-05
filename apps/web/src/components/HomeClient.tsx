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

type BookingMode = "days" | "hours";

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

    // STUDIO - Pinceau qui dessine puis revient
    STUDIO: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Canvas/Chevalet */}
          <rect
            x="3" y="6" width="12" height="14" rx="1"
            stroke={color}
            strokeWidth="1.5"
            className={isAnimating ? "animate-canvas-appear" : ""}
          />
          {/* Pieds du chevalet */}
          <path d="M5 20L3 23" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M13 20L15 23" stroke={color} strokeWidth="1.5" strokeLinecap="round" />

          {/* Trait en train d'être dessiné */}
          <path
            d="M5 10C6 11 7 9 8 10C9 11 10 9 11 10C12 11 13 9 13 10"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            className={isAnimating ? "animate-paint-line" : ""}
            strokeDasharray="20"
            strokeDashoffset={isAnimating ? "0" : "20"}
          />

          {/* Pinceau */}
          <g className={isAnimating ? "animate-brush-draw" : ""} style={{ transformOrigin: "19px 8px" }}>
            {/* Manche du pinceau */}
            <rect x="17" y="2" width="4" height="10" rx="1" stroke={color} strokeWidth="1.5" fill="none" />
            {/* Virole (partie métallique) */}
            <rect x="17" y="10" width="4" height="2" fill={color} />
            {/* Poils du pinceau */}
            <path d="M17.5 12L17 15L19 16L21 15L20.5 12" stroke={color} strokeWidth="1" fill={color} />
          </g>

          {/* Gouttes de peinture */}
          {isAnimating && (
            <>
              <circle cx="19" cy="18" r="0.8" fill={color} className="animate-drop-1" />
              <circle cx="17" cy="19" r="0.5" fill={color} className="animate-drop-2" />
            </>
          )}
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

    // PARKING - Voiture bien visible qui se gare
    PARKING: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Panneau P */}
          <rect x="2" y="2" width="8" height="10" rx="1" stroke={color} strokeWidth="1.5" />
          <text x="6" y="9" textAnchor="middle" fontSize="7" fontWeight="bold" fill={color}>P</text>

          {/* Voiture bien dessinée */}
          <g className={isAnimating ? "animate-car-arrive" : ""}>
            {/* Carrosserie */}
            <path
              d="M8 18H20C21 18 22 17 22 16V15C22 14 21.5 13.5 21 13.5L19 13L18 11H12L10 13L9 13.5C8.5 13.5 8 14 8 15V16C8 17 8 18 8 18Z"
              stroke={color}
              strokeWidth="1.5"
              fill="none"
              strokeLinejoin="round"
            />
            {/* Toit/Vitres */}
            <path d="M12 11L13 9H17L18 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Pare-brise */}
            <path d="M13.5 10L16.5 10" stroke={color} strokeWidth="1" strokeLinecap="round" />
            {/* Roue avant */}
            <circle cx="11" cy="18" r="1.5" stroke={color} strokeWidth="1.5" />
            <circle cx="11" cy="18" r="0.5" fill={color} />
            {/* Roue arrière */}
            <circle cx="19" cy="18" r="1.5" stroke={color} strokeWidth="1.5" />
            <circle cx="19" cy="18" r="0.5" fill={color} />
            {/* Phares */}
            <circle cx="9" cy="15" r="0.5" fill={color} className={isAnimating ? "animate-headlight-blink" : ""} />
            <circle cx="21" cy="15" r="0.5" fill={color} />
            {/* Rétroviseur */}
            <path d="M12.5 11L11.5 10.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
          </g>

          {/* Lignes de mouvement quand la voiture arrive */}
          {isAnimating && (
            <>
              <path d="M4 15H6" stroke={color} strokeWidth="1" strokeLinecap="round" className="animate-motion-line-1" />
              <path d="M3 17H5" stroke={color} strokeWidth="1" strokeLinecap="round" className="animate-motion-line-2" />
            </>
          )}
        </svg>
      </div>
    ),

    // EVENT SPACE - Feu d'artifice bien visible
    EVENT_SPACE: (
      <div className={wrapperClass}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          {/* Fusée de feu d'artifice (base) */}
          <path
            d="M12 22V16"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            className={isAnimating ? "animate-rocket-launch" : ""}
          />
          <path
            d="M10 22L12 20L14 22"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Centre de l'explosion */}
          <circle
            cx="12" cy="8" r="2"
            stroke={color}
            strokeWidth="1.5"
            fill={isAnimating ? color : "none"}
            className={isAnimating ? "animate-explosion-center" : ""}
          />

          {/* Rayons de l'explosion - étoile à 8 branches */}
          <g className={isAnimating ? "animate-firework-rays" : ""}>
            {/* Haut */}
            <path d="M12 6V2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="1" r="1" fill={color} />
            {/* Bas */}
            <path d="M12 10V12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            {/* Gauche */}
            <path d="M10 8H5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="4" cy="8" r="1" fill={color} />
            {/* Droite */}
            <path d="M14 8H19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="20" cy="8" r="1" fill={color} />
            {/* Diagonales */}
            <path d="M9.5 5.5L7 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="6" cy="2" r="0.8" fill={color} />
            <path d="M14.5 5.5L17 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="18" cy="2" r="0.8" fill={color} />
            <path d="M9.5 10.5L7 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14.5 10.5L17 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Étincelles */}
          {isAnimating && (
            <>
              <circle cx="8" cy="5" r="0.5" fill={color} className="animate-sparkle-1" />
              <circle cx="16" cy="5" r="0.5" fill={color} className="animate-sparkle-2" />
              <circle cx="6" cy="10" r="0.5" fill={color} className="animate-sparkle-3" />
              <circle cx="18" cy="10" r="0.5" fill={color} className="animate-sparkle-4" />
              <circle cx="10" cy="3" r="0.4" fill={color} className="animate-sparkle-5" />
              <circle cx="14" cy="3" r="0.4" fill={color} className="animate-sparkle-6" />
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
// SEARCH BAR COMPONENT - Animation fluide de rétrécissement
// ============================================================================

function SearchBar({ isCompact }: { isCompact: boolean }) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"location" | "dates" | "hours" | "guests">("location");
  const [bookingMode, setBookingMode] = useState<BookingMode>("days");
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [guests, setGuests] = useState(1);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (bookingMode === "days") {
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
    } else {
      if (startDate) params.set("date", startDate);
      if (startTime) params.set("startTime", startTime);
      if (endTime) params.set("endTime", endTime);
      params.set("mode", "hourly");
    }
    if (guests > 1) params.set("guests", guests.toString());
    router.push(`/listings?${params.toString()}`);
  };

  const today = new Date().toISOString().split("T")[0];

  // Générer les options d'heures
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    timeOptions.push(`${h.toString().padStart(2, "0")}:00`);
    timeOptions.push(`${h.toString().padStart(2, "0")}:30`);
  }

  // Textes pour le mode compact
  const getLocationText = () => query || "N'importe où";
  const getDatesText = () => {
    if (startDate) {
      const dateStr = new Date(startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      if (bookingMode === "hours") {
        return `${dateStr}`;
      } else if (endDate) {
        const endStr = new Date(endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
        return `${dateStr} - ${endStr}`;
      }
      return dateStr;
    }
    return "N'importe quand";
  };
  const getGuestsText = () => guests > 1 ? `${guests} voyageurs` : "Voyageurs";

  // Mode compact ou expanded selon isCompact ET isExpanded
  const showCompact = isCompact && !isExpanded;

  return (
    <div ref={searchRef} className="relative w-full max-w-3xl mx-auto">
      {/* Barre de recherche avec animation de taille fluide */}
      <div
        onClick={() => { if (showCompact) setIsExpanded(true); }}
        className={`relative rounded-full border bg-white transition-all duration-500 ease-out cursor-pointer ${
          isExpanded ? "border-gray-300 shadow-xl" : "border-gray-200 shadow-md hover:shadow-lg"
        }`}
        style={{
          transform: showCompact ? "scale(0.85)" : "scale(1)",
          transformOrigin: "center center",
        }}
      >
        <div className="flex items-center">
          {/* Location */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); setActiveTab("location"); }}
            className={`flex-1 text-left rounded-l-full transition-all duration-300 ${
              isExpanded && activeTab === "location" ? "bg-gray-50" : "hover:bg-gray-50"
            } ${showCompact ? "px-4 py-2" : "px-6 py-4"}`}
          >
            <p className={`font-semibold text-gray-900 transition-all duration-300 ${showCompact ? "text-[10px]" : "text-xs"}`}>
              Destination
            </p>
            {showCompact ? (
              <p className="text-xs text-gray-500 truncate">{getLocationText()}</p>
            ) : (
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { setIsExpanded(true); setActiveTab("location"); }}
                placeholder="Rechercher une destination"
                className="w-full bg-transparent text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </button>

          <div className={`w-px bg-gray-200 transition-all duration-300 ${showCompact ? "h-6" : "h-8"}`} />

          {/* Dates */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); setActiveTab(bookingMode === "hours" ? "hours" : "dates"); }}
            className={`flex-1 text-left transition-all duration-300 ${
              isExpanded && (activeTab === "dates" || activeTab === "hours") ? "bg-gray-50" : "hover:bg-gray-50"
            } ${showCompact ? "px-4 py-2" : "px-6 py-4"}`}
          >
            <p className={`font-semibold text-gray-900 transition-all duration-300 ${showCompact ? "text-[10px]" : "text-xs"}`}>
              Dates
            </p>
            <p className={`text-gray-500 truncate transition-all duration-300 ${showCompact ? "text-xs" : "text-sm"}`}>
              {getDatesText()}
            </p>
          </button>

          <div className={`w-px bg-gray-200 transition-all duration-300 ${showCompact ? "h-6" : "h-8"}`} />

          {/* Guests */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); setActiveTab("guests"); }}
            className={`flex-1 text-left transition-all duration-300 ${
              isExpanded && activeTab === "guests" ? "bg-gray-50" : "hover:bg-gray-50"
            } ${showCompact ? "px-4 py-2" : "px-6 py-4"}`}
          >
            <p className={`font-semibold text-gray-900 transition-all duration-300 ${showCompact ? "text-[10px]" : "text-xs"}`}>
              Voyageurs
            </p>
            <p className={`text-gray-500 truncate transition-all duration-300 ${showCompact ? "text-xs" : "text-sm"}`}>
              {getGuestsText()}
            </p>
          </button>

          {/* Search Button */}
          <div className={`transition-all duration-300 ${showCompact ? "pr-1" : "pr-2"}`}>
            <button
              onClick={(e) => { e.stopPropagation(); handleSearch(); }}
              className={`flex items-center justify-center rounded-full bg-gray-900 text-white transition-all duration-300 hover:bg-gray-800 active:scale-95 ${
                showCompact ? "h-8 w-8" : "h-12 w-12"
              }`}
            >
              <svg className={`transition-all duration-300 ${showCompact ? "h-4 w-4" : "h-5 w-5"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Panneau déroulant */}
      {isExpanded && (
        <div className="absolute left-0 right-0 top-full mt-3 animate-dropdown-appear" style={{ zIndex: 9999 }}>
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
                        setActiveTab(bookingMode === "hours" ? "hours" : "dates");
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

            {(activeTab === "dates" || activeTab === "hours") && (
              <div className="space-y-4">
                {/* Mode selector */}
                <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                  <button
                    onClick={() => { setBookingMode("days"); setActiveTab("dates"); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      bookingMode === "days" ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    À la journée
                  </button>
                  <button
                    onClick={() => { setBookingMode("hours"); setActiveTab("hours"); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      bookingMode === "hours" ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    À l&apos;heure
                  </button>
                </div>

                {bookingMode === "days" ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-gray-900">Sélectionnez votre créneau</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-600">Date</label>
                        <input
                          type="date"
                          value={startDate}
                          min={today}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-gray-600">Heure de début</label>
                          <select
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                          >
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-gray-600">Heure de fin</label>
                          <select
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                          >
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {[
                          { label: "Matinée (9h-12h)", start: "09:00", end: "12:00" },
                          { label: "Après-midi (14h-18h)", start: "14:00", end: "18:00" },
                          { label: "Journée (9h-18h)", start: "09:00", end: "18:00" },
                          { label: "Soirée (18h-22h)", start: "18:00", end: "22:00" },
                        ].map((slot) => (
                          <button
                            key={slot.label}
                            onClick={() => {
                              setStartTime(slot.start);
                              setEndTime(slot.end);
                              if (!startDate) {
                                setStartDate(today);
                              }
                              setActiveTab("guests");
                            }}
                            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
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
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Scroll detection pour la barre de recherche et les catégories
  useEffect(() => {
    let lastScrollY = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setIsScrolled(heroBottom < 80);
      }

      // Collapse categories quand on scroll vers le bas après 150px
      if (currentScrollY > 150 && currentScrollY > lastScrollY) {
        setCategoriesCollapsed(true);
      }
      // Expand categories quand on remonte près du top
      else if (currentScrollY < 100) {
        setCategoriesCollapsed(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredCards = activeCategory
    ? cards.filter((card) => card.type === activeCategory)
    : cards;

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
        @keyframes brush-draw {
          0% { transform: translate(0, 0) rotate(0deg); }
          30% { transform: translate(-6px, 6px) rotate(-20deg); }
          60% { transform: translate(-3px, 3px) rotate(-10deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes paint-line-draw {
          0% { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes canvas-appear {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes drop-fall {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          50% { transform: translateY(1px) scale(1); opacity: 1; }
          100% { transform: translateY(3px) scale(0.8); opacity: 0; }
        }
        .animate-brush-draw { animation: brush-draw 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-paint-line { animation: paint-line-draw 1s ease-out 0.3s forwards; }
        .animate-canvas-appear { animation: canvas-appear 0.5s ease-out forwards; }
        .animate-drop-1 { animation: drop-fall 0.8s ease-out 0.8s forwards; }
        .animate-drop-2 { animation: drop-fall 0.8s ease-out 1s forwards; }

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
           PARKING - Car arrives
           ============================================ */
        @keyframes car-arrive {
          0% { transform: translateX(-20px); opacity: 0; }
          60% { transform: translateX(3px); opacity: 1; }
          80% { transform: translateX(-1px); }
          100% { transform: translateX(0); }
        }
        @keyframes headlight-blink {
          0%, 40% { opacity: 0.3; }
          50% { opacity: 1; }
          60% { opacity: 0.3; }
          70% { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes motion-line {
          0% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(-5px); }
        }
        .animate-car-arrive { animation: car-arrive 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-headlight-blink { animation: headlight-blink 1s ease-out forwards; }
        .animate-motion-line-1 { animation: motion-line 0.5s ease-out forwards; }
        .animate-motion-line-2 { animation: motion-line 0.5s ease-out 0.1s forwards; }

        /* ============================================
           EVENT SPACE - Firework explosion
           ============================================ */
        @keyframes rocket-launch {
          0% { transform: translateY(5px); opacity: 0; }
          50% { transform: translateY(-2px); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes explosion-center {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes firework-rays {
          0% { transform: scale(0); opacity: 0; }
          30% { transform: scale(0.5); opacity: 0.5; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes sparkle {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(1); opacity: 0.7; }
        }
        .animate-rocket-launch { animation: rocket-launch 0.5s ease-out forwards; }
        .animate-explosion-center { animation: explosion-center 0.6s ease-out 0.3s forwards; }
        .animate-firework-rays { animation: firework-rays 0.8s ease-out 0.4s forwards; }
        .animate-sparkle-1 { animation: sparkle 0.6s ease-out 0.5s forwards; }
        .animate-sparkle-2 { animation: sparkle 0.6s ease-out 0.6s forwards; }
        .animate-sparkle-3 { animation: sparkle 0.6s ease-out 0.7s forwards; }
        .animate-sparkle-4 { animation: sparkle 0.6s ease-out 0.8s forwards; }
        .animate-sparkle-5 { animation: sparkle 0.6s ease-out 0.55s forwards; }
        .animate-sparkle-6 { animation: sparkle 0.6s ease-out 0.65s forwards; }

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

        /* ============================================
           CATEGORIES SMOOTH COLLAPSE ANIMATION
           Animation fluide et premium
           ============================================ */
        @keyframes category-collapse {
          0% {
            opacity: 1;
            transform: scale(1) translateX(0);
            max-width: 150px;
          }
          100% {
            opacity: 0;
            transform: scale(0.3) translateX(-20px);
            max-width: 0;
            padding: 0;
            margin: 0;
          }
        }

        @keyframes category-expand {
          0% {
            opacity: 0;
            transform: scale(0.3) translateX(-20px);
            max-width: 0;
          }
          100% {
            opacity: 1;
            transform: scale(1) translateX(0);
            max-width: 150px;
          }
        }

        .animate-category-collapse {
          animation: category-collapse 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          overflow: hidden;
        }

        .animate-category-expand {
          animation: category-expand 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          overflow: hidden;
        }

        /* Délais échelonnés pour effet cascade */
        .collapse-delay-1 { animation-delay: 0ms; }
        .collapse-delay-2 { animation-delay: 30ms; }
        .collapse-delay-3 { animation-delay: 60ms; }
        .collapse-delay-4 { animation-delay: 90ms; }
        .collapse-delay-5 { animation-delay: 120ms; }
        .collapse-delay-6 { animation-delay: 150ms; }
        .collapse-delay-7 { animation-delay: 180ms; }
        .collapse-delay-8 { animation-delay: 210ms; }

        /* Animation du compteur dans Tous */
        @keyframes count-pop {
          0% { transform: scale(0); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .animate-count-pop {
          animation: count-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Scrollbar cachée mais fonctionnelle */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

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
        </div>
      </section>

      {/* STICKY HEADER - Barre de recherche style Airbnb */}
      <div
        className={`sticky z-50 transition-all duration-300 ${
          isScrolled
            ? "top-0 bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200"
            : "top-0 bg-[#FAFAFA]"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-center transition-all duration-300 ${isScrolled ? "py-3" : "py-4"}`}>
            {/* Barre de recherche - Grande barre → Bouton compact au scroll */}
            <div className={`w-full transition-all duration-500 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
              <SearchBar isCompact={isScrolled} />
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORIES - Animation premium où elles rentrent dans "Tous" */}
      <section
        className={`border-b border-gray-200 bg-white sticky z-40 transition-all duration-300 ${
          isScrolled ? "top-[56px]" : "top-[72px]"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {/* Bouton "Tous" - S'agrandit quand les catégories sont collapsed */}
            <div className="relative">
              <button
                onClick={() => {
                  setActiveCategory(null);
                  if (categoriesCollapsed) {
                    setCategoriesCollapsed(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className={`flex items-center gap-2 px-4 py-3 transition-all duration-500 ease-out ${
                  activeCategory === null
                    ? "border-b-2 border-gray-900"
                    : "border-b-2 border-transparent opacity-60 hover:opacity-100"
                } ${categoriesCollapsed ? "bg-gray-900 rounded-full text-white border-none px-5" : ""}`}
              >
                <div className={`relative transition-all duration-300 ${categoriesCollapsed ? "scale-90" : ""}`}>
                  <CategoryIcon category="ALL" isActive={!categoriesCollapsed && activeCategory === null} isAnimating={false} />
                </div>
                <span className={`whitespace-nowrap text-xs font-medium transition-all duration-300 ${
                  categoriesCollapsed ? "text-white" : activeCategory === null ? "text-gray-900" : "text-gray-600"
                }`}>
                  Tous
                </span>
                {/* Badge avec le nombre de catégories */}
                <span
                  className={`flex items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${
                    categoriesCollapsed
                      ? "h-5 w-5 bg-white text-gray-900 opacity-100 scale-100"
                      : "h-0 w-0 opacity-0 scale-0"
                  }`}
                >
                  {categories.length}
                </span>
              </button>
            </div>

            {/* Autres catégories - Animation de slide/fade vers "Tous" */}
            {categories.map((cat, index) => (
              <div
                key={cat.key}
                className="transition-all duration-500 ease-out"
                style={{
                  opacity: categoriesCollapsed ? 0 : 1,
                  transform: categoriesCollapsed
                    ? `translateX(-${(index + 1) * 40}px) scale(0.5)`
                    : "translateX(0) scale(1)",
                  maxWidth: categoriesCollapsed ? 0 : "200px",
                  overflow: "hidden",
                  transitionDelay: categoriesCollapsed ? `${index * 30}ms` : `${(categories.length - index) * 30}ms`,
                }}
              >
                <CategoryButton
                  category={cat.key}
                  label={cat.label}
                  isActive={activeCategory === cat.key}
                  onClick={() => setActiveCategory(cat.key === activeCategory ? null : cat.key)}
                />
              </div>
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
