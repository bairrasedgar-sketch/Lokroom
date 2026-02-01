"use client";

import { useState } from "react";

type Amenity = {
  key: string;
  label: string;
};

type AmenitiesModalProps = {
  amenities: Amenity[];
  previewCount?: number;
};

export default function AmenitiesModal({ amenities, previewCount = 6 }: AmenitiesModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!amenities || amenities.length === 0) {
    return null;
  }

  const previewAmenities = amenities.slice(0, previewCount);
  const hasMore = amenities.length > previewCount;

  return (
    <>
      {/* Preview des equipements */}
      <div className="grid grid-cols-2 gap-3">
        {previewAmenities.map((amenity) => (
          <div key={amenity.key} className="flex items-center gap-2 text-sm text-gray-700">
            <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>{amenity.label}</span>
          </div>
        ))}
      </div>

      {/* Bouton voir tous les equipements */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-3 text-sm font-medium text-gray-900 underline hover:text-gray-600"
        >
          Voir les {amenities.length} equipements
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[80vh] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Ce que propose ce logement
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Liste des equipements */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {amenities.map((amenity) => (
                  <div key={amenity.key} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <svg className="h-6 w-6 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-base text-gray-900">{amenity.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
