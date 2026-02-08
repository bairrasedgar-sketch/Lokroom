"use client";

import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { SearchBarProvider } from "@/contexts/SearchBarContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { MobileSheetProvider } from "@/contexts/MobileSheetContext";
import GoogleMapsLoader from "./GoogleMapsLoader";
import { initializeCapacitor } from "@/lib/capacitor";

// IMPORTANT : on désactive le SSR pour le Toaster
const ToasterClient = dynamic(() => import("./toaster-client"), { ssr: false });

export default function Providers({ children }: { children: ReactNode }) {
  // Initialiser Capacitor au montage du composant
  useEffect(() => {
    initializeCapacitor();
  }, []);

  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <FavoritesProvider>
        <MobileSheetProvider>
          <GoogleMapsLoader>
            <SearchBarProvider>
              {children}
              <ToasterClient />
            </SearchBarProvider>
          </GoogleMapsLoader>
        </MobileSheetProvider>
      </FavoritesProvider>
    </SessionProvider>
  );
}
