"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMobileSheetSafe } from "@/contexts/MobileSheetContext";
import { logger } from "@/lib/logger";


export default function MobileNavBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const mobileSheet = useMobileSheetSafe();

  // Ne pas afficher sur certaines pages
  const hiddenPaths = ["/login", "/onboarding", "/admin", "/maintenance"];
  if (hiddenPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  // Determiner si on doit cacher le footer
  const isOnListingsPage = pathname === "/listings" || pathname.startsWith("/listings?");
  // Cacher si collapsed OU si on scroll vers le bas en mode expanded
  const shouldHideFooter = isOnListingsPage && mobileSheet?.isSheetActive && (
    mobileSheet?.sheetPosition === 'collapsed' || mobileSheet?.isScrollingDown
  );

  // Vérifier si l'utilisateur est hôte
  type SessionUser = { isHost?: boolean; role?: string };
  const sessionUser = session?.user as SessionUser | undefined;

  // Vérification stricte: isHost doit être explicitement true
  const isHost = sessionUser?.isHost === true ||
                 sessionUser?.role === "HOST" ||
                 sessionUser?.role === "BOTH";

  // Debug: afficher les valeurs dans la console
  if (typeof window !== 'undefined' && sessionUser) {
    logger.debug('[MobileNavBar] Session user:', {
      isHost: sessionUser.isHost,
      role: sessionUser.role,
      computed_isHost: isHost
    });
  }

  const navItems = [
    {
      href: "/",
      label: "Explorer",
      icon: (active: boolean) => (
        <svg className={`h-6 w-6 ${active ? "text-rose-500" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      ),
    },
    {
      href: "/favorites",
      label: "Favoris",
      icon: (active: boolean) => (
        <svg className={`h-6 w-6 ${active ? "text-rose-500" : "text-gray-500"}`} fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
    },
    // Onglet "Annonces" pour les hôtes uniquement
    ...(isHost ? [{
      href: "/host/listings",
      label: "Annonces",
      icon: (active: boolean) => (
        <svg className={`h-6 w-6 ${active ? "text-rose-500" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
        </svg>
      ),
    }] : []),
    {
      href: "/trips",
      label: "Voyages",
      icon: (active: boolean) => (
        <svg className={`h-6 w-6 ${active ? "text-rose-500" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      ),
    },
    {
      href: "/messages",
      label: "Messages",
      icon: (active: boolean) => (
        <svg className={`h-6 w-6 ${active ? "text-rose-500" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      ),
    },
    {
      href: session ? "/account" : "/login",
      label: session ? "Profil" : "Connexion",
      icon: (active: boolean) => (
        <svg className={`h-6 w-6 ${active ? "text-rose-500" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden safe-area-bottom transition-transform duration-300 ease-out ${
        shouldHideFooter ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="flex items-center justify-around py-2 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1"
            >
              {item.icon(isActive)}
              <span className={`text-[10px] ${isActive ? "text-rose-500 font-medium" : "text-gray-500"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
