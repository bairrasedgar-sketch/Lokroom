// apps/web/src/app/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { formatMoneyAsync, type Currency } from "@/lib/currency";
import CurrencyNotice from "@/components/CurrencyNotice";
import { getServerDictionary } from "@/lib/i18n.server";

// Icons SVG components
function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function UserCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12l2.25 2.25L21 12" />
    </svg>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  );
}

function LockClosedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

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

        {/* SECTION POURQUOI LOK'ROOM */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-center text-lg font-semibold text-slate-900 sm:text-xl">
            {(t as any).whyLokroom?.title || "Pourquoi Lok'Room ?"}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center rounded-2xl bg-slate-50 p-4 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <ShieldCheckIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-sm font-medium text-slate-900">
                {(t as any).whyLokroom?.securePayment || "Paiement sécurisé"}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {(t as any).whyLokroom?.securePaymentDesc || "Transactions protégées via Stripe"}
              </p>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-slate-50 p-4 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <UserCheckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-slate-900">
                {(t as any).whyLokroom?.verifiedHosts || "Hôtes vérifiés"}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {(t as any).whyLokroom?.verifiedHostsDesc || "Identité contrôlée pour votre sécurité"}
              </p>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-slate-50 p-4 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <ChatBubbleIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-sm font-medium text-slate-900">
                {(t as any).whyLokroom?.reactiveSupport || "Support réactif"}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {(t as any).whyLokroom?.reactiveSupportDesc || "Une équipe disponible pour vous aider"}
              </p>
            </div>
          </div>
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
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-slate-50">
          <div className="p-5 sm:p-6">
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

            {/* Tagline avec icônes */}
            <div className="mt-5 border-t border-slate-700/50 pt-5">
              <p className="mb-4 text-center text-xs font-medium text-slate-300">
                {(t as any).hostSection?.tagline || "Tu fixes les règles, on gère les paiements et la sécurité."}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-700/50">
                    <ClipboardIcon className="h-5 w-5 text-slate-300" />
                  </div>
                  <span className="text-xs font-medium text-white">
                    {(t as any).hostSection?.features?.yourRules || "Tes règles"}
                  </span>
                  <span className="mt-0.5 text-[10px] text-slate-400">
                    {(t as any).hostSection?.features?.yourRulesDesc || "Définis les conditions"}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-700/50">
                    <CreditCardIcon className="h-5 w-5 text-slate-300" />
                  </div>
                  <span className="text-xs font-medium text-white">
                    {(t as any).hostSection?.features?.securePayments || "Paiements sécurisés"}
                  </span>
                  <span className="mt-0.5 text-[10px] text-slate-400">
                    {(t as any).hostSection?.features?.securePaymentsDesc || "Revenus en sécurité"}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-700/50">
                    <LockClosedIcon className="h-5 w-5 text-slate-300" />
                  </div>
                  <span className="text-xs font-medium text-white">
                    {(t as any).hostSection?.features?.protection || "Protection"}
                  </span>
                  <span className="mt-0.5 text-[10px] text-slate-400">
                    {(t as any).hostSection?.features?.protectionDesc || "Couverture assurée"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
