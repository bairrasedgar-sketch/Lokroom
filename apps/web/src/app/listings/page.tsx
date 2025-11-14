// apps/web/src/app/listings/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db"; // même import que dans /api/profile
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import CurrencyNotice from "@/components/CurrencyNotice";
import ListingFilters from "@/components/ListingFilters";

// On déclare un type simple pour les annonces
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
  // 1) On lit TOUTES les annonces directement depuis Prisma
  const listingsFromDb = await prisma.listing.findMany({
    include: {
      images: true,
      owner: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // On cast dans notre type "Listing" simplifié
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

  // 2) On récupère les filtres depuis l’URL
  const sp = searchParams ?? {};
  const country =
    (typeof sp.country === "string" ? sp.country : "").trim();
  const city = (typeof sp.city === "string" ? sp.city : "").trim();
  const min = Number(
    typeof sp.min === "string" ? sp.min : undefined,
  );
  const max = Number(
    typeof sp.max === "string" ? sp.max : undefined,
  );

  // 3) Filtrage côté serveur
  const filtered = listings.filter((l) => {
    if (country && !strIncludes(l.country, country)) return false;
    if (city && !strIncludes(l.city, city)) return false;
    if (Number.isFinite(min) && l.price < min) return false;
    if (Number.isFinite(max) && l.price > max) return false;
    return true;
  });

  // 4) Formatage des prix dans la devise choisie
  const cards = await Promise.all(
    filtered.map(async (l) => {
      const priceFormatted = await formatMoneyAsync(
        l.price,
        l.currency as Currency,
        displayCurrency,
      );

      return {
        ...l,
        priceFormatted,
      };
    }),
  );

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Annonces</h1>
        <Link
          href="/listings/new"
          className="rounded bg-black text-white px-3 py-2 text-sm"
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
        <ul className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((l) => {
            const cover = l.images?.[0]?.url ?? null;
            return (
              <li
                key={l.id}
                className="rounded border overflow-hidden"
              >
                <Link href={`/listings/${l.id}`} className="block">
                  <div className="relative aspect-[4/3] bg-gray-50 border-b">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={l.title}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-gray-400">
                        Pas d’image
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <h3 className="font-medium line-clamp-1">
                      {l.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {l.city ? `${l.city}, ` : ""}
                      {l.country} ·{" "}
                      {new Date(l.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-semibold">
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
  );
}
