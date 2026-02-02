/// <reference types="@types/google.maps" />
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useGoogleMaps } from "./GoogleMapsLoader";
import FavoriteButton from "@/components/FavoriteButton";
import { useTranslation } from "@/hooks/useTranslation";

// Types pour Google Maps
type GoogleMap = google.maps.Map;
type GoogleOverlayView = google.maps.OverlayView;
type GoogleMarker = google.maps.Marker;

type WindowWithGoogle = Window & {
  google?: {
    maps: typeof google.maps;
  };
};

// Interface pour les overlays personnalisés avec propriétés additionnelles
interface CustomOverlay extends google.maps.OverlayView {
  div: HTMLDivElement | null;
  markerId: string;
}

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string; // ex: "120 €"

  // Infos optionnelles pour l'aperçu façon Airbnb
  title?: string;
  city?: string | null;
  country?: string;
  createdAt?: string | Date;
  priceFormatted?: string;
  imageUrl?: string | null;
  images?: { id: string; url: string }[]; // Toutes les images pour le carousel
};

type MapProps = {
  markers?: MapMarker[];
  /** Quand true → on utilise le logo Lok'Room comme repère (détail annonce) */
  useLogoIcon?: boolean;

  /** Quand true → carte interactive (pour modal agrandie) */
  interactive?: boolean;

  /** Id de l'annonce survolée dans la liste (pour recentrer / zoomer) */
  hoveredId?: string | null;

  /** Callback quand on survole une bulle sur la carte */
  onMarkerHover?: (id: string | null) => void;

  /** Callback quand on clique sur une bulle sur la carte (aperçu externe Airbnb-like) */
  onMarkerClick?: (id: string) => void;

  /** Est-ce qu'on déplace la carte quand hoveredId change ? */
  panOnHover?: boolean;

  /** Callback quand les bounds de la carte changent (zoom/pan) */
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;

  /** Si true, ne pas faire fitBounds quand les markers changent (utile après un fetch basé sur la carte) */
  skipFitBounds?: boolean;

  /** PlaceId Google pour centrer la carte sur un lieu précis avec zoom adaptatif */
  placeId?: string;
};

const DEFAULT_CENTER = { lat: 45.5019, lng: -73.5674 }; // Montréal

// Composant popup style Airbnb pour la carte
function MapPopupCard({
  marker,
  onClose,
  mapT,
}: {
  marker: MapMarker;
  onClose: () => void;
  mapT: {
    closePreview: string;
    noImage: string;
    prevImage: string;
    nextImage: string;
    viewImage: string;
    listingAlt: string;
    locationFallback: string;
    perNight: string;
    viewDetails: string;
  };
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const images = marker.images ?? (marker.imageUrl ? [{ id: "0", url: marker.imageUrl }] : []);
  const hasMultipleImages = images.length > 1;

  const goToImage = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentImageIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning]);

  const nextImage = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      goToImage((currentImageIndex + 1) % images.length);
    },
    [currentImageIndex, images.length, goToImage]
  );

  const prevImage = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      goToImage((currentImageIndex - 1 + images.length) % images.length);
    },
    [currentImageIndex, images.length, goToImage]
  );

  const locationLabel = [marker.city ?? undefined, marker.country ?? undefined]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-[1000] w-[280px] max-w-[calc(100%-32px)] overflow-hidden rounded-xl bg-white shadow-2xl sm:w-[300px]">
      {/* Image container avec carousel */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {/* Bouton fermer - toujours visible en haut gauche */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute left-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-105"
          aria-label={mapT.closePreview}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Bouton favori - en haut à droite */}
        <div className="absolute right-2 top-2 z-20">
          <FavoriteButton listingId={marker.id} size={22} variant="card" />
        </div>

        {/* Carousel d'images avec slide fluide */}
        <Link href={`/listings/${marker.id}`} className="block h-full w-full">
          {images.length > 0 ? (
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{
                width: `${images.length * 100}%`,
                transform: `translateX(-${currentImageIndex * (100 / images.length)}%)`
              }}
            >
              {images.map((img, idx) => (
                <div key={img.id || idx} className="relative h-full flex-shrink-0" style={{ width: `${100 / images.length}%` }}>
                  <Image
                    src={img.url}
                    alt={`${marker.title ?? "Annonce"} - Image ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="300px"
                    priority={idx === 0}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
              {mapT.noImage}
            </div>
          )}
        </Link>

        {/* Flèches de navigation */}
        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95"
              aria-label={mapT.prevImage}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-95"
              aria-label={mapT.nextImage}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                  goToImage(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === currentImageIndex
                    ? "bg-white w-2"
                    : "bg-white/60 w-1.5 hover:bg-white/80"
                }`}
                aria-label={mapT.viewImage.replace("{idx}", String(idx + 1))}
              />
            ))}
            {images.length > 5 && (
              <span className="text-[10px] text-white/80 ml-1">+{images.length - 5}</span>
            )}
          </div>
        )}
      </div>

      {/* Infos de l'annonce */}
      <Link href={`/listings/${marker.id}`} className="block p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[14px] font-semibold text-gray-900 flex-1">
            {marker.title ?? mapT.listingAlt}
          </h3>
        </div>

        <p className="mt-0.5 text-[12px] text-gray-500 line-clamp-1">
          {locationLabel || mapT.locationFallback}
        </p>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[14px]">
            <span className="font-semibold text-gray-900">
              {marker.priceFormatted ?? marker.label ?? ""}
            </span>
            <span className="font-normal text-gray-500"> {mapT.perNight}</span>
          </p>
          <span className="text-[11px] text-gray-400">{mapT.viewDetails}</span>
        </div>
      </Link>
    </div>
  );
}

// Style écologique pour la map
const MAP_STYLES = [
  // Fond général - beige chaud et reposant
  { featureType: "landscape", elementType: "geometry.fill", stylers: [{ color: "#f5efe6" }] },
  { featureType: "landscape.natural", elementType: "geometry.fill", stylers: [{ color: "#f0e9de" }] },
  { featureType: "landscape.man_made", elementType: "geometry.fill", stylers: [{ color: "#f7f2ea" }] },
  // Parcs et espaces verts - vert écologique #a5d8a1
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#a5d8a1" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#4a7c47" }] },
  // Forêts et végétation
  { featureType: "landscape.natural.terrain", elementType: "geometry.fill", stylers: [{ color: "#b8e0b4" }] },
  { featureType: "landscape.natural.landcover", elementType: "geometry.fill", stylers: [{ color: "#c2e8be" }] },
  // Autres POI - beige avec touches subtiles
  { featureType: "poi.attraction", elementType: "geometry.fill", stylers: [{ color: "#ebe4d8" }] },
  { featureType: "poi.business", elementType: "geometry.fill", stylers: [{ color: "#f5efe6" }] },
  { featureType: "poi.school", elementType: "geometry.fill", stylers: [{ color: "#f0e9de" }] },
  { featureType: "poi.medical", elementType: "geometry.fill", stylers: [{ color: "#f7f2ea" }] },
  { featureType: "poi.sports_complex", elementType: "geometry.fill", stylers: [{ color: "#a5d8a1" }] },
  { featureType: "poi.government", elementType: "geometry.fill", stylers: [{ color: "#ebe4d8" }] },
  { featureType: "poi.place_of_worship", elementType: "geometry.fill", stylers: [{ color: "#f0e9de" }] },
  // Cacher les icônes POI
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#8a7a65" }] },
  // Eau - bleu doux #cae8f2
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#cae8f2" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#5a9aaa" }] },
  // Routes
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e8e0d5" }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#fdfbf8" }] },
  { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: "#ebe4d8" }] },
  { featureType: "road.local", elementType: "geometry.fill", stylers: [{ color: "#faf7f2" }] },
  { featureType: "road.local", elementType: "geometry.stroke", stylers: [{ color: "#ebe4d8" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a7a65" }] },
  // Transit
  { featureType: "transit.station", elementType: "geometry.fill", stylers: [{ color: "#ebe4d8" }] },
  { featureType: "transit.line", elementType: "geometry.fill", stylers: [{ color: "#e0d8cc" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  // Labels
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#5a5045" }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#7a6a5a" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#9a8a7a" }] },
];

export default function Map({
  markers = [],
  useLogoIcon = false,
  interactive = false,
  hoveredId,
  onMarkerHover,
  onMarkerClick,
  panOnHover = true,
  onBoundsChange,
  skipFitBounds = false,
  placeId,
}: MapProps) {
  const { isLoaded: scriptLoaded, loadError: scriptError } = useGoogleMaps();
  const { t } = useTranslation();
  const mapT = t.components.map;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const missingApiKey = !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Référence vers la carte (persistante)
  const mapRef = useRef<GoogleMap | null>(null);
  const mapInitializedRef = useRef(false);

  // Référence réactive vers l'id survolé (pour les bulles actives)
  const hoveredIdRef = useRef<string | null>(null);
  const overlaysRef = useRef<GoogleOverlayView[]>([]);
  const markersInstancesRef = useRef<GoogleMarker[]>([]);

  // Refs pour les callbacks (éviter les re-renders)
  const onMarkerHoverRef = useRef(onMarkerHover);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onBoundsChangeRef = useRef(onBoundsChange);

  // Mettre à jour les refs quand les callbacks changent
  useEffect(() => {
    onMarkerHoverRef.current = onMarkerHover;
    onMarkerClickRef.current = onMarkerClick;
    onBoundsChangeRef.current = onBoundsChange;
  }, [onMarkerHover, onMarkerClick, onBoundsChange]);

  // Sélection interne pour l'aperçu intégré (si aucun onMarkerClick externe)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Ref pour le container de la map
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Bloquer le scroll de la page quand la souris est sur la map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // Mettre à jour la ref hoveredId et redessiner les overlays
  useEffect(() => {
    hoveredIdRef.current = hoveredId ?? null;
    overlaysRef.current.forEach((ov) => {
      if (typeof ov.draw === "function") ov.draw();
    });
  }, [hoveredId]);

  // Reset sélection si les markers changent
  useEffect(() => {
    setSelectedId(null);
  }, [markers]);

  // === EFFET 1: Création de la map (UNE SEULE FOIS) ===
  useEffect(() => {
    if (missingApiKey || !scriptLoaded || !containerRef.current || mapInitializedRef.current) return;

    const g = (window as WindowWithGoogle).google;
    if (!g || !g.maps || typeof g.maps.Map !== "function") {
      console.error(mapT.googleMapsNotReady);
      return;
    }

    const WORLD_BOUNDS = { north: 85, south: -85, west: -180, east: 180 };

    const mapOptions: google.maps.MapOptions = {
      center: DEFAULT_CENTER,
      zoom: 5,
      mapTypeId: "roadmap",
      disableDefaultUI: true,
      zoomControl: false,
      gestureHandling: "greedy",
      scrollwheel: true,
      clickableIcons: false,
      minZoom: 2,
      maxZoom: 18,
      restriction: { latLngBounds: WORLD_BOUNDS, strictBounds: true },
      styles: MAP_STYLES,
      // Optimisations pour un zoom/pan plus fluide sur mobile
      isFractionalZoomEnabled: true, // Zoom fractionnaire pour plus de fluidite
      draggableCursor: 'grab',
      draggingCursor: 'grabbing',
    };

    const map = new g.maps.Map(containerRef.current, mapOptions);
    mapRef.current = map;
    mapInitializedRef.current = true;

    // Listener pour les changements de bounds (PERMANENT)
    map.addListener("idle", () => {
      const bounds = map.getBounds();
      if (bounds && onBoundsChangeRef.current) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        onBoundsChangeRef.current({
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng(),
        });
      }
    });

    // Cleanup on unmount
    return () => {
      // Clean up overlays and markers
      overlaysRef.current.forEach((o) => o.setMap(null));
      markersInstancesRef.current.forEach((m) => m.setMap(null));
      overlaysRef.current = [];
      markersInstancesRef.current = [];
      mapInitializedRef.current = false;
      mapRef.current = null;
    };
  }, [missingApiKey, scriptLoaded]);

  // === EFFET 2: Mise à jour des markers (à chaque changement de markers) ===
  useEffect(() => {
    const map = mapRef.current;
    const g = (window as WindowWithGoogle).google;
    if (!map || !g || !g.maps) return;

    // Nettoyer les anciens overlays et markers
    overlaysRef.current.forEach((o) => o.setMap(null));
    markersInstancesRef.current.forEach((m) => m.setMap(null));
    overlaysRef.current = [];
    markersInstancesRef.current = [];

    if (markers.length === 0) return;

    // Centrer sur les markers (seulement si c'est le premier affichage de ces markers)
    const bounds = new g.maps.LatLngBounds();
    let hasValidMarker = false;

    markers.forEach((m: MapMarker) => {
      if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) return;
      hasValidMarker = true;

      const position = new g.maps.LatLng(m.lat, m.lng);
      bounds.extend(position);

      // Mode logo (page détail)
      if (useLogoIcon) {
        // Si interactive (modal agrandie), permettre zoom et déplacement complet
        if (interactive) {
          map.setOptions({
            draggable: true,
            zoomControl: true,
            scrollwheel: true,
            disableDoubleClickZoom: false,
            gestureHandling: "greedy",
            keyboardShortcuts: true,
            clickableIcons: false,
          });
        } else {
          // Carte petite sur PC: pas d'interaction, scroll passe à la page
          map.setOptions({
            draggable: false,
            zoomControl: true,
            scrollwheel: false,
            disableDoubleClickZoom: true,
            gestureHandling: "none",
            keyboardShortcuts: false,
            clickableIcons: false,
          });
        }

        // Centrer et zoomer sur la position (niveau quartier/rue)
        map.setCenter(position);
        map.setZoom(16);

        // Ajouter le marqueur (taille fixe qui ne change pas avec le zoom)
        const marker = new g.maps.Marker({
          map,
          position,
          icon: {
            url: "/map-marker-lokroom-2.png",
            scaledSize: new g.maps.Size(120, 120),
            anchor: new g.maps.Point(60, 60),
          },
        });
        markersInstancesRef.current.push(marker);
        return;
      }

      // Mode bulle de prix (liste)
      const labelText = m.label ?? "";
      const overlay = new g.maps.OverlayView() as CustomOverlay;
      overlay.div = null;
      overlay.markerId = m.id;

      overlay.onAdd = function (this: CustomOverlay) {
        const div = document.createElement("div");
        div.className = "lokroom-price-badge";
        div.textContent = labelText;

        div.addEventListener("click", (event) => {
          event.stopPropagation();
          if (onMarkerClickRef.current) {
            onMarkerClickRef.current(m.id);
          } else {
            setSelectedId(m.id);
          }
          if (onMarkerHoverRef.current) onMarkerHoverRef.current(m.id);
        });

        div.addEventListener("mouseenter", () => {
          if (onMarkerHoverRef.current) onMarkerHoverRef.current(m.id);
        });

        div.addEventListener("mouseleave", () => {
          if (onMarkerHoverRef.current) onMarkerHoverRef.current(null);
        });

        this.div = div;
        const panes = this.getPanes();
        if (panes) {
          panes.overlayMouseTarget.appendChild(div);
        }
      };

      overlay.draw = function (this: CustomOverlay) {
        const projection = this.getProjection();
        if (!projection) return;

        const point = projection.fromLatLngToDivPixel(position);
        const div = this.div;
        if (!div || !point) return;

        div.style.position = "absolute";
        div.style.left = `${point.x}px`;
        div.style.top = `${point.y}px`;

        const currentHovered = hoveredIdRef.current;
        const isActive = currentHovered && currentHovered === m.id;

        if (isActive) {
          div.classList.add("lokroom-price-badge--active");
          div.style.zIndex = "999";
        } else {
          div.classList.remove("lokroom-price-badge--active");
          div.style.zIndex = "1";
        }
      };

      overlay.onRemove = function (this: CustomOverlay) {
        const div = this.div;
        if (div && div.parentNode) div.parentNode.removeChild(div);
      };

      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });

    // Ajuster la vue sur les markers UNIQUEMENT si on ne skip pas
    if (hasValidMarker && !bounds.isEmpty() && !skipFitBounds) {
      if (markers.length === 1) {
        const m = markers[0];
        map.setCenter({ lat: m.lat, lng: m.lng });
        map.setZoom(14);
      } else {
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
        // Limiter le zoom max
        g.maps.event.addListenerOnce(map, "idle", () => {
          const currentZoom = map.getZoom();
          if (currentZoom && currentZoom > 14) {
            map.setZoom(14);
          }
        });
      }
    }
  }, [markers, useLogoIcon, skipFitBounds]);

  // === EFFET 3: Pan vers le marker survolé ===
  useEffect(() => {
    if (!panOnHover || !hoveredId || !mapRef.current) return;

    const markerData = markers.find((m) => m.id === hoveredId);
    if (!markerData) return;

    const { lat, lng } = markerData;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    // Ne pas recentrer si on a panOnHover=false (mode listings)
    // Le panOnHover est déjà vérifié en haut
  }, [hoveredId, markers, panOnHover]);

  // === EFFET 4: Centrer sur un placeId avec zoom adaptatif ===
  useEffect(() => {
    if (!placeId || !mapRef.current) return;

    const g = (window as WindowWithGoogle).google;
    if (!g?.maps?.places?.PlacesService) return;

    const map = mapRef.current;
    const service = new g.maps.places.PlacesService(map);

    service.getDetails(
      { placeId, fields: ["geometry", "types"] },
      (place, status) => {
        if (status !== g.maps.places.PlacesServiceStatus.OK || !place?.geometry) return;

        const location = place.geometry.location;
        const types = place.types || [];

        // Zoom basé sur le type - toujours montrer une vue large pour trouver des annonces
        let zoom = 12; // Par défaut niveau ville

        if (types.includes("country")) {
          zoom = 5;
        } else if (types.includes("administrative_area_level_1")) {
          zoom = 7; // Région/Province
        } else if (types.includes("administrative_area_level_2")) {
          zoom = 9; // Département
        } else if (types.includes("locality") || types.includes("postal_town")) {
          zoom = 12; // Ville
        } else if (types.includes("sublocality") || types.includes("neighborhood")) {
          zoom = 13; // Quartier - un peu plus large
        } else {
          // Rue, adresse → niveau ville pour avoir des résultats
          zoom = 12;
        }

        if (location) {
          map.setCenter(location);
          map.setZoom(zoom);
        }
      }
    );
  }, [placeId]);

  // State pour erreur de chargement de la carte
  const [mapLoadError, setMapLoadError] = useState(false);

  // Detecter si la carte n'a pas pu se charger apres un delai
  useEffect(() => {
    if (missingApiKey || scriptError) return;
    if (!scriptLoaded) return;

    const timeout = setTimeout(() => {
      if (!mapRef.current) {
        setMapLoadError(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [scriptLoaded, missingApiKey, scriptError]);

  if (scriptError) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-red-500">
        {scriptError}
      </div>
    );
  }

  if (mapLoadError && !mapRef.current) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-2 p-4 text-center">
        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="text-sm text-gray-600">{mapT.loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        >
          {mapT.retry}
        </button>
      </div>
    );
  }

  const hasExternalClickHandler = !!onMarkerClick;
  const selectedMarker =
    !useLogoIcon && !hasExternalClickHandler && selectedId
      ? markers.find((m) => m.id === selectedId) ?? null
      : null;

  // Fermer la popup au clic en dehors (sur la carte)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;

    const g = (window as WindowWithGoogle).google;
    if (!g?.maps) return;

    const listener = map.addListener("click", () => {
      setSelectedId(null);
    });

    return () => {
      g.maps.event.removeListener(listener);
    };
  }, [selectedId]);

  return (
    <>
      <div
        ref={mapContainerRef}
        className="relative h-full w-full rounded-3xl"
        style={{ minHeight: 360 }}
      >
        <div ref={containerRef} className="h-full w-full rounded-3xl" />

        {/* Boutons zoom custom - desktop uniquement */}
        <div className="absolute bottom-4 left-4 z-10 hidden md:flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              if (mapRef.current) {
                const currentZoom = mapRef.current.getZoom() || 12;
                mapRef.current.setZoom(currentZoom + 1);
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-medium text-gray-700 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl active:scale-95"
            aria-label={mapT.zoomIn}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => {
              if (mapRef.current) {
                const currentZoom = mapRef.current.getZoom() || 12;
                mapRef.current.setZoom(currentZoom - 1);
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-medium text-gray-700 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl active:scale-95"
            aria-label={mapT.zoomOut}
          >
            −
          </button>
        </div>

        {/* Aperçu intégré façon Airbnb avec carousel */}
        {selectedMarker && (
          <MapPopupCard
            marker={selectedMarker}
            onClose={() => setSelectedId(null)}
            mapT={mapT}
          />
        )}
      </div>

      {missingApiKey && (
        <div className="flex h-full items-center justify-center text-xs text-red-500">
          {mapT.apiKeyMissing}
        </div>
      )}

      {!missingApiKey && scriptLoaded && markers.length === 0 && (
        <div className="mt-2 text-center text-[11px] text-gray-500">
          {mapT.noLocationAvailable}
        </div>
      )}
    </>
  );
}
