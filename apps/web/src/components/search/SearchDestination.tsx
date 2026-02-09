"use client";

import LocationAutocomplete, { type LocationAutocompletePlace } from "../LocationAutocomplete";

type PopularDestination = {
  city: string;
  country: string;
  image: string;
};

const POPULAR_DESTINATIONS: PopularDestination[] = [
  { city: "Paris", country: "France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop&q=80" },
  { city: "Montréal", country: "Canada", image: "https://images.unsplash.com/photo-1519178614-68673b201f36?w=400&h=400&fit=crop&q=80" },
  { city: "Lyon", country: "France", image: "/images/lyon.webp" },
  { city: "Marseille", country: "France", image: "/images/marseille.webp" },
  { city: "Toronto", country: "Canada", image: "https://images.unsplash.com/photo-1507992781348-310259076fe0?w=400&h=400&fit=crop&q=80" },
  { city: "Bordeaux", country: "France", image: "/images/bordeaux.webp" },
];

type SearchDestinationProps = {
  destination: string;
  selectedCity: string;
  onDestinationChange: (value: string) => void;
  onLocationSelect: (place: LocationAutocompletePlace) => void;
  onCitySelect: (city: string, country: string) => void;
  autoFocus?: boolean;
};

export function SearchDestination({
  destination,
  selectedCity,
  onDestinationChange,
  onLocationSelect,
  onCitySelect,
  autoFocus = false,
}: SearchDestinationProps) {
  return (
    <div className="space-y-6">
      {/* Champ de recherche avec autocomplete */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Où allez-vous ?
        </label>
        <LocationAutocomplete
          value={destination}
          onChange={onDestinationChange}
          onSelect={onLocationSelect}
          placeholder="Rechercher une ville, un pays..."
          autoFocus={autoFocus}
          popularCities={POPULAR_DESTINATIONS.map(d => ({
            main: d.city,
            secondary: d.country,
            icon: d.image,
          }))}
        />
      </div>

      {/* Destinations populaires avec images */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Destinations populaires</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {POPULAR_DESTINATIONS.map((dest) => (
            <button
              key={dest.city}
              onClick={() => onCitySelect(dest.city, dest.country)}
              className={`relative overflow-hidden rounded-xl aspect-[4/3] group ${
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
  );
}
