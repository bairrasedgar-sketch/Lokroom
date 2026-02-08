import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Providers from "@/components/providers";
import { ConditionalNavbar, ConditionalFooter, ConditionalCookieBanner } from "@/components/ConditionalLayout";
import SkipLink from "@/components/accessibility/SkipLink";
import { prisma } from "@/lib/db";
import { MaintenanceRedirect } from "@/components/MaintenanceRedirect";
import SplashScreen from "@/components/SplashScreen";

const SUPPORTED_LOCALES = ["fr", "en", "es", "de", "it", "pt", "zh"] as const;
type LocaleCode = (typeof SUPPORTED_LOCALES)[number];

function getInitialLocale(): LocaleCode {
  const store = cookies();
  const fromCookie = store.get("locale")?.value;

  if (
    fromCookie &&
    SUPPORTED_LOCALES.includes(fromCookie as LocaleCode)
  ) {
    return fromCookie as LocaleCode;
  }

  return "fr";
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: "Lok'Room - Location d'espaces entre particuliers",
    template: "%s | Lok'Room",
  },
  description:
    "Louez et proposez des espaces uniques : appartements, bureaux, studios, parkings et plus. Réservation sécurisée et paiement protégé.",
  keywords: [
    "location espace",
    "louer bureau",
    "location appartement",
    "coworking",
    "location parking",
    "studio photo",
    "salle de réunion",
    "location entre particuliers",
  ],
  authors: [{ name: "Lok'Room" }],
  creator: "Lok'Room",
  publisher: "Lok'Room",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.lokroom.com"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Lok'Room",
    title: "Lok'Room - Location d'espaces entre particuliers",
    description:
      "Louez et proposez des espaces uniques : appartements, bureaux, studios, parkings et plus.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lok'Room - Location d'espaces",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lok'Room - Location d'espaces entre particuliers",
    description:
      "Louez et proposez des espaces uniques : appartements, bureaux, studios, parkings et plus.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon.ico",
      },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  verification: {
    // À remplir avec vos codes de vérification
    // google: "votre-code-google",
    // yandex: "votre-code-yandex",
  },
};

async function checkMaintenanceMode() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "maintenanceMode" },
    });
    return config?.value === true;
  } catch {
    return false;
  }
}

// Désactiver le cache pour vérifier le mode maintenance à chaque requête
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getInitialLocale();
  const isMaintenanceMode = await checkMaintenanceMode();

  return (
    <html
      lang={locale}
      data-locale={locale}
      className="h-full"
    >
      <body className="min-h-screen bg-white text-gray-900 antialiased relative">
        <Providers>
          <SplashScreen />
          <MaintenanceRedirect isMaintenanceMode={isMaintenanceMode} />
          <SkipLink />
          <ConditionalNavbar />
          <main id="main-content" className="flex-1" role="main" tabIndex={-1}>
            {children}
          </main>
          <ConditionalFooter />
          <ConditionalCookieBanner />
        </Providers>
      </body>
    </html>
  );
}
