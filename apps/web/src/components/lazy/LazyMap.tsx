"use client";

import dynamic from "next/dynamic";
import { ComponentProps } from "react";

// Skeleton loader pour la carte
function MapSkeleton() {
  return (
    <div className="relative h-full w-full rounded-3xl bg-gray-100 animate-pulse">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-2 rounded-full border-4 border-gray-300 border-t-gray-600 animate-spin" />
          <p className="text-sm text-gray-500">Chargement de la carte...</p>
        </div>
      </div>
    </div>
  );
}

// Import dynamique du composant Map
const MapComponent = dynamic(() => import("@/components/Map"), {
  loading: () => <MapSkeleton />,
  ssr: false, // Google Maps ne peut pas être rendu côté serveur
});

// Type-safe wrapper
type MapProps = ComponentProps<typeof import("@/components/Map").default>;

export default function LazyMap(props: MapProps) {
  return <MapComponent {...props} />;
}
