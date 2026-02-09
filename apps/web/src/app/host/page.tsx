import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServerDictionary } from "@/lib/i18n.server";
import HostKitReward from "@/components/host/HostKitReward";
import HostDashboardStats from "@/components/host/HostDashboardStats";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";

export const metadata = {
  title: "Tableau de bord | Hote Lok'Room",
  description: "Gerez vos annonces, reservations et revenus en tant qu'hote sur Lok'Room. Accedez a tous vos outils de gestion.",
};

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
    <PageErrorBoundary>
      <div className="mx-auto max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1600px] px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* En-tête */}
      <header className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-xs sm:text-sm text-gray-600">
          {t.welcome}{" "}
          <span className="font-medium text-gray-800">{user.email}</span>
        </p>
      </header>

      {/* Bandeau résumé - Stats dynamiques */}
      <HostDashboardStats
        labels={{
          hostStatus: t.hostStatus,
          hostActive: t.hostActive,
          hostActiveDesc: t.hostActiveDesc,
          listingsLabel: t.listingsLabel,
          listingsDesc: t.listingsDesc,
          estimatedEarnings: t.estimatedEarnings,
          estimatedEarningsDesc: t.estimatedEarningsDesc,
        }}
      />

      {/* Programme Kit Lokeur */}
      <section>
        <HostKitReward />
      </section>

      {/* Actions principales */}
      <section className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-2 sm:space-y-3">
          <h2 className="text-base sm:text-lg font-semibold">{t.manageListings}</h2>
          <p className="text-xs sm:text-sm text-gray-600">{t.manageListingsDesc}</p>
          <div className="flex flex-wrap gap-2 pt-1 sm:pt-2">
            <a
              href="/listings/new"
              className="rounded-lg sm:rounded-xl bg-black px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-gray-900"
            >
              {t.createListing}
            </a>
            <a
              href="/host/listings"
              className="rounded-lg sm:rounded-xl border border-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              {t.viewMyListings}
            </a>
          </div>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm space-y-2 sm:space-y-3">
          <h2 className="text-base sm:text-lg font-semibold">{t.bookingsAndEarnings}</h2>
          <p className="text-xs sm:text-sm text-gray-600">{t.bookingsAndEarningsDesc}</p>
          <div className="flex flex-wrap gap-2 pt-1 sm:pt-2">
            <a
              href="/host/bookings"
              className="rounded-lg sm:rounded-xl border border-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              {t.viewMyBookings}
            </a>
            <a
              href="/host/analytics"
              className="rounded-lg sm:rounded-xl border border-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Analytics
            </a>
            <a
              href="/host/wallet"
              className="rounded-lg sm:rounded-xl border border-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Portefeuille
            </a>
          </div>
        </div>
      </section>

      {/* Outils supplémentaires */}
      <section className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <a
          href="/host/calendar"
          className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-100 flex items-center justify-center mb-2 sm:mb-3">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Calendrier</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Gérez vos disponibilités et synchronisez avec iCal</p>
        </a>

        <a
          href="/messages"
          className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-100 flex items-center justify-center mb-2 sm:mb-3">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Messages</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Communiquez avec vos voyageurs</p>
        </a>

        <a
          href="/host/profile"
          className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 md:col-span-1"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-100 flex items-center justify-center mb-2 sm:mb-3">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Profil hôte</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Personnalisez votre profil public</p>
        </a>
      </section>
      </div>
    </PageErrorBoundary>
  );
}
