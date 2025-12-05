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
// ANIMATED COUNTER
// ============================================================================

function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime: number | null = null;
          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeOut * end));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <span ref={countRef} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// ============================================================================
// SEARCH BAR COMPONENT
// ============================================================================

function PremiumSearchBar() {
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"location" | "dates" | "guests">("location");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState(1);

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
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main Search Bar */}
      <div
        className={`relative rounded-full border bg-white shadow-lg transition-all duration-500 ${
          searchFocused
            ? "border-gray-300 shadow-2xl scale-[1.02]"
            : "border-gray-200 hover:shadow-xl"
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Destination</p>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { setSearchFocused(true); setActiveTab("location"); }}
              placeholder="Rechercher une destination"
              className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Dates</p>
            <p className="text-sm text-gray-900">
              {startDate && endDate
                ? `${new Date(startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} - ${new Date(endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                : "Quand partez-vous ?"}
            </p>
          </button>

          <div className="h-8 w-px bg-gray-200" />

          {/* Guests */}
          <button
            type="button"
            onClick={() => { setSearchFocused(true); setActiveTab("guests"); }}
            className={`flex-1 px-6 py-4 text-left transition-colors ${
              searchFocused && activeTab === "guests" ? "bg-gray-50" : "hover:bg-gray-50"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Voyageurs</p>
            <p className="text-sm text-gray-900">
              {guests > 1 ? `${guests} voyageurs` : "Ajouter des voyageurs"}
            </p>
          </button>

          {/* Search Button */}
          <div className="pr-2">
            <button
              onClick={handleSearch}
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3 text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <span className="hidden sm:inline font-medium">Rechercher</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Search Panel */}
      {searchFocused && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setSearchFocused(false)}
          />

          {/* Panel */}
          <div className="absolute left-0 right-0 top-full z-50 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
              {activeTab === "location" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Destinations populaires</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { city: "Paris", country: "France", emoji: "🇫🇷" },
                      { city: "Montréal", country: "Canada", emoji: "🇨🇦" },
                      { city: "Lyon", country: "France", emoji: "🇫🇷" },
                      { city: "Toronto", country: "Canada", emoji: "🇨🇦" },
                    ].map((dest) => (
                      <button
                        key={dest.city}
                        onClick={() => {
                          setQuery(dest.city);
                          setActiveTab("dates");
                        }}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 text-left transition-all hover:border-gray-300 hover:bg-gray-50 hover:scale-[1.02]"
                      >
                        <span className="text-2xl">{dest.emoji}</span>
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
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">Départ</label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || today}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Ce week-end", days: "weekend" as const },
                      { label: "Semaine prochaine", days: 7 as const },
                      { label: "Ce mois-ci", days: 30 as const },
                      { label: "Flexible", days: 0 as const },
                    ].map((shortcut) => (
                      <button
                        key={shortcut.label}
                        onClick={() => {
                          const todayDate = new Date();
                          const start = new Date();
                          const end = new Date();
                          if (shortcut.days === "weekend") {
                            const dayOfWeek = todayDate.getDay();
                            const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
                            start.setDate(todayDate.getDate() + daysUntilSaturday);
                            end.setDate(start.getDate() + 1);
                          } else if (typeof shortcut.days === "number" && shortcut.days > 0) {
                            start.setDate(todayDate.getDate() + 1);
                            end.setDate(start.getDate() + shortcut.days);
                          }
                          if (shortcut.days !== 0) {
                            setStartDate(start.toISOString().split("T")[0]);
                            setEndDate(end.toISOString().split("T")[0]);
                          }
                          setActiveTab("guests");
                        }}
                        className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-50"
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
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-900"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-8 text-center text-lg font-semibold">{guests}</span>
                      <button
                        onClick={() => setGuests(Math.min(16, guests + 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-900"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleSearch}
                    className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl"
                  >
                    Rechercher
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
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
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setImageIndex(0); }}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <Link href={`/listings/${card.id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
          {images.length > 0 ? (
            <>
              <Image
                src={images[imageIndex]?.url || images[0]?.url}
                alt={card.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
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
              className={`h-7 w-7 drop-shadow-lg transition-colors ${
                isFavorited ? "fill-rose-500 text-rose-500" : "fill-black/30 text-white"
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
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-gray-900 shadow-lg backdrop-blur-sm">
              <svg className="h-3.5 w-3.5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Instantané
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        {/* Card Content */}
        <div className="mt-3 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold text-gray-900 group-hover:text-rose-600 transition-colors">
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
// MAIN COMPONENT
// ============================================================================

export default function HomeClient({ cards, categories, stats }: HomeClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const filteredCards = activeCategory
    ? cards.filter((card) => card.type === activeCategory)
    : cards;

  return (
    <main className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 h-full w-full animate-pulse rounded-full bg-rose-500/10 blur-3xl" />
          <div className="absolute -bottom-1/2 -right-1/2 h-full w-full animate-pulse rounded-full bg-purple-500/10 blur-3xl" style={{ animationDelay: "1s" }} />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          {/* Hero Content */}
          <div className={`mx-auto max-w-3xl text-center transition-all duration-1000 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
              <span className="text-sm font-medium text-white/80">Nouvelle plateforme en France & Canada</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Trouvez l&apos;espace
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent"> parfait </span>
              </span>
              pour chaque moment
            </h1>

            <p className="mt-6 text-lg text-gray-300 sm:text-xl">
              Appartements, bureaux, studios créatifs, espaces événementiels...
              <br className="hidden sm:block" />
              Réservez des espaces uniques en quelques clics.
            </p>
          </div>

          {/* Search Bar */}
          <div className={`mt-12 transition-all delay-300 duration-1000 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            <PremiumSearchBar />
          </div>

          {/* Stats */}
          <div className={`mt-16 grid grid-cols-3 gap-8 transition-all delay-500 duration-1000 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            {[
              { value: stats.totalListings, label: "Espaces disponibles", suffix: "+" },
              { value: stats.totalUsers, label: "Utilisateurs", suffix: "+" },
              { value: stats.totalCountries, label: "Pays", suffix: "" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-white sm:text-4xl">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-b border-gray-100 bg-white sticky top-16 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-4 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all ${
                activeCategory === null
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">🏠</span>
              <span className="whitespace-nowrap text-xs font-medium">Tous</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key === activeCategory ? null : cat.key)}
                className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all ${
                  activeCategory === cat.key
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="whitespace-nowrap text-xs font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* LISTINGS GRID */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {activeCategory ? categories.find(c => c.key === activeCategory)?.label : "Découvrez nos espaces"}
            </h2>
            <p className="mt-1 text-gray-500">
              {filteredCards.length} espace{filteredCards.length > 1 ? "s" : ""} disponible{filteredCards.length > 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/listings"
            className="group flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-50"
          >
            Voir tout
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {filteredCards.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 py-16 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Aucun espace dans cette catégorie</h3>
            <p className="mt-1 text-gray-500">Essayez une autre catégorie ou explorez tous nos espaces</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCards.map((card, i) => (
              <ListingCard key={card.id} card={card} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* TRUST SECTION */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Pourquoi choisir Lok&apos;Room ?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Une expérience de location repensée pour votre tranquillité
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                title: "Paiement 100% sécurisé",
                description: "Transactions protégées par Stripe. Votre argent est en sécurité jusqu'à votre arrivée.",
                color: "from-emerald-500 to-teal-500",
              },
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                ),
                title: "Hôtes vérifiés",
                description: "Chaque hôte est vérifié. Identité contrôlée pour une expérience sereine.",
                color: "from-blue-500 to-indigo-500",
              },
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Réservation instantanée",
                description: "Réservez en quelques secondes. Confirmation immédiate, sans attente.",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                ),
                title: "Support 7j/7",
                description: "Une équipe dédiée pour vous accompagner avant, pendant et après votre séjour.",
                color: "from-orange-500 to-red-500",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${feature.color} p-3 text-white`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative overflow-hidden bg-gray-900 py-24">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-purple-600/20" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                <svg className="h-5 w-5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Devenez hôte
              </span>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Rentabilisez votre espace
                <br />
                <span className="text-rose-400">en toute simplicité</span>
              </h2>
              <p className="mt-4 text-lg text-gray-300">
                Que vous ayez un appartement, un bureau, un studio ou un parking,
                commencez à générer des revenus dès aujourd&apos;hui.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/become-host"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-gray-900 shadow-lg transition-all hover:bg-gray-100 hover:scale-105"
                >
                  Commencer maintenant
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/listings"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
                >
                  En savoir plus
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "📋", title: "Vos règles", desc: "Fixez vos conditions" },
                { icon: "💳", title: "Paiements sûrs", desc: "Revenus garantis" },
                { icon: "🛡️", title: "Protection", desc: "Assurance incluse" },
                { icon: "📈", title: "Visibilité", desc: "Exposition maximale" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  <span className="text-3xl">{item.icon}</span>
                  <h3 className="mt-4 font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Prêt à trouver votre prochain espace ?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Rejoignez des milliers d&apos;utilisateurs qui font confiance à Lok&apos;Room
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
            >
              Explorer les espaces
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-8 py-4 font-semibold text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-50"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
