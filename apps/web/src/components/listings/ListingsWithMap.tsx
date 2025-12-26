"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  latPublic?: number | null;
  lngPublic?: number | null;
  currency?: string;
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
  searchParams?: Record<string, string>;
  displayCurrency?: string;
};

// Composant Skeleton pour le chargement (style Airbnb)
function ListingCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl animate-pulse">
      {/* Image skeleton */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-200" />

      {/* Content skeleton */}
      <div className="flex flex-col pt-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-8" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

// Composant pour la carte d'annonce style Airbnb
function ListingCard({
  listing,
  isHovered,
  onHover,
  onLeave,
  t,
  index = 0,
}: {
  listing: ListingCardData;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  t: ListingsWithMapProps["translations"];
  index?: number;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const images = listing.images || [];
  const hasMultipleImages = images.length > 1;

  // Animation d'apparition en escalier
  useEffect(() => {
    // Reset visibility when listing changes (new data from map)
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 80); // 80ms de délai entre chaque carte (plus lent)
    return () => clearTimeout(timer);
  }, [index, listing.id]); // Re-trigger quand l'id change

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
      className={`group relative flex flex-col overflow-hidden rounded-xl transition-all duration-500 ease-out ${
        isHovered ? "shadow-lg scale-[1.02]" : ""
      } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
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
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
              {t.noImage}
            </div>
          )}
        </Link>

        {/* Bouton Favori - style Airbnb en haut à droite */}
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton listingId={listing.id} size={24} variant="card" />
        </div>

        {/* Flèches de navigation (visibles au hover) */}
        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className={`absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 shadow-md transition-all hover:scale-110 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              aria-label="Image précédente"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className={`absolute right-12 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 shadow-md transition-all hover:scale-110 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              aria-label="Image suivante"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Points indicateurs d'images */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
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
                    ? "bg-white w-2"
                    : "bg-white/60 hover:bg-white/80"
                }`}
                aria-label={`Voir image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Infos de l'annonce - hauteur fixe pour cohérence */}
      <Link href={`/listings/${listing.id}`} className="flex flex-col pt-3 h-[76px]">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[15px] font-medium text-gray-900 flex-1 min-w-0">
            {locationLabel || listing.title}
          </h3>
          {rev.count > 0 && rev.avgRating != null && (
            <div className="flex shrink-0 items-center gap-1 text-sm">
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="font-medium">{rev.avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500 truncate">
          {LISTING_TYPE_LABELS[listing.type] || listing.type}
        </p>

        <p className="mt-auto text-[15px]">
          <span className="font-semibold">{listing.priceLabel}</span>
          <span className="font-normal text-gray-600"> {t.perNight}</span>
        </p>
      </Link>
    </div>
  );
}

// Helper pour comparer les bounds (éviter les re-fetches inutiles)
function boundsAreEqual(
  a: { north: number; south: number; east: number; west: number } | null,
  b: { north: number; south: number; east: number; west: number } | null,
  threshold = 0.001
): boolean {
  if (!a || !b) return false;
  return (
    Math.abs(a.north - b.north) < threshold &&
    Math.abs(a.south - b.south) < threshold &&
    Math.abs(a.east - b.east) < threshold &&
    Math.abs(a.west - b.west) < threshold
  );
}

export default function ListingsWithMap({
  listings: initialListings,
  markers: initialMarkers,
  translations: t,
  searchParams = {},
  displayCurrency = "EUR",
}: ListingsWithMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [listings, setListings] = useState<ListingCardData[]>(initialListings);
  const [previousListings, setPreviousListings] = useState<ListingCardData[]>(initialListings); // Garde les anciennes pendant le chargement
  const [markers, setMarkers] = useState<MapMarker[]>(initialMarkers);
  const [totalCount, setTotalCount] = useState(initialListings.length);
  const [isMapSearchEnabled, setIsMapSearchEnabled] = useState(true);
  const [skipFitBounds, setSkipFitBounds] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isFirstLoad = useRef(true);
  const lastFetchedBounds = useRef<{ north: number; south: number; east: number; west: number } | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Tracker si on a fait un fetch manuel (pour éviter de re-fitBounds)
  const hasFetchedFromMapRef = useRef(false);

  // Update listings when initial data changes (e.g., from server-side filters)
  useEffect(() => {
    setListings(initialListings);
    setPreviousListings(initialListings);
    setMarkers(initialMarkers);
    setTotalCount(initialListings.length);
    isFirstLoad.current = true; // Reset pour ne pas refetch au premier bounds change
    lastFetchedBounds.current = null;
    hasFetchedFromMapRef.current = false;
    setSkipFitBounds(false);
  }, [initialListings, initialMarkers]);

  // Fetch listings based on map bounds
  const fetchListingsInBounds = useCallback(
    async (bounds: { north: number; south: number; east: number; west: number }) => {
      // Vérifier si les bounds sont significativement différents
      if (boundsAreEqual(lastFetchedBounds.current, bounds)) {
        return; // Éviter les fetches redondants
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoadingMap(true);
      lastFetchedBounds.current = bounds;

      try {
        // Build query params including existing search params
        const params = new URLSearchParams();

        // Add existing search params (sauf page et bounds existants)
        for (const [key, value] of Object.entries(searchParams)) {
          if (value && key !== "page" && !key.startsWith("ne") && !key.startsWith("sw")) {
            params.set(key, value);
          }
        }

        // Add bounding box params
        params.set("neLat", String(bounds.north));
        params.set("neLng", String(bounds.east));
        params.set("swLat", String(bounds.south));
        params.set("swLng", String(bounds.west));
        params.set("pageSize", "50");

        const response = await fetch(`/api/listings/search?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch listings");
        }

        const data = await response.json();

        // Format prices for display
        const formattedListings: ListingCardData[] = data.items.map((item: ListingCardData & { currency?: string }) => ({
          ...item,
          priceLabel: new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: displayCurrency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(item.price),
        }));

        // Create markers from listings
        const newMarkers: MapMarker[] = formattedListings
          .filter((l: ListingCardData) => l.latPublic != null && l.lngPublic != null)
          .map((l: ListingCardData) => ({
            id: l.id,
            lat: l.latPublic as number,
            lng: l.lngPublic as number,
            label: l.priceLabel,
            title: l.title,
            city: l.city,
            country: l.country,
            createdAt: l.createdAt,
            priceFormatted: l.priceLabel,
            imageUrl: l.images?.[0]?.url ?? null,
          }));

        setListings(formattedListings);
        setPreviousListings(formattedListings); // Mettre à jour les anciennes aussi
        setMarkers(newMarkers);
        setTotalCount(data.total);
        hasFetchedFromMapRef.current = true; // Marquer qu'on vient de fetcher
        setSkipFitBounds(true); // Ne pas re-centrer la map
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error fetching listings:", error);
        }
      } finally {
        setIsLoadingMap(false);
      }
    },
    [searchParams, displayCurrency]
  );

  // Callback quand les bounds de la carte changent (avec debounce intégré)
  const handleBoundsChange = useCallback(
    (bounds: { north: number; south: number; east: number; west: number }) => {
      // Skip si désactivé ou premier chargement
      if (!isMapSearchEnabled) return;

      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
      }

      // Annuler le timeout précédent
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce de 500ms pour éviter trop de requêtes
      debounceTimeoutRef.current = setTimeout(() => {
        fetchListingsInBounds(bounds);
      }, 500);
    },
    [isMapSearchEnabled, fetchListingsInBounds]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="relative">
      {/* Indicateur de chargement */}
      {isLoadingMap && (
        <div className="fixed left-1/2 top-24 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg border border-gray-200">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            <span className="text-sm font-medium text-gray-700">Recherche en cours...</span>
          </div>
        </div>
      )}

      {/* Compteur d'annonces + Toggle recherche sur carte */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {listings.length} logement{listings.length !== 1 ? "s" : ""} dans cette zone
          {totalCount > listings.length && ` (${totalCount} au total)`}
        </p>

        {/* Toggle pour activer/désactiver la recherche sur carte */}
        <button
          onClick={() => setIsMapSearchEnabled(!isMapSearchEnabled)}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            isMapSearchEnabled
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          {isMapSearchEnabled ? "Recherche sur carte activée" : "Recherche sur carte désactivée"}
        </button>
      </div>

      {/* Grille des annonces - responsive pour tous écrans */}
      {/* Pendant le chargement, afficher les skeletons */}
      {isLoadingMap && (
        <div className="grid gap-4 sm:gap-x-6 sm:gap-y-8 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4">
          {Array.from({ length: Math.max(previousListings.length, 6) }).map((_, index) => (
            <ListingCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      )}

      {/* Nouvelles annonces avec animation escalier */}
      {!isLoadingMap && listings.length > 0 && (
        <div className="grid gap-4 sm:gap-x-6 sm:gap-y-8 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4">
          {listings.map((listing, index) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isHovered={hoveredId === listing.id}
              onHover={() => setHoveredId(listing.id)}
              onLeave={() => setHoveredId(null)}
              t={t}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Message si aucune annonce */}
      {listings.length === 0 && !isLoadingMap && (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Aucune annonce dans cette zone</p>
          <p className="mt-1 text-sm text-gray-400">Déplacez ou dézoomez la carte pour voir plus d&apos;annonces</p>
        </div>
      )}

      {/* Map fixée à droite - desktop only - responsive pour grands écrans */}
      <div className="hidden lg:fixed lg:right-4 xl:right-6 2xl:right-8 lg:top-[80px] lg:block lg:h-[calc(100vh-100px)] lg:w-[38%] xl:w-[40%] 2xl:w-[42%] 3xl:w-[45%] lg:overflow-hidden lg:rounded-2xl lg:border lg:border-gray-200 lg:shadow-lg">
        <Map
          markers={markers}
          panOnHover={false}
          hoveredId={hoveredId}
          onMarkerHover={setHoveredId}
          onBoundsChange={handleBoundsChange}
          skipFitBounds={skipFitBounds}
        />

        {/* Indicateur de mode recherche sur la carte */}
        {isMapSearchEnabled && (
          <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-md backdrop-blur-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Déplacez la carte pour actualiser
            </span>
          </div>
        )}
      </div>

      {/* Carte mobile et tablette */}
      <section className="mt-6 sm:mt-8 lg:hidden">
        <div className="h-64 sm:h-72 md:h-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <Map
            markers={markers}
            panOnHover={false}
            hoveredId={hoveredId}
            onMarkerHover={setHoveredId}
            onBoundsChange={handleBoundsChange}
            skipFitBounds={skipFitBounds}
          />
        </div>
      </section>
    </div>
  );
}
