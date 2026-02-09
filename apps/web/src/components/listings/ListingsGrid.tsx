"use client";

import Link from "next/link";
import Image from "next/image";

type ListingCardFixed = {
  id: string;
  title: string;
  country: string;
  city: string | null;
  type: string;
  createdAt: string | Date;
  images: { id: string; url: string }[];
  priceFormatted: string;
  latPublic: number | null;
  lngPublic: number | null;
  lat: number | null;
  lng: number | null;
};

const LISTING_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  ROOM: "Chambre",
  STUDIO: "Studio",
  OFFICE: "Bureau",
  COWORKING: "Coworking",
  MEETING_ROOM: "Salle de réunion",
  PARKING: "Parking",
  GARAGE: "Garage",
  STORAGE: "Stockage",
  EVENT_SPACE: "Événementiel",
  RECORDING_STUDIO: "Studio",
  OTHER: "Autre",
};

function getCategoryEmoji(key: string): string {
  const emojis: Record<string, string> = {
    APARTMENT: "🏢",
    HOUSE: "🏠",
    ROOM: "🛏️",
    STUDIO: "🎨",
    OFFICE: "💼",
    COWORKING: "👥",
    MEETING_ROOM: "📊",
    PARKING: "🚗",
    GARAGE: "🚙",
    STORAGE: "📦",
    EVENT_SPACE: "🎉",
    RECORDING_STUDIO: "🎤",
    OTHER: "✨",
  };
  return emojis[key] || "🏠";
}

type ListingsGridProps = {
  cards: ListingCardFixed[];
  hoveredId: string | null;
  cardRefs: React.MutableRefObject<Record<string, HTMLLIElement | null>>;
  onHover: (id: string | null) => void;
};

export function ListingsGrid({ cards, hoveredId, cardRefs, onHover }: ListingsGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((l, index) => {
        const cover = l.images?.[0]?.url ?? null;
        const isHovered = hoveredId === l.id;

        const createdAt =
          l.createdAt instanceof Date
            ? l.createdAt
            : new Date(l.createdAt);

        const priority = index === 0;

        return (
          <li
            key={l.id}
            ref={(el) => {
              cardRefs.current[l.id] = el;
            }}
            className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
              isHovered
                ? "ring-2 ring-black shadow-lg"
                : "hover:-translate-y-0.5 hover:shadow-lg"
            }`}
            onMouseEnter={() => onHover(l.id)}
            onMouseLeave={() => onHover(null)}
          >
            <Link href={`/listings/${l.id}`} className="block">
              <div className="relative aspect-[4/3] bg-gray-50">
                {cover ? (
                  <Image
                    src={cover}
                    alt={l.title}
                    fill
                    className="object-cover"
                    priority={priority}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
                    Pas d&apos;image
                  </div>
                )}
              </div>
              <div className="space-y-1 p-3">
                {/* Category Badge */}
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  <span>{getCategoryEmoji(l.type)}</span>
                  {LISTING_TYPE_LABELS[l.type] || l.type}
                </span>
                <h3 className="line-clamp-1 text-sm font-medium">
                  {l.title}
                </h3>
                <p className="text-xs text-gray-500">
                  {l.city ? `${l.city}, ` : ""}
                  {l.country} · {createdAt.toLocaleDateString()}
                </p>
                <p className="pt-1 text-sm font-semibold">
                  {l.priceFormatted}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
