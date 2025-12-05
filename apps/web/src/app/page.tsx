// apps/web/src/app/page.tsx
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import { getServerDictionary } from "@/lib/i18n.server";
import HomeClient from "@/components/HomeClient";

async function getFeaturedListings() {
  const listings = await prisma.listing.findMany({
    include: {
      images: {
        orderBy: { position: "asc" },
      },
      owner: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return listings;
}

async function getListingStats() {
  const [totalListings, totalUsers, countries] = await Promise.all([
    prisma.listing.count(),
    prisma.user.count(),
    prisma.listing.groupBy({
      by: ["country"],
      _count: true,
    }),
  ]);

  return {
    totalListings,
    totalUsers,
    totalCountries: countries.length,
  };
}

export default async function Home() {
  const displayCurrency =
    (cookies().get("currency")?.value as Currency) ?? "EUR";

  const { dict } = getServerDictionary();
  const t = dict.home;

  const [listings, stats] = await Promise.all([
    getFeaturedListings(),
    getListingStats(),
  ]);

  const cards = await Promise.all(
    listings.map(async (l) => {
      const priceFormatted = await formatMoneyAsync(
        l.price,
        l.currency as Currency,
        displayCurrency
      );

      return {
        id: l.id,
        title: l.title,
        city: l.city,
        country: l.country,
        type: l.type,
        createdAt: l.createdAt,
        images: l.images,
        priceFormatted,
        ownerName: l.owner?.name,
        maxGuests: l.maxGuests,
        beds: l.beds,
        isInstantBook: l.isInstantBook,
      };
    })
  );

  const categories = [
    { key: "APARTMENT", label: "Appartements", icon: "🏢", count: listings.filter(l => l.type === "APARTMENT").length },
    { key: "HOUSE", label: "Maisons", icon: "🏠", count: listings.filter(l => l.type === "HOUSE").length },
    { key: "STUDIO", label: "Studios", icon: "🎨", count: listings.filter(l => l.type === "STUDIO").length },
    { key: "OFFICE", label: "Bureaux", icon: "💼", count: listings.filter(l => l.type === "OFFICE").length },
    { key: "COWORKING", label: "Coworking", icon: "👥", count: listings.filter(l => l.type === "COWORKING").length },
    { key: "PARKING", label: "Parkings", icon: "🚗", count: listings.filter(l => l.type === "PARKING").length },
    { key: "EVENT_SPACE", label: "Événementiel", icon: "🎉", count: listings.filter(l => l.type === "EVENT_SPACE").length },
    { key: "RECORDING_STUDIO", label: "Studios d'enregistrement", icon: "🎙️", count: listings.filter(l => l.type === "RECORDING_STUDIO").length },
  ];

  return (
    <HomeClient
      cards={cards}
      categories={categories}
      stats={stats}
      translations={t}
      displayCurrency={displayCurrency}
    />
  );
}
