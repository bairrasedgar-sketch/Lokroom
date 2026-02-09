"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ListingFilters from "@/components/ListingFilters";
import { type MapMarker as MapMarkerType } from "@/components/Map";
import { ListingsHeader } from "./listings/ListingsHeader";
import { ListingsGrid } from "./listings/ListingsGrid";
import { ListingsMap } from "./listings/ListingsMap";
import { MobileMapOverlay } from "./listings/MobileMapOverlay";
import { ListingPreviewCard } from "./listings/ListingPreviewCard";

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

type Props = {
  cards: ListingCardFixed[];
  mapMarkers: MapMarkerType[];
};

type SortOption = "recent" | "price_asc" | "price_desc";

export default function ListingsWithMap({ cards, mapMarkers }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const total = cards.length;

  const sortParam = (searchParams.get("sort") ?? "recent") as SortOption;

  const handleSortChange = (value: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "recent") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const sortLabel = (() => {
    if (sortParam === "price_asc") return "Prix croissant";
    if (sortParam === "price_desc") return "Prix décroissant";
    return "Plus récentes";
  })();

  // Réfs pour chaque carte → scrollIntoView quand on survole depuis la carte
  const cardRefs = useRef<Record<string, HTMLLIElement | null>>({});

  useEffect(() => {
    if (!hoveredId) return;
    const el = cardRefs.current[hoveredId];
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [hoveredId]);

  const selectedListing =
    selectedId ? cards.find((c) => c.id === selectedId) ?? null : null;

  const closePreview = () => setSelectedId(null);

  return (
    <>
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col gap-4 px-4 pb-8 pt-4 lg:flex-row">
        {/* COLONNE GAUCHE : filtres + liste */}
        <section className="flex-1 space-y-4 lg:max-w-[55%]">
          <ListingsHeader
            total={total}
            sortParam={sortParam}
            onSortChange={handleSortChange}
            showMobileMapButton={mapMarkers.length > 0}
            onShowMobileMap={() => setShowMobileMap(true)}
          />

          <ListingFilters />

          {cards.length === 0 ? (
            <p className="text-sm text-gray-500">
              Essaie d&apos;ajuster les filtres ou de changer de ville / pays.
            </p>
          ) : (
            <ListingsGrid
              cards={cards}
              hoveredId={hoveredId}
              cardRefs={cardRefs}
              onHover={setHoveredId}
            />
          )}
        </section>

        {/* COLONNE DROITE : MAP (desktop) */}
        <ListingsMap
          markers={mapMarkers}
          hoveredId={hoveredId}
          sortLabel={sortLabel}
          onMarkerHover={setHoveredId}
          onMarkerClick={(id) => {
            setSelectedId(id);
            setHoveredId(id);
          }}
        />

        {/* Aperçu Airbnb-like sur desktop */}
        {selectedListing && (
          <div className="pointer-events-auto absolute bottom-6 right-6 hidden lg:block">
            <ListingPreviewCard
              listing={selectedListing}
              onClose={closePreview}
            />
          </div>
        )}
      </main>

      {/* OVERLAY CARTE MOBILE PLEIN ÉCRAN */}
      <MobileMapOverlay
        isOpen={showMobileMap}
        markers={mapMarkers}
        hoveredId={hoveredId}
        selectedListing={selectedListing}
        total={total}
        sortLabel={sortLabel}
        onClose={() => setShowMobileMap(false)}
        onMarkerHover={setHoveredId}
        onMarkerClick={(id) => {
          setSelectedId(id);
          setHoveredId(id);
        }}
        onClosePreview={closePreview}
      />
    </>
  );
}
