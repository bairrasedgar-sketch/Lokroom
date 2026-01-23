"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export function MaintenanceRedirect({ isMaintenanceMode }: { isMaintenanceMode: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Si on est sur la page maintenance, vérifier périodiquement si la maintenance est terminée
    if (pathname === "/maintenance") {
      hasRedirected.current = false; // Reset pour permettre la redirection vers l'accueil

      const checkMaintenance = async () => {
        try {
          const res = await fetch("/api/maintenance/check");
          const data = await res.json();

          if (!data.maintenanceMode) {
            // Maintenance terminée, rediriger vers l'accueil
            window.location.href = "/";
          }
        } catch {
          // En cas d'erreur, on ne fait rien
        }
      };

      // Vérifier toutes les 5 secondes
      const interval = setInterval(checkMaintenance, 5000);

      // Vérifier immédiatement aussi
      checkMaintenance();

      return () => clearInterval(interval);
    }

    // Si maintenance active et pas sur une page exclue, rediriger vers maintenance
    if (isMaintenanceMode && !hasRedirected.current) {
      const isExcluded =
        pathname === "/maintenance" ||
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
