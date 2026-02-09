"use client";

import Map, { type MapMarker as MapMarkerType } from "../Map";

type ListingsMapProps = {
  markers: MapMarkerType[];
  hoveredId: string | null;
  sortLabel: string;
  onMarkerHover: (id: string | null) => void;
  onMarkerClick: (id: string) => void;
};

export function ListingsMap({
  markers,
  hoveredId,
  sortLabel,
  onMarkerHover,
  onMarkerClick,
}: ListingsMapProps) {
  return (
    <aside className="sticky top-24 hidden h-[600px] flex-1 lg:block">
      <div className="relative h-full w-full overflow-hidden rounded-3xl border bg-gray-100">
        <Map
          markers={markers}
          hoveredId={hoveredId}
          onMarkerHover={onMarkerHover}
          onMarkerClick={onMarkerClick}
        />
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/80 px-3 py-1 text-xs text-gray-600 backdrop-blur">
          Carte Lok&apos;Room (Google Maps) · {sortLabel}
        </div>
      </div>
    </aside>
  );
}
