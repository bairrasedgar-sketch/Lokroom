// apps/web/src/components/ListingGallery.tsx
"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/hooks/useTranslation";

type Img = { id: string; url: string };

interface ListingGalleryProps {
  images: Img[];
  title: string;
}

// Placeholder image for broken images
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='14' text-anchor='middle' x='200' y='150'%3EImage unavailable%3C/text%3E%3C/svg%3E";

export default function ListingGallery({ images, title }: ListingGalleryProps) {
  const { t } = useTranslation();
  const gallery = t.components.listingGallery;

  const safeImages = useMemo<Img[]>(
    () => (Array.isArray(images) ? images.filter(Boolean) : []),
    [images]
  );

  const total = safeImages.length;
  const [mobileIdx, setMobileIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIdx, setModalIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [errorImages, setErrorImages] = useState<Set<string>>(new Set());

  // Handle image error
  const handleImageError = useCallback((imageId: string) => {
    setErrorImages((prev) => new Set(prev).add(imageId));
  }, []);

  // Get image source with fallback
  const getImageSrc = useCallback(
    (img: Img) => {
      return errorImages.has(img.id) ? PLACEHOLDER_IMAGE : img.url;
    },
    [errorImages]
  );

  // For client-side portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset index if images change
  useEffect(() => {
    if (mobileIdx >= total) setMobileIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // Mobile carousel swipe
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > dy && dx > 10) {
      isDragging.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !isDragging.current) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    // Increased swipe threshold from 50px to 80px for less sensitivity
    if (Math.abs(dx) > 80) {
      if (dx < 0 && mobileIdx < total - 1) {
        setMobileIdx((i) => i + 1);
      } else if (dx > 0 && mobileIdx > 0) {
        setMobileIdx((i) => i - 1);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isDragging.current = false;
  };

  // Open modal at specific index
  const openModal = (index: number) => {
    setModalIdx(index);
    setModalOpen(true);
  };

  // Modal navigation
  const modalPrev = useCallback(() => {
    setModalIdx((i) => (i - 1 + total) % total);
  }, [total]);

  const modalNext = useCallback(() => {
    setModalIdx((i) => (i + 1) % total);
  }, [total]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  // Keyboard navigation for modal
  useEffect(() => {
    if (!modalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        modalPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        modalNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalOpen, modalPrev, modalNext, closeModal]);

  // Modal swipe support
  const modalTouchStartX = useRef<number | null>(null);

  const handleModalTouchStart = (e: React.TouchEvent) => {
    modalTouchStartX.current = e.touches[0].clientX;
  };

  const handleModalTouchEnd = (e: React.TouchEvent) => {
    if (modalTouchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - modalTouchStartX.current;
    // Increased swipe threshold from 50px to 80px for less sensitivity
    if (Math.abs(dx) > 80) {
      if (dx < 0) modalNext();
      else modalPrev();
    }
    modalTouchStartX.current = null;
  };

  if (total === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
        {gallery.noImagesAvailable}
      </div>
    );
  }

  // Fullscreen Modal Gallery
  const ModalGallery = () => {
    if (!modalOpen || !mounted) return null;

    return createPortal(
      <div
        className="fixed inset-0 z-50 bg-black flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={`${title} gallery`}
      >
        {/* Header with close button and counter */}
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <span className="text-sm font-medium">
            {modalIdx + 1} / {total}
          </span>
          <button
            type="button"
            onClick={closeModal}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label={gallery.closeGallery}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Main image area */}
        <div
          className="flex-1 relative flex items-center justify-center px-4 md:px-16"
          onTouchStart={handleModalTouchStart}
          onTouchEnd={handleModalTouchEnd}
        >
          {/* Left arrow */}
          <button
            type="button"
            onClick={modalPrev}
            className="absolute left-2 md:left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors hidden md:flex items-center justify-center"
            aria-label={gallery.prevImage}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Image container */}
          <div className="relative w-full h-full max-w-5xl max-h-[70vh]">
            <Image
              src={getImageSrc(safeImages[modalIdx])}
              alt={`${title} - ${gallery.imageAlt.replace("{number}", String(modalIdx + 1))} / ${total}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              onError={() => handleImageError(safeImages[modalIdx].id)}
            />
          </div>

          {/* Right arrow */}
          <button
            type="button"
            onClick={modalNext}
            className="absolute right-2 md:right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors hidden md:flex items-center justify-center"
            aria-label={gallery.nextImage}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Thumbnail strip */}
        <div className="px-4 py-4 overflow-x-auto">
          <div className="flex gap-2 justify-center">
            {safeImages.map((img, i) => (
              <button
                key={img.id || i}
                type="button"
                onClick={() => setModalIdx(i)}
                className={`relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                  i === modalIdx
                    ? "ring-2 ring-white opacity-100"
                    : "opacity-50 hover:opacity-75"
                }`}
                aria-label={gallery.viewImageNumber.replace("{number}", String(i + 1))}
                aria-current={i === modalIdx}
              >
                <Image
                  src={getImageSrc(img)}
                  alt={`${title} - ${gallery.thumbnail.replace("{number}", String(i + 1))}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  onError={() => handleImageError(img.id)}
                />
              </button>
            ))}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      {/* Mobile Carousel - visible on small screens */}
      <div className="block md:hidden">
        <div
          className="relative w-full aspect-[4/3] overflow-hidden rounded-xl bg-gray-100"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Sliding images container */}
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${mobileIdx * 100}%)` }}
          >
            {safeImages.map((img, i) => (
              <button
                key={img.id || i}
                type="button"
                className="relative h-full w-full flex-shrink-0"
                onClick={() => openModal(i)}
                aria-label={gallery.viewImageOf.replace("{number}", String(i + 1)).replace("{total}", String(total))}
              >
                <Image
                  src={getImageSrc(img)}
                  alt={`${title} - ${gallery.imageAlt.replace("{number}", String(i + 1))} / ${total}`}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={i === 0}
                  onError={() => handleImageError(img.id)}
                />
              </button>
            ))}
          </div>

          {/* Counter badge */}
          <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 text-white text-xs font-medium rounded-md">
            {mobileIdx + 1} / {total}
          </div>

          {/* Dots indicator - show for 2-5 images, counter badge handles > 5 */}
          {total > 1 && total <= 5 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {safeImages.map((_, i) => (
                <button
                  key={`dot-${i}`}
                  type="button"
                  onClick={() => setMobileIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === mobileIdx
                      ? "bg-white w-2.5"
                      : "bg-white/60 hover:bg-white/80"
                  }`}
                  aria-label={gallery.goToImage.replace("{number}", String(i + 1))}
                  aria-current={i === mobileIdx}
                />
              ))}
            </div>
          )}

          {/* Scrollable dots indicator for > 5 images - shows 5 dots with sliding window */}
          {total > 5 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 items-center">
              {(() => {
                // Calculate which 5 dots to show based on current index
                const maxVisible = 5;
                let startIdx = Math.max(0, Math.min(mobileIdx - 2, total - maxVisible));
                const visibleIndices = Array.from({ length: Math.min(maxVisible, total) }, (_, i) => startIdx + i);

                return visibleIndices.map((i) => (
                  <button
                    key={`dot-${i}`}
                    type="button"
                    onClick={() => setMobileIdx(i)}
                    className={`rounded-full transition-all ${
                      i === mobileIdx
                        ? "bg-white w-2 h-2"
                        : Math.abs(i - mobileIdx) === 1
                        ? "bg-white/70 w-1.5 h-1.5"
                        : "bg-white/50 w-1 h-1"
                    }`}
                    aria-label={gallery.goToImage.replace("{number}", String(i + 1))}
                    aria-current={i === mobileIdx}
                  />
                ));
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Grid - Airbnb style - visible on medium screens and up */}
      <div className="hidden md:block">
        <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden relative">
          {/* Show all photos button - top left overlay */}
          {total > 1 && (
            <button
              type="button"
              onClick={() => openModal(0)}
              className="absolute top-4 left-4 z-10 px-5 py-2.5 bg-white/70 backdrop-blur-sm text-gray-900 text-sm font-semibold rounded-lg hover:bg-white/80 transition-colors flex items-center gap-2 shadow-sm border border-gray-300/50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {gallery.showAllPhotos}
            </button>
          )}

          {/* Large image on left - 50% width */}
          <button
            type="button"
            className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 cursor-pointer group"
            onClick={() => openModal(0)}
            aria-label={gallery.viewImageOf.replace("{number}", "1").replace("{total}", String(total))}
          >
            <Image
              src={getImageSrc(safeImages[0])}
              alt={`${title} - ${gallery.mainImage}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="50vw"
              priority
              onError={() => handleImageError(safeImages[0].id)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>

          {/* 2x2 grid on right - 50% width */}
          <div className="grid grid-cols-2 grid-rows-2 gap-2">
            {[1, 2, 3, 4].map((gridIdx) => {
              const imgIdx = gridIdx;
              const hasImage = imgIdx < total;

              if (!hasImage) {
                return (
                  <div
                    key={`empty-${gridIdx}`}
                    className="relative aspect-[4/3] rounded-xl bg-gray-100"
                  />
                );
              }

              return (
                <button
                  key={safeImages[imgIdx].id || imgIdx}
                  type="button"
                  className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 cursor-pointer group"
                  onClick={() => openModal(imgIdx)}
                  aria-label={gallery.viewImageOf.replace("{number}", String(imgIdx + 1)).replace("{total}", String(total))}
                >
                  <Image
                    src={getImageSrc(safeImages[imgIdx])}
                    alt={`${title} - ${gallery.imageAlt.replace("{number}", String(imgIdx + 1))}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="25vw"
                    onError={() => handleImageError(safeImages[imgIdx].id)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                  {/* Show all photos button on last visible image if more images exist */}
                  {gridIdx === 4 && total > 5 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {gallery.morePhotos.replace("{count}", String(total - 5))}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Gallery */}
      <ModalGallery />
    </>
  );
}
