import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.lokroom.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/listings`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // Pages légales
    {
      url: `${BASE_URL}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal/cookies`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal/legal-notice`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal/cancellation`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal/community-standards`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal/non-discrimination`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Récupérer toutes les annonces actives
  const listings = await prisma.listing.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const listingPages: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${BASE_URL}/listings/${listing.id}`,
    lastModified: listing.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Récupérer les villes avec des annonces
  const cities = await prisma.listing.groupBy({
    by: ["city", "country"],
    where: {
      isActive: true,
      city: { not: "" },
    },
    _count: true,
  });

  const cityPages: MetadataRoute.Sitemap = cities
    .filter((city) => city._count >= 1)
    .map((city) => ({
      url: `${BASE_URL}/listings?city=${encodeURIComponent(city.city)}&country=${encodeURIComponent(city.country)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  // Récupérer les pays avec des annonces
  const countries = await prisma.listing.groupBy({
    by: ["country"],
    where: {
      isActive: true,
    },
    _count: true,
  });

  const countryPages: MetadataRoute.Sitemap = countries
    .filter((country) => country._count >= 1)
    .map((country) => ({
      url: `${BASE_URL}/listings?country=${encodeURIComponent(country.country)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticPages, ...listingPages, ...cityPages, ...countryPages];
}
