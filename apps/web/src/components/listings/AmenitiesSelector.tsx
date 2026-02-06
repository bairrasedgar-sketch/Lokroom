"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

interface Amenity {
  id: string;
  slug: string;
  label: string;
  category: string;
}

interface AmenitiesSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: "Essentiel",
  BUSINESS: "Professionnel",
  PARKING: "Stationnement",
  ACCESSIBILITY: "Accessibilité",
  OUTDOOR: "Extérieur",
  MEDIA: "Média & Studio",
};

export default function AmenitiesSelector({
  selectedIds,
  onChange,
}: AmenitiesSelectorProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Amenity[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAmenities() {
      try {
        const res = await fetch("/api/amenities");
        if (!res.ok) throw new Error("Erreur lors du chargement des équipements");
        const data = await res.json();
        setAmenities(data.amenities);
        setGrouped(data.grouped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    fetchAmenities();
  }, []);

  const toggleAmenity = (amenityId: string) => {
    if (selectedIds.includes(amenityId)) {
      onChange(selectedIds.filter((id) => id !== amenityId));
    } else {
      onChange([...selectedIds, amenityId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compteur */}
      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">{selectedIds.length}</span> équipement
          {selectedIds.length > 1 ? "s" : ""} sélectionné
          {selectedIds.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Équipements sélectionnés */}
      {selectedIds.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">
            Équipements sélectionnés
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id) => {
              const amenity = amenities.find((a) => a.id === id);
              if (!amenity) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleAmenity(id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {amenity.label}
                  <X className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Équipements par catégorie */}
      {Object.entries(grouped).map(([category, categoryAmenities]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {CATEGORY_LABELS[category] || category}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoryAmenities.map((amenity) => {
              const isSelected = selectedIds.includes(amenity.id);
              return (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => toggleAmenity(amenity.id)}
                  className={`flex items-center justify-between rounded-lg border-2 p-4 text-left transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? "text-blue-900" : "text-gray-900"
                    }`}
                  >
                    {amenity.label}
                  </span>
                  {isSelected && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
