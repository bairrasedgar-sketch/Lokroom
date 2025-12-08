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
};

const DEFAULT_CENTER = { lat: 45.5019, lng: -73.5674 }; // Montréal

export default function Map({
  markers = [],
  useLogoIcon = false,
  hoveredId,
  onMarkerHover,
  onMarkerClick,
  panOnHover = true,
}: MapProps) {
  const { isLoaded: scriptLoaded, loadError: scriptError } = useGoogleMaps();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const missingApiKey = !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Référence vers la carte pour pouvoir la recentrer depuis un autre effet
  const mapRef = useRef<any | null>(null);

  // Référence réactive vers l'id survolé (pour les bulles actives)
  const hoveredIdRef = useRef<string | null>(null);
  const overlaysRef = useRef<any[]>([]);

  // Sélection interne pour l'aperçu intégré (si aucun onMarkerClick externe)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Ref pour le container de la map
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Bloquer le scroll de la page quand la souris est sur la map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Empêcher le scroll de la page, la map gère le zoom
      e.preventDefault();
      e.stopPropagation();
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    hoveredIdRef.current = hoveredId ?? null;

    // 🔁 force un redraw des overlays pour mettre à jour la classe active
    overlaysRef.current.forEach((ov) => {
      if (typeof ov.draw === "function") {
        ov.draw();
      }
    });
  }, [hoveredId]);

  // Reset sélection si les markers changent (ex: changement de filtres)
  useEffect(() => {
    setSelectedId(null);
  }, [markers]);

  useEffect(() => {
    if (missingApiKey || !scriptLoaded || !containerRef.current) return;

    const g = (window as any).google as any;
    if (!g || !g.maps || typeof g.maps.Map !== "function") {
      console.error("Google Maps API non prête", {
        g,
        maps: g?.maps,
        mapCtor: g?.maps?.Map,
      });
      return;
    }

    // --- Création de la carte ---
    const first = markers[0];
    const center = first
      ? { lat: first.lat, lng: first.lng }
      : DEFAULT_CENTER;

    const map = new g.maps.Map(containerRef.current, {
      center,
      zoom: first ? 12 : 4,
      mapTypeId: "roadmap",
      disableDefaultUI: true,
      zoomControl: false, // On va créer nos propres boutons
      // Activer le scroll zoom directement
      gestureHandling: "greedy",
      scrollwheel: true,
      clickableIcons: false, // désactive les popups de POI (parcs, restos, etc.)
      styles: [
        {
          featureType: "all",
          elementType: "labels.icon",
          stylers: [{ visibility: "off" }],
        },
        {
          featureType: "poi",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6b7280" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#e5e7eb" }],
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#d1d5db" }],
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [{ color: "#f3f4f6" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#dbeafe" }],
        },
      ],
    });

    mapRef.current = map;

    // Pour nettoyer les overlays & markers à l'unmount
    const overlays: any[] = [];
    const markersInstances: any[] = [];

    // --- Gestion du zoom / centrage ---
    if (markers.length === 1) {
      // Vue "quartier" pour une seule annonce
      const m = markers[0];
      if (Number.isFinite(m.lat) && Number.isFinite(m.lng)) {
        map.setCenter({ lat: m.lat, lng: m.lng });
        map.setZoom(14); // quartier, pas ultra-zoomé
      }
    } else if (markers.length > 1) {
      // Vue large qui englobe toutes les annonces
      const bounds = new g.maps.LatLngBounds();
      markers.forEach((m: MapMarker) => {
        if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) return;
        bounds.extend({ lat: m.lat, lng: m.lng });
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          top: 40,
          right: 40,
          bottom: 40,
          left: 40,
        });

        // Limite de zoom max pour éviter d'être trop près
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 12) {
          map.setZoom(12);
        }
      }
    }

    // --- Markers --->    
    markers.forEach((m: MapMarker) => {
      if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) return;

      const position = new g.maps.LatLng(m.lat, m.lng);

      // 1) Détail annonce → logo Lok'Room comme repère
      if (useLogoIcon) {
        const marker = new g.maps.Marker({
          map,
          position,
          icon: {
            url: "/map-marker-lokroom.png",
            scaledSize: new g.maps.Size(56, 56), // ajuste si tu veux
          },
        });
        markersInstances.push(marker);
        return;
      }

      // 2) Liste d'annonces → bulle de prix personnalisée (OverlayView)
      const labelText = m.label ?? "";

      const overlay = new g.maps.OverlayView();
      (overlay as any).div = null;

      overlay.onAdd = function () {
        const div = document.createElement("div");
        div.className = "lokroom-price-badge";
        div.textContent = labelText;

        // clic → apercu (interne si pas de handler externe) + highlight
        div.addEventListener("click", (event) => {
          event.stopPropagation(); // empêche le clic de remonter à la carte / POI

          if (onMarkerClick) {
            onMarkerClick(m.id);
          } else {
            setSelectedId(m.id);
          }
          if (onMarkerHover) onMarkerHover(m.id);
        });

        div.addEventListener("mouseenter", () => {
          if (onMarkerHover) onMarkerHover(m.id);
        });

        div.addEventListener("mouseleave", () => {
          if (onMarkerHover) onMarkerHover(null);
        });

        (this as any).div = div;

        const panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(div);
      };

      overlay.draw = function () {
        const projection = this.getProjection();
        if (!projection) return; // sécurité

        const point = projection.fromLatLngToDivPixel(position);
        const div = (this as any).div as HTMLDivElement | null;
        if (!div || !point) return;

        div.style.position = "absolute";
        div.style.left = `${point.x}px`;
        div.style.top = `${point.y}px`;

        // 💡 Mise à jour du style "actif" en fonction du hoveredId courant
        const currentHovered = hoveredIdRef.current;
        const isActive = currentHovered && currentHovered === m.id;

        if (isActive) {
          div.classList.add("lokroom-price-badge--active");
          // 👉 cette bulle passe AU-DESSUS des autres
          div.style.zIndex = "999";
        } else {
          div.classList.remove("lokroom-price-badge--active");
          div.style.zIndex = "1";
        }
      };

      overlay.onRemove = function () {
        const div = (this as any).div as HTMLDivElement | null;
        if (div && div.parentNode) {
          div.parentNode.removeChild(div);
        }
      };

      overlay.setMap(map);
      overlays.push(overlay);
    });

    overlaysRef.current = overlays;

    // Cleanup
    return () => {
      overlays.forEach((o) => o.setMap(null));
      markersInstances.forEach((m: any) => m.setMap(null));
      overlaysRef.current = [];
    };
  }, [
    missingApiKey,
    scriptLoaded,
    markers,
    useLogoIcon,
    onMarkerHover,
    onMarkerClick,
  ]);

  // 🎯 Quand on survole une carte dans la liste OU qu'on clique une bulle
  // → recentrer la map (optionnel)
  useEffect(() => {
    if (!panOnHover) return; // pour /listings : pas de déplacement au survol
    if (!hoveredId || !mapRef.current) return;

    const markerData = markers.find((m) => m.id === hoveredId);
    if (!markerData) return;

    const { lat, lng } = markerData;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const map = mapRef.current;
    map.panTo({ lat, lng });

    const currentZoom = map.getZoom();
    if (!currentZoom || currentZoom < 13) {
      map.setZoom(13);
    }
  }, [hoveredId, markers, panOnHover]);

  if (scriptError) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-red-500">
        {scriptError}
      </div>
    );
  }

  // 👉 Aperçu interne seulement si :
  // - on n’est PAS en mode logo (détail annonce)
  // - il n’y a PAS de onMarkerClick externe (cas ListingsWithMap)
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

        {/* Indicateur de zoom (apparaît brièvement au survol) */}
        <style jsx>{`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            15% { opacity: 1; transform: translateX(-50%) translateY(0); }
            85% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          }
        `}</style>

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

        {/* Aperçu intégré façon Airbnb (desktop & mobile) */}
        {selectedMarker && (
          <div className="pointer-events-auto absolute bottom-4 right-4 z-[1000] w-72 max-w-full overflow-hidden rounded-2xl border bg-white text-xs shadow-xl sm:w-80">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-gray-800 shadow"
              aria-label="Fermer l’aperçu"
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
                      {new Date(
                        selectedMarker.createdAt,
                      ).toLocaleDateString()}
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
