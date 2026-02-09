// apps/web/src/components/reviews/ReviewPhotoGallery.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface ReviewPhoto {
  id: string;
  url: string;
  caption?: string | null;
}

interface ReviewPhotoGalleryProps {
  photos: ReviewPhoto[];
}

export default function ReviewPhotoGallery({ photos }: ReviewPhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    document.body.style.overflow = "";
  };

  const goToPrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length);
  };

  const goToNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % photos.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
  };

  return (
    <>
      {/* Thumbnail grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-3">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => openLightbox(index)}
            className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition"
          >
            <Image
              src={photo.url}
              alt={photo.caption || `Photo ${index + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition z-10"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Previous button */}
          {photos.length > 1 && (
            <button
              onClick={goToPrevious}
              className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition z-10"
            >
              <ChevronLeftIcon className="w-8 h-8" />
            </button>
          )}

          {/* Image */}
          <div className="relative w-full h-full max-w-6xl max-h-[90vh] mx-4">
            <Image
              src={photos[selectedIndex].url}
              alt={photos[selectedIndex].caption || `Photo ${selectedIndex + 1}`}
              fill
              className="object-contain"
              priority
            />
            {photos[selectedIndex].caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-4 text-center">
                {photos[selectedIndex].caption}
              </div>
            )}
          </div>

          {/* Next button */}
          {photos.length > 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full transition z-10"
            >
              <ChevronRightIcon className="w-8 h-8" />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/60 px-4 py-2 rounded-full">
            {selectedIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
