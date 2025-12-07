// apps/web/src/app/listings/page.tsx
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import { getOrigin } from "@/lib/origin";
import Map, { type MapMarker } from "@/components/Map";
import FiltersBar from "@/components/listings/FiltersBar";
import ActiveFilters from "@/components/listings/ActiveFilters";
import { getServerDictionary } from "@/lib/i18n.server";

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

// Helper pour obtenir le label de chaque type de listing
const LISTING_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  ROOM: "Chambre",
  STUDIO: "Studio",
  OFFICE: "Bureau",
  COWORKING: "Coworking",
  MEETING_ROOM: "Salle de réunion",
  PARKING: "Parking",
  GARAGE: "Garage",
  STORAGE: "Stockage",
  EVENT_SPACE: "Événementiel",
  RECORDING_STUDIO: "Studio",
  OTHER: "Autre",
};

// Helper pour obtenir l'emoji de chaque catégorie
function getCategoryEmoji(key: string): string {
  const emojis: Record<string, string> = {
    APARTMENT: "🏢",
    HOUSE: "🏠",
    ROOM: "🛏️",
    STUDIO: "🎨",
    OFFICE: "💼",
    COWORKING: "👥",
    MEETING_ROOM: "📊",
    PARKING: "🚗",
    GARAGE: "🚙",
    STORAGE: "📦",
    EVENT_SPACE: "🎉",
    RECORDING_STUDIO: "🎤",
    OTHER: "✨",
  };
  return emojis[key] || "🏠";
}

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
    <main className="mx-auto max-w-6xl space-y-6 px-4 pb-12 pt-6">
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

      {/* Liste + Carte */}
      {listingsWithPrice.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          {t.emptyState}
        </div>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)] lg:items-start">
            {/* Colonne gauche : annonces */}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {listingsWithPrice.map(({ listing, priceLabel }) => {
                  const cover = listing.images?.[0]?.url;
                  const rev = listing.reviewSummary;

                  const locationLabel = [
                    listing.city ?? undefined,
                    listing.country ?? undefined,
                  ]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <Link
                      key={listing.id}
                      href={`/listings/${listing.id}`}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-black hover:shadow-md"
                    >
                      <div className="relative h-40 w-full bg-gray-100">
                        {cover ? (
                          <Image
                            src={cover}
                            alt={listing.title}
                            fill
                            className="object-cover transition group-hover:scale-[1.02]"
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">
                            {t.noImage}
                          </div>
                        )}

                        {rev.count > 0 && rev.avgRating != null && (
                          <div className="absolute right-2 top-2 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-medium text-white">
                            {rev.avgRating.toFixed(1)} ★ ({rev.count})
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col gap-2 p-3">
                        <div className="space-y-1">
                          {/* Category Badge */}
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            <span>{getCategoryEmoji(listing.type)}</span>
                            {LISTING_TYPE_LABELS[listing.type] || listing.type}
                          </span>
                          <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                            {listing.title}
                          </p>
                          <p className="line-clamp-2 text-xs text-gray-600">
                            {listing.description}
                          </p>
                        </div>

                        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {priceLabel}
                              <span className="text-xs font-normal text-gray-600">
                                {" "}
                                {t.perNight}
                              </span>
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {locationLabel || t.noLocation}
                            </p>
                          </div>

                          <div className="flex flex-col items-end text-[11px] text-gray-500">
                            <span>
                              {t.hostLabel}{" "}
                              {listing.owner.name ?? t.defaultHostName}
                            </span>
                            <span>
                              {t.publishedOnPrefix}{" "}
                              {new Date(listing.createdAt).toLocaleDateString(
                                locale
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Colonne droite : carte (desktop, map fixe) */}
            <aside className="hidden lg:block">
              <div className="sticky top-20 h-[520px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="relative h-full w-full">
                  <Map markers={markers} panOnHover={false} />
                </div>
              </div>
            </aside>
          </section>

          {/* Carte mobile */}
          <section className="lg:hidden">
            <div className="mt-2 h-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="relative h-full w-full">
                <Map markers={markers} panOnHover={false} />
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
