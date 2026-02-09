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

// IMPORTANT : on désactive le SSR pour le Toaster
const ToasterClient = dynamic(() => import("./toaster-client"), { ssr: false });

export default function Providers({ children }: { children: ReactNode }) {
  // Initialiser Capacitor au montage du composant
  useEffect(() => {
    initializeCapacitor();
  }, []);

  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <SWRConfig
        value={{
          // Refresh data every 30 seconds for real-time updates
          refreshInterval: 30000,

          // Disable revalidation on focus to reduce unnecessary requests
          revalidateOnFocus: false,

          // Revalidate when reconnecting to network
          revalidateOnReconnect: true,

          // Dedupe requests within 2 seconds
          dedupingInterval: 2000,

          // Keep previous data while revalidating for better UX
          keepPreviousData: true,

          // Error retry configuration
          errorRetryCount: 3,
          errorRetryInterval: 5000,

          // Show error boundary on error
          shouldRetryOnError: true,

          // Optimistic UI updates
          revalidateIfStale: true,
        }}
      >
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
