"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function MaintenanceRedirect({ isMaintenanceMode }: { isMaintenanceMode: boolean }) {
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Si on est sur la page maintenance, ne rien faire (l'utilisateur utilise le bouton Réessayer)
    if (pathname === "/maintenance") {
      return;
    }

    // Si maintenance active et pas sur une page exclue, rediriger vers maintenance
    if (isMaintenanceMode && !hasRedirected.current) {
      const isExcluded =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/login");

      if (!isExcluded) {
        hasRedirected.current = true;
        window.location.href = "/maintenance";
      }
    }
  }, [isMaintenanceMode, pathname]);

  return null;
}
