"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type CookieConsent = {
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
};

const COOKIE_CONSENT_KEY = "lokroom_cookie_consent";
const COOKIE_CONSENT_VERSION = "1.0";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    functional: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if consent was already given
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        if (parsed.version === COOKIE_CONSENT_VERSION) {
          setConsent(parsed.consent);
          return;
        }
      } catch {
        // Invalid stored consent, show banner
      }
    }
    // Show banner after a short delay for better UX
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Listen for settings open event (from cookies page)
  useEffect(() => {
    const handleOpenSettings = () => {
      setIsVisible(true);
      setShowSettings(true);
    };
    window.addEventListener("openCookieSettings", handleOpenSettings);
    return () => window.removeEventListener("openCookieSettings", handleOpenSettings);
  }, []);

  const saveConsent = useCallback((newConsent: CookieConsent) => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        version: COOKIE_CONSENT_VERSION,
        consent: newConsent,
        timestamp: new Date().toISOString(),
      })
    );
    setConsent(newConsent);
    setIsVisible(false);
    setShowSettings(false);

    // Apply consent (disable/enable tracking)
    if (typeof window !== "undefined") {
      // Google Analytics
      if (newConsent.analytics) {
        // Enable GA
        (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.("consent", "update", {
          analytics_storage: "granted",
        });
      } else {
        // Disable GA
        (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.("consent", "update", {
          analytics_storage: "denied",
        });
      }

      // Marketing
      if (newConsent.marketing) {
        (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.("consent", "update", {
          ad_storage: "granted",
        });
      } else {
        (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.("consent", "update", {
          ad_storage: "denied",
        });
      }
    }
  }, []);

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true,
    });
  };

  const refuseAll = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false,
    });
  };

  const saveCustom = () => {
    saveConsent(consent);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/30" onClick={() => !showSettings && setIsVisible(false)} />

      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white shadow-2xl border-t border-gray-200">
        {!showSettings ? (
          // Simple banner
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Nous utilisons des cookies pour améliorer votre expérience sur Lok&apos;Room.
                  En continuant, vous acceptez notre{" "}
                  <Link href="/legal/cookies" className="font-medium text-gray-900 underline hover:no-underline">
                    politique de cookies
                  </Link>
                  .
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                <button
                  onClick={() => setShowSettings(true)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Personnaliser
                </button>
                <button
                  onClick={refuseAll}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Refuser tout
                </button>
                <button
                  onClick={acceptAll}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Accepter tout
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Detailed settings
          <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Paramètres de cookies</h2>
              <button
                onClick={() => setShowSettings(false)}
                aria-label="Fermer les parametres de cookies"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Necessary */}
              <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">Cookies nécessaires</h3>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">Obligatoire</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Ces cookies sont essentiels au fonctionnement du site (authentification, sécurité).
                  </p>
                </div>
                <div className="mt-1">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="h-5 w-5 rounded border-gray-300 text-gray-900"
                  />
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Cookies analytiques</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Nous aident à comprendre comment vous utilisez le site pour l&apos;améliorer (Google Analytics).
                  </p>
                </div>
                <div className="mt-1">
                  <input
                    type="checkbox"
                    checked={consent.analytics}
                    onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                    className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Functional */}
              <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Cookies de fonctionnalité</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Permettent de mémoriser vos préférences (langue, devise, recherches récentes).
                  </p>
                </div>
                <div className="mt-1">
                  <input
                    type="checkbox"
                    checked={consent.functional}
                    onChange={(e) => setConsent({ ...consent, functional: e.target.checked })}
                    className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Cookies marketing</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Utilisés pour afficher des publicités personnalisées (Facebook Pixel).
                  </p>
                </div>
                <div className="mt-1">
                  <input
                    type="checkbox"
                    checked={consent.marketing}
                    onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                    className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={refuseAll}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Refuser tout
              </button>
              <button
                onClick={acceptAll}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Accepter tout
              </button>
              <button
                onClick={saveCustom}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Enregistrer mes préférences
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-gray-500">
              En savoir plus dans notre{" "}
              <Link href="/legal/cookies" className="underline hover:no-underline">
                Politique de cookies
              </Link>
            </p>
          </div>
        )}
      </div>
    </>
  );
}
