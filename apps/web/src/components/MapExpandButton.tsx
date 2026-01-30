"use client";

import { useState } from "react";
import Map, { type MapMarker } from "./Map";

type MapExpandButtonProps = {
  marker: MapMarker;
  locationLabel: string;
};

export default function MapExpandButton({ marker, locationLabel }: MapExpandButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Bouton agrandir */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="absolute bottom-3 right-3 flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>

      {/* Modal carte agrandie */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:flex lg:items-center lg:justify-center lg:p-8">
          <div className="bg-white h-full lg:h-[80vh] lg:rounded-2xl w-full lg:max-w-4xl flex flex-col overflow-hidden">
            {/* Header modal */}
            <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">Localisation de l&apos;annonce</h3>
                <p className="text-sm text-gray-500">{locationLabel}</p>
              </div>
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
            {/* Carte plein écran */}
            <div className="flex-1">
              <Map markers={[marker]} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
