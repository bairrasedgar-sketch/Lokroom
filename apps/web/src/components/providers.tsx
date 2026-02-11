"use client";

import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { SearchBarProvider } from "@/contexts/SearchBarContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { MobileSheetProvider } from "@/contexts/MobileSheetContext";
import GoogleMapsLoader from "./GoogleMapsLoader";
import { initializeCapacitor } from "@/lib/capacitor";
import { swrConfig } from "@/lib/swr-config";

// IMPORTANT : on désactive le SSR pour le Toaster
const ToasterClient = dynamic(() => import("./toaster-client"), { ssr: false });

export default function Providers({ children }: { children: ReactNode }) {
  // Initialiser Capacitor au montage du composant
  useEffect(() => {
    initializeCapacitor();
  }, []);

  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <SWRConfig value={swrConfig}>
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
      </SWRConfig>
    </SessionProvider>
  );
}
