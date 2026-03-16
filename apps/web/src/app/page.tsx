// apps/web/src/app/page.tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import dynamicImport from "next/dynamic";
import { prisma } from "@/lib/db";
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import { getServerDictionary } from "@/lib/i18n.server";
import HomePageJsonLd from "@/components/seo/HomePageJsonLd";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";

import HomeClientSkeleton from "@/components/HomeClientSkeleton";

// Lazy load HomeClient with loading skeleton
const HomeClient = dynamicImport(() => import("@/components/HomeClient"), {
  loading: () => <HomeClientSkeleton />,
  ssr: true,
});

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
  try {
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
      // Charger toutes les annonces pour que les filtres par catégorie fonctionnent
    });

    return listings;
  } catch {
    return [];
  }
}

async function getListingStats() {
  try {
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
  } catch {
    return { totalListings: 0, totalUsers: 0, totalCountries: 0 };
  }
}

async function getCategoryCounts() {
  try {
    const counts = await prisma.listing.groupBy({
      by: ["type"],
      _count: true,
    });

    const countMap: Record<string, number> = {};
    counts.forEach(c => {
      countMap[c.type] = c._count;
    });

    return countMap;
  } catch {
    return {};
  }
}

export default async function Home() {
  const displayCurrency =
    (cookies().get("currency")?.value as Currency) ?? "EUR";

  const { dict } = getServerDictionary();
  const t = dict.home;

  const [listings, stats, categoryCounts] = await Promise.all([
    getFeaturedListings(),
    getListingStats(),
    getCategoryCounts(),
  ]);

  const cards = await Promise.all(
    listings.map(async (l) => {
      const priceFormatted = await formatMoneyAsync(
        l.price,
        l.currency as Currency,
        displayCurrency
      );

      let hourlyPriceFormatted: string | undefined;
      if (l.hourlyPrice) {
        hourlyPriceFormatted = await formatMoneyAsync(
          l.hourlyPrice,
          l.currency as Currency,
          displayCurrency
        );
      }

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
        hourlyPrice: hourlyPriceFormatted,
        pricingMode: l.pricingMode,
      };
    })
  );

  const categories = [
    { key: "APARTMENT", label: "Appartements", icon: "🏢", count: categoryCounts["APARTMENT"] || 0 },
    { key: "HOUSE", label: "Maisons", icon: "🏠", count: categoryCounts["HOUSE"] || 0 },
    { key: "STUDIO", label: "Studios", icon: "🎨", count: categoryCounts["STUDIO"] || 0 },
    { key: "OFFICE", label: "Bureaux", icon: "💼", count: categoryCounts["OFFICE"] || 0 },
    { key: "COWORKING", label: "Coworking", icon: "👥", count: categoryCounts["COWORKING"] || 0 },
    { key: "PARKING", label: "Parkings", icon: "🚗", count: categoryCounts["PARKING"] || 0 },
    { key: "EVENT_SPACE", label: "Événementiel", icon: "🎉", count: categoryCounts["EVENT_SPACE"] || 0 },
    { key: "RECORDING_STUDIO", label: "Studios d'enregistrement", icon: "🎙️", count: categoryCounts["RECORDING_STUDIO"] || 0 },
  ];

  return (
    <PageErrorBoundary>
      {/* Schema.org JSON-LD pour le SEO de la page d'accueil */}
      <HomePageJsonLd stats={stats} />

      <HomeClient
        cards={cards}
        categories={categories}
        stats={stats}
        translations={t}
        displayCurrency={displayCurrency}
      />
    </PageErrorBoundary>
  );
}
