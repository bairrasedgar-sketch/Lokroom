// apps/web/src/app/listings/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { Metadata } from "next";
import dynamicImport from "next/dynamic";

import { authOptions } from "@/lib/auth";
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import { getOrigin } from "@/lib/origin";
import FiltersBar from "@/components/listings/FiltersBar";
import ActiveFilters from "@/components/listings/ActiveFilters";
import { getServerDictionary } from "@/lib/i18n.server";
import { type MapMarker } from "@/components/Map";
import SearchPageJsonLd from "@/components/seo/SearchPageJsonLd";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";

// Lazy load ListingsWithMap - heavy component with map
const ListingsWithMap = dynamicImport(() => import("@/components/listings/ListingsWithMap"), {
  loading: () => (
    <div className="flex-1 animate-pulse">
      <div className="h-full bg-gray-200 rounded-lg" />
    </div>
  ),
  ssr: false,
});

export const revalidate = 0;
export const dynamic = "force-dynamic";

// Mapping des types vers les labels français
const typeLabels: Record<string, string> = {
  APARTMENT: "Appartements",
  HOUSE: "Maisons",
  ROOM: "Chambres",
  STUDIO: "Studios",
  OFFICE: "Bureaux",
  COWORKING: "Espaces coworking",
  MEETING_ROOM: "Salles de réunion",
  PARKING: "Parkings",
  GARAGE: "Garages",
  STORAGE: "Espaces de stockage",
  EVENT_SPACE: "Espaces événementiels",
  RECORDING_STUDIO: "Studios d'enregistrement",
  OTHER: "Espaces",
};

type SearchParamsType = {
  q?: string;
  country?: string;
  province?: string;
  city?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  hasPhoto?: string;
  sort?: string;
  page?: string;
  pageSize?: string;
  startDate?: string;
  endDate?: string;
  guests?: string;
  [key: string]: string | string[] | undefined;
};

// SEO: generateMetadata dynamique pour les pages de recherche (niveau Airbnb)
export async function generateMetadata({
  searchParams,
}: {
  searchParams?: SearchParamsType;
}): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.lokroom.com";

  // Extraire les paramètres de recherche
  const city = searchParams?.city as string || "";
  const country = searchParams?.country as string || "";
  const type = searchParams?.type as string || "";
  const q = searchParams?.q as string || "";

  // Construire le titre dynamique
  const titleParts: string[] = [];
  const locationParts: string[] = [];

  if (type && typeLabels[type]) {
    titleParts.push(typeLabels[type]);
  } else {
    titleParts.push("Espaces");
  }

  titleParts.push("à louer");

  if (city) {
    locationParts.push(city);
  }
  if (country) {
    locationParts.push(country);
  }

  if (locationParts.length > 0) {
    titleParts.push("à " + locationParts.join(", "));
  }

  if (q) {
    titleParts.push(`- "${q}"`);
  }

  const title = titleParts.join(" ");

  // Construire la description dynamique
  let description = "";
  if (city && country) {
    description = `Découvrez les meilleurs ${(type && typeLabels[type]?.toLowerCase()) || "espaces"} à louer à ${city}, ${country}. `;
  } else if (country) {
    description = `Trouvez des ${(type && typeLabels[type]?.toLowerCase()) || "espaces"} uniques à louer en ${country}. `;
  } else if (city) {
    description = `Location d'${(type && typeLabels[type]?.toLowerCase()) || "espaces"} à ${city}. `;
  } else {
    description = `Découvrez des espaces uniques à louer : appartements, bureaux, studios photo, salles de réunion et plus. `;
  }
  description += "Réservation sécurisée sur Lok'Room.";

  // Construire l'URL canonique avec les paramètres
  const canonicalParams = new URLSearchParams();
  if (country) canonicalParams.set("country", country);
  if (city) canonicalParams.set("city", city);
  if (type) canonicalParams.set("type", type);
  if (q) canonicalParams.set("q", q);

  const canonicalUrl = canonicalParams.toString()
    ? `${baseUrl}/listings?${canonicalParams.toString()}`
    : `${baseUrl}/listings`;

  // Keywords dynamiques
  const keywords = [
    "location espace",
    city || "",
    country || "",
    type && typeLabels[type]?.toLowerCase() || "",
    "réservation",
    "Lok'Room",
    "location entre particuliers",
    "louer",
    q || "",
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,

    openGraph: {
      type: "website",
      siteName: "Lok'Room",
      locale: "fr_FR",
      title: `${title} | Lok'Room`,
      description,
      url: canonicalUrl,
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${title} - Lok'Room`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      site: "@lokroom",
      title: `${title} | Lok'Room`,
      description,
      images: [`${baseUrl}/og-image.png`],
    },

    alternates: {
      canonical: canonicalUrl,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },
  };
}

type ReviewSummary = {
  count: number;
  avgRating: number | null;
};

type ListingItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  currency: Currency;
  country: string;
  city: string | null;
  maxGuests: number | null;
  latPublic: number | null;
  lngPublic: number | null;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
  };
  images: { id: string; url: string }[];
  reviewSummary: ReviewSummary;
};

type SearchResponse = {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  items: ListingItem[];
};

type SearchParams = {
  q?: string;
  country?: string;
  province?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  hasPhoto?: string;
  sort?: string;
  page?: string;
  pageSize?: string;
  startDate?: string;
  endDate?: string;
  guests?: string;
  [key: string]: string | string[] | undefined;
};

function buildQuery(searchParams?: SearchParams): string {
  const url = new URL("http://dummy");
  if (!searchParams) return "";

  for (const [key, value] of Object.entries(searchParams)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v != null && v !== "") {
          url.searchParams.append(key, v);
        }
      }
    } else {
      if (value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.searchParams.toString();
}

async function searchListings(
  searchParams?: SearchParams
): Promise<SearchResponse> {
  const origin = getOrigin();
  const qs = buildQuery(searchParams);
  const url = qs
    ? `${origin}/api/listings/search?${qs}`
    : `${origin}/api/listings/search`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return {
      page: 1,
      pageSize: 20,
      total: 0,
      pageCount: 0,
      items: [],
    };
  }
  const data = (await res.json()) as SearchResponse;
  return data;
}

// Utilitaire pour la pagination
function withUpdatedParam(
  searchParams: SearchParams | undefined,
  key: string,
  value: string | null
): string {
  const params = new URLSearchParams();

  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (Array.isArray(v)) {
        for (const vv of v) {
          if (vv != null) params.append(k, vv);
        }
      } else if (v != null) {
        params.set(k, v);
      }
    }
  }

  if (value === null) {
    params.delete(key);
  } else {
    params.set(key, value);
  }

  return params.toString();
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  const displayCurrency =
    (cookies().get("currency")?.value as Currency) ?? "EUR";

  // 🔤 Traductions depuis le serveur
  const { dict, locale } = getServerDictionary();
  const t = dict.listings;

  const {
    items: listings,
    page,
    total,
    pageCount,
  } = await searchListings(searchParams);

  const q = (searchParams?.q as string) ?? "";
  const country = (searchParams?.country as string) ?? "";
  const city = (searchParams?.city as string) ?? "";
  const minPrice = (searchParams?.minPrice as string) ?? "";
  const maxPrice = (searchParams?.maxPrice as string) ?? "";
  const minRating = (searchParams?.minRating as string) ?? "";
  const sort = (searchParams?.sort as string) ?? "newest";
  const hasPhoto = searchParams?.hasPhoto === "1";
  const startDate = (searchParams?.startDate as string) ?? "";
  const endDate = (searchParams?.endDate as string) ?? "";
  const guests = (searchParams?.guests as string) ?? "";

  // Pré-formatage des prix
  const listingsWithPrice = await Promise.all(
    listings.map(async (listing) => {
      const priceLabel = await formatMoneyAsync(
        listing.price,
        listing.currency,
        displayCurrency
      );
      return { listing, priceLabel };
    })
  );

  // Markers pour la carte
  const markers: MapMarker[] = listingsWithPrice
    .filter(
      ({ listing }) =>
        listing.latPublic != null && listing.lngPublic != null
    )
    .map(({ listing, priceLabel }) => ({
      id: listing.id,
      lat: listing.latPublic as number,
      lng: listing.lngPublic as number,
      label: priceLabel,
      title: listing.title,
      city: listing.city,
      country: listing.country,
      createdAt: listing.createdAt,
      priceFormatted: priceLabel,
      imageUrl: listing.images?.[0]?.url ?? null,
      images: listing.images ?? [], // Passer toutes les images pour le carousel
    }));

  const resultLabel =
    total === 0
      ? t.resultNone
      : total === 1
        ? t.resultOne
        : t.resultMany.replace("{count}", String(total));

  return (
    <PageErrorBoundary>
      {/* Schema.org JSON-LD pour le SEO de la page de recherche */}
      <SearchPageJsonLd
        searchParams={{
          q,
          country,
          city,
          type: (searchParams?.type as string) || undefined,
        }}
        totalResults={total}
        listings={listings.map(l => ({
          id: l.id,
          title: l.title,
          price: l.price,
          currency: l.currency,
          city: l.city,
          country: l.country,
          images: l.images,
        }))}
      />

      {/* Contenu principal - responsive pour tous écrans */}
      <main className="min-h-screen pb-8 sm:pb-12 pt-4 sm:pt-6 lg:mr-[40%] xl:mr-[42%] 2xl:mr-[44%] 3xl:mr-[46%]">
        <div className="mx-auto max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl space-y-3 sm:space-y-4 px-4 sm:px-6 lg:px-8">
          {/* Header simple comme Airbnb */}
          <header className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {resultLabel}
            </p>

            {session && (
              <span className="text-xs text-gray-500">
                {t.connectedAs} {session.user?.email}
              </span>
            )}
          </header>

          {/* 🔍 Barre de recherche + Filtres (client) */}
          <FiltersBar
            q={q}
            country={country}
            city={city}
            minPrice={minPrice}
            maxPrice={maxPrice}
            minRating={minRating}
            sort={sort}
            hasPhoto={hasPhoto}
            startDate={startDate}
            endDate={endDate}
            guests={guests}
            locale={locale}
          />

          {/* Filtres actifs */}
          <ActiveFilters
            q={q}
            startDate={startDate}
            endDate={endDate}
            guests={guests}
            searchParams={searchParams}
          />

          {/* Pagination en haut */}
          {pageCount > 1 && (
            <div className="flex items-center justify-end gap-2 text-xs text-gray-600">
              <span>
                Page {page} / {pageCount}
              </span>

              <div className="flex gap-1">
                {page > 1 && (
                  <Link
                    href={`/listings?${withUpdatedParam(
                      searchParams,
                      "page",
                      String(page - 1)
                    )}`}
                    className="rounded-full border border-gray-300 px-2 py-1 hover:border-black"
                  >
                    {t.prevPage}
                  </Link>
                )}

                {page < pageCount && (
                  <Link
                    href={`/listings?${withUpdatedParam(
                      searchParams,
                      "page",
                      String(page + 1)
                    )}`}
                    className="rounded-full border border-gray-300 px-2 py-1 hover:border-black"
                  >
                    {t.nextPage}
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Liste des annonces - toujours afficher la carte même sans résultats */}
          <ListingsWithMap
            listings={listingsWithPrice.map(({ listing, priceLabel }) => ({
              ...listing,
              priceLabel,
            }))}
            markers={markers}
            translations={{
              noImage: t.noImage,
              perNight: t.perNight,
              noLocation: t.noLocation,
              hostLabel: t.hostLabel,
              defaultHostName: t.defaultHostName,
              publishedOnPrefix: t.publishedOnPrefix,
            }}
            searchParams={searchParams as Record<string, string>}
            displayCurrency={displayCurrency}
            currentPage={page}
            totalPages={pageCount}
          />
        </div>
      </main>
    </PageErrorBoundary>
  );
}
