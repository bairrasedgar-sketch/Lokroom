"use client";

import { useState, useEffect, useCallback } from "react";
import Map, { type MapMarker } from "./Map";
import { useTranslation } from "@/hooks/useTranslation";
import { useGoogleMaps } from "./GoogleMapsLoader";

type MapExpandButtonProps = {
  marker: MapMarker;
  locationLabel: string;
};

export default function MapExpandButton({ marker, locationLabel }: MapExpandButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { loadError } = useGoogleMaps();

  const closeModal = useCallback(() => setIsOpen(false), []);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeModal]);

  return (
    <>
      {/* Bouton agrandir */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition"
        aria-label={t.listingDetail.mapLocation}
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>

      {/* Modal carte agrandie */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:flex lg:items-center lg:justify-center lg:p-8"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white h-full lg:h-[80vh] lg:rounded-2xl w-full lg:max-w-4xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">{t.listingDetail.mapLocation}</h3>
                <p className="text-sm text-gray-500">{locationLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
                aria-label={t.common.close}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Carte plein ecran avec gestion d'erreur */}
            <div className="flex-1">
              {loadError ? (
                <div className="flex h-full items-center justify-center flex-col gap-2 p-4 text-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm text-gray-600">{t.components.map.loadError}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                  >
                    {t.components.map.retry}
                  </button>
                </div>
              ) : (
                <Map markers={[marker]} useLogoIcon={true} interactive={true} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
