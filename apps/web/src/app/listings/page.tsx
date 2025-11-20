// apps/web/src/app/listings/page.tsx
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import ListingsWithMap from "@/components/ListingsWithMap";

type ListingDb = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  country: string;
  city: string | null;
  createdAt: Date;
  images: { id: string; url: string }[];
  latPublic: number | null;
  lngPublic: number | null;
  lat: number | null;
  lng: number | null;
};

type ListingCard = ListingDb & {
  priceFormatted: string;
};

type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
};

function strIncludes(a: string | null | undefined, b: string) {
  return (a ?? "").toLowerCase().includes(b.toLowerCase());
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // 1) On lit TOUTES les annonces
  const listingsFromDb = await prisma.listing.findMany({
    include: {
      images: true,
      owner: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const listings: ListingDb[] = listingsFromDb.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    price: l.price,
    currency: l.currency,
    country: l.country,
    city: l.city,
    createdAt: l.createdAt,
    images: l.images.map((img) => ({ id: img.id, url: img.url })),
    latPublic: l.latPublic,
    lngPublic: l.lngPublic,
    lat: l.lat,
    lng: l.lng,
  }));

  const displayCurrency =
    (cookies().get("currency")?.value as Currency) ?? "EUR";

  // 2) Filtres URL (pays, ville, min/max)
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

  // 4) Formatage prix pour les cartes
  const cards: ListingCard[] = await Promise.all(
    filtered.map(async (l) => {
      const priceFormatted = await formatMoneyAsync(
        l.price,
        l.currency as Currency,
        displayCurrency
      );
      return { ...l, priceFormatted };
    })
  );

  // 5) Markers pour la map (latPublic → fallback lat)
  const mapMarkers: MapMarker[] = cards
    .map((l) => {
      const lat = l.latPublic ?? l.lat;
      const lng = l.lngPublic ?? l.lng;

      if (lat == null || lng == null) return null;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      return {
        id: l.id,
        lat,
        lng,
        label: l.priceFormatted,
      };
    })
    .filter((m): m is MapMarker => m !== null)
    .slice(0, 80);

  return <ListingsWithMap cards={cards} mapMarkers={mapMarkers} />;
}
