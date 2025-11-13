// apps/web/src/app/listings/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import CurrencyNotice from "@/components/CurrencyNotice";
import ListingFilters from "@/components/ListingFilters";

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  country: string;
  city: string | null;
  createdAt: string;
  images: { id: string; url: string }[];
  owner: { id: string; name: string | null; email: string | null };
};

async function getListings(): Promise<Listing[]> {
  try {
    // ✅ URL relative → marche en dev, prod, et avec www/redirects
    const res = await fetch(`/api/listings`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.listings ?? []) as Listing[];
  } catch {
    return [];
  }
}

function strIncludes(a: string | null | undefined, b: string) {
  return (a ?? "").toLowerCase().includes(b.toLowerCase());
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | undefined>;
}) {
  const listings = await getListings();
  const displayCurrency = (cookies().get("currency")?.value as Currency) ?? "EUR";

  const country = (searchParams?.country ?? "").trim();
  const city = (searchParams?.city ?? "").trim();
  const min = Number(searchParams?.min);
  const max = Number(searchParams?.max);

  const filtered = listings.filter((l) => {
    if (country && !strIncludes(l.country, country)) return false;
    if (city && !strIncludes(l.city || "", city)) return false;
    if (Number.isFinite(min) && l.price < min) return false;
    if (Number.isFinite(max) && l.price > max) return false;
    return true;
  });

  const cards = await Promise.all(
    filtered.map(async (l) => {
      const priceFormatted = await formatMoneyAsync(l.price, l.currency, displayCurrency);
      return { ...l, priceFormatted };
    })
  );

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Annonces</h1>
        <Link href="/listings/new" className="rounded bg-black text-white px-3 py-2 text-sm">
          + Nouvelle annonce
        </Link>
      </div>

      <CurrencyNotice />
      <ListingFilters />

      {cards.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune annonce ne correspond aux filtres.</p>
      ) : (
        <ul className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((l) => {
            const cover = l.images?.[0]?.url ?? null;
            return (
              <li key={l.id} className="rounded border overflow-hidden">
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
                    <h3 className="font-medium line-clamp-1">{l.title}</h3>
                    <p className="text-sm text-gray-500">
                      {l.city ? `${l.city}, ` : ""}
                      {l.country} · {new Date(l.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-semibold">{l.priceFormatted}</p>
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
