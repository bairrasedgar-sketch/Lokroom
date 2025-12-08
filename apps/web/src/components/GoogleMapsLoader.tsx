"use client";

import Script from "next/script";
import { useEffect, useState, createContext, useContext } from "react";

type GoogleMapsContextType = {
  isLoaded: boolean;
  loadError: string | null;
};

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null,
});

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

export default function GoogleMapsLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Check if already loaded (e.g., page navigation)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const g = (window as unknown as { google?: { maps?: { places?: unknown } } }).google;
    if (g?.maps?.places) {
      setIsLoaded(true);
    }
  }, []);

  if (!apiKey) {
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, loadError: "API key missing" }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Google Maps API loaded globally");
          setIsLoaded(true);
        }}
        onError={(e) => {
          console.error("Error loading Google Maps", e);
          setLoadError("Failed to load Google Maps");
        }}
      />
      {children}
    </GoogleMapsContext.Provider>
  );
}
