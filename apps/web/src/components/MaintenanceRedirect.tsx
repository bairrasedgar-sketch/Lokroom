"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function MaintenanceRedirect({ isMaintenanceMode }: { isMaintenanceMode: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Si on est sur la page maintenance, vérifier périodiquement si la maintenance est terminée
    if (pathname === "/maintenance") {
      const checkMaintenance = async () => {
        try {
          const res = await fetch("/api/maintenance/check");
          const data = await res.json();

          if (!data.maintenanceMode) {
            // Maintenance terminée, rediriger vers l'accueil
            router.replace("/");
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
    if (isMaintenanceMode) {
      const isExcluded =
        pathname === "/maintenance" ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/login");

      if (!isExcluded) {
        router.replace("/maintenance");
      }
    }
  }, [isMaintenanceMode, pathname, router]);

  return null;
}
