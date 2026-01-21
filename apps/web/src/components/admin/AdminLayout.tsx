"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  HomeIcon,
  UsersIcon,
  HomeModernIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  TicketIcon,
  MagnifyingGlassIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  IdentificationIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  LifebuoyIcon,
} from "@heroicons/react/24/outline";
import { signOut } from "next-auth/react";

type AdminRole = "ADMIN" | "MODERATOR" | "SUPPORT" | "ANALYST";

const ROLE_LABELS: Record<AdminRole, string> = {
  ADMIN: "Administrateur",
  MODERATOR: "Modérateur",
  SUPPORT: "Support",
  ANALYST: "Analyste",
};

const ROLE_COLORS: Record<AdminRole, string> = {
  ADMIN: "bg-red-100 text-red-800",
  MODERATOR: "bg-blue-100 text-blue-800",
  SUPPORT: "bg-green-100 text-green-800",
  ANALYST: "bg-purple-100 text-purple-800",
};

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AdminRole[];
  badge?: number;
};

const navigation: NavItem[] = [
  { name: "Tableau de bord", href: "/admin", icon: HomeIcon, roles: ["ADMIN", "MODERATOR", "SUPPORT", "ANALYST"] },
  { name: "Utilisateurs", href: "/admin/users", icon: UsersIcon, roles: ["ADMIN", "MODERATOR", "SUPPORT"] },
  { name: "Vérifications", href: "/admin/verifications", icon: IdentificationIcon, roles: ["ADMIN", "MODERATOR"] },
  { name: "Annonces", href: "/admin/listings", icon: HomeModernIcon, roles: ["ADMIN", "MODERATOR"] },
  { name: "Réservations", href: "/admin/bookings", icon: CalendarDaysIcon, roles: ["ADMIN", "MODERATOR", "SUPPORT"] },
  { name: "Avis", href: "/admin/reviews", icon: StarIcon, roles: ["ADMIN", "MODERATOR"] },
  { name: "Litiges", href: "/admin/disputes", icon: ExclamationTriangleIcon, roles: ["ADMIN", "MODERATOR", "SUPPORT"] },
  { name: "Support utilisateurs", href: "/admin/support", icon: LifebuoyIcon, roles: ["ADMIN", "MODERATOR", "SUPPORT"] },
  { name: "Paiements", href: "/admin/payments", icon: BanknotesIcon, roles: ["ADMIN"] },
  { name: "Messages", href: "/admin/messages", icon: ChatBubbleLeftRightIcon, roles: ["ADMIN", "MODERATOR"] },
  { name: "Analytiques", href: "/admin/analytics", icon: ChartBarIcon, roles: ["ADMIN", "ANALYST"] },
  { name: "Codes promo", href: "/admin/promos", icon: TicketIcon, roles: ["ADMIN"] },
  { name: "Logs d'audit", href: "/admin/logs", icon: ClipboardDocumentListIcon, roles: ["ADMIN"] },
  { name: "Configuration", href: "/admin/settings", icon: Cog6ToothIcon, roles: ["ADMIN"] },
];

type Alert = {
  id: string;
  type: "dispute" | "listing" | "user" | "booking" | "support";
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
  actionUrl?: string;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    users: Array<{ id: string; name: string | null; email: string }>;
    listings: Array<{ id: string; title: string; city: string }>;
    bookings: Array<{ id: string; guestName: string; listingTitle: string }>;
  } | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [stats, setStats] = useState({
    pendingListings: 0,
    openDisputes: 0,
    todayBookings: 0,
    pendingSupport: 0,
  });

  const user = session?.user as { id?: string; name?: string; email?: string; role?: string } | undefined;
  const userRole = (user?.role || "USER") as AdminRole | "USER";
  const isAdmin = ["ADMIN", "MODERATOR", "SUPPORT", "ANALYST"].includes(userRole);

  // Fetch alerts and stats
  useEffect(() => {
    if (isAdmin) {
      fetch("/api/admin/alerts")
        .then((res) => res.json())
        .then((data) => {
          if (data.alerts) setAlerts(data.alerts);
          if (data.stats) setStats(data.stats);
        })
        .catch(console.error);
    }
  }, [isAdmin]);

  // Redirect if not admin
  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAdmin) {
      router.push("/");
    }
  }, [session, status, isAdmin, router]);

  // Recherche en temps réel - doit être avant les return conditionnels
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults(null);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowSearchResults(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Variables calculées
  const filteredNav = navigation.filter((item) =>
    item.roles.includes(userRole as AdminRole)
  );
  const highPriorityAlerts = alerts.filter((a) => a.priority === "high").length;

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/users?search=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Not admin - redirect handled by useEffect
  if (!session || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-300 lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-200 px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <ShieldCheckIcon className="h-6 w-6 text-red-500" />
            <span className="text-lg font-bold text-gray-900">Lok&apos;Room Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu"
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* User info */}
        <div className="flex-shrink-0 border-b border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || "Admin"}
              </p>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${ROLE_COLORS[userRole as AdminRole] || "bg-gray-100 text-gray-800"}`}>
                {ROLE_LABELS[userRole as AdminRole] || userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation - scrollable */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/admin" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-red-50 text-red-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-red-500" : "text-gray-400"}`} />
                <span className="truncate">{item.name}</span>
                {item.name === "Litiges" && stats.openDisputes > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {stats.openDisputes}
                  </span>
                )}
                {item.name === "Annonces" && stats.pendingListings > 0 && (
                  <span className="ml-auto bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {stats.pendingListings}
                  </span>
                )}
                {item.name === "Support utilisateurs" && stats.pendingSupport > 0 && (
                  <span className="ml-auto bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {stats.pendingSupport}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="flex-shrink-0 border-t border-gray-200 p-3 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <HomeIcon className="h-5 w-5 text-gray-400" />
            Retour au site
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-0 lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex h-14 items-center gap-4 px-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xs sm:max-w-sm md:max-w-lg relative">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults && setShowSearchResults(true)}
                  className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-1.5 md:py-2 border border-gray-300 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  </div>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                  {/* Users */}
                  {searchResults.users.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-500 uppercase px-2 mb-1">Utilisateurs</p>
                      {searchResults.users.slice(0, 3).map((user) => (
                        <Link
                          key={user.id}
                          href={`/admin/users/${user.id}`}
                          onClick={() => { setShowSearchResults(false); setSearchQuery(""); }}
                          className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg"
                        >
                          <UsersIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name || "Sans nom"}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Listings */}
                  {searchResults.listings.length > 0 && (
                    <div className="p-2 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase px-2 mb-1">Annonces</p>
                      {searchResults.listings.slice(0, 3).map((listing) => (
                        <Link
                          key={listing.id}
                          href={`/admin/listings/${listing.id}`}
                          onClick={() => { setShowSearchResults(false); setSearchQuery(""); }}
                          className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg"
                        >
                          <HomeModernIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{listing.title}</p>
                            <p className="text-xs text-gray-500">{listing.city}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Bookings */}
                  {searchResults.bookings.length > 0 && (
                    <div className="p-2 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase px-2 mb-1">Réservations</p>
                      {searchResults.bookings.slice(0, 3).map((booking) => (
                        <Link
                          key={booking.id}
                          href={`/admin/bookings/${booking.id}`}
                          onClick={() => { setShowSearchResults(false); setSearchQuery(""); }}
                          className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg"
                        >
                          <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{booking.listingTitle}</p>
                            <p className="text-xs text-gray-500">par {booking.guestName}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* No results */}
                  {searchResults.users.length === 0 &&
                   searchResults.listings.length === 0 &&
                   searchResults.bookings.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Aucun résultat pour &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Alerts */}
              <div className="relative">
                <button
                  onClick={() => setShowAlerts(!showAlerts)}
                  aria-label="Afficher les alertes"
                  aria-expanded={showAlerts}
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <BellIcon className="h-6 w-6" />
                  {highPriorityAlerts > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {highPriorityAlerts}
                    </span>
                  )}
                </button>

                {/* Alerts dropdown */}
                {showAlerts && (
                  <div className="absolute right-0 mt-2 w-64 sm:w-72 md:w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                      <h3 className="font-semibold text-gray-900">Alertes</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {alerts.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500 text-center">
                          Aucune alerte
                        </p>
                      ) : (
                        alerts.slice(0, 5).map((alert) => (
                          <Link
                            key={alert.id}
                            href={alert.actionUrl || "#"}
                            onClick={() => setShowAlerts(false)}
                            className={`block p-3 border-b border-gray-100 hover:bg-gray-50 ${
                              alert.priority === "high" ? "bg-red-50" : ""
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {alert.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {alert.message}
                            </p>
                          </Link>
                        ))
                      )}
                    </div>
                    {alerts.length > 5 && (
                      <Link
                        href="/admin/alerts"
                        className="block p-3 text-center text-sm text-red-600 hover:bg-gray-50"
                      >
                        Voir toutes les alertes
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="hidden sm:flex items-center gap-4 pl-4 border-l border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Aujourd&apos;hui</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.todayBookings}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
