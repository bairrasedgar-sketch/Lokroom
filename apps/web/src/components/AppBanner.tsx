"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

// Détecte si l'utilisateur est sur iOS ou Android
function getDeviceType(): "ios" | "android" | "other" {
  if (typeof window === "undefined") return "other";

  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }
  if (/android/.test(userAgent)) {
    return "android";
  }
  return "other";
}

// URLs des stores (à remplacer par les vraies URLs quand l'app sera publiée)
const APP_STORE_URL = "https://apps.apple.com/app/lokroom/id123456789"; // TODO: Remplacer par la vraie URL
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.lokroom.app"; // TODO: Remplacer par la vraie URL

export default function AppBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [deviceType, setDeviceType] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fermé la bannière
    const dismissed = localStorage.getItem("appBannerDismissed");
    if (dismissed) {
      setIsVisible(false);
    }

    // Détecter le type d'appareil
    setDeviceType(getDeviceType());
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("appBannerDismissed", "true");
  };

  const handleOpenApp = () => {
    if (deviceType === "ios") {
      window.location.href = APP_STORE_URL;
    } else if (deviceType === "android") {
      window.location.href = PLAY_STORE_URL;
    } else {
      // Pour desktop, on peut rediriger vers une page avec les deux liens
      window.location.href = APP_STORE_URL;
    }
  };

  // Ne pas afficher sur desktop ou si fermé
  if (!isVisible) return null;

  return (
    <div className="md:hidden sticky top-0 z-[60] bg-white border-b border-gray-200 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        {/* Partie gauche : X + Logo + Texte */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Bouton fermer */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 -ml-1 text-gray-400 hover:text-gray-600"
            aria-label="Fermer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Logo Lok'Room */}
          <div className="flex-shrink-0">
            <Image
              src="/logo.svg"
              alt="Lok'Room"
              width={80}
              height={24}
              className="h-6 w-auto"
              unoptimized
            />
          </div>

          {/* Texte */}
          <p className="text-xs text-gray-600 truncate">
            Téléchargez l'appli
          </p>
        </div>

        {/* Bouton Utiliser l'appli */}
        <button
          onClick={handleOpenApp}
          className="flex-shrink-0 bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
        >
          Utiliser l'appli
        </button>
      </div>
    </div>
  );
}
