// apps/web/src/app/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import CurrencyNotice from "@/components/CurrencyNotice";
import { getServerDictionary } from "@/lib/i18n.server";

async function getFeaturedListings() {
  const listings = await prisma.listing.findMany({
    include: {
      images: true,
    },
    orderBy: { createdAt: "desc" },
    take: 6, // les 6 plus récentes
  });

  return listings;
}

export default async function Home() {
  const displayCurrency =
    (cookies().get("currency")?.value as Currency) ?? "EUR";

  const { dict } = getServerDictionary();
  const t = dict.home;

  const listings = await getFeaturedListings();

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
        createdAt: l.createdAt,
        images: l.images,
        priceFormatted,
      };
    })
  );

  const categories = [
    { key: "home", label: t.categories.home },
    { key: "desk", label: t.categories.desk },
    { key: "parking", label: t.categories.parking },
    { key: "event", label: t.categories.event },
    { key: "other", label: t.categories.other },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col space-y-10 px-4 pb-12 pt-8">
        {/* HERO */}
        <section className="space-y-5">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium tracking-[0.18em] text-slate-600">
            LOK&apos;ROOM • BETA
          </span>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              {t.title}
            </h1>

            <p className="max-w-xl text-sm text-slate-600 sm:text-base">
              {t.subtitle}
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="mt-4 space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-900"
              />

              <div className="flex gap-2 sm:w-auto">
                <button className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:text-sm">
                  {t.dates}
                </button>
                <button className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:text-sm">
                  {t.spaceType}
                </button>
                <button className="flex-1 whitespace-nowrap rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 sm:text-sm">
                  {t.searchBtn}
                </button>
              </div>
            </div>

            {/* Catégories */}
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Info devise */}
        <section>
          <CurrencyNotice />
        </section>

        {/* SECTION ANNONCES RÉCENTES */}
        <section className="space-y-4 rounded-3xl bg-slate-50/80 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                {t.recentListings}
              </h2>
              <p className="text-xs text-slate-500">
                {t.recentListingsDesc}
              </p>
            </div>
            <Link
              href="/listings"
              className="text-xs font-medium text-slate-700 hover:text-slate-900 sm:text-sm"
            >
              {t.viewAllListings} →
            </Link>
          </div>

          {cards.length === 0 ? (
            <p className="text-sm text-slate-500">
              {t.noListingsYet}
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((l) => {
                const cover = l.images?.[0]?.url ?? null;

                return (
                  <li
                    key={l.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <Link href={`/listings/${l.id}`} className="block">
                      <div className="relative aspect-[4/3] bg-slate-100">
                        {cover ? (
                          <Image
                            src={cover}
                            alt={l.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-xs text-slate-400">
                            {t.noImage}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 p-3">
                        <h3 className="line-clamp-1 text-sm font-medium text-slate-900">
                          {l.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {l.city ? `${l.city}, ` : ""}
                          {l.country}
                        </p>
                        <p className="pt-1 text-sm font-semibold text-slate-900">
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

        {/* CTA pour devenir hôte */}
        <section className="rounded-3xl bg-slate-900 px-5 py-5 text-slate-50 sm:px-6 sm:py-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
                {t.becomeHostTitle}
              </p>
              <p className="max-w-md text-sm text-slate-100">
                {t.becomeHostDesc}
              </p>
            </div>
            <Link
              href="/profile?tab=host"
              className="rounded-full bg-white px-5 py-2 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-100 sm:text-sm"
            >
              {t.startRenting} →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
