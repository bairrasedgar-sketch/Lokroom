"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { X, SlidersHorizontal } from "lucide-react";

interface AdvancedFiltersProps {
  onApply: (filters: FilterValues) => void;
  initialFilters?: Partial<FilterValues>;
}

export interface FilterValues {
  minPrice: number;
  maxPrice: number;
  category: string;
  amenities: string[];
  instantBook: boolean;
  superhost: boolean;
  minRating: number;
  pricingMode: string;
  bedrooms: number;
  bathrooms: number;
}

const CATEGORIES = [
  { value: "", label: "Tous les types" },
  { value: "APARTMENT", label: "Appartement" },
  { value: "HOUSE", label: "Maison" },
  { value: "STUDIO", label: "Studio" },
  { value: "ROOM", label: "Chambre" },
  { value: "OFFICE", label: "Bureau" },
  { value: "COWORKING", label: "Coworking" },
  { value: "MEETING_ROOM", label: "Salle de réunion" },
  { value: "PARKING", label: "Parking" },
  { value: "GARAGE", label: "Garage" },
  { value: "STORAGE", label: "Stockage" },
  { value: "EVENT_SPACE", label: "Événementiel" },
  { value: "RECORDING_STUDIO", label: "Studio d'enregistrement" },
];

const PRICING_MODES = [
  { value: "", label: "Tous" },
  { value: "HOURLY", label: "À l'heure" },
  { value: "DAILY", label: "À la journée" },
  { value: "BOTH", label: "Les deux" },
];

const POPULAR_AMENITIES = [
  { id: "wifi", label: "WiFi" },
  { id: "parking", label: "Parking" },
  { id: "kitchen", label: "Cuisine" },
  { id: "ac", label: "Climatisation" },
  { id: "heating", label: "Chauffage" },
  { id: "tv", label: "Télévision" },
  { id: "workspace", label: "Espace de travail" },
  { id: "washer", label: "Lave-linge" },
];

export function AdvancedFilters({ onApply, initialFilters }: AdvancedFiltersProps) {
  const [priceRange, setPriceRange] = useState([
    initialFilters?.minPrice || 0,
    initialFilters?.maxPrice || 500,
  ]);
  const [category, setCategory] = useState(initialFilters?.category || "");
  const [pricingMode, setPricingMode] = useState(initialFilters?.pricingMode || "");
  const [amenities, setAmenities] = useState<string[]>(initialFilters?.amenities || []);
  const [instantBook, setInstantBook] = useState(initialFilters?.instantBook || false);
  const [superhost, setSuperhost] = useState(initialFilters?.superhost || false);
  const [minRating, setMinRating] = useState(initialFilters?.minRating || 0);
  const [bedrooms, setBedrooms] = useState(initialFilters?.bedrooms || 0);
  const [bathrooms, setBathrooms] = useState(initialFilters?.bathrooms || 0);

  const handleAmenityToggle = (amenityId: string, checked: boolean) => {
    if (checked) {
      setAmenities([...amenities, amenityId]);
    } else {
      setAmenities(amenities.filter((a) => a !== amenityId));
    }
  };

  const handleApply = () => {
    onApply({
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      category,
      pricingMode,
      amenities,
      instantBook,
      superhost,
      minRating,
      bedrooms,
      bathrooms,
    });
  };

  const handleReset = () => {
    setPriceRange([0, 500]);
    setCategory("");
    setPricingMode("");
    setAmenities([]);
    setInstantBook(false);
    setSuperhost(false);
    setMinRating(0);
    setBedrooms(0);
    setBathrooms(0);
  };

  const hasActiveFilters =
    priceRange[0] > 0 ||
    priceRange[1] < 500 ||
    category ||
    pricingMode ||
    amenities.length > 0 ||
    instantBook ||
    superhost ||
    minRating > 0 ||
    bedrooms > 0 ||
    bathrooms > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Prix */}
      <div>
        <label className="block font-medium text-gray-900 mb-3">
          Prix par nuit
        </label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={500}
          step={10}
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>{priceRange[0]}€</span>
          <span>{priceRange[1]}€+</span>
        </div>
      </div>

      {/* Catégorie */}
      <div>
        <label className="block font-medium text-gray-900 mb-2">
          Type d'espace
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mode de tarification */}
      <div>
        <label className="block font-medium text-gray-900 mb-2">
          Mode de tarification
        </label>
        <select
          value={pricingMode}
          onChange={(e) => setPricingMode(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        >
          {PRICING_MODES.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>

      {/* Chambres et salles de bain */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium text-gray-900 mb-2 text-sm">
            Chambres min.
          </label>
          <select
            value={bedrooms}
            onChange={(e) => setBedrooms(parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="0">Toutes</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>
        <div>
          <label className="block font-medium text-gray-900 mb-2 text-sm">
            Salles de bain min.
          </label>
          <select
            value={bathrooms}
            onChange={(e) => setBathrooms(parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="0">Toutes</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
          </select>
        </div>
      </div>

      {/* Équipements */}
      <div>
        <label className="block font-medium text-gray-900 mb-3">
          Équipements
        </label>
        <div className="space-y-2">
          {POPULAR_AMENITIES.map((amenity) => (
            <Checkbox
              key={amenity.id}
              label={amenity.label}
              checked={amenities.includes(amenity.id)}
              onChange={(checked) => handleAmenityToggle(amenity.id, checked)}
            />
          ))}
        </div>
      </div>

      {/* Options */}
      <div>
        <label className="block font-medium text-gray-900 mb-3">
          Options
        </label>
        <div className="space-y-2">
          <Checkbox
            label="Réservation instantanée"
            checked={instantBook}
            onChange={setInstantBook}
          />
          <Checkbox
            label="Superhôte uniquement"
            checked={superhost}
            onChange={setSuperhost}
          />
        </div>
      </div>

      {/* Note minimum */}
      <div>
        <label className="block font-medium text-gray-900 mb-2">
          Note minimum
        </label>
        <select
          value={minRating}
          onChange={(e) => setMinRating(parseFloat(e.target.value))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        >
          <option value="0">Toutes les notes</option>
          <option value="3">3+ ⭐</option>
          <option value="4">4+ ⭐</option>
          <option value="4.5">4.5+ ⭐</option>
        </select>
      </div>

      {/* Bouton Appliquer */}
      <button
        onClick={handleApply}
        className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
      >
        Appliquer les filtres
      </button>
    </div>
  );
}
