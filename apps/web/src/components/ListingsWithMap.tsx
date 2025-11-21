"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import CurrencyNotice from "@/components/CurrencyNotice";
import ListingFilters from "@/components/ListingFilters";
import Map from "@/components/Map";

type ListingCardFixed = {
  id: string;
  title: string;
  country: string;
  city: string | null;
  createdAt: Date;
  images: { id: string; url: string }[];
  priceFormatted: string;

  latPublic: number | null;
  lngPublic: number | null;
  lat: number | null;
  lng: number | null;
};

type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
};

type Props = {
  cards: ListingCardFixed[];
  mapMarkers: MapMarker[];
};

type SortOption = "recent" | "price_asc" | "price_desc";

function ListingPreviewCard({ listing, onClose }: { listing: ListingCardFixed; onClose: () => void }) {
  const cover = listing.images?.[0]?.url ?? null;

  return (
    <div className="relative w-full max-w-xs overflow-hidden rounded-2xl border bg-white shadow-xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-gray-800 shadow"
        aria-label="Fermer l’aperçu"
      >
        ×
      </button>
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative h-40 w-full bg-gray-100">
          {cover ? (
            <Image
              src={cover}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="256px"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
              Pas d&apos;image
            </div>
          )}
        </div>
        <div className="space-y-1 p-3">
          <h3 className="line-clamp-1 text-sm font-semibold">
            {listing.title}
          </h3>
          <p className="text-[11px] text-gray-500">
            {listing.city ? `${listing.city}, ` : ""}
            {listing.country} ·{" "}
            {new Date(listing.createdAt).toLocaleDateString()}
          </p>
          <p className="pt-1 text-sm font-semibold">
            {listing.priceFormatted}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            Cliquer pour voir les détails
          </p>
        </div>
      </Link>
    </div>
  );
}

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

  // 🔁 Réfs pour chaque carte → scrollIntoView quand on survole depuis la carte
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
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">Annonces</h1>
              <p className="text-xs text-gray-500">
                {total === 0
                  ? "Aucune annonce pour ces filtres."
                  : `${total} annonce${total > 1 ? "s" : ""} trouvée${
                      total > 1 ? "s" : ""
                    }`}
              </p>
            </div>

            <Link
              href="/listings/new"
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              + Nouvelle annonce
            </Link>
          </div>

          {/* Barre tri + filtres + bouton carte mobile */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CurrencyNotice />

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Bouton voir la carte (mobile seulement) */}
              {mapMarkers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowMobileMap(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/60 sm:hidden"
                >
                  <span>Voir la carte</span>
                </button>
              )}

              <span className="hidden text-xs text-gray-500 sm:inline">
                Trier par
              </span>
              <select
                value={sortParam}
                onChange={(e) =>
                  handleSortChange(e.target.value as SortOption)
                }
                className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/60"
              >
                <option value="recent">Plus récentes</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
            </div>
          </div>

          <ListingFilters />

          {cards.length === 0 ? (
            <p className="text-sm text-gray-500">
              Essaie d&apos;ajuster les filtres ou de changer de ville / pays.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((l, index) => {
                const cover = l.images?.[0]?.url ?? null;
                const isHovered = hoveredId === l.id;

                // ⭐ Première carte → image LCP prioritaire
                const priority = index === 0;

                return (
                  <li
                    key={l.id}
                    ref={(el) => {
                      cardRefs.current[l.id] = el;
                    }}
                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                      isHovered
                        ? "ring-2 ring-black shadow-lg"
                        : "hover:-translate-y-0.5 hover:shadow-lg"
                    }`}
                    onMouseEnter={() => setHoveredId(l.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <Link href={`/listings/${l.id}`} className="block">
                      <div className="relative aspect-[4/3] bg-gray-50">
                        {cover ? (
                          <Image
                            src={cover}
                            alt={l.title}
                            fill
                            className="object-cover"
                            priority={priority}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
                            Pas d&apos;image
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 p-3">
                        <h3 className="line-clamp-1 text-sm font-medium">
                          {l.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {l.city ? `${l.city}, ` : ""}
                          {l.country} ·{" "}
                          {new Date(l.createdAt).toLocaleDateString()}
                        </p>
                        <p className="pt-1 text-sm font-semibold">
                          {l.priceFormatted}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* COLONNE DROITE : MAP (desktop) */}
        <aside className="sticky top-24 hidden h-[600px] flex-1 lg:block">
          <div className="relative h-full w-full overflow-hidden rounded-3xl border bg-gray-100">
            <Map
              markers={mapMarkers}
              hoveredId={hoveredId}
              onMarkerHover={setHoveredId}
              onMarkerClick={setSelectedId}
            />
            <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/80 px-3 py-1 text-xs text-gray-600 backdrop-blur">
              Carte Lok&apos;Room (Google Maps) · {sortLabel}
            </div>

            {/* Aperçu Airbnb-like sur desktop */}
            {selectedListing && (
              <div className="pointer-events-auto absolute bottom-6 right-6">
                <ListingPreviewCard
                  listing={selectedListing}
                  onClose={closePreview}
                />
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* OVERLAY CARTE MOBILE PLEIN ÉCRAN */}
      {showMobileMap && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden">
          <div className="absolute inset-x-3 bottom-3 top-16 overflow-hidden rounded-3xl border bg-gray-100">
            <Map
              markers={mapMarkers}
              hoveredId={hoveredId}
              onMarkerHover={setHoveredId}
              onMarkerClick={setSelectedId}
            />

            <button
              type="button"
              onClick={() => setShowMobileMap(false)}
              className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-800 shadow"
            >
              Fermer la carte
            </button>

            <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-[11px] text-gray-700 backdrop-blur">
              Carte Lok&apos;Room · {total} annonce
              {total > 1 ? "s" : ""} · {sortLabel}
            </div>

            {/* Aperçu Airbnb-like sur mobile (en bas de la carte) */}
            {selectedListing && (
              <div className="pointer-events-auto absolute bottom-16 left-3 right-3">
                <ListingPreviewCard
                  listing={selectedListing}
                  onClose={closePreview}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
