// apps/web/src/components/Map.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string; // ex: "120 €"
};

type MapProps = {
  markers?: MapMarker[];
};

const DEFAULT_CENTER = { lat: 45.5019, lng: -73.5674 }; // Montréal

export default function Map({ markers = [] }: MapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as
    | string
    | undefined;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-red-500">
        Clé <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> absente dans{" "}
        <code>.env.local</code>
      </div>
    );
  }

  // ✅ Fix : si on revient en arrière et que le script est déjà là,
  // on force scriptLoaded à true.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const g = (window as any).google;
    if (g?.maps) {
      setScriptLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current) return;

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

    if (markers.length > 0) {
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
      }
    }

    // AdvancedMarkerElement si dispo => bulles custom
    if (g.maps.marker?.AdvancedMarkerElement) {
      markers.forEach((m: MapMarker) => {
        if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) return;

        const div = document.createElement("div");
        div.className = "lokroom-map-badge";
        div.textContent = m.label ?? "";

        new g.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: m.lat, lng: m.lng },
          content: div,
        });
      });
    } else {
      // Fallback : marker classique avec petit icône transparent + label
      markers.forEach((m: MapMarker) => {
        if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) return;

        new g.maps.Marker({
          map,
          position: { lat: m.lat, lng: m.lng },
          label: m.label ?? "",
          icon: {
            path: "M0 0h1v1H0z",
            fillOpacity: 0,
            strokeOpacity: 0,
          },
        });
      });
    }
  }, [scriptLoaded, markers]);

  if (scriptError) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-red-500">
        {scriptError}
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`}
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

      <div
        ref={containerRef}
        className="h-full w-full rounded-3xl"
        style={{ minHeight: 360 }}
      />
    </>
  );
}
