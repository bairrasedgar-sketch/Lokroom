"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useGoogleMaps } from "./GoogleMapsLoader";
import { CityIllustration } from "./CityIllustrations";

// ────────────────────────────────────────────────────────────────────────────
// Types Google Maps (simplified)
// ────────────────────────────────────────────────────────────────────────────
type GoogleMapsAPI = {
  maps: {
    places: {
      AutocompleteService: new () => GoogleAutocompleteService;
      PlacesServiceStatus: { OK: string };
    };
  };
};

type GoogleAutocompleteService = {
  getPlacePredictions: (
    request: { input: string; types: string[]; componentRestrictions?: { country: string | string[] } },
    callback: (predictions: GooglePrediction[] | null, status: string) => void
  ) => void;
};

type GooglePrediction = {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

type WindowWithGoogle = Window & { google?: GoogleMapsAPI };

// ────────────────────────────────────────────────────────────────────────────
// Types du composant
// ────────────────────────────────────────────────────────────────────────────
export type LocationAutocompletePlace = {
  description: string;
  mainText: string;
  secondaryText: string;
};

type PopularCity = {
  main: string;
  secondary: string;
  icon: string;
};

export type LocationAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: LocationAutocompletePlace) => void;
  placeholder?: string;
  label?: string;
  /** Affichage compact pour la barre de filtres */
  compact?: boolean;
  /** Villes populaires à afficher */
  popularCities?: PopularCity[];
  /** Classe CSS personnalisée pour le conteneur */
  className?: string;
  /** Focus automatique */
  autoFocus?: boolean;
};

// Villes populaires par défaut
const DEFAULT_POPULAR_CITIES: PopularCity[] = [
  { main: "Paris", secondary: "France", icon: "" },
  { main: "Montréal", secondary: "Canada", icon: "" },
  { main: "Lyon", secondary: "France", icon: "" },
  { main: "Toronto", secondary: "Canada", icon: "" },
  { main: "Marseille", secondary: "France", icon: "" },
  { main: "Vancouver", secondary: "Canada", icon: "" },
];

// ────────────────────────────────────────────────────────────────────────────
// Composant LocationAutocomplete (style Airbnb)
// ────────────────────────────────────────────────────────────────────────────
export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Rechercher une ville...",
  label,
  compact = false,
  popularCities = DEFAULT_POPULAR_CITIES,
  className = "",
  autoFocus = false,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<GooglePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Use the global Google Maps context
  const { isLoaded: googleReady } = useGoogleMaps();

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recherche Google Places avec debounce
  const searchPlaces = useCallback((query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    // Wait for Google to be ready
    if (!googleReady) {
      console.log("Google Maps not ready yet, waiting...");
      return;
    }

    const g = (window as WindowWithGoogle).google;
    if (!g?.maps?.places?.AutocompleteService) {
      console.log("AutocompleteService not available");
      return;
    }

    setIsLoading(true);
    const service = new g.maps.places.AutocompleteService();

    service.getPlacePredictions(
      {
        input: query,
        types: ["(cities)"],
        componentRestrictions: { country: ["fr", "ca"] }, // France et Canada
      },
      (predictions, status) => {
        setIsLoading(false);
        if (status === g.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      }
    );
  }, [googleReady]);

  // Handler pour l'input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);

    // Debounce la recherche (150ms pour plus de réactivité)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 150);
  };

  // Sélection d'une suggestion
  const handleSelect = (prediction: GooglePrediction) => {
    const mainText = prediction.structured_formatting?.main_text || prediction.description.split(",")[0];
    const secondaryText = prediction.structured_formatting?.secondary_text || "";

    onChange(mainText);
    onSelect({
      description: prediction.description,
      mainText,
      secondaryText,
    });
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Sélection d'une ville populaire
  const handlePopularSelect = (city: PopularCity) => {
    onChange(city.main);
    onSelect({
      description: `${city.main}, ${city.secondary}`,
      mainText: city.main,
      secondaryText: city.secondary,
    });
    setIsOpen(false);
  };

  // Navigation clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length > 0 ? suggestions.length : popularCities.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelect(suggestions[highlightedIndex]);
      } else if (value.length < 1) {
        handlePopularSelect(popularCities[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const showPopular = isOpen && value.length < 1 && suggestions.length === 0;
  const showSuggestions = isOpen && suggestions.length > 0;

  return (
    <div ref={containerRef} className={`relative ${compact ? "flex-1" : ""} ${className}`}>
      <div className="flex-1">
        {label && (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
        )}
        <div className={compact ? "" : "relative"}>
          {!compact && (
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={
              compact
                ? "w-full border-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                : "w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            }
            autoComplete="off"
          />
          {value && !compact && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                inputRef.current?.focus();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Dropdown des suggestions */}
      {(showPopular || showSuggestions) && (
        <div
          className={`absolute ${compact ? "left-0" : "left-0 right-0"} top-full z-50 mt-2 ${
            compact ? "w-[340px]" : "w-full"
          } overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl`}
        >
          {/* Loading */}
          {isLoading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
              Recherche...
            </div>
          )}

          {/* Google Maps not loaded warning */}
          {!googleReady && value.length >= 1 && !isLoading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-amber-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
              Chargement de Google Maps...
            </div>
          )}

          {/* Villes populaires (quand pas de recherche) */}
          {showPopular && !isLoading && (
            <div className="py-2">
              <p className="px-4 py-2 text-xs font-semibold text-gray-500">
                Destinations populaires
              </p>
              {popularCities.map((city, index) => (
                <button
                  key={city.main}
                  type="button"
                  onClick={() => handlePopularSelect(city)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                    highlightedIndex === index
                      ? "bg-gray-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <CityIllustration city={city.main} className="w-10 h-10 rounded-xl" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{city.main}</p>
                    <p className="text-xs text-gray-500">{city.secondary}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Résultats de recherche Google Places */}
          {showSuggestions && !isLoading && (
            <div className="py-2">
              {suggestions.map((suggestion, index) => {
                const cityName = suggestion.structured_formatting?.main_text || suggestion.description.split(",")[0];
                return (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => handleSelect(suggestion)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                      highlightedIndex === index
                        ? "bg-gray-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <CityIllustration city={cityName} className="w-10 h-10 rounded-xl" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {cityName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {suggestion.structured_formatting?.secondary_text || ""}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Aucun résultat */}
          {!isLoading && googleReady && value.length >= 1 && suggestions.length === 0 && (
            <div className="px-4 py-3 text-center text-sm text-gray-500">
              Aucune ville trouvée pour &quot;{value}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
