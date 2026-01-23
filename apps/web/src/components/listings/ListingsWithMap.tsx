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
  currentPage?: number;
  totalPages?: number;
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
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const images = listing.images || [];
  const hasMultipleImages = images.length > 1;

  // Animation d'apparition en escalier
  useEffect(() => {
    // Reset visibility when listing changes (new data from map)
    setIsVisible(false);
    setCurrentImageIndex(0); // Reset image index when listing changes
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 80); // 80ms de délai entre chaque carte (plus lent)
    return () => clearTimeout(timer);
  }, [index, listing.id]); // Re-trigger quand l'id change

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSlideDirection('left');
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSlideDirection('right');
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
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {images.map((image, idx) => (
                <div key={image.id || idx} className="relative h-full w-full flex-shrink-0">
                  <Image
                    src={image.url || ""}
                    alt={`${listing.title} - ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    priority={idx === 0}
                  />
                </div>
              ))}
            </div>
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

        {/* Flèches de navigation (visibles au hover) - style Airbnb */}
        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className={`absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm border border-gray-200/50 transition-all hover:bg-white hover:scale-105 hover:shadow-md ${
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
              className={`absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm border border-gray-200/50 transition-all hover:bg-white hover:scale-105 hover:shadow-md ${
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
// Détecte les micro-mouvements (quelques pixels / millimètres sur la carte)
function boundsAreEqual(
  a: { north: number; south: number; east: number; west: number } | null,
  b: { north: number; south: number; east: number; west: number } | null
): boolean {
  if (!a || !b) return false;

  // Calculer la taille de la zone visible
  const height = Math.abs(a.north - a.south);
  const width = Math.abs(a.east - a.west);

  // Seuil: 1% de la zone visible = micro-mouvement
  // Cela correspond à quelques pixels sur l'écran
  const thresholdLat = height * 0.01;
  const thresholdLng = width * 0.01;

  return (
    Math.abs(a.north - b.north) < thresholdLat &&
    Math.abs(a.south - b.south) < thresholdLat &&
    Math.abs(a.east - b.east) < thresholdLng &&
    Math.abs(a.west - b.west) < thresholdLng
  );
}

// Helper pour vérifier si les nouvelles bounds sont significativement différentes
// Recharge si l'utilisateur s'est déplacé d'au moins 8% de la zone visible
function boundsChangedSignificantly(
  oldBounds: { north: number; south: number; east: number; west: number } | null,
  newBounds: { north: number; south: number; east: number; west: number }
): boolean {
  if (!oldBounds) return true;

  const oldHeight = Math.abs(oldBounds.north - oldBounds.south);
  const oldWidth = Math.abs(oldBounds.east - oldBounds.west);

  // Éviter division par zéro
  if (oldHeight === 0 || oldWidth === 0) return true;

  // Calculer le déplacement du centre de la carte
  const oldCenterLat = (oldBounds.north + oldBounds.south) / 2;
  const oldCenterLng = (oldBounds.east + oldBounds.west) / 2;
  const newCenterLat = (newBounds.north + newBounds.south) / 2;
  const newCenterLng = (newBounds.east + newBounds.west) / 2;

  const centerMoveLat = Math.abs(newCenterLat - oldCenterLat) / oldHeight;
  const centerMoveLng = Math.abs(newCenterLng - oldCenterLng) / oldWidth;

  // Calculer le changement de zoom (taille de la zone)
  const newHeight = Math.abs(newBounds.north - newBounds.south);
  const newWidth = Math.abs(newBounds.east - newBounds.west);
  const zoomChangeHeight = Math.abs(newHeight - oldHeight) / oldHeight;
  const zoomChangeWidth = Math.abs(newWidth - oldWidth) / oldWidth;

  // Seuil: 8% de déplacement du centre OU 15% de changement de zoom
  // C'est assez sensible pour être réactif, mais évite les micro-mouvements
  const moveThreshold = 0.08;
  const zoomThreshold = 0.15;

  const significantMove = centerMoveLat > moveThreshold || centerMoveLng > moveThreshold;
  const significantZoom = zoomChangeHeight > zoomThreshold || zoomChangeWidth > zoomThreshold;

  return significantMove || significantZoom;
}

export default function ListingsWithMap({
  listings: initialListings,
  markers: initialMarkers,
  translations: t,
  searchParams = {},
  displayCurrency = "EUR",
  currentPage = 1,
  totalPages = 1,
}: ListingsWithMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [listings, setListings] = useState<ListingCardData[]>(initialListings);
  const [previousListings, setPreviousListings] = useState<ListingCardData[]>(initialListings);
  const [markers, setMarkers] = useState<MapMarker[]>(initialMarkers);
  const [totalCount, setTotalCount] = useState(initialListings.length);
  const [isMapSearchEnabled, setIsMapSearchEnabled] = useState(true);
  const [skipFitBounds, setSkipFitBounds] = useState(false);
  const [mobileSheetPosition, setMobileSheetPosition] = useState<'collapsed' | 'partial' | 'expanded'>('partial');
  const [isDragging, setIsDragging] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(45); // pourcentage de la hauteur

  const abortControllerRef = useRef<AbortController | null>(null);
  const isFirstLoad = useRef(true);
  const lastFetchedBounds = useRef<{ north: number; south: number; east: number; west: number } | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const lastTouchY = useRef(0);
  const lastTouchTime = useRef(0);
  const velocityY = useRef(0);

  // Tracker si on a fait un fetch manuel (pour éviter de re-fitBounds)
  const hasFetchedFromMapRef = useRef(false);

  // Gérer le comportement sticky de la map (s'arrête au niveau de la pagination)
  useEffect(() => {
    let rafId: number;

    const handleScroll = () => {
      // Utiliser requestAnimationFrame pour synchroniser avec le rendu
      rafId = requestAnimationFrame(() => {
        if (!mapRef.current) return;

        // Chercher la pagination ou le footer comme limite
        const pagination = document.querySelector('nav[aria-label="Pagination"]');
        const footer = document.querySelector('footer');
        const stopElement = pagination || footer;

        if (!stopElement) return;

        const map = mapRef.current;
        const stopRect = stopElement.getBoundingClientRect();
        const mapHeight = window.innerHeight - 100;
        const navbarHeight = 80;
        const margin = 20;

        const limitPoint = navbarHeight + mapHeight + margin;

        if (stopRect.top <= limitPoint) {
          // La map suit le scroll - synchrone, pas de transition
          const newTop = stopRect.top - mapHeight - margin;
          map.style.transition = 'none';
          map.style.top = `${newTop}px`;
        } else {
          // La map reste fixe en haut
          map.style.top = `${navbarHeight}px`;
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

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
      // 1. Vérifier si les bounds sont quasi identiques (micro-mouvements de quelques pixels)
      if (boundsAreEqual(lastFetchedBounds.current, bounds)) {
        return; // Éviter les fetches pour micro-mouvements
      }

      // 2. Vérifier si le changement est vraiment significatif (>8% de déplacement)
      if (!boundsChangedSignificantly(lastFetchedBounds.current, bounds)) {
        return; // Pas assez de changement pour justifier un rechargement
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
            images: l.images ?? [], // Passer toutes les images pour le carousel
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

      // Debounce de 600ms pour éviter trop de requêtes
      debounceTimeoutRef.current = setTimeout(() => {
        fetchListingsInBounds(bounds);
      }, 600);
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
          {/* Dédupliquer les listings par ID */}
          {listings.filter((listing, index, self) =>
            index === self.findIndex(l => l.id === listing.id)
          ).map((listing, index) => (
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

      {/* Pagination style Airbnb */}
      {totalPages > 1 && !isLoadingMap && (
        <nav className="mt-10 mb-6 flex items-center justify-center gap-1 relative z-20" aria-label="Pagination">
          {/* Bouton précédent */}
          <Link
            href={`/listings?${new URLSearchParams({ ...searchParams, page: String(Math.max(1, currentPage - 1)) }).toString()}`}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              currentPage === 1
                ? 'pointer-events-none text-gray-300'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-disabled={currentPage === 1}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Numéros de page */}
          {(() => {
            const pages: (number | string)[] = [];
            const showEllipsisStart = currentPage > 4;
            const showEllipsisEnd = currentPage < totalPages - 3;

            // Toujours afficher la page 1
            pages.push(1);

            if (showEllipsisStart) {
              pages.push('...');
            }

            // Pages autour de la page courante
            const start = showEllipsisStart ? Math.max(2, currentPage - 1) : 2;
            const end = showEllipsisEnd ? Math.min(totalPages - 1, currentPage + 1) : totalPages - 1;

            for (let i = start; i <= end; i++) {
              if (!pages.includes(i)) {
                pages.push(i);
              }
            }

            if (showEllipsisEnd) {
              pages.push('...');
            }

            // Toujours afficher la dernière page
            if (totalPages > 1 && !pages.includes(totalPages)) {
              pages.push(totalPages);
            }

            return pages.map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="flex h-10 w-10 items-center justify-center text-gray-500">
                    …
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <Link
                  key={pageNum}
                  href={`/listings?${new URLSearchParams({ ...searchParams, page: String(pageNum) }).toString()}`}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {pageNum}
                </Link>
              );
            });
          })()}

          {/* Bouton suivant */}
          <Link
            href={`/listings?${new URLSearchParams({ ...searchParams, page: String(Math.min(totalPages, currentPage + 1)) }).toString()}`}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              currentPage === totalPages
                ? 'pointer-events-none text-gray-300'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-disabled={currentPage === totalPages}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </nav>
      )}

      {/* Map fixée à droite - desktop only - responsive pour grands écrans */}
      {/* z-index bas pour que le footer passe par-dessus */}
      <div
        ref={mapRef}
        className="hidden lg:block lg:fixed lg:right-4 xl:right-6 2xl:right-8 lg:top-[80px] lg:h-[calc(100vh-100px)] lg:w-[38%] xl:w-[40%] 2xl:w-[42%] 3xl:w-[45%] lg:overflow-hidden lg:rounded-2xl lg:border lg:border-gray-200 lg:shadow-lg z-10"
      >
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
          <div className="absolute bottom-4 left-16 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-md backdrop-blur-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Déplacez la carte pour actualiser
            </span>
          </div>
        )}
      </div>

      {/* ========== MOBILE: Carte plein écran + Bottom Sheet style Airbnb ========== */}
      <div className="lg:hidden">
        {/* Carte en arrière-plan - plein écran */}
        <div
          className="fixed inset-0 z-0"
          style={{
            top: '64px',
            bottom: '60px',
          }}
        >
          <Map
            markers={markers}
            panOnHover={false}
            hoveredId={hoveredId}
            onMarkerHover={setHoveredId}
            onBoundsChange={handleBoundsChange}
            skipFitBounds={skipFitBounds}
          />
        </div>

        {/* Bottom Sheet draggable - Style Airbnb */}
        <div
          ref={sheetRef}
          className="fixed left-0 right-0 z-30 bg-white rounded-t-[20px] shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.15)]"
          style={{
            bottom: '60px',
            height: `${sheetHeight}vh`,
            maxHeight: 'calc(100vh - 124px)',
            minHeight: '80px',
            transition: isDragging ? 'none' : 'height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            willChange: 'height',
            touchAction: 'none',
          }}
        >
          {/* Handle de drag - Zone tactile agrandie */}
          <div
            className="relative flex flex-col items-center pt-2 pb-3 cursor-grab active:cursor-grabbing select-none"
            style={{ touchAction: 'none' }}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              setIsDragging(true);
              dragStartY.current = touch.clientY;
              dragStartHeight.current = sheetHeight;
              lastTouchY.current = touch.clientY;
              lastTouchTime.current = Date.now();
              velocityY.current = 0;
            }}
            onTouchMove={(e) => {
              if (!isDragging) return;
              e.preventDefault();

              const touch = e.touches[0];
              const currentY = touch.clientY;
              const currentTime = Date.now();

              // Calculer la vélocité (pixels par milliseconde)
              const timeDelta = currentTime - lastTouchTime.current;
              if (timeDelta > 0) {
                const instantVelocity = (lastTouchY.current - currentY) / timeDelta;
                // Lissage de la vélocité avec moyenne pondérée
                velocityY.current = velocityY.current * 0.7 + instantVelocity * 0.3;
              }

              lastTouchY.current = currentY;
              lastTouchTime.current = currentTime;

              // Calculer la nouvelle hauteur
              const deltaY = dragStartY.current - currentY;
              const deltaPercent = (deltaY / window.innerHeight) * 100;

              // Limites avec résistance élastique aux bords
              const rawHeight = dragStartHeight.current + deltaPercent;
              let newHeight: number;

              if (rawHeight > 88) {
                // Résistance élastique en haut
                const overflow = rawHeight - 88;
                newHeight = 88 + overflow * 0.15;
              } else if (rawHeight < 12) {
                // Résistance élastique en bas
                const overflow = 12 - rawHeight;
                newHeight = 12 - overflow * 0.15;
              } else {
                newHeight = rawHeight;
              }

              setSheetHeight(Math.min(95, Math.max(5, newHeight)));
            }}
            onTouchEnd={() => {
              setIsDragging(false);

              // Points de snap: collapsed (12%), partial (45%), expanded (88%)
              const SNAP_COLLAPSED = 12;
              const SNAP_PARTIAL = 45;
              const SNAP_EXPANDED = 88;

              // Seuil de vélocité pour déclencher un snap directionnel
              const VELOCITY_THRESHOLD = 0.25; // pixels/ms - plus bas = plus sensible

              let targetHeight: number;
              let targetPosition: 'collapsed' | 'partial' | 'expanded';

              // Si la vélocité est suffisante, snap dans la direction du mouvement
              if (Math.abs(velocityY.current) > VELOCITY_THRESHOLD) {
                if (velocityY.current > 0) {
                  // Mouvement vers le haut (agrandir)
                  if (sheetHeight < SNAP_PARTIAL) {
                    targetHeight = SNAP_PARTIAL;
                    targetPosition = 'partial';
                  } else {
                    targetHeight = SNAP_EXPANDED;
                    targetPosition = 'expanded';
                  }
                } else {
                  // Mouvement vers le bas (réduire)
                  if (sheetHeight > SNAP_PARTIAL) {
                    targetHeight = SNAP_PARTIAL;
                    targetPosition = 'partial';
                  } else {
                    targetHeight = SNAP_COLLAPSED;
                    targetPosition = 'collapsed';
                  }
                }
              } else {
                // Snap au point le plus proche basé sur la position
                const distToCollapsed = Math.abs(sheetHeight - SNAP_COLLAPSED);
                const distToPartial = Math.abs(sheetHeight - SNAP_PARTIAL);
                const distToExpanded = Math.abs(sheetHeight - SNAP_EXPANDED);

                if (distToCollapsed <= distToPartial && distToCollapsed <= distToExpanded) {
                  targetHeight = SNAP_COLLAPSED;
                  targetPosition = 'collapsed';
                } else if (distToPartial <= distToExpanded) {
                  targetHeight = SNAP_PARTIAL;
                  targetPosition = 'partial';
                } else {
                  targetHeight = SNAP_EXPANDED;
                  targetPosition = 'expanded';
                }
              }

              setSheetHeight(targetHeight);
              setMobileSheetPosition(targetPosition);
              velocityY.current = 0;
            }}
          >
            {/* Barre de drag visuelle */}
            <div className="w-9 h-[5px] bg-gray-300 rounded-full" />

            {/* Compteur d'annonces */}
            <div className="mt-3 flex items-center gap-2">
              <p className="text-[15px] font-semibold text-gray-900">
                {listings.length} logement{listings.length !== 1 ? 's' : ''}
              </p>
              {isLoadingMap && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              )}
            </div>

            {/* Indicateur de position (points) */}
            <div className="flex gap-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  mobileSheetPosition === 'collapsed' ? 'w-4 bg-gray-800' : 'w-1.5 bg-gray-300'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  mobileSheetPosition === 'partial' ? 'w-4 bg-gray-800' : 'w-1.5 bg-gray-300'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  mobileSheetPosition === 'expanded' ? 'w-4 bg-gray-800' : 'w-1.5 bg-gray-300'
                }`}
              />
            </div>
          </div>

          {/* Contenu scrollable */}
          <div
            className="overflow-y-auto overscroll-none pb-6 px-4"
            style={{
              height: 'calc(100% - 75px)',
              WebkitOverflowScrolling: 'touch',
            }}
            onTouchStart={(e) => {
              const scrollContainer = e.currentTarget;
              if (scrollContainer.scrollTop <= 0) {
                dragStartY.current = e.touches[0].clientY;
                dragStartHeight.current = sheetHeight;
              }
            }}
            onTouchMove={(e) => {
              const scrollContainer = e.currentTarget;
              const touch = e.touches[0];
              const isAtTop = scrollContainer.scrollTop <= 0;
              const pullingDown = touch.clientY > dragStartY.current;

              // Si on est en haut et qu'on tire vers le bas, on drag le sheet
              if (isAtTop && pullingDown) {
                e.preventDefault();
                const deltaY = dragStartY.current - touch.clientY;
                const deltaPercent = (deltaY / window.innerHeight) * 100;
                const newHeight = Math.max(12, Math.min(88, dragStartHeight.current + deltaPercent));
                setSheetHeight(newHeight);
                setIsDragging(true);
              }
            }}
            onTouchEnd={() => {
              if (isDragging) {
                setIsDragging(false);
                // Snap to nearest position
                if (sheetHeight < 28) {
                  setSheetHeight(12);
                  setMobileSheetPosition('collapsed');
                } else if (sheetHeight < 66) {
                  setSheetHeight(45);
                  setMobileSheetPosition('partial');
                } else {
                  setSheetHeight(88);
                  setMobileSheetPosition('expanded');
                }
              }
            }}
          >
            {/* Liste des annonces */}
            {!isLoadingMap && listings.length > 0 && (
              <div className="space-y-4">
                {listings.filter((listing, index, self) =>
                  index === self.findIndex(l => l.id === listing.id)
                ).map((listing, index) => (
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

            {/* Skeletons pendant le chargement */}
            {isLoadingMap && (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ListingCardSkeleton key={`skeleton-mobile-${index}`} />
                ))}
              </div>
            )}

            {/* Message si aucune annonce */}
            {listings.length === 0 && !isLoadingMap && (
              <div className="py-8 text-center">
                <p className="text-gray-600 font-medium">Aucune annonce dans cette zone</p>
                <p className="mt-1 text-sm text-gray-400">Déplacez la carte pour voir plus d&apos;annonces</p>
              </div>
            )}
          </div>
        </div>

        {/* Bouton de contrôle sur la carte */}
        <div className="fixed top-20 left-4 z-20">
          <button
            onClick={() => setIsMapSearchEnabled(!isMapSearchEnabled)}
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium shadow-lg backdrop-blur-sm ${
              isMapSearchEnabled
                ? "bg-gray-900/90 text-white"
                : "bg-white/90 text-gray-700"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isMapSearchEnabled ? "Auto" : "Manuel"}
          </button>
        </div>

        {/* Boutons de snap rapide */}
        <div
          className="fixed right-4 z-20 flex flex-col gap-2"
          style={{
            bottom: `calc(${sheetHeight}vh + 70px)`,
            transition: isDragging ? 'none' : 'bottom 0.35s cubic-bezier(0.32, 0.72, 0, 1)'
          }}
        >
          <button
            onClick={() => {
              if (mobileSheetPosition === 'expanded') {
                setSheetHeight(45);
                setMobileSheetPosition('partial');
              } else if (mobileSheetPosition === 'partial') {
                setSheetHeight(12);
                setMobileSheetPosition('collapsed');
              } else {
                setSheetHeight(45);
                setMobileSheetPosition('partial');
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm"
            aria-label={mobileSheetPosition === 'collapsed' ? 'Voir les annonces' : 'Voir la carte'}
          >
            <svg
              className={`h-5 w-5 text-gray-700 transition-transform duration-300 ${
                mobileSheetPosition === 'collapsed' ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
