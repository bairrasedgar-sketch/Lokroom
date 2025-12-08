"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Map, { type MapMarker } from "@/components/Map";

// Helper pour obtenir le label de chaque type de listing
const LISTING_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  ROOM: "Chambre",
  STUDIO: "Studio",
  OFFICE: "Bureau",
  COWORKING: "Coworking",
  MEETING_ROOM: "Salle de réunion",
  PARKING: "Parking",
  GARAGE: "Garage",
  STORAGE: "Stockage",
  EVENT_SPACE: "Événementiel",
  RECORDING_STUDIO: "Studio",
  OTHER: "Autre",
};

// Helper pour obtenir l'emoji de chaque catégorie
function getCategoryEmoji(key: string): string {
  const emojis: Record<string, string> = {
    APARTMENT: "🏢",
    HOUSE: "🏠",
    ROOM: "🛏️",
    STUDIO: "🎨",
    OFFICE: "💼",
    COWORKING: "👥",
    MEETING_ROOM: "📊",
    PARKING: "🚗",
    GARAGE: "🚙",
    STORAGE: "📦",
    EVENT_SPACE: "🎉",
    RECORDING_STUDIO: "🎤",
    OTHER: "✨",
  };
  return emojis[key] || "🏠";
}

type ListingCardData = {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  country: string;
  city: string | null;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
  };
  images: { id: string; url: string }[];
  reviewSummary: {
    count: number;
    avgRating: number | null;
  };
  priceLabel: string;
};

type ListingsWithMapProps = {
  listings: ListingCardData[];
  markers: MapMarker[];
  locale: string;
  translations: {
    noImage: string;
    perNight: string;
    noLocation: string;
    hostLabel: string;
    defaultHostName: string;
    publishedOnPrefix: string;
  };
};

export default function ListingsWithMap({
  listings,
  markers,
  locale,
  translations: t,
}: ListingsWithMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <>
      {/* Map fixee a droite - desktop only */}
      <div className="hidden lg:fixed lg:right-0 lg:top-[73px] lg:block lg:h-[calc(100vh-73px)] lg:w-[38%] lg:overflow-hidden lg:border-l lg:border-gray-200 lg:bg-white">
        <Map
          markers={markers}
          panOnHover={false}
          hoveredId={hoveredId}
          onMarkerHover={setHoveredId}
        />
      </div>

      {/* Grille des annonces */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {listings.map((listing) => {
          const cover = listing.images?.[0]?.url;
          const rev = listing.reviewSummary;

          const locationLabel = [
            listing.city ?? undefined,
            listing.country ?? undefined,
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-black hover:shadow-md"
              onMouseEnter={() => setHoveredId(listing.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="relative h-40 w-full bg-gray-100">
                {cover ? (
                  <Image
                    src={cover}
                    alt={listing.title}
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
                    {t.noImage}
                  </div>
                )}

                {rev.count > 0 && rev.avgRating != null && (
                  <div className="absolute right-2 top-2 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-medium text-white">
                    {rev.avgRating.toFixed(1)} ({rev.count})
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="space-y-1">
                  {/* Category Badge */}
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    <span>{getCategoryEmoji(listing.type)}</span>
                    {LISTING_TYPE_LABELS[listing.type] || listing.type}
                  </span>
                  <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                    {listing.title}
                  </p>
                  <p className="line-clamp-2 text-xs text-gray-600">
                    {listing.description}
                  </p>
                </div>

                <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {listing.priceLabel}
                      <span className="text-xs font-normal text-gray-600">
                        {" "}
                        {t.perNight}
                      </span>
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {locationLabel || t.noLocation}
                    </p>
                  </div>

                  <div className="flex flex-col items-end text-[11px] text-gray-500">
                    <span>
                      {t.hostLabel} {listing.owner.name ?? t.defaultHostName}
                    </span>
                    <span>
                      {t.publishedOnPrefix}{" "}
                      {new Date(listing.createdAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Carte mobile */}
      <section className="mt-4 lg:hidden">
        <div className="h-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="relative h-full w-full">
            <Map markers={markers} panOnHover={false} />
          </div>
        </div>
      </section>
    </>
  );
}
