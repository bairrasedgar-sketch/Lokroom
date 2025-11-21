// apps/web/src/components/ListingGallery.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Img = { id?: string; url: string };

export default function ListingGallery({
  images,
  aspect = 4 / 3,
  objectFit = "contain", // "cover" si tu veux remplir la zone
}: {
  images: Img[];
  aspect?: number;
  objectFit?: "contain" | "cover";
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

  const prev = () => canNav && setIdx((i) => (i - 1 + total) % total);
  const next = () => canNav && setIdx((i) => (i + 1) % total);

  // Navigation clavier ← →
  useEffect(() => {
    if (!canNav) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canNav, total]);

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
        className="relative select-none"
        style={{ aspectRatio: String(aspect) }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {safeImages[idx] ? (
          <Image
            key={safeImages[idx].url}
            src={safeImages[idx].url}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className={
              objectFit === "cover" ? "object-cover" : "object-contain"
            }
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-gray-400">
            Pas d’image
          </div>
        )}

        {/* Flèches */}
        {canNav && (
          <>
            <button
              type="button"
              aria-label="Image précédente"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 text-white w-8 h-8 grid place-items-center hover:bg-black/70"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Image suivante"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 text-white w-8 h-8 grid place-items-center hover:bg-black/70"
            >
              ›
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
                alt=""
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
