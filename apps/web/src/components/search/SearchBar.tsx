"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Users, Calendar } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [guests, setGuests] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (city) params.set("city", city);
    if (guests) params.set("guests", guests);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white rounded-full shadow-lg border border-gray-200 p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 max-w-4xl mx-auto"
    >
      {/* Recherche */}
      <div className="flex-1 flex items-center gap-2 px-4 py-2 sm:py-0">
        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un espace..."
          className="flex-1 outline-none text-sm bg-transparent"
        />
      </div>

      {/* Ville */}
      <div className="sm:border-l border-t sm:border-t-0 border-gray-200 pl-4 pr-4 py-2 sm:py-0 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ville"
          className="w-full sm:w-32 outline-none text-sm bg-transparent"
        />
      </div>

      {/* Voyageurs */}
      <div className="sm:border-l border-t sm:border-t-0 border-gray-200 pl-4 pr-4 py-2 sm:py-0 flex items-center gap-2">
        <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          type="number"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          placeholder="Voyageurs"
          min="1"
          className="w-full sm:w-24 outline-none text-sm bg-transparent"
        />
      </div>

      {/* Bouton */}
      <button
        type="submit"
        className="bg-black text-white rounded-full px-6 py-3 sm:px-8 sm:py-3 hover:bg-gray-800 transition-colors font-medium text-sm flex items-center justify-center gap-2"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Rechercher</span>
      </button>
    </form>
  );
}
