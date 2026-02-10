"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import FavoriteButton from "../FavoriteButton";
import { useAnalytics } from "@/hooks/useAnalytics";

type ListingCardType = {
  id: string;
  title: string;
  city: string | null;
  country: string;
  type: string;
  createdAt: Date;
  images: { id: string; url: string }[];
  priceFormatted: string;
  ownerName: string | null;
  maxGuests: number | null;
  beds: number | null;
  isInstantBook: boolean;
  hourlyPrice?: number | null;
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
  RECORDING_STUDIO: "Studios",
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

export function ListingCard({ card, index }: { card: ListingCardType; index: number }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { logListingClick } = useAnalytics();

  const images = card.images || [];
  const hasMultipleImages = images.length > 1;

  const handleCardClick = () => {
    // Track listing click
    logListingClick({
      listingId: card.id,
      listingTitle: card.title,
      category: card.type,
      price: parseFloat(card.priceFormatted.replace(/[^0-9.]/g, '')),
      position: index,
    });
  };

  return (
    <div
      className="group relative animate-fade-in"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setImageIndex(0); }}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image Container - séparé du Link pour le bouton favori */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl sm:rounded-xl bg-gray-100">
        <Link href={`/listings/${card.id}`} onClick={handleCardClick} className="block absolute inset-0">
          {images.length > 0 ? (
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${imageIndex * 100}%)` }}
            >
              {images.map((image, idx) => (
                <div key={image.id || idx} className="relative h-full w-full flex-shrink-0">
                  <Image
                    src={image.url}
                    alt={`${card.title} - ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    priority={idx === 0}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
          )}
        </Link>

        {/* Image Navigation Dots - Desktop only */}
        {hasMultipleImages && isHovered && (
          <div className="hidden sm:flex absolute bottom-3 left-1/2 -translate-x-1/2 gap-1.5 z-10">
            {images.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImageIndex(i); }}
                aria-label={`Voir image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === imageIndex ? "w-4 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}

        {/* Navigation Arrows - Desktop only */}
        {hasMultipleImages && isHovered && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
              }}
              aria-label="Image precedente"
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm border border-gray-200/50 transition-all hover:bg-white hover:scale-105 hover:shadow-md z-10"
            >
              <svg className="h-3 w-3 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
              }}
              aria-label="Image suivante"
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm border border-gray-200/50 transition-all hover:bg-white hover:scale-105 hover:shadow-md z-10"
            >
              <svg className="h-3 w-3 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Favorite Button - en dehors du Link */}
        <div className="absolute right-3 top-3 z-20">
          <FavoriteButton listingId={card.id} size={24} variant="card" />
        </div>

        {/* Instant Book Badge */}
        {card.isInstantBook && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-900 shadow-md z-10">
            <svg className="h-3 w-3 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Instantané
          </div>
        )}
      </div>

      {/* Card Content */}
      <Link href={`/listings/${card.id}`} onClick={handleCardClick} className="block mt-3 space-y-1">
        {/* Category Badge */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            <span>{getCategoryEmoji(card.type)}</span>
            {LISTING_TYPE_LABELS[card.type] || card.type}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-medium text-gray-900">
            {card.title}
          </h3>
        </div>
        <p className="text-sm text-gray-500">
          {card.city ? `${card.city}, ` : ""}{card.country}
        </p>
        {(card.maxGuests || card.beds) && (
          <p className="text-sm text-gray-400">
            {card.maxGuests && `${card.maxGuests} voyageurs`}
            {card.maxGuests && card.beds && " · "}
            {card.beds && `${card.beds} lit${card.beds > 1 ? "s" : ""}`}
          </p>
        )}
        <p className="pt-1">
          <span className="font-semibold text-gray-900">{card.priceFormatted}</span>
          <span className="text-gray-500"> / nuit</span>
          {card.hourlyPrice && (
            <span className="ml-2 text-sm text-blue-600 font-medium">
              • {card.hourlyPrice}/h
            </span>
          )}
        </p>
      </Link>
    </div>
  );
}
