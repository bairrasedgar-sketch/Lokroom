"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Clock, TrendingUp, X } from "lucide-react";

interface CitySuggestion {
  name: string;
  country: string;
  count: number;
}

interface ListingSuggestion {
  id: string;
  title: string;
  city: string;
  type: string;
}

interface SearchHistory {
  id: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  guests: number | null;
  createdAt: Date;
}

export function SearchWithSuggestions() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cities, setCities] = useState<CitySuggestion[]>([]);
  const [listings, setListings] = useState<ListingSuggestion[]>([]);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fermer les suggestions au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Charger l'historique au focus
  useEffect(() => {
    if (showSuggestions && query.length === 0) {
      loadHistory();
    }
  }, [showSuggestions]);

  // Charger les suggestions en temps réel
  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(() => {
        loadSuggestions();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setCities([]);
      setListings([]);
    }
  }, [query]);

  const loadHistory = async () => {
    try {
      const response = await fetch("/api/search/history");
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Erreur chargement historique:", error);
    }
  };

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(query)}&type=all`
      );
      if (response.ok) {
        const data = await response.json();
        setCities(data.cities || []);
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error("Erreur chargement suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Sauvegarder dans l'historique
    saveToHistory(searchQuery);

    // Rediriger vers la page de recherche
    const params = new URLSearchParams();
    params.set("q", searchQuery);
    router.push(`/search?${params.toString()}`);
    setShowSuggestions(false);
  };

  const handleCityClick = (city: CitySuggestion) => {
    saveToHistory(city.name);
    const params = new URLSearchParams();
    params.set("city", city.name);
    router.push(`/search?${params.toString()}`);
    setShowSuggestions(false);
  };

  const handleListingClick = (listing: ListingSuggestion) => {
    router.push(`/listings/${listing.id}`);
    setShowSuggestions(false);
  };

  const handleHistoryClick = (item: SearchHistory) => {
    setQuery(item.destination);
    handleSearch(item.destination);
  };

  const saveToHistory = async (destination: string) => {
    try {
      await fetch("/api/search/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination }),
      });
    } catch (error) {
      console.error("Erreur sauvegarde historique:", error);
    }
  };

  const clearHistory = async () => {
    try {
      await fetch("/api/search/history", { method: "DELETE" });
      setHistory([]);
    } catch (error) {
      console.error("Erreur suppression historique:", error);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      {/* Barre de recherche */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(query);
            }
          }}
          placeholder="Rechercher une destination, un espace..."
          className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent shadow-sm"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
          {/* Historique */}
          {query.length === 0 && history.length > 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recherches récentes
                </h3>
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-600 hover:text-gray-900 underline"
                >
                  Effacer
                </button>
              </div>
              <div className="space-y-1">
                {history.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleHistoryClick(item)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{item.destination}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Villes */}
          {cities.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Destinations
              </h3>
              <div className="space-y-1">
                {cities.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => handleCityClick(city)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {city.name}
                        </div>
                        <div className="text-xs text-gray-500">{city.country}</div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {city.count} {city.count > 1 ? "espaces" : "espace"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Annonces */}
          {listings.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Espaces correspondants
              </h3>
              <div className="space-y-1">
                {listings.map((listing) => (
                  <button
                    key={listing.id}
                    onClick={() => handleListingClick(listing)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900 line-clamp-1">
                      {listing.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {listing.city} • {listing.type}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Aucun résultat */}
          {query.length >= 2 &&
            !loading &&
            cities.length === 0 &&
            listings.length === 0 && (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  Aucune suggestion pour "{query}"
                </p>
                <button
                  onClick={() => handleSearch(query)}
                  className="mt-3 text-sm text-gray-900 font-medium hover:underline"
                >
                  Rechercher quand même
                </button>
              </div>
            )}

          {/* Loading */}
          {loading && (
            <div className="p-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
