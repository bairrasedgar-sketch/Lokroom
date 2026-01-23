"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// Footer links configuration - adapted for Lok'Room
const footerSections = [
  {
    title: "Assistance",
    links: [
      { label: "Centre d'aide", href: "/help" },
      { label: "LokCover", href: "/lokcover" },
      { label: "Non-discrimination", href: "/legal/non-discrimination" },
      { label: "Options d'annulation", href: "/legal/cancellation" },
      { label: "Accessibilité", href: "/accessibility" },
    ],
  },
  {
    title: "Accueil de voyageurs",
    links: [
      { label: "Proposer votre espace sur Lok'Room", href: "/listings/new" },
      { label: "LokCover pour les hôtes", href: "/lokcover-host" },
      { label: "Ressources pour les hôtes", href: "/host/resources" },
      { label: "Standards de la communauté", href: "/legal/community-standards" },
      { label: "Accueil responsable", href: "/responsible-hosting" },
    ],
  },
  {
    title: "Lok'Room",
    links: [
      { label: "Nouveautés", href: "/whats-new" },
      { label: "Salle de presse", href: "/press" },
      { label: "Carrières", href: "/careers" },
      { label: "Investisseurs", href: "/investors" },
      { label: "Cartes cadeaux", href: "/gift-cards" },
    ],
  },
];

// Mapping des codes de langue vers les labels
const LOCALE_LABELS: Record<string, string> = {
  fr: "Français (FR)",
  en: "English (EN)",
  es: "Español (ES)",
  de: "Deutsch (DE)",
  it: "Italiano (IT)",
  pt: "Português (PT)",
  zh: "中文 (ZH)",
};

// Mapping des devises vers les symboles
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  CAD: "C$",
  GBP: "£",
  CNY: "¥",
  CHF: "CHF",
};

export default function Footer() {
  const [currentYear] = useState(() => new Date().getFullYear());
  const pathname = usePathname();
  const [currentLocale, setCurrentLocale] = useState("fr");
  const [currentCurrency, setCurrentCurrency] = useState("EUR");

  // Lire la langue et devise depuis les cookies
  useEffect(() => {
    if (typeof document === "undefined") return;

    const mLoc = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    if (mLoc?.[1] && Object.keys(LOCALE_LABELS).includes(mLoc[1])) {
      setCurrentLocale(mLoc[1]);
    }

    const mCur = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
    if (mCur?.[1]) {
      setCurrentCurrency(mCur[1]);
    }
  }, []);

  // Ouvrir le modal langue/devise (dispatch event pour le modal dans navbar)
  function openLocaleModal() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("openLocaleModal"));
    }
  }

  // Afficher le footer sur toutes les pages
  // (anciennement masqué sur /listings)

  return (
    <footer className="relative z-30 hidden md:block" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Main footer content */}
      <div className="mx-auto max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[1920px] px-4 py-4 sm:py-5 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 mt-4">
          {footerSections.map((section, index) => (
            <div key={section.title} className={index === 2 ? "ml-16" : ""}>
              <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
              <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Illustration à droite avec fondu */}
          <div className="hidden xl:flex xl:col-span-2 2xl:col-span-3 items-start justify-center" style={{ marginTop: '-2.25rem' }}>
            <div className="relative">
              {/* Masque de fondu radial */}
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: 'radial-gradient(ellipse at center, transparent 50%, rgba(245, 245, 245, 0.6) 75%, rgb(245, 245, 245) 100%)',
                }}
              />
              <Image
                src="/illustration final.png"
                alt="Illustration Lok'Room"
                width={900}
                height={600}
                className="object-contain max-h-[350px] w-auto"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-200">
        <div className="mx-auto max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[1920px] px-4 py-4 sm:py-6 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            {/* Copyright and legal links */}
            <div className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-4 gap-y-1 sm:gap-y-2 text-xs sm:text-sm text-gray-600">
              <span>&copy; {currentYear} Lok&apos;Room, Inc.</span>
              <span className="hidden sm:inline">·</span>
              <Link href="/legal/privacy" className="hover:underline">
                Confidentialité
              </Link>
              <span className="hidden sm:inline">·</span>
              <Link href="/legal/terms" className="hover:underline">
                Conditions générales
              </Link>
              <span className="hidden md:inline">·</span>
              <Link href="/legal/legal-notice" className="hidden md:inline hover:underline">
                Mentions légales
              </Link>
              <span className="hidden md:inline">·</span>
              <Link href="/legal/cookies" className="hidden md:inline hover:underline">
                Cookies
              </Link>
            </div>

            {/* Language, currency, and social */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              {/* Language selector */}
              <button
                type="button"
                onClick={openLocaleModal}
                aria-label="Changer la langue"
                className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                <span className="hidden sm:inline">{LOCALE_LABELS[currentLocale] || "Français (FR)"}</span>
                <span className="sm:hidden">{currentLocale.toUpperCase()}</span>
              </button>

              {/* Currency */}
              <button
                type="button"
                onClick={openLocaleModal}
                aria-label="Changer la devise"
                className="text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                {CURRENCY_SYMBOLS[currentCurrency] || "€"} {currentCurrency}
              </button>

              {/* Social links */}
              <div className="flex items-center gap-2 sm:gap-3">
                <a
                  href="https://facebook.com/lokroom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* X (Twitter) */}
                <a
                  href="https://twitter.com/lokroom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="X (Twitter)"
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com/lokroom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
