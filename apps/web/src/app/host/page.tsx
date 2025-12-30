import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServerDictionary } from "@/lib/i18n.server";
import HostKitReward from "@/components/host/HostKitReward";

export default async function HostPage() {
  const session = await getServerSession(authOptions);

  // Pas connecté → on renvoie vers /login
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as { isHost?: boolean; email?: string | null };

  // Connecté mais pas hôte → on renvoie vers /become-host
  if (!user.isHost) {
    redirect("/become-host");
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

      {/* Programme Kit Lokeur */}
      <section>
        <HostKitReward />
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
              href="/host/listings"
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
              href="/host/bookings"
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              {t.viewMyBookings}
            </a>
            <a
              href="/host/analytics"
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Analytics
            </a>
            <a
              href="/host/wallet"
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Portefeuille
            </a>
          </div>
        </div>
      </section>

      {/* Outils supplémentaires */}
      <section className="grid gap-6 md:grid-cols-3">
        <a
          href="/host/calendar"
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">Calendrier</h3>
          <p className="text-sm text-gray-500 mt-1">Gérez vos disponibilités et synchronisez avec iCal</p>
        </a>

        <a
          href="/messages"
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">Messages</h3>
          <p className="text-sm text-gray-500 mt-1">Communiquez avec vos voyageurs</p>
        </a>

        <a
          href="/host/profile"
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">Profil hôte</h3>
          <p className="text-sm text-gray-500 mt-1">Personnalisez votre profil public</p>
        </a>
      </section>
    </div>
  );
}
