// apps/web/src/components/layout/UserMenu.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react"; // ⬅️ NEW : on utilise NextAuth pour logout

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [hostLoading, setHostLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  // 🚀 Onboarding Stripe pour devenir hôte
  async function handleBecomeHost() {
    if (hostLoading) return;
    setHostLoading(true);
    try {
      const res = await fetch("/api/host/onboard", { method: "POST" });

      const text = await res.text();
      let data: unknown = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // pas du JSON, on garde le texte brut
      }

      if (!res.ok) {
        const parsed = data as { error?: string } | null;
        const msg = parsed?.error || text || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const parsed = data as { url?: string } | null;
      const url = parsed?.url;

      if (!url) {
        throw new Error("Stripe onboarding URL manquante dans la réponse.");
      }

      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Erreur inconnue lors de l'onboarding hôte"
      );
    } finally {
      setHostLoading(false);
    }
  }

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
              href="/favorites"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-gray-50"
            >
              Favoris
            </Link>
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
              href="/account/payments?tab=payouts"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-gray-50"
            >
              Versements
            </Link>
            <Link
              href="/account?tab=taxes"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-gray-50"
            >
              Taxes
            </Link>

            {/* ➕ Sous Taxes */}
            <Link
              href="/listings/new"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 font-medium text-gray-900 hover:bg-gray-50"
            >
              Créer une annonce
            </Link>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void handleBecomeHost();
              }}
              disabled={hostLoading}
              className="block w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              {hostLoading
                ? "Redirection vers Stripe…"
                : "Devenir hôte Lok’Room"}
            </button>

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
