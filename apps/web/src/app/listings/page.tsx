// apps/web/src/app/listings/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import { getOrigin } from "@/lib/origin";
import FiltersBar from "@/components/listings/FiltersBar";
import ActiveFilters from "@/components/listings/ActiveFilters";
import ListingsWithMap from "@/components/listings/ListingsWithMap";
import { getServerDictionary } from "@/lib/i18n.server";
import { type MapMarker } from "@/components/Map";

export const revalidate = 0;
export const dynamic = "force-dynamic";

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
    }));

  const resultLabel =
    total === 0
      ? t.resultNone
      : total === 1
        ? t.resultOne
        : t.resultMany.replace("{count}", String(total));

  return (
    <>
      {/* Contenu principal - prend 62% à gauche sur desktop */}
      <main className="pb-12 pt-6 lg:mr-[38%]">
        <div className="mx-auto max-w-4xl space-y-6 px-4">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold sm:text-3xl">{t.title}</h1>
              <p className="text-sm text-gray-600">{t.subtitle}</p>
            </div>

            <div className="text-xs text-gray-500">
              {session ? (
                <span>
                  {t.connectedAs} {session.user?.email}
                </span>
              ) : (
                <span>{t.loginHint}</span>
              )}
            </div>
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

          {/* Résumé + pagination */}
          <section className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <p className="text-xs text-gray-600">{resultLabel}</p>

            {pageCount > 1 && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
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
          </section>

          {/* Liste des annonces */}
          {listingsWithPrice.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              {t.emptyState}
            </div>
          ) : (
            <ListingsWithMap
              listings={listingsWithPrice.map(({ listing, priceLabel }) => ({
                ...listing,
                priceLabel,
              }))}
              markers={markers}
              locale={locale}
              translations={{
                noImage: t.noImage,
                perNight: t.perNight,
                noLocation: t.noLocation,
                hostLabel: t.hostLabel,
                defaultHostName: t.defaultHostName,
                publishedOnPrefix: t.publishedOnPrefix,
              }}
            />
          )}
        </div>
      </main>
    </>
  );
}
