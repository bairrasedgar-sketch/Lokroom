"use client";

import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { SearchBarProvider } from "@/contexts/SearchBarContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { MobileSheetProvider } from "@/contexts/MobileSheetContext";
import GoogleMapsLoader from "./GoogleMapsLoader";

// IMPORTANT : on désactive le SSR pour le Toaster
const ToasterClient = dynamic(() => import("./toaster-client"), { ssr: false });

export default function Providers({ children }: { children: ReactNode }) {
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
