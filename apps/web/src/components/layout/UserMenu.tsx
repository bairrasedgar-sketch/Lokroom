// apps/web/src/components/layout/UserMenu.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { logger } from "@/lib/logger";


// Types pour la locale
type LocaleCode = "fr" | "en" | "es" | "de" | "it" | "pt" | "zh";

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CAD: "C$",
  CHF: "CHF",
  JPY: "¥",
  CNY: "¥",
};

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [localeModalOpen, setLocaleModalOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<LocaleCode>("fr");
  const [currentCurrency, setCurrentCurrency] = useState<string>("EUR");
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Vérifier si l'utilisateur est hôte
  const sessionUser = session?.user as { isHost?: boolean; role?: string } | undefined;
  const isHost =
    sessionUser?.isHost === true ||
    sessionUser?.role === "HOST" ||
    sessionUser?.role === "BOTH" ||
    sessionUser?.role === "ADMIN";

  // 🔒 Ferme le menu dès que l'URL / la page change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Initialise locale + currency à partir des cookies
  useEffect(() => {
    if (typeof document === "undefined") return;

    const mLoc = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    if (mLoc?.[1] && ["fr", "en", "es", "de", "it", "pt", "zh"].includes(mLoc[1])) {
      setCurrentLocale(mLoc[1] as LocaleCode);
    }

    const mCur = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
    if (mCur?.[1]) {
      setCurrentCurrency(mCur[1]);
    }
  }, []);

  // 🔒 Ferme le menu si on clique en dehors
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // 🔴 Déconnexion complète via NextAuth
  async function handleLogout() {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      await signOut({
        callbackUrl: "/", // retour sur la home après logout
      });
    } catch (error) {
      logger.error("Failed to sign out", { error: error instanceof Error ? error.message : String(error) });
      alert("Erreur lors de la déconnexion");
    } finally {
      setLogoutLoading(false);
    }
  }

  // Ouvrir le modal langue/devise (dispatch event pour le modal dans navbar)
  function openLocaleModal() {
    setOpen(false);
    // Dispatch un event custom pour ouvrir le modal dans la navbar
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("openLocaleModal"));
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Bouton "avatar + 3 barres" */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Ouvrir le menu utilisateur"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
          E
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-lg">
          ☰
        </span>
      </button>

      {/* Panneau déroulant */}
      {open && (
        <div className="absolute right-0 top-11 z-40 w-[calc(100vw-2rem)] max-w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:w-72">
          <nav className="py-1 text-sm text-gray-800 max-h-[70vh] overflow-y-auto scrollbar-menu">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 font-medium"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Profil
            </Link>

            <div className="my-1 border-t border-gray-100" />

            <Link
              href="/trips"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-gray-50"
            >
              Voyages
            </Link>
            <Link
              href="/messages"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-gray-50"
            >
              Messages
            </Link>

            <div className="my-1 border-t border-gray-100" />

            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-gray-50"
            >
              Paramètres du compte
            </Link>
            <Link
              href="/account?tab=payments"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-gray-50"
            >
              Paiements
            </Link>
            <Link
              href="/account?tab=payments"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-gray-50"
            >
              Versements
            </Link>
            <Link
              href="/host/wallet"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-gray-50"
            >
              Portefeuille
            </Link>
            <Link
              href="/host/listings"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-gray-50"
            >
              Mes annonces
            </Link>
            <Link
              href="/account?tab=taxes"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-gray-50"
            >
              Taxes
            </Link>

            {/* Section Espace hôte - visible uniquement pour les hôtes */}
            {isHost && (
              <>
                <div className="border-b border-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Espace hôte
                </div>
                <Link
                  href="/host"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
                >
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                  Tableau de bord
                </Link>
                <Link
                  href="/host/listings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
                >
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                  </svg>
                  Mes annonces
                </Link>
                <Link
                  href="/host/bookings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
                >
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Réservations
                </Link>
                <Link
                  href="/host/calendar"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
                >
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Calendrier
                </Link>
                <Link
                  href="/host/analytics"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
                >
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                  Analytics
                </Link>
              </>
            )}

            <div className="my-1 border-t border-gray-100" />

            {/* Favoris - juste avant le bouton principal */}
            <Link
              href="/favorites"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
            >
              <svg
                className="h-4 w-4 text-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21s-6.716-4.145-9.192-7.07C.749 11.62 1.367 8.5 3.757 7.05A5.002 5.002 0 0 1 12 8.278 5.002 5.002 0 0 1 20.243 7.05c2.39 1.45 3.008 4.57.95 6.88C18.716 16.855 12 21 12 21z" />
              </svg>
              Favoris
            </Link>

            {/* Bouton unique : texte change selon statut hôte, destination toujours /listings/new */}
            <Link
              href="/listings/new"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 font-medium text-gray-900 hover:bg-gray-50"
            >
              {isHost ? "Créer une annonce" : "Devenir hôte Lok'Room"}
            </Link>

            <div className="my-1 border-t border-gray-100" />

            {/* Langue et devise */}
            <button
              type="button"
              onClick={openLocaleModal}
              className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-50"
            >
              <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15 15 0 0 1 0 20" />
                <path d="M12 2a15 15 0 0 0 0 20" />
              </svg>
              <span>Langue et devise</span>
              <span className="ml-auto text-xs text-gray-400">
                {currentLocale.toUpperCase()} · {CURRENCY_SYMBOLS[currentCurrency] || "€"}
              </span>
            </button>

            <Link
              href="/help"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-gray-50"
            >
              Centre d&apos;aide
            </Link>
            <Link
              href="/help/issue"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-orange-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Signaler un problème
            </Link>

            {/* 🔴 Bouton Se déconnecter */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void handleLogout();
              }}
              disabled={logoutLoading}
              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 disabled:opacity-60"
            >
              {logoutLoading ? "Déconnexion..." : "Se déconnecter"}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
