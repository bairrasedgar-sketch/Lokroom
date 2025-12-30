// apps/web/src/app/page.tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import { getServerDictionary } from "@/lib/i18n.server";
import HomeClient from "@/components/HomeClient";
import HomePageJsonLd from "@/components/seo/HomePageJsonLd";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.lokroom.com";

export const metadata: Metadata = {
  title: "Lok'Room - Location d'espaces entre particuliers",
  description:
    "Louez et proposez des espaces uniques : appartements, bureaux, studios photo, salles de réunion, parkings et plus. Réservation sécurisée entre particuliers.",
  keywords: [
    "location espace",
    "louer bureau",
    "location appartement",
    "coworking",
    "location parking",
    "studio photo",
    "salle de réunion",
    "location entre particuliers",
    "Airbnb espaces",
    "Lok'Room",
  ],
  authors: [{ name: "Lok'Room" }],
  creator: "Lok'Room",
  publisher: "Lok'Room",

  openGraph: {
    type: "website",
    siteName: "Lok'Room",
    locale: "fr_FR",
    title: "Lok'Room - Location d'espaces entre particuliers",
    description:
      "Louez et proposez des espaces uniques : appartements, bureaux, studios, parkings et plus. Réservation sécurisée.",
    url: baseUrl,
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Lok'Room - Location d'espaces entre particuliers",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@lokroom",
    creator: "@lokroom",
    title: "Lok'Room - Location d'espaces entre particuliers",
    description:
      "Louez et proposez des espaces uniques près de chez vous. Réservation sécurisée.",
    images: [`${baseUrl}/og-image.png`],
  },

  alternates: {
    canonical: baseUrl,
    languages: {
      "fr-FR": baseUrl,
      "en-US": `${baseUrl}/en`,
    },
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  verification: {
    // À remplir avec vos codes de vérification
    // google: "votre-code-google",
  },

  category: "location",
};

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
    <>
      {/* Schema.org JSON-LD pour le SEO de la page d'accueil */}
      <HomePageJsonLd stats={stats} />

      <HomeClient
        cards={cards}
        categories={categories}
        stats={stats}
        translations={t}
        displayCurrency={displayCurrency}
      />
    </>
  );
}
