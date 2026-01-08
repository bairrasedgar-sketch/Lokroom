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
  emoji: string;
};

const POPULAR_DESTINATIONS: PopularDestination[] = [
  // France
  { city: "Paris", country: "France", emoji: "" },
  { city: "Lyon", country: "France", emoji: "" },
  { city: "Bordeaux", country: "France", emoji: "" },
  { city: "Nice", country: "France", emoji: "" },
  { city: "Marseille", country: "France", emoji: "" },
  { city: "Toulouse", country: "France", emoji: "" },
  { city: "Nantes", country: "France", emoji: "" },
  { city: "Strasbourg", country: "France", emoji: "" },
  { city: "Lille", country: "France", emoji: "" },
  { city: "Montpellier", country: "France", emoji: "" },
  { city: "Rennes", country: "France", emoji: "" },
  // Canada
  { city: "Montréal", country: "Canada", emoji: "" },
  { city: "Toronto", country: "Canada", emoji: "" },
  { city: "Québec", country: "Canada", emoji: "" },
  { city: "Vancouver", country: "Canada", emoji: "" },
  { city: "Ottawa", country: "Canada", emoji: "" },
  { city: "Calgary", country: "Canada", emoji: "" },
  { city: "Edmonton", country: "Canada", emoji: "" },
  { city: "Winnipeg", country: "Canada", emoji: "" },
  { city: "Halifax", country: "Canada", emoji: "" },
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

  const [activeTab, setActiveTab] = useState<"destination" | "dates" | "guests">(initialTab);
  const [destination, setDestination] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  const today = new Date().toISOString().split("T")[0];

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
    if (endDate) params.set("endDate", endDate);
    if (guests > 1) params.set("guests", guests.toString());

    // Sauvegarder dans l'historique si connecté
    if (session?.user && destination) {
      try {
        await fetch("/api/search-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destination, startDate, endDate, guests }),
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
    if (history.guests) setGuests(history.guests);
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

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-start justify-center pt-0 sm:pt-20 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-full h-full sm:h-auto sm:max-w-3xl bg-white sm:rounded-3xl shadow-2xl overflow-hidden animate-modal-appear"
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

        {/* Résumé de la recherche - Scrollable sur mobile */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-100 overflow-x-auto">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm flex-shrink-0 ${destination ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="whitespace-nowrap">{destination || "Destination"}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm flex-shrink-0 ${startDate ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="whitespace-nowrap">
              {startDate && endDate ? `${new Date(startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} - ${new Date(endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}` : startDate ? new Date(startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "Dates"}
            </span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm flex-shrink-0 ${guests > 1 ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="whitespace-nowrap">{guests} {guests > 1 ? "voyageurs" : "voyageur"}</span>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="p-4 sm:p-6 min-h-[300px] max-h-[calc(100vh-220px)] sm:max-h-[60vh] overflow-y-auto">
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
                  autoFocus
                  popularCities={POPULAR_DESTINATIONS.map(d => ({
                    main: d.city,
                    secondary: d.country,
                    icon: d.emoji,
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
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Sélectionnez vos dates
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Arrivée
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      min={today}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Départ
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || today}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Raccourcis de dates */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Suggestions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Ce week-end", type: "weekend" },
                    { label: "Semaine prochaine", type: "week" },
                    { label: "Ce mois-ci", type: "month" },
                    { label: "Flexible", type: "flexible" },
                  ].map((shortcut) => (
                    <button
                      key={shortcut.type}
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
                        } else if (shortcut.type === "month") {
                          start.setDate(todayDate.getDate() + 1);
                          end.setDate(start.getDate() + 30);
                        } else {
                          // Flexible - pas de dates
                          setStartDate("");
                          setEndDate("");
                          setActiveTab("guests");
                          return;
                        }

                        setStartDate(start.toISOString().split("T")[0]);
                        setEndDate(end.toISOString().split("T")[0]);
                        setActiveTab("guests");
                      }}
                      className="px-4 py-2 border border-gray-200 hover:border-gray-400 rounded-full text-sm font-medium text-gray-700 transition-colors"
                    >
                      {shortcut.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "guests" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Combien de voyageurs ?
                </h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Voyageurs</p>
                    <p className="text-sm text-gray-500">Nombre de personnes</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      disabled={guests <= 1}
                      aria-label="Diminuer le nombre de voyageurs"
                      className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-8 text-center text-lg font-semibold text-gray-900">
                      {guests}
                    </span>
                    <button
                      onClick={() => setGuests(Math.min(16, guests + 1))}
                      disabled={guests >= 16}
                      aria-label="Augmenter le nombre de voyageurs"
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

        {/* Footer avec bouton recherche */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => {
              setDestination("");
              setStartDate("");
              setEndDate("");
              setGuests(1);
            }}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 underline"
          >
            Tout effacer
          </button>
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-medium transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
