// apps/web/src/app/listings/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import CurrencyNotice from "@/components/CurrencyNotice";
import ListingFilters from "@/components/ListingFilters";

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
};

function strIncludes(a: string | null | undefined, b: string) {
  return (a ?? "").toLowerCase().includes(b.toLowerCase());
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
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
  }));

  const displayCurrency =
    (cookies().get("currency")?.value as Currency) ?? "EUR";

  const sp = searchParams ?? {};
  const country = (typeof sp.country === "string" ? sp.country : "").trim();
  const city = (typeof sp.city === "string" ? sp.city : "").trim();
  const min = Number(typeof sp.min === "string" ? sp.min : undefined);
  const max = Number(typeof sp.max === "string" ? sp.max : undefined);

  const filtered = listings.filter((l) => {
    if (country && !strIncludes(l.country, country)) return false;
    if (city && !strIncludes(l.city, city)) return false;
    if (Number.isFinite(min) && l.price < min) return false;
    if (Number.isFinite(max) && l.price > max) return false;
    return true;
  });

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

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-8 space-y-6">
      {/* Header + CTA */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Toutes les annonces
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Parcours les espaces disponibles. Utilise les filtres pour trouver
            exactement ce qu&apos;il te faut.
          </p>
        </div>

        <Link
          href="/listings/new"
          className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-900"
        >
          + Nouvelle annonce
        </Link>
      </header>

      {/* Devise + filtres dans un bloc léger */}
      <section className="space-y-4 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm">
        <CurrencyNotice />
        <ListingFilters />
      </section>

      {/* Grille d'annonces */}
      <section className="space-y-3">
        {cards.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucune annonce ne correspond aux filtres. Essaie d&apos;élargir ta
            recherche.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((l) => {
              const cover = l.images?.[0]?.url ?? null;
              return (
                <li
                  key={l.id}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Link href={`/listings/${l.id}`} className="block">
                    <div className="relative aspect-[4/3] bg-[#f5f5f5]">
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
    </main>
  );
}
