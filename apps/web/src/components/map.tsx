// apps/web/src/components/Map.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string; // ex: "120 €"
};

type MapProps = {
  markers?: MapMarker[];
  /** Quand true → on utilise le logo Lok'Room comme repère (détail annonce) */
  useLogoIcon?: boolean;
};

const DEFAULT_CENTER = { lat: 45.5019, lng: -73.5674 }; // Montréal

export default function Map({ markers = [], useLogoIcon = false }: MapProps) {
  const apiKey = process.env
    .NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  const missingApiKey = !apiKey;

  // Si on revient sur la page et que Google Maps est déjà chargé
  useEffect(() => {
    if (typeof window === "undefined") return;
    const g = (window as any).google;
    if (g?.maps) {
      setScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (missingApiKey || !scriptLoaded || !containerRef.current) return;

    const g = (window as any).google as any;
    if (!g || !g.maps || typeof g.maps.Map !== "function") {
      console.error("Google Maps API non prête", {
        g,
        maps: g?.maps,
        mapCtor: g?.maps?.Map,
      });
      setScriptError(
        "Google Maps n'a pas pu s'initialiser correctement (voir console)."
      );
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
      zoomControl: true,
      gestureHandling: "greedy",
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

    // --- Markers ---
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
        (this as any).div = div;

        const panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(div);
      };

      overlay.draw = function () {
        const projection = this.getProjection();
        const point = projection.fromLatLngToDivPixel(position);
        const div = (this as any).div as HTMLDivElement | null;
        if (!div || !point) return;

        div.style.left = `${point.x}px`;
        div.style.top = `${point.y}px`;
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

    // Cleanup
    return () => {
      overlays.forEach((o) => o.setMap(null));
      markersInstances.forEach((m: any) => m.setMap(null));
    };
  }, [missingApiKey, scriptLoaded, markers, useLogoIcon]);

  if (scriptError) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-red-500">
        {scriptError}
      </div>
    );
  }

  return (
    <>
      {!missingApiKey && (
        <Script
          // pas de "marker" dans libraries → pas de problème d'ID de carte
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
          strategy="afterInteractive"
          onLoad={() => {
            console.log("Google Maps JS chargé ✔");
            setScriptLoaded(true);
          }}
          onError={(e) => {
            console.error("Erreur chargement Google Maps", e);
            setScriptError("Impossible de charger Google Maps (voir console)");
          }}
        />
      )}

      <div
        ref={containerRef}
        className="h-full w-full rounded-3xl"
        style={{ minHeight: 360 }}
      />

      {missingApiKey && (
        <div className="flex h-full items-center justify-center text-xs text-red-500">
          Clé <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> absente dans{" "}
          <code>.env.local</code>
        </div>
      )}
    </>
  );
}
