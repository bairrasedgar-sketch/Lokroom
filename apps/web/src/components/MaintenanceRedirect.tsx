"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function MaintenanceRedirect({ isMaintenanceMode }: { isMaintenanceMode: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isMaintenanceMode) return;

    // Ne pas rediriger si on est sur une page exclue
    const isExcluded =
      pathname === "/maintenance" ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/login");

    if (!isExcluded) {
      router.replace("/maintenance");
    }
  }, [isMaintenanceMode, pathname, router]);

  return null;
}
