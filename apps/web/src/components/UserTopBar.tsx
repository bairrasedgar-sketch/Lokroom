// apps/web/src/components/UserTopBar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type Mode = "guest" | "host";

export function UserTopBar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("guest");
  const menuRef = useRef<HTMLDivElement | null>(null);

  const userInitial =
    session?.user?.name?.[0]?.toUpperCase() ??
    session?.user?.email?.[0]?.toUpperCase() ??
    "U";

  function toggleMode() {
    setMode((m) => (m === "guest" ? "host" : "guest"));
    // plus tard : appeler une route /api/user/mode pour sauver le mode
  }

  // 🔒 Ferme le menu dès que la route change (ex: /favorites -> /account)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 🔒 Ferme le menu si on clique en dehors
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-end px-6 pt-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-white/80 px-3 py-1 shadow-sm backdrop-blur">
        {/* Mode hôte / voyageur */}
        <button
          onClick={toggleMode}
          className="hidden text-sm font-medium text-gray-700 md:inline-flex"
        >
          {mode === "host" ? "Mode hôte" : "Mode voyageur"}
        </button>

        {/* Avatar → profil */}
        <button
          onClick={() => router.push("/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white"
          aria-label="Aller au profil"
        >
          {userInitial}
        </button>

        {/* 3 barres + menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm"
            aria-label="Ouvrir le menu"
          >
            <span className="flex flex-col gap-[3px]">
              <span className="block h-[2px] w-4 rounded-full bg-gray-800" />
              <span className="block h-[2px] w-4 rounded-full bg-gray-800" />
              <span className="block h-[2px] w-4 rounded-full bg-gray-800" />
            </span>
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-gray-200 bg-white py-2 text-sm shadow-lg">
              <MenuLink
                href="/profile"
                label="Profil"
                bold
                onClick={() => setOpen(false)}
              />
              <MenuLink
                href="/favorites"
                label="Favoris"
                onClick={() => setOpen(false)}
              />
              <MenuLink
                href="/trips"
                label="Voyages"
                onClick={() => setOpen(false)}
              />
              {/* 🔗 Messagerie Lok'Room */}
              <MenuLink
                href="/messages"
                label="Messages"
                onClick={() => setOpen(false)}
              />

              <div className="my-2 border-t border-gray-200" />

              <MenuLink
                href="/account"
                label="Paramètres du compte"
                onClick={() => setOpen(false)}
              />
              <MenuLink
                href="/account?tab=payments"
                label="Paiements"
                onClick={() => setOpen(false)}
              />
              {/* On reste dans /account, avec un param pour activer l’onglet Versements */}
              <MenuLink
                href="/account?tab=payments&view=payouts"
                label="Versements"
                onClick={() => setOpen(false)}
              />
              <MenuLink
                href="/account?tab=taxes"
                label="Taxes"
                onClick={() => setOpen(false)}
              />

              <div className="my-2 border-t border-gray-200" />

              <MenuLink
                href="/help"
                label="Centre d'aide"
                onClick={() => setOpen(false)}
              />
              {/* Plus tard : bouton Se déconnecter, etc. */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuLink({
  href,
  label,
  bold,
  onClick,
}: {
  href: string;
  label: string;
  bold?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block px-4 py-2 hover:bg-gray-100 ${
        bold ? "font-semibold text-gray-900" : "text-gray-700"
      }`}
    >
      {label}
    </Link>
  );
}
