"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSearchBar } from "@/contexts/SearchBarContext";
import SearchModal from "./SearchModal";
import FavoriteButton from "./FavoriteButton";
import { CityIllustration } from "./CityIllustrations";
import CategoryIcon from "./CategoryIcon";

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
              aria-label="Rechercher"
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
                      <CityIllustration city={dest.city} className="w-10 h-10 rounded-lg" />
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
                      aria-label="Diminuer le nombre de voyageurs"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-8 text-center text-lg font-semibold">{guests}</span>
                    <button
                      onClick={() => setGuests(Math.min(16, guests + 1))}
                      aria-label="Augmenter le nombre de voyageurs"
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

  const images = card.images || [];
  const hasMultipleImages = images.length > 1;

  return (
    <div
      className="group relative animate-fade-in"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setImageIndex(0); }}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image Container - séparé du Link pour le bouton favori */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
        <Link href={`/listings/${card.id}`} className="block absolute inset-0">
          {images.length > 0 ? (
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${imageIndex * 100}%)` }}
            >
              {images.map((image, idx) => (
                <div key={image.id || idx} className="relative h-full w-full flex-shrink-0">
                  <Image
                    src={image.url}
                    alt={`${card.title} - ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    priority={idx === 0}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
          )}
        </Link>

        {/* Image Navigation Dots - en dehors du Link */}
        {hasMultipleImages && isHovered && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImageIndex(i); }}
                aria-label={`Voir image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === imageIndex ? "w-4 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}

        {/* Navigation Arrows - en dehors du Link */}
        {hasMultipleImages && isHovered && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
              }}
              aria-label="Image precedente"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm border border-gray-200/50 transition-all hover:bg-white hover:scale-105 hover:shadow-md z-10"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
              }}
              aria-label="Image suivante"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm border border-gray-200/50 transition-all hover:bg-white hover:scale-105 hover:shadow-md z-10"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Favorite Button - en dehors du Link */}
        <div className="absolute right-3 top-3 z-20">
          <FavoriteButton listingId={card.id} size={24} variant="card" />
        </div>

        {/* Instant Book Badge */}
        {card.isInstantBook && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-900 shadow-md z-10">
            <svg className="h-3 w-3 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Instantané
          </div>
        )}
      </div>

      {/* Card Content */}
      <Link href={`/listings/${card.id}`} className="block mt-3 space-y-1">
        {/* Category Badge */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            <span>{getCategoryEmoji(card.type)}</span>
            {LISTING_TYPE_LABELS[card.type] || card.type}
          </span>
        </div>
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
      className={`group flex flex-col items-center gap-1 px-3 py-2 transition-all duration-300 flex-shrink-0 ${
        isActive
          ? "text-gray-900"
          : "text-gray-400 hover:text-gray-600"
      }`}
    >
      <div className={`relative p-2 rounded-full transition-all duration-300 ${
        isActive
          ? "bg-gray-100"
          : "group-hover:bg-gray-50"
      }`}>
        <CategoryIcon category={category} isActive={isActive} isAnimating={isAnimating} />
      </div>
      <span className={`whitespace-nowrap text-[11px] font-medium ${isActive ? "text-gray-900" : "text-gray-500"}`}>
        {label}
      </span>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// Helper pour obtenir le label de chaque type de listing
const LISTING_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  ROOM: "Chambre",
  STUDIO: "Studio",
  OFFICE: "Bureau",
  COWORKING: "Coworking",
  MEETING_ROOM: "Salle de réunion",
  PARKING: "Parking",
  GARAGE: "Garage",
  STORAGE: "Stockage",
  EVENT_SPACE: "Événementiel",
  RECORDING_STUDIO: "Studios",
  OTHER: "Autre",
};

// Helper pour obtenir l'emoji de chaque catégorie
function getCategoryEmoji(key: string): string {
  const emojis: Record<string, string> = {
    APARTMENT: "🏢",
    HOUSE: "🏠",
    ROOM: "🛏️",
    STUDIO: "🎨",
    OFFICE: "💼",
    COWORKING: "👥",
    MEETING_ROOM: "📊",
    PARKING: "🚗",
    GARAGE: "🚙",
    STORAGE: "📦",
    EVENT_SPACE: "🎉",
    RECORDING_STUDIO: "🎤",
    OTHER: "✨",
  };
  return emojis[key] || "🏠";
}

export default function HomeClient({ cards, categories }: HomeClientProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  // Ordre des catégories les plus recherchées
  const CATEGORY_ORDER = [
    "HOUSE", "APARTMENT", "PARKING", "ROOM", "GARAGE", "STORAGE",
    "OFFICE", "MEETING_ROOM", "COWORKING", "EVENT_SPACE", "RECORDING_STUDIO", "OTHER"
  ];

  // Labels pour toutes les catégories
  const CATEGORY_LABELS: Record<string, string> = {
    HOUSE: "Maison",
    APARTMENT: "Appartement",
    PARKING: "Parking",
    ROOM: "Chambre",
    GARAGE: "Garage",
    STORAGE: "Stockage",
    OFFICE: "Bureau",
    MEETING_ROOM: "Salle de réunion",
    COWORKING: "Coworking",
    EVENT_SPACE: "Événementiel",
    RECORDING_STUDIO: "Studios",
    OTHER: "Autre",
  };

  // Créer la liste complète des catégories triées
  const sortedCategories = CATEGORY_ORDER.map(key => {
    const existing = categories.find(c => c.key === key);
    return existing || { key, label: CATEGORY_LABELS[key] || key, icon: "", count: 0 };
  });

  // Context pour partager la SearchBar et les catégories avec la Navbar
  const {
    setSearchBarElement,
    setShowInNavbar,
    setCategories,
    activeCategory,
    setActiveCategory
  } = useSearchBar();

  // Ouvrir le modal si ?search=open dans l'URL
  useEffect(() => {
    if (searchParams.get("search") === "open") {
      setIsSearchModalOpen(true);
    }
  }, [searchParams]);

  // Écouter l'événement pour ouvrir le modal depuis la navbar
  useEffect(() => {
    const handleOpenSearchModal = () => setIsSearchModalOpen(true);
    window.addEventListener("openSearchModal", handleOpenSearchModal);
    return () => window.removeEventListener("openSearchModal", handleOpenSearchModal);
  }, []);

  useEffect(() => {
    setIsLoaded(true);
    // Envoyer les catégories au contexte
    setCategories(categories);
  }, [categories, setCategories]);

  // Synchroniser l'état du scroll avec le contexte pour la Navbar
  useEffect(() => {
    setShowInNavbar(isScrolled);
  }, [isScrolled, setShowInNavbar]);

  // Ne plus envoyer de SearchBar au contexte (elle est maintenant dans HomeClient)
  useEffect(() => {
    setSearchBarElement(null);
  }, [setSearchBarElement]);

  // Scroll detection pour la barre de recherche
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setIsScrolled(heroBottom < 80);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredCards = activeCategory
    ? cards.filter((card) => card.type === activeCategory)
    : cards;

  return (
    <main className="min-h-screen bg-white">
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

        /* Heart pop animation for favorite button */
        @keyframes heart-pop {
          0% { transform: scale(1); }
          25% { transform: scale(1.3); }
          50% { transform: scale(0.95); }
          75% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-heart-pop {
          animation: heart-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
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

        /* Scrollbar fine et visible */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
      `}</style>

      {/* HERO SECTION */}
      <section ref={heroRef} className="relative bg-white pt-8 overflow-hidden">
        {/* Subtle Lok'Room themed background pattern */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Floating house icons - very subtle */}
          <svg className="absolute top-10 left-[10%] w-16 h-16 text-gray-200/40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z"/>
          </svg>
          <svg className="absolute top-32 right-[15%] w-12 h-12 text-gray-200/30 rotate-12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z"/>
          </svg>
          <svg className="absolute bottom-20 left-[20%] w-10 h-10 text-gray-200/25 -rotate-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z"/>
          </svg>

          {/* Key icons */}
          <svg className="absolute top-20 right-[8%] w-10 h-10 text-gray-200/30 rotate-45" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
          <svg className="absolute bottom-32 right-[25%] w-8 h-8 text-gray-200/25 -rotate-12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>

          {/* Building icons */}
          <svg className="absolute top-40 left-[5%] w-14 h-14 text-gray-200/20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/>
          </svg>
          <svg className="absolute bottom-10 right-[10%] w-12 h-12 text-gray-200/25 rotate-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/>
          </svg>

          {/* Location pin */}
          <svg className="absolute top-16 left-[40%] w-8 h-8 text-gray-200/20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>

        <div className="relative mx-auto max-w-[1800px] 3xl:max-w-[2200px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          {/* Hero Content */}
          <div className={`mx-auto max-w-3xl lg:max-w-4xl text-center transition-all duration-700 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight text-gray-900">
              Trouvez l&apos;espace parfait
            </h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl text-gray-500">
              Appartements, bureaux, studios, espaces événementiels...
              <br className="hidden sm:block" />
              Réservez pour une heure ou plusieurs jours.
            </p>
          </div>
        </div>
      </section>

      {/* SEARCH BAR - Sous le héro, disparaît quand scrollé */}
      <div
        className={`transition-all duration-700 ease-out ${
          isScrolled
            ? "opacity-0 max-h-0 overflow-hidden py-0"
            : "opacity-100 max-h-40 bg-white py-6"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            {/* Barre de recherche grande - Desktop */}
            <div className="hidden sm:block w-full max-w-3xl">
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="flex items-center rounded-full border border-gray-300 bg-white shadow-lg hover:shadow-xl transition-all py-2 px-2 w-full"
              >
                {/* Section Destination */}
                <div className="flex-1 px-6 py-3 border-r border-gray-200 text-left">
                  <p className="text-xs font-medium text-gray-900">Destination</p>
                  <p className="text-sm text-gray-500 mt-0.5">Rechercher une destination</p>
                </div>

                {/* Section Dates */}
                <div className="flex-1 px-6 py-3 border-r border-gray-200 text-left">
                  <p className="text-xs font-medium text-gray-900">Quand</p>
                  <p className="text-sm text-gray-500 mt-0.5">Ajouter des dates</p>
                </div>

                {/* Section Voyageurs */}
                <div className="flex-1 px-6 py-3 text-left">
                  <p className="text-xs font-medium text-gray-900">Voyageurs</p>
                  <p className="text-sm text-gray-500 mt-0.5">Ajouter des voyageurs</p>
                </div>

                {/* Bouton recherche */}
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gray-900 hover:bg-black transition-colors flex-shrink-0">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Barre de recherche - Mobile */}
            <div className="sm:hidden w-full">
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="flex items-center gap-3 w-full rounded-full border border-gray-300 bg-white shadow-lg hover:shadow-xl transition-all py-3 px-4"
              >
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-900 flex-shrink-0">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">Rechercher</p>
                  <p className="text-xs text-gray-500">Destination, dates, voyageurs</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORIES - Visible seulement quand pas scrollé - avec animation fluide */}
      <section
        className={`border-b border-gray-200 bg-white transition-all duration-500 ease-out ${
          isScrolled
            ? "opacity-0 max-h-0 py-0 overflow-hidden -translate-y-2"
            : "opacity-100 max-h-24 py-1 translate-y-0"
        }`}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3">
            {/* Bouton "Tous" - fixe à gauche */}
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 flex-shrink-0 text-sm ${
                activeCategory === null
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <svg className={`h-4 w-4 ${activeCategory === null ? "text-white" : "text-gray-700"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <span className="whitespace-nowrap font-medium">Tous</span>
            </button>

            {/* Séparateur */}
            <div className="w-px h-6 bg-gray-200 mx-2 flex-shrink-0" />

            {/* Autres catégories - scrollables */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin flex-1">
              {sortedCategories.map((cat) => (
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
        </div>
      </section>

      {/* LISTINGS GRID */}
      <section className="mx-auto max-w-[1800px] 3xl:max-w-[2200px] 4xl:max-w-[2800px] px-4 py-6 sm:py-8 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 line-clamp-1">
              {activeCategory ? categories.find(c => c.key === activeCategory)?.label : "Découvrez nos espaces"}
            </h2>
          </div>
          <Link
            href="/listings"
            className="group flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 flex-shrink-0"
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
          <div className="grid gap-4 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
            {filteredCards.map((card, i) => (
              <ListingCard key={card.id} card={card} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* DECORATIVE VISUAL SECTION */}
      <section className="py-4 sm:py-6 lg:py-8 overflow-hidden">
        <div className="mx-auto max-w-[1800px] 3xl:max-w-[2200px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Illustration - À gauche */}
            <div className="relative hidden sm:block">
              <Image
                src="/illustration final 2.png"
                alt="Illustration Lok'Room"
                width={700}
                height={500}
                className="w-full max-w-[550px] lg:max-w-[700px] h-auto"
              />
            </div>

            {/* Text Content - À droite */}
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">
                Des espaces pour chaque besoin
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-500 leading-relaxed">
                Que vous cherchiez un appartement pour vos vacances, un bureau pour votre équipe,
                ou un studio pour votre projet créatif, trouvez l&apos;espace idéal parmi notre sélection.
              </p>
              <div className="mt-6 sm:mt-8 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-gray-50 py-4 sm:py-6 lg:py-8">
        <div className="mx-auto max-w-[1800px] 3xl:max-w-[2200px] px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="rounded-2xl bg-gray-900 px-6 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12 text-center">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">
              Vous avez un espace à louer ?
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-400 max-w-md mx-auto">
              Rejoignez notre communauté d&apos;hôtes et commencez à générer des revenus.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href={isLoggedIn ? "/host/listings/new" : "/become-host"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-gray-900 transition-all hover:bg-gray-100"
              >
                {isLoggedIn ? "Créer une annonce" : "Devenir hôte"}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/listings"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-gray-600 px-6 py-3 font-medium text-white transition-all hover:bg-gray-800"
              >
                Explorer les espaces
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH MODAL */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </main>
  );
}
