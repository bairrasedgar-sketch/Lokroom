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
  t,
}: {
  listing: ListingCardData;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
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
      {/* Image container avec carousel - aspect ratio 4:3 pour moins de hauteur */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100">
        <Link href={`/listings/${listing.id}`} className="block h-full w-full">
          {images.length > 0 ? (
            <Image
              src={images[currentImageIndex]?.url || ""}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-300"
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
              {t.noImage}
            </div>
          )}
        </Link>

        {/* Bouton Favori - sans badge qui coupe */}
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton listingId={listing.id} size={24} />
        </div>

        {/* Flèches de navigation (visibles au hover) */}
        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className={`absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition-all hover:bg-white hover:scale-105 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              aria-label="Image précédente"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className={`absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition-all hover:bg-white hover:scale-105 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              aria-label="Image suivante"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Points indicateurs d'images */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
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

      {/* Infos de l'annonce - plus compact */}
      <Link href={`/listings/${listing.id}`} className="flex flex-col gap-0.5 pt-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-medium text-gray-900">
            {locationLabel || listing.title}
          </h3>
          {rev.count > 0 && rev.avgRating != null && (
            <div className="flex shrink-0 items-center gap-0.5 text-sm">
              <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>{rev.avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500">
          {LISTING_TYPE_LABELS[listing.type] || listing.type}
        </p>

        <p className="mt-0.5 text-sm">
          <span className="font-semibold">{listing.priceLabel}</span>
          <span className="font-normal text-gray-900"> {t.perNight}</span>
        </p>
      </Link>
    </div>
  );
}

export default function ListingsWithMap({
  listings,
  markers,
  translations: t,
}: ListingsWithMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  // Filtrer les annonces selon les bounds de la carte
  const filteredListings = mapBounds
    ? listings.filter((listing) => {
        const marker = markers.find((m) => m.id === listing.id);
        if (!marker) return true; // Garder si pas de coordonnées
        return (
          marker.lat >= mapBounds.south &&
          marker.lat <= mapBounds.north &&
          marker.lng >= mapBounds.west &&
          marker.lng <= mapBounds.east
        );
      })
    : listings;

  // Callback quand les bounds de la carte changent
  const handleBoundsChange = useCallback(
    (bounds: { north: number; south: number; east: number; west: number }) => {
      setIsLoadingMap(true);

      // Petit délai pour montrer le loading
      setTimeout(() => {
        setMapBounds(bounds);
        setIsLoadingMap(false);
      }, 300);
    },
    []
  );

  return (
    <div className="relative">
      {/* Indicateur de chargement */}
      {isLoadingMap && (
        <div className="fixed left-1/2 top-24 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
            <span className="text-sm font-medium">Chargement...</span>
          </div>
        </div>
      )}

      {/* Compteur d'annonces */}
      <p className="mb-4 text-sm text-gray-600">
        {filteredListings.length} logement{filteredListings.length !== 1 ? "s" : ""} dans la zone de la carte
      </p>

      {/* Grille des annonces - 3 colonnes style Airbnb */}
      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {filteredListings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isHovered={hoveredId === listing.id}
            onHover={() => setHoveredId(listing.id)}
            onLeave={() => setHoveredId(null)}
            t={t}
          />
        ))}
      </div>

      {/* Message si aucune annonce */}
      {filteredListings.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-gray-500">Aucune annonce dans cette zone</p>
          <p className="mt-1 text-sm text-gray-400">Déplacez ou dézoomez la carte pour voir plus d&apos;annonces</p>
        </div>
      )}

      {/* Map fixée à droite - desktop only - taille réduite comme Airbnb */}
      <div className="hidden lg:fixed lg:right-0 lg:top-[64px] lg:block lg:h-[calc(100vh-64px)] lg:w-[40%] lg:border-l lg:border-gray-200">
        <Map
          markers={markers}
          panOnHover={false}
          hoveredId={hoveredId}
          onMarkerHover={setHoveredId}
          onBoundsChange={handleBoundsChange}
          restrictBounds={false}
        />
      </div>

      {/* Carte mobile */}
      <section className="mt-8 lg:hidden">
        <div className="h-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <Map
            markers={markers}
            panOnHover={false}
            hoveredId={hoveredId}
            onMarkerHover={setHoveredId}
            onBoundsChange={handleBoundsChange}
            restrictBounds={false}
          />
        </div>
      </section>
    </div>
  );
}
