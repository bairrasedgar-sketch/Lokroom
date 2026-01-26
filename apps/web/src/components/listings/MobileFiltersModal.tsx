"use client";

import { useState } from "react";

type MobileFiltersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (filters: FilterValues) => void;
};

type FilterValues = {
  minPrice: string;
  maxPrice: string;
  minRating: string;
  propertyTypes: string[];
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
};

const PROPERTY_TYPES = [
  { key: "APARTMENT", label: "Appartement" },
  { key: "HOUSE", label: "Maison" },
  { key: "STUDIO", label: "Studio" },
  { key: "ROOM", label: "Chambre" },
  { key: "OFFICE", label: "Bureau" },
  { key: "COWORKING", label: "Coworking" },
  { key: "PARKING", label: "Parking" },
];

const AMENITIES = [
  { key: "wifi", label: "WiFi" },
  { key: "parking", label: "Parking" },
  { key: "kitchen", label: "Cuisine" },
  { key: "washer", label: "Lave-linge" },
  { key: "ac", label: "Climatisation" },
  { key: "heating", label: "Chauffage" },
  { key: "tv", label: "Télévision" },
  { key: "workspace", label: "Espace travail" },
];

export default function MobileFiltersModal({
  isOpen,
  onClose,
  onApply,
}: MobileFiltersModalProps) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);

  if (!isOpen) return null;

  const toggleType = (key: string) => {
    setSelectedTypes(prev =>
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
    );
  };

  const toggleAmenity = (key: string) => {
    setSelectedAmenities(prev =>
      prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]
    );
  };

  const handleClear = () => {
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setSelectedTypes([]);
    setSelectedAmenities([]);
    setBedrooms(0);
    setBathrooms(0);
  };

  const handleApply = () => {
    if (onApply) {
      onApply({
        minPrice,
        maxPrice,
        minRating,
        propertyTypes: selectedTypes,
        amenities: selectedAmenities,
        bedrooms,
        bathrooms,
      });
    }
    onClose();
  };

  const activeFiltersCount = [
    minPrice,
    maxPrice,
    minRating,
    ...selectedTypes,
    ...selectedAmenities,
    bedrooms > 0 ? "bed" : "",
    bathrooms > 0 ? "bath" : "",
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[100] bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Filtres</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="overflow-y-auto h-[calc(100vh-160px)]">

        {/* Section Type de logement */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-11 h-11 bg-gray-100 rounded-xl">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Type de logement</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type.key}
                onClick={() => toggleType(type.key)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  selectedTypes.includes(type.key)
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[1px] bg-gray-100 mx-4" />

        {/* Section Prix */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-11 h-11 bg-gray-100 rounded-xl">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 7.629A3 3 0 009.017 9.43c-.023.212-.002.425.028.636l.506 3.541a4.5 4.5 0 01-.43 2.65L9 16.5l1.539-.513a2.25 2.25 0 011.422 0l.655.218a2.25 2.25 0 001.718-.122L15 15.75M8.25 12H12m9 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Fourchette de prix</h2>
              <p className="text-sm text-gray-500">Prix par nuit</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:bg-white transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
              </div>
            </div>
            <div className="text-gray-300">—</div>
            <div className="flex-1">
              <div className="relative">
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:bg-white transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-gray-100 mx-4" />

        {/* Section Chambres et salles de bain */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-11 h-11 bg-gray-100 rounded-xl">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Chambres et salles de bain</h2>
            </div>
          </div>

          <div className="space-y-4">
            {/* Chambres */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Chambres</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBedrooms(Math.max(0, bedrooms - 1))}
                  disabled={bedrooms === 0}
                  className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-8 text-center text-sm font-medium">{bedrooms === 0 ? "—" : bedrooms}</span>
                <button
                  onClick={() => setBedrooms(bedrooms + 1)}
                  className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Salles de bain */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Salles de bain</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBathrooms(Math.max(0, bathrooms - 1))}
                  disabled={bathrooms === 0}
                  className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-8 text-center text-sm font-medium">{bathrooms === 0 ? "—" : bathrooms}</span>
                <button
                  onClick={() => setBathrooms(bathrooms + 1)}
                  className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-gray-100 mx-4" />

        {/* Section Note minimum */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-11 h-11 bg-gray-100 rounded-xl">
              <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Note minimum</h2>
            </div>
          </div>

          <div className="flex gap-2">
            {["", "3", "3.5", "4", "4.5"].map((rating) => (
              <button
                key={rating || "all"}
                onClick={() => setMinRating(rating)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  minRating === rating
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {rating === "" ? "Tous" : `${rating}+`}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[1px] bg-gray-100 mx-4" />

        {/* Section Équipements */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-11 h-11 bg-gray-100 rounded-xl">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Équipements</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((amenity) => (
              <button
                key={amenity.key}
                onClick={() => toggleAmenity(amenity.key)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  selectedAmenities.includes(amenity.key)
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {amenity.label}
              </button>
            ))}
          </div>
        </div>

        {/* Espace en bas pour le footer */}
        <div className="h-4" />
      </div>

      {/* Footer fixe */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={handleClear}
            className="px-4 py-3 text-sm font-medium text-gray-700 underline underline-offset-2"
          >
            Tout effacer
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black active:scale-[0.98] transition-all"
          >
            {activeFiltersCount > 0
              ? `Afficher les résultats (${activeFiltersCount})`
              : "Afficher les résultats"
            }
          </button>
        </div>
      </div>
    </div>
  );
}
