"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Enregistrer le Service Worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);

          // Vérifier les mises à jour toutes les heures
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });

      // Écouter les messages du Service Worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "NOTIFICATION_CLICKED") {
          // Gérer le clic sur notification
          console.log("Notification clicked:", event.data);
        }
      });
    }
  }, []);

  return null;
}
