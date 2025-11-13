"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import CurrencySwitcher from "./CurrencySwitcher";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Fermer le menu mobile quand on change de page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="border-b bg-white">
      {/* Barre principale */}
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-lg">
          Lokroom
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4">
          <Link
            href="/listings"
            className={pathname?.startsWith("/listings") ? "underline" : ""}
          >
            Annonces
          </Link>
          <Link
            href="/bookings"
            className={pathname === "/bookings" ? "underline" : ""}
          >
            Réservations
          </Link>
          <Link
            href="/profile"
            className={pathname === "/profile" ? "underline" : ""}
          >
            Profil
          </Link>

          {/* Switchers alignés */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>
        </nav>

        {/* Bouton burger (mobile) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Ouvrir le menu"
          aria-expanded={open ? "true" : "false"}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded hover:bg-gray-100"
        >
          <span className="sr-only">Menu</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>

      {/* Panneau mobile */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <nav className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3">
            <Link
              href="/listings"
              className={`py-1 ${pathname?.startsWith("/listings") ? "underline" : ""}`}
            >
              Annonces
            </Link>
            <Link
              href="/bookings"
              className={`py-1 ${pathname === "/bookings" ? "underline" : ""}`}
            >
              Réservations
            </Link>
            <Link
              href="/profile"
              className={`py-1 ${pathname === "/profile" ? "underline" : ""}`}
            >
              Profil
            </Link>

            <div className="mt-2 flex items-center gap-2">
              <LanguageSwitcher />
              <CurrencySwitcher />
            </div>
          </nav>
        </div>
      )}

      {/* Bandeau d’info (facultatif) */}
      <TopCookieNotice />
    </header>
  );
}

/** Petit bandeau qui lit les cookies (locale/currency) et affiche “Affichage : EUR • fr”. */
function TopCookieNotice() {
  const [show, setShow] = useState(true);
  const [currency, setCurrency] = useState<"EUR" | "CAD">("EUR");
  const [locale, setLocale] = useState<"fr" | "en">("fr");

  useEffect(() => {
    const mCur = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
    const mLoc = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    const c = (mCur?.[1] as "EUR" | "CAD" | undefined) || "EUR";
    const l = (mLoc?.[1] as "fr" | "en" | undefined) || "fr";
    setCurrency(c);
    setLocale(l);
  }, []);

  if (!show) return null;

  return (
    <div className="border-t bg-gray-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2 text-xs text-gray-700">
        <div>
          Affichage&nbsp;: <strong>{currency}</strong>&nbsp;•&nbsp;<strong>{locale}</strong>
        </div>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="rounded px-1.5 py-0.5 hover:bg-gray-100"
          aria-label="Masquer le bandeau"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
