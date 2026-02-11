"use client";

import dynamic from "next/dynamic";
import { ComponentProps } from "react";

// Skeleton loader pour la galerie
function GallerySkeleton() {
  return (
    <>
      {/* Mobile Skeleton */}
      <div className="block md:hidden">
        <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl bg-gray-200 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Desktop Skeleton */}
      <div className="hidden md:block">
        <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
          {/* Large image skeleton */}
          <div className="relative aspect-[4/3] rounded-xl bg-gray-200 animate-pulse" />

          {/* 2x2 grid skeleton */}
          <div className="grid grid-cols-2 grid-rows-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative aspect-[4/3] rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// Import dynamique de la galerie
const ListingGalleryComponent = dynamic(() => import("@/components/ListingGallery"), {
  loading: () => <GallerySkeleton />,
  ssr: true, // La galerie peut être rendue côté serveur
});

type ListingGalleryProps = ComponentProps<typeof import("@/components/ListingGallery").default>;

export default function LazyListingGallery(props: ListingGalleryProps) {
  return <ListingGalleryComponent {...props} />;
}
