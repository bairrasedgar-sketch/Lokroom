// apps/web/src/app/favorites/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);

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
    <main className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Favoris</h1>
        <p className="mt-1 text-sm text-gray-500">
          Toutes les annonces Lok&apos;Room que tu as ajoutées en favoris.
        </p>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
          Chargement de tes favoris...
        </div>
      ) : !hasFavorites ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
          <p className="font-medium text-gray-900">Aucun favori pour le moment</p>
          <p className="mt-1 text-sm text-gray-500">
            Quand tu auras liké des annonces, elles apparaîtront ici pour que tu
            puisses les retrouver facilement.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
          >
            Découvrir des annonces
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={listing.title ?? "Annonce Lok'Room"}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                      Aucune image
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="flex flex-1 flex-col px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="line-clamp-1 text-sm font-semibold text-gray-900">
                      {listing.title ?? "Annonce Lok'Room"}
                    </h2>
                    {price != null && (
                      <span className="shrink-0 text-sm font-semibold text-gray-900">
                        {Math.round(price)}{" "}
                        {listing.currency === "CAD" ? "CAD" : "€"} / nuit
                      </span>
                    )}
                  </div>

                  <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                    {location || "Emplacement à venir"}
                  </p>

                  <span className="mt-3 inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    Voir l&apos;annonce
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
