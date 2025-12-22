"use client";

import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { SearchBarProvider } from "@/contexts/SearchBarContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import GoogleMapsLoader from "./GoogleMapsLoader";

// IMPORTANT : on désactive le SSR pour le Toaster
const ToasterClient = dynamic(() => import("./toaster-client"), { ssr: false });

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <FavoritesProvider>
        <GoogleMapsLoader>
          <SearchBarProvider>
            {children}
            <ToasterClient />
          </SearchBarProvider>
        </GoogleMapsLoader>
      </FavoritesProvider>
    </SessionProvider>
  );
}
