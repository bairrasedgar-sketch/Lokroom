"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

import Map, { type MapMarker } from "@/components/Map";

type ReviewSummary = {
  count: number;
  avgRating: number | null;
};

type ListingForClient = {
  id: string;
  title: string;
  description: string;
  country: string;
  city: string | null;
  createdAt: string;
  ownerName: string | null;
  imageUrl: string | null;
  priceLabel: string;
  reviewSummary: ReviewSummary;
};

type Props = {
  listings: ListingForClient[];
  markers: MapMarker[];
};

export default function ListingsResultsWithMap({ listings, markers }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
        Essaie d&apos;élargir un peu tes filtres (prix, ville, note…).
      </div>
    );
  }

  return (
    <>
      {/* Desktop : liste + carte côte à côte */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)] lg:items-start">
        {/* Colonne gauche : cartes annonces */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {listings.map((listing) => {
              const isHovered = hoveredId === listing.id;

              const locationLabel = [
                listing.city ?? undefined,
                listing.country ?? undefined,
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <div
                  key={listing.id}
                  className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                    isHovered
                      ? "border-transparent ring-[0.5px] ring-black/20 shadow-sm"
                      : "border-gray-200 hover:-translate-y-0.5 hover:border-black hover:shadow-md"
                  }`}
                  onMouseEnter={() => setHoveredId(listing.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <Link
                    href={`/listings/${listing.id}`}
                    className="flex flex-1 flex-col"
                  >
                    <div className="relative h-40 w-full bg-gray-100">
                      {listing.imageUrl ? (
                        <Image
                          src={listing.imageUrl}
                          alt={listing.title}
                          fill
                          className="object-cover transition group-hover:scale-[1.02]"
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
                          Pas d&apos;image
                        </div>
                      )}

                      {listing.reviewSummary.count > 0 &&
                        listing.reviewSummary.avgRating != null && (
                          <div className="absolute right-2 top-2 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-medium text-white">
                            {listing.reviewSummary.avgRating.toFixed(1)} ★ (
                            {listing.reviewSummary.count})
                          </div>
                        )}
                    </div>

                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <div className="space-y-1">
                        <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                          {listing.title}
                        </p>
                        <p className="line-clamp-2 text-xs text-gray-600">
                          {listing.description}
                        </p>
                      </div>

                      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {listing.priceLabel}
                            <span className="text-xs font-normal text-gray-600">
                              {" "}
                              / nuit
                            </span>
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {locationLabel || "Localisation non précisée"}
                          </p>
                        </div>

                        <div className="flex flex-col items-end text-[11px] text-gray-500">
                          <span>
                            Hôte :{" "}
                            {listing.ownerName ?? "Utilisateur Lok'Room"}
                          </span>
                          <span>
                            Publié le{" "}
                            {new Date(
                              listing.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Colonne droite : carte (desktop) */}
        <aside className="sticky top-20 hidden self-start lg:block">
          <div className="h-[520px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative h-full w-full">
              <Map
                markers={markers}
                hoveredId={hoveredId}
                onMarkerHover={setHoveredId}
                panOnHover={false} // la carte ne se déplace pas au survol
              />
            </div>
          </div>
        </aside>
      </section>

      {/* Carte mobile */}
      <section className="lg:hidden">
        <div className="mt-2 h-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="relative h-full w-full">
            <Map
              markers={markers}
              hoveredId={hoveredId}
              onMarkerHover={setHoveredId}
              panOnHover={false}
            />
          </div>
        </div>
      </section>
    </>
  );
}
