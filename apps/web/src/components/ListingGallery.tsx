// apps/web/src/components/ListingGallery.tsx
"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Img = { id?: string; url: string };

export default function ListingGallery({
  images,
  aspect = 4 / 3,
  objectFit = "contain", // "cover" si tu veux remplir la zone
  title = "Photo de l'annonce", // Pour l'accessibilité
}: {
  images: Img[];
  aspect?: number;
  objectFit?: "contain" | "cover";
  title?: string;
}) {
  const safeImages = useMemo<Img[]>(
    () => (Array.isArray(images) ? images.filter(Boolean) : []),
    [images]
  );

  const total = safeImages.length;
  const [idx, setIdx] = useState(0);
  const canNav = total > 1;

  useEffect(() => {
    if (idx > total - 1) setIdx(0);
  }, [total, idx]);

  const prev = useCallback(() => canNav && setIdx((i) => (i - 1 + total) % total), [canNav, total]);
  const next = useCallback(() => canNav && setIdx((i) => (i + 1) % total), [canNav, total]);

  // Navigation clavier ← →
  useEffect(() => {
    if (!canNav) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canNav, prev, next]);

  // Swipe mobile
  const startX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    startX.current = null;
  };

  return (
    <div className="rounded-lg border overflow-hidden bg-gray-100">
      <div
        className="relative select-none overflow-hidden"
        style={{ aspectRatio: String(aspect) }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {safeImages.length > 0 ? (
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${idx * 100}%)` }}
          >
            {safeImages.map((img, i) => (
              <div key={img.id || i} className="relative h-full w-full flex-shrink-0">
                <Image
                  src={img.url}
                  alt={`${title} - Photo ${i + 1} sur ${total}`}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 768px) 100vw, 768px"
                  className={objectFit === "cover" ? "object-cover" : "object-contain"}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-gray-400">
            Pas d'image
          </div>
        )}

        {/* Flèches - style Airbnb */}
        {canNav && (
          <>
            <button
              type="button"
              aria-label="Image précédente"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm border border-gray-200/50 transition-all hover:bg-white hover:scale-105 hover:shadow-md"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Image suivante"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm border border-gray-200/50 transition-all hover:bg-white hover:scale-105 hover:shadow-md"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Points de pagination */}
        {canNav && (
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-2">
            {safeImages.map((_, i) => {
              const active = i === idx;
              return (
                <button
                  type="button"
                  key={`dot-${i}`}
                  aria-label={`Aller à l’image ${i + 1}`}
                  aria-current={active ? "true" : "false"}
                  onClick={() => setIdx(i)}
                  className={`h-2 w-2 rounded-full transition ${
                    active ? "bg-black" : "bg-black/40 hover:bg-black/70"
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Miniatures cliquables */}
      {canNav && (
        <div className="flex gap-2 p-2 overflow-x-auto bg-white">
          {safeImages.map((img, i) => (
            <button
              type="button"
              key={img.id ?? `${img.url}-${i}`}
              onClick={() => setIdx(i)}
              className={`relative h-14 w-[72px] shrink-0 rounded border ${
                i === idx ? "ring-2 ring-black" : ""
              }`}
              title={`Image ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={`${title} - Miniature ${i + 1}`}
                fill
                sizes="100px"
                className="object-contain bg-gray-50"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
