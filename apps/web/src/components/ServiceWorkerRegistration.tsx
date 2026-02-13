"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";


export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Enregistrer le Service Worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          logger.debug("Service Worker registered", { scope: registration.scope });

          // Vérifier les mises à jour toutes les heures
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          logger.error("Service Worker registration failed", { error: error instanceof Error ? error.message : String(error) });
        });

      // Écouter les messages du Service Worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "NOTIFICATION_CLICKED") {
          // Gérer le clic sur notification
          logger.debug("Notification clicked", { type: event.data.type, data: event.data });
        }
      });
    }
  }, []);

  return null;
}
