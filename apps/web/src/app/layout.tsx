import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Providers from "@/components/providers";
import Navbar from "@/components/navbar";

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

export const metadata: Metadata = {
  title: "Lok’Room",
  description: "Starter",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getInitialLocale();

  return (
    <html
      lang={locale}
      data-locale={locale}
      className="h-full"
    >
      <body className="min-h-screen bg-gradient-to-b from-[#f9fafb] via-white to-[#f3f4f6] text-gray-900 antialiased">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
