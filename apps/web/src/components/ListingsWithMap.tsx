// apps/web/src/components/ListingsWithMap.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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

export default function ListingsWithMap({ cards, mapMarkers }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col gap-4 px-4 pb-8 pt-4 lg:flex-row">
      {/* COLONNE GAUCHE : filtres + liste */}
      <section className="flex-1 space-y-4 lg:max-w-[55%]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Annonces</h1>
          <Link
            href="/listings/new"
            className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
          >
            + Nouvelle annonce
          </Link>
        </div>

        <CurrencyNotice />
        <ListingFilters />

        {cards.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucune annonce ne correspond aux filtres.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((l) => {
              const cover = l.images?.[0]?.url ?? null;
              const isHovered = hoveredId === l.id;

              return (
                <li
                  key={l.id}
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

      {/* COLONNE DROITE : MAP */}
      <aside className="sticky top-24 hidden h-[600px] flex-1 lg:block">
        <div className="relative h-full w-full overflow-hidden rounded-3xl border bg-gray-100">
          <Map markers={mapMarkers} />
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/80 px-3 py-1 text-xs text-gray-600 backdrop-blur">
            Carte Lok&apos;Room (Google Maps)
          </div>
        </div>
      </aside>
    </main>
  );
}
