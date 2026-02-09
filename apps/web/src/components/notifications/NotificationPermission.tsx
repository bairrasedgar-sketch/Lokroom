"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Check, X } from "lucide-react";

interface NotificationPermissionProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export default function NotificationPermission({
  onPermissionGranted,
  onPermissionDenied,
}: NotificationPermissionProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Vérifier si les notifications sont supportées
    if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Afficher le banner si la permission n'a pas été demandée
      if (Notification.permission === "default") {
        // Attendre 3 secondes avant d'afficher le banner
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      alert("Les notifications ne sont pas supportées par votre navigateur");
      return;
    }

    setIsLoading(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        // Enregistrer le Service Worker et créer l'abonnement
        await registerServiceWorkerAndSubscribe();
        setShowBanner(false);
        onPermissionGranted?.();
      } else {
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const registerServiceWorkerAndSubscribe = async () => {
    try {
      // Enregistrer le Service Worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Obtenir la clé publique VAPID
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("VAPID public key not configured");
        return;
      }

      // Créer l'abonnement push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Envoyer l'abonnement au serveur
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
            auth: arrayBufferToBase64(subscription.getKey("auth")!),
          },
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to subscribe to push notifications");
      }

      console.log("Successfully subscribed to push notifications");
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    // Ne plus afficher pendant cette session
    sessionStorage.setItem("notification-banner-dismissed", "true");
  };

  // Ne rien afficher si les notifications ne sont pas supportées
  if (!isSupported) {
    return null;
  }

  // Ne rien afficher si la permission a déjà été accordée ou refusée
  if (permission !== "default" || !showBanner) {
    return null;
  }

  // Vérifier si le banner a été fermé pendant cette session
  if (typeof window !== "undefined" && sessionStorage.getItem("notification-banner-dismissed")) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Activer les notifications
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Recevez des alertes pour vos réservations, messages et mises à jour importantes.
            </p>

            <div className="flex gap-2">
              <button
                onClick={requestPermission}
                disabled={isLoading}
                className="flex-1 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Activation...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Activer
                  </>
                )}
              </button>

              <button
                onClick={dismissBanner}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Plus tard
              </button>
            </div>
          </div>

          <button
            onClick={dismissBanner}
            disabled={isLoading}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Utilitaires pour convertir les clés VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
