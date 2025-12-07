// apps/web/src/components/layout/UserMenu.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Vérifier si l'utilisateur est hôte
  const sessionUser = session?.user as { isHost?: boolean; role?: string } | undefined;
  const isHost =
    sessionUser?.isHost === true ||
    sessionUser?.role === "HOST" ||
    sessionUser?.role === "BOTH";

  // 🔒 Ferme le menu dès que l'URL / la page change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
      console.error(error);
      alert("Erreur lors de la déconnexion");
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Bouton "avatar + 3 barres" */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
        <div className="absolute right-0 top-11 z-40 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Profil
          </div>

          <nav className="py-1 text-sm text-gray-800">
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

            <Link
              href="/help"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-gray-50"
            >
              Centre d&apos;aide
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
