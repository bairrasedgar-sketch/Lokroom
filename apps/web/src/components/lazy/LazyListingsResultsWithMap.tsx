"use client";

import dynamic from "next/dynamic";
import { ComponentProps } from "react";

// Skeleton loader pour les résultats avec carte
function ResultsWithMapSkeleton() {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)] lg:items-start">
      {/* Colonne gauche : cartes annonces skeleton */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="relative h-40 w-full bg-gray-200 animate-pulse" />
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
                <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                  <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Colonne droite : carte skeleton (desktop) */}
      <aside className="sticky top-20 hidden self-start lg:block">
        <div className="h-[520px] overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm animate-pulse">
          <div className="relative h-full w-full flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 mx-auto mb-2 rounded-full border-4 border-gray-300 border-t-gray-600 animate-spin" />
              <p className="text-sm text-gray-500">Chargement de la carte...</p>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}

// Import dynamique
const ListingsResultsWithMapComponent = dynamic(
  () => import("@/components/ListingsResultsWithMap"),
  {
    loading: () => <ResultsWithMapSkeleton />,
    ssr: false, // Contient Google Maps, pas de SSR
  }
);

type ListingsResultsWithMapProps = ComponentProps<typeof import("@/components/ListingsResultsWithMap").default>;

export default function LazyListingsResultsWithMap(props: ListingsResultsWithMapProps) {
  return <ListingsResultsWithMapComponent {...props} />;
}
