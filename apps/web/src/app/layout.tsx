// apps/web/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";

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
    apple: "/apple-touch-icon.png", // iOS home screen icon
  },
  manifest: "/site.webmanifest", // tells browsers where your manifest is
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-screen bg-gradient-to-b from-[#f9fafb] via-white to-[#f3f4f6] text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
