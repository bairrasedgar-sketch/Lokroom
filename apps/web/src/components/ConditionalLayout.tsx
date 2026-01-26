"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import MobileNavBar from "@/components/MobileNavBar";

export function ConditionalNavbar() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  if (isAdminPage) return null;
  return <Navbar />;
}

export function ConditionalFooter() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  const isListingsPage = pathname === "/listings";

  if (isAdminPage) return null;

  return (
    <>
      {/* Footer caché sur /listings en mobile (la map prend tout l'écran) */}
      <div className={isListingsPage ? "hidden lg:block" : ""}>
        <Footer />
      </div>
      <MobileNavBar />
    </>
  );
}

export function ConditionalCookieBanner() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  if (isAdminPage) return null;
  return <CookieBanner />;
}
