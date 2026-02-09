"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
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
  const isHomePage = pathname === "/";

  if (isAdminPage) return null;

  return (
    <>
      {/* Footer visible uniquement sur la page d'accueil en mobile, visible partout sur desktop */}
      <div className={isHomePage ? "" : "hidden lg:block"}>
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
