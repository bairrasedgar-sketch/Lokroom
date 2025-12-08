"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Map, { type MapMarker } from "@/components/Map";
import FavoriteButton from "@/components/FavoriteButton";

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

// Composant pour la carte d'annonce style Airbnb
function ListingCard({
  listing,
  isHovered,
  onHover,
  onLeave,
  locale,
  t,
}: {
  listing: ListingCardData;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  locale: string;
  t: ListingsWithMapProps["translations"];
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = listing.images || [];
  const hasMultipleImages = images.length > 1;

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const locationLabel = [listing.city ?? undefined, listing.country ?? undefined]
    .filter(Boolean)
    .join(", ");

  const rev = listing.reviewSummary;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl transition-all duration-200 ${
        isHovered ? "shadow-lg" : ""
      }`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Image container avec carousel */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
        <Link href={`/listings/${listing.id}`} className="block h-full w-full">
          {images.length > 0 ? (
            <Image
              src={images[currentImageIndex]?.url || ""}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-300"
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
              {t.noImage}
            </div>
          )}
        </Link>

        {/* Badge Superhost / Coup de coeur */}
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-900 shadow-sm">
            Coup de c&oelig;ur voy...
          </span>
        </div>

        {/* Bouton Favori */}
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton listingId={listing.id} size={24} />
        </div>

        {/* Flèches de navigation (visibles au hover) */}
        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className={`absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition-all hover:bg-white hover:scale-105 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              aria-label="Image précédente"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className={`absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition-all hover:bg-white hover:scale-105 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              aria-label="Image suivante"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Points indicateurs d'images */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {images.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex(idx);
                }}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  idx === currentImageIndex
                    ? "bg-white"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Voir image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Infos de l'annonce */}
      <Link href={`/listings/${listing.id}`} className="flex flex-col gap-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[15px] font-medium text-gray-900">
            {locationLabel || listing.title}
          </h3>
          {rev.count > 0 && rev.avgRating != null && (
            <div className="flex shrink-0 items-center gap-1 text-[15px]">
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>{rev.avgRating.toFixed(2)}</span>
              <span className="text-gray-500">({rev.count})</span>
            </div>
          )}
        </div>

        <p className="text-[15px] text-gray-500">
          {LISTING_TYPE_LABELS[listing.type] || listing.type}
        </p>

        <p className="text-[15px] text-gray-500">
          {new Date(listing.createdAt).toLocaleDateString(locale, {
            day: "numeric",
            month: "short",
          })}
        </p>

        <p className="mt-1 text-[15px]">
          <span className="font-semibold">{listing.priceLabel}</span>
          <span className="text-gray-500"> {t.perNight}</span>
        </p>
      </Link>
    </div>
  );
}

export default function ListingsWithMap({
  listings,
  markers,
  locale,
  translations: t,
}: ListingsWithMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Callback quand les bounds de la carte changent
  const handleBoundsChange = useCallback(
    (bounds: { north: number; south: number; east: number; west: number }) => {
      // Pour l'instant on log, mais plus tard on pourrait filtrer les annonces
      console.log("Map bounds changed:", bounds);
    },
    []
  );

  return (
    <div className="relative">
      {/* Grille des annonces - 3 colonnes style Airbnb */}
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isHovered={hoveredId === listing.id}
            onHover={() => setHoveredId(listing.id)}
            onLeave={() => setHoveredId(null)}
            locale={locale}
            t={t}
          />
        ))}
      </div>

      {/* Map fixée à droite - desktop only */}
      <div className="hidden xl:fixed xl:right-0 xl:top-0 xl:block xl:h-screen xl:w-[45%] xl:border-l xl:border-gray-200">
        <Map
          markers={markers}
          panOnHover={false}
          hoveredId={hoveredId}
          onMarkerHover={setHoveredId}
          onBoundsChange={handleBoundsChange}
          restrictBounds={true}
        />
      </div>

      {/* Carte mobile */}
      <section className="mt-8 xl:hidden">
        <div className="h-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <Map
            markers={markers}
            panOnHover={false}
            hoveredId={hoveredId}
            onMarkerHover={setHoveredId}
            restrictBounds={true}
          />
        </div>
      </section>
    </div>
  );
}
