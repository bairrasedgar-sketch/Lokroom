"use client";

import { useState, useEffect, useCallback } from "react";
import Map, { type MapMarker } from "./Map";
import { useTranslation } from "@/hooks/useTranslation";
import { useGoogleMaps } from "./GoogleMapsLoader";

type MapExpandButtonProps = {
  marker: MapMarker;
  locationLabel: string;
  /** Si true, le bouton couvre toute la carte et ouvre en plein écran mobile */
  fullScreen?: boolean;
  /** Si true avec fullScreen, affiche aussi un bouton visible en bas à droite */
  showButton?: boolean;
};

export default function MapExpandButton({ marker, locationLabel, fullScreen = false, showButton = false }: MapExpandButtonProps) {
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Cacher la navbar quand la carte est agrandie
      const navbar = document.querySelector('header');
      if (navbar) {
        (navbar as HTMLElement).style.display = 'none';
      }
    } else {
      document.body.style.overflow = "";
      // Remettre la navbar
      const navbar = document.querySelector('header');
      if (navbar) {
        (navbar as HTMLElement).style.display = '';
      }
    }
    return () => {
      document.body.style.overflow = "";
      const navbar = document.querySelector('header');
      if (navbar) {
        (navbar as HTMLElement).style.display = '';
      }
    };
  }, [isOpen]);

  return (
    <>
      {/* Bouton agrandir - soit petit bouton, soit overlay plein écran */}
      {fullScreen ? (
        <>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label={t.listingDetail.mapLocation}
          >
            <span className="sr-only">{t.listingDetail.mapLocation}</span>
          </button>
          {/* Bouton visible en bas à droite */}
          {showButton && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="absolute bottom-3 right-3 z-20 flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition"
              aria-label={t.listingDetail.mapLocation}
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          )}
        </>
      ) : (
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
      )}

      {/* Modal carte agrandie */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-0 lg:p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Mobile: plein écran avec header | PC: vraiment plein écran avec bords arrondis */}
          <div
            className="bg-white h-full w-full lg:h-[calc(100vh-32px)] lg:w-[calc(100vw-32px)] lg:rounded-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal - mobile seulement, PC juste bouton fermer */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 lg:border-none lg:absolute lg:top-4 lg:left-4 lg:right-4 lg:z-10 lg:bg-transparent lg:p-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md hover:bg-gray-100 lg:w-10 lg:h-10"
                aria-label={t.common.close}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="text-center flex-1 lg:hidden">
                <h3 className="text-base font-semibold text-gray-900">{t.listingDetail.mapLocation}</h3>
                <p className="text-xs text-gray-500">{locationLabel}</p>
              </div>
              <div className="w-8 lg:hidden" />
            </div>
            {/* Carte plein ecran avec gestion d'erreur */}
            <div className="flex-1 relative lg:rounded-2xl lg:overflow-hidden">
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
                <>
                  <Map markers={[marker]} useLogoIcon={true} interactive={true} />
                  {/* Boutons zoom custom ronds en bas à droite - PC uniquement */}
                  <div className="absolute bottom-4 right-4 z-10 hidden lg:flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const event = new CustomEvent('map-fullscreen-zoom-in');
                        window.dispatchEvent(event);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-medium text-gray-700 shadow-lg border border-gray-200 transition-all hover:bg-gray-50 hover:shadow-xl active:scale-95"
                      aria-label="Zoom in"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const event = new CustomEvent('map-fullscreen-zoom-out');
                        window.dispatchEvent(event);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-medium text-gray-700 shadow-lg border border-gray-200 transition-all hover:bg-gray-50 hover:shadow-xl active:scale-95"
                      aria-label="Zoom out"
                    >
                      −
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
