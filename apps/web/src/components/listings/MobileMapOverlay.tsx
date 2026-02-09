"use client";

import Map, { type MapMarker as MapMarkerType } from "../Map";
import { ListingPreviewCard } from "./ListingPreviewCard";

type ListingCardFixed = {
  id: string;
  title: string;
  country: string;
  city: string | null;
  type: string;
  createdAt: string | Date;
  images: { id: string; url: string }[];
  priceFormatted: string;
  latPublic: number | null;
  lngPublic: number | null;
  lat: number | null;
  lng: number | null;
};

type MobileMapOverlayProps = {
  isOpen: boolean;
  markers: MapMarkerType[];
  hoveredId: string | null;
  selectedListing: ListingCardFixed | null;
  total: number;
  sortLabel: string;
  onClose: () => void;
  onMarkerHover: (id: string | null) => void;
  onMarkerClick: (id: string) => void;
  onClosePreview: () => void;
};

export function MobileMapOverlay({
  isOpen,
  markers,
  hoveredId,
  selectedListing,
  total,
  sortLabel,
  onClose,
  onMarkerHover,
  onMarkerClick,
  onClosePreview,
}: MobileMapOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden">
      <div className="absolute inset-x-3 bottom-3 top-16 overflow-hidden rounded-3xl border bg-gray-100">
        <Map
          markers={markers}
          hoveredId={hoveredId}
          onMarkerHover={onMarkerHover}
          onMarkerClick={onMarkerClick}
        />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-800 shadow"
        >
          Fermer la carte
        </button>

        <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-[11px] text-gray-700 backdrop-blur">
          Carte Lok&apos;Room · {total} annonce
          {total > 1 ? "s" : ""} · {sortLabel}
        </div>

        {/* Aperçu Airbnb-like sur mobile (centré) */}
        {selectedListing && (
          <div className="pointer-events-auto absolute bottom-14 left-0 right-0 flex justify-center">
            <ListingPreviewCard
              listing={selectedListing}
              onClose={onClosePreview}
            />
          </div>
        )}
      </div>
    </div>
  );
}
