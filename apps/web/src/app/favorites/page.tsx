"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HeartIcon } from "@heroicons/react/24/solid";
import { getDictionaryForLocale, type SupportedLocale } from "@/lib/i18n.client";

type FavoriteListing = {
  id: string;
  title?: string | null;
  city?: string | null;
  country?: string | null;
  nightlyPrice?: number | null;
  price?: number | null;
  currency?: string | null;
  images?: { id: string; url: string | null }[];
};

type FavoritesResponse = {
  favorites: FavoriteListing[];
  total?: number;
};

function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm animate-pulse">
      <div className="relative h-44 w-full bg-gray-200" />
      <div className="flex flex-1 flex-col px-4 py-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-16 rounded bg-gray-200" />
        </div>
        <div className="h-3 w-1/2 rounded bg-gray-200" />
        <div className="h-6 w-24 rounded-full bg-gray-200 mt-2" />
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [dict, setDict] = useState(getDictionaryForLocale("fr"));

  // Charger le dictionnaire selon la locale du cookie
  useEffect(() => {
    if (typeof document === "undefined") return;
    const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    const locale = (m?.[1] || "fr") as SupportedLocale;
    setDict(getDictionaryForLocale(locale));
  }, []);

  const t = dict.favorites;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/favorites");
        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = (await res.json()) as FavoritesResponse;

        setFavorites(Array.isArray(data.favorites) ? data.favorites : []);
      } catch (e) {
        console.error("Erreur chargement favoris:", e);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const hasFavorites = favorites.length > 0;

  return (
    <main className="mx-auto max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1800px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <header className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold">{t.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t.subtitle}
        </p>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !hasFavorites ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
            <HeartIcon className="h-8 w-8 text-rose-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900">{t.noFavoritesYet}</p>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            {t.noFavoritesDesc}
          </p>
          <Link
            href="/listings"
            className="mt-6 inline-flex rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-black transition"
          >
            {t.discoverListings}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
          {favorites.map((listing) => {
            const imageUrl = listing.images?.[0]?.url ?? null;
            const price =
              listing.nightlyPrice ?? listing.price ?? null;
            const location = [listing.city, listing.country]
              .filter(Boolean)
              .join(", ");

            return (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Image */}
                <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={listing.title ?? "Lok'Room"}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                      {t.noImage}
                    </div>
                  )}
                  {/* Badge favori */}
                  <div className="absolute top-2 right-2">
                    <HeartIcon className="h-6 w-6 text-rose-500 drop-shadow-sm" />
                  </div>
                </div>

                {/* Contenu */}
                <div className="flex flex-1 flex-col px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="line-clamp-1 text-sm font-semibold text-gray-900">
                      {listing.title ?? "Lok'Room"}
                    </h2>
                    {price != null && (
                      <span className="shrink-0 text-sm font-semibold text-gray-900">
                        {Math.round(price)}{" "}
                        {listing.currency === "CAD" ? "CAD" : "€"} {dict.common.perNight}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                    {location || t.locationToCome}
                  </p>

                  <span className="mt-3 inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 group-hover:bg-gray-200 transition">
                    {t.viewListing}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
