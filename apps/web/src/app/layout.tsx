// apps/web/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "Lok’Room",
  description: "Starter",
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
