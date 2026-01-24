"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import MobileNavBar from "@/components/MobileNavBar";
import AppBanner from "@/components/AppBanner";

export function ConditionalNavbar() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  if (isAdminPage) return null;
  return (
    <>
      <AppBanner />
      <Navbar />
    </>
  );
}

export function ConditionalFooter() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  if (isAdminPage) return null;
  return (
    <>
      <Footer />
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
