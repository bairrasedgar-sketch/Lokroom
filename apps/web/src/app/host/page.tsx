import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServerDictionary } from "@/lib/i18n.server";

export default async function HostPage() {
  const session = await getServerSession(authOptions);

  // Pas connecté → on renvoie vers /login
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  // Connecté mais pas hôte → on renvoie vers /profile (ou /become-host)
  if (!user.isHost) {
    redirect("/profile");
  }

  const { dict } = getServerDictionary();
  const t = dict.host;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      {/* En-tête */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-gray-600">
          {t.welcome}{" "}
          <span className="font-medium text-gray-800">{user.email}</span>
        </p>
      </header>

      {/* Bandeau résumé */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500">
            {t.hostStatus}
          </p>
          <p className="mt-2 text-sm">{t.hostActive}</p>
          <p className="mt-1 text-xs text-gray-500">{t.hostActiveDesc}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500">
            {t.listingsLabel}
          </p>
          <p className="mt-2 text-2xl font-semibold">—</p>
          <p className="mt-1 text-xs text-gray-500">{t.listingsDesc}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500">
            {t.estimatedEarnings}
          </p>
          <p className="mt-2 text-2xl font-semibold">—</p>
          <p className="mt-1 text-xs text-gray-500">{t.estimatedEarningsDesc}</p>
        </div>
      </section>

      {/* Actions principales */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">{t.manageListings}</h2>
          <p className="text-sm text-gray-600">{t.manageListingsDesc}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href="/listings/new"
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
            >
              {t.createListing}
            </a>
            <a
              href="/listings?mine=1"
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              {t.viewMyListings}
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">{t.bookingsAndEarnings}</h2>
          <p className="text-sm text-gray-600">{t.bookingsAndEarningsDesc}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href="/reservations?mine=1"
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              {t.viewMyBookings}
            </a>
            <a
              href="/profile"
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              {t.manageHostAccount}
            </a>
          </div>
        </div>
      </section>

      {/* Placeholder futur */}
      <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
        {t.futurePlaceholder}
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t.futurePlaceholderItems.arrivals}</li>
          <li>{t.futurePlaceholderItems.notifications}</li>
          <li>{t.futurePlaceholderItems.walletSummary}</li>
        </ul>
      </section>
    </div>
  );
}
