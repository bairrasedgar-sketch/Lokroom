"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useGoogleMaps } from "./GoogleMapsLoader";

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
};

type MapProps = {
  markers?: MapMarker[];
  /** Quand true → on utilise le logo Lok'Room comme repère (détail annonce) */
  useLogoIcon?: boolean;

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
};

const DEFAULT_CENTER = { lat: 45.5019, lng: -73.5674 }; // Montréal

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
  hoveredId,
  onMarkerHover,
  onMarkerClick,
  panOnHover = true,
  onBoundsChange,
  skipFitBounds = false,
}: MapProps) {
  const { isLoaded: scriptLoaded, loadError: scriptError } = useGoogleMaps();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const missingApiKey = !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Référence vers la carte (persistante)
  const mapRef = useRef<any | null>(null);
  const mapInitializedRef = useRef(false);

  // Référence réactive vers l'id survolé (pour les bulles actives)
  const hoveredIdRef = useRef<string | null>(null);
  const overlaysRef = useRef<any[]>([]);
  const markersInstancesRef = useRef<any[]>([]);

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

    const g = (window as any).google as any;
    if (!g || !g.maps || typeof g.maps.Map !== "function") {
      console.error("Google Maps API non prête");
      return;
    }

    const WORLD_BOUNDS = { north: 85, south: -85, west: -180, east: 180 };

    const mapOptions: any = {
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
      mapInitializedRef.current = false;
      mapRef.current = null;
    };
  }, [missingApiKey, scriptLoaded]);

  // === EFFET 2: Mise à jour des markers (à chaque changement de markers) ===
  useEffect(() => {
    const map = mapRef.current;
    const g = (window as any).google;
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
        const marker = new g.maps.Marker({
          map,
          position,
          icon: { url: "/map-marker-lokroom.png", scaledSize: new g.maps.Size(56, 56) },
        });
        markersInstancesRef.current.push(marker);
        return;
      }

      // Mode bulle de prix (liste)
      const labelText = m.label ?? "";
      const overlay = new g.maps.OverlayView();
      (overlay as any).div = null;
      (overlay as any).markerId = m.id;

      overlay.onAdd = function () {
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

        (this as any).div = div;
        const panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(div);
      };

      overlay.draw = function () {
        const projection = this.getProjection();
        if (!projection) return;

        const point = projection.fromLatLngToDivPixel(position);
        const div = (this as any).div as HTMLDivElement | null;
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

      overlay.onRemove = function () {
        const div = (this as any).div as HTMLDivElement | null;
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

  if (scriptError) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-red-500">
        {scriptError}
      </div>
    );
  }

  const hasExternalClickHandler = !!onMarkerClick;
  const selectedMarker =
    !useLogoIcon && !hasExternalClickHandler && selectedId
      ? markers.find((m) => m.id === selectedId) ?? null
      : null;

  return (
    <>
      <div
        ref={mapContainerRef}
        className="relative h-full w-full rounded-3xl"
        style={{ minHeight: 360 }}
      >
        <div ref={containerRef} className="h-full w-full rounded-3xl" />

        {/* Boutons zoom custom */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              if (mapRef.current) {
                const currentZoom = mapRef.current.getZoom() || 12;
                mapRef.current.setZoom(currentZoom + 1);
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-medium text-gray-700 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl active:scale-95"
            aria-label="Zoom avant"
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
            aria-label="Zoom arrière"
          >
            −
          </button>
        </div>

        {/* Aperçu intégré façon Airbnb */}
        {selectedMarker && (
          <div className="pointer-events-auto absolute bottom-4 right-4 z-[1000] w-72 max-w-full overflow-hidden rounded-2xl border bg-white text-xs shadow-xl sm:w-80">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-gray-800 shadow"
              aria-label="Fermer l'aperçu"
            >
              ×
            </button>

            <Link href={`/listings/${selectedMarker.id}`} className="block">
              <div className="relative h-32 w-full bg-gray-100 sm:h-36">
                {selectedMarker.imageUrl ? (
                  <Image
                    src={selectedMarker.imageUrl}
                    alt={selectedMarker.title ?? "Annonce Lok'Room"}
                    fill
                    className="object-cover"
                    sizes="320px"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-[11px] text-gray-400">
                    Pas d&apos;image
                  </div>
                )}
              </div>

              <div className="space-y-1 px-3 pb-3 pt-2">
                <p className="line-clamp-1 text-[13px] font-semibold text-gray-900">
                  {selectedMarker.title ?? "Annonce Lok'Room"}
                </p>

                <p className="text-[11px] text-gray-500">
                  {selectedMarker.city ? `${selectedMarker.city}, ` : ""}
                  {selectedMarker.country}
                  {selectedMarker.createdAt && (
                    <>
                      {" · "}
                      {new Date(selectedMarker.createdAt).toLocaleDateString()}
                    </>
                  )}
                </p>

                <p className="pt-1 text-[13px] font-semibold text-gray-900">
                  {selectedMarker.priceFormatted ?? selectedMarker.label ?? ""}
                </p>
                <p className="text-[11px] text-gray-500">
                  Cliquer pour voir les détails
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>

      {missingApiKey && (
        <div className="flex h-full items-center justify-center text-xs text-red-500">
          Clé <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> absente dans{" "}
          <code>.env.local</code>
        </div>
      )}

      {!missingApiKey && scriptLoaded && markers.length === 0 && (
        <div className="mt-2 text-center text-[11px] text-gray-500">
          Localisation non disponible pour ces annonces.
        </div>
      )}
    </>
  );
}
