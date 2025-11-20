// apps/web/src/app/listings/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import CurrencyNotice from "@/components/CurrencyNotice";
import ListingFilters from "@/components/ListingFilters";
import Map from "@/components/Map";

// Type simplifié pour les annonces
type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  country: string;
  city: string | null;
  createdAt: Date;
  images: { id: string; url: string }[];
  latPublic: number;
  lngPublic: number;
};

function strIncludes(a: string | null | undefined, b: string) {
  return (a ?? "").toLowerCase().includes(b.toLowerCase());
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // 1) On lit TOUTES les annonces avec coords publiques
  const listingsFromDb = await prisma.listing.findMany({
    include: {
      images: true,
      owner: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const listings: Listing[] = listingsFromDb.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    price: l.price,
    currency: l.currency,
    country: l.country,
    city: l.city,
    createdAt: l.createdAt,
    images: l.images.map((img) => ({ id: img.id, url: img.url })),
    latPublic: l.latPublic ?? 0,
    lngPublic: l.lngPublic ?? 0,
  }));

  const displayCurrency =
    (cookies().get("currency")?.value as Currency) ?? "EUR";

  // 2) Filtres URL
  const sp = searchParams ?? {};
  const country =
    (typeof sp.country === "string" ? sp.country : "").trim();
  const city = (typeof sp.city === "string" ? sp.city : "").trim();
  const min = Number(typeof sp.min === "string" ? sp.min : undefined);
  const max = Number(typeof sp.max === "string" ? sp.max : undefined);

  // 3) Filtrage
  const filtered = listings.filter((l) => {
    if (country && !strIncludes(l.country, country)) return false;
    if (city && !strIncludes(l.city, city)) return false;
    if (Number.isFinite(min) && l.price < min) return false;
    if (Number.isFinite(max) && l.price > max) return false;
    return true;
  });

  // 4) Formatage prix
  const cards = await Promise.all(
    filtered.map(async (l) => {
      const priceFormatted = await formatMoneyAsync(
        l.price,
        l.currency as Currency,
        displayCurrency
      );

      return {
        ...l,
        priceFormatted,
      };
    })
  );

  // 5) Markers pour la map : vraies coords publiques
  const mapMarkers = cards
    .filter(
      (l) =>
        Number.isFinite(l.latPublic) &&
        Number.isFinite(l.lngPublic) &&
        !(l.latPublic === 0 && l.lngPublic === 0)
    )
    .slice(0, 80)
    .map((l) => ({
      id: l.id,
      lat: l.latPublic,
      lng: l.lngPublic,
      label: l.priceFormatted, // prix dans une bulle
    }));

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col gap-4 px-4 pb-8 pt-4 lg:flex-row">
      {/* COLONNE GAUCHE : filtres + liste */}
      <section className="flex-1 space-y-4 lg:max-w-[55%]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Annonces</h1>
          <Link
            href="/listings/new"
            className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
          >
            + Nouvelle annonce
          </Link>
        </div>

        <CurrencyNotice />
        <ListingFilters />

        {cards.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucune annonce ne correspond aux filtres.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((l) => {
              const cover = l.images?.[0]?.url ?? null;

              return (
                <li
                  key={l.id}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <Link href={`/listings/${l.id}`} className="block">
                    <div className="relative aspect-[4/3] bg-gray-50">
                      {cover ? (
                        <Image
                          src={cover}
                          alt={l.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
                          Pas d&apos;image
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 p-3">
                      <h3 className="line-clamp-1 text-sm font-medium">
                        {l.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {l.city ? `${l.city}, ` : ""}
                        {l.country} ·{" "}
                        {new Date(l.createdAt).toLocaleDateString()}
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
        )}
      </section>

      {/* COLONNE DROITE : Google Map style Airbnb */}
      <aside className="sticky top-24 hidden h-[600px] flex-1 lg:block">
        <div className="relative h-full w-full overflow-hidden rounded-3xl border bg-gray-100">
          <Map markers={mapMarkers} />
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/80 px-3 py-1 text-xs text-gray-600 backdrop-blur">
            Carte Lok&apos;Room (Google Maps)
          </div>
        </div>
      </aside>
    </main>
  );
}
