'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

/**
 * Hook pour gérer le Service Worker et le mode offline
 * Architecture professionnelle avec gestion complète PWA
 */
export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(true);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Vérifier si on est dans un navigateur
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Enregistrer le Service Worker
    registerServiceWorker();

    // Écouter les changements de connexion
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('Connection lost - offline mode');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // État initial
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      setRegistration(reg);
      logger.info('Service Worker registered', { scope: reg.scope });

      // Vérifier les mises à jour
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setIsUpdateAvailable(true);
              logger.info('New version available');
            }
          });
        }
      });

      // Vérifier les mises à jour toutes les heures
      setInterval(() => {
        reg.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      logger.error('Service Worker registration failed', error);
    }
  };

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const clearCache = async () => {
    if (registration) {
      registration.active?.postMessage({ type: 'CLEAR_CACHE' });
      logger.info('Cache cleared');
    }
  };

  return {
    isOnline,
    isUpdateAvailable,
    updateServiceWorker,
    clearCache,
    registration,
  };
}

/**
 * Composant pour afficher le statut offline
 */
export function OfflineBanner() {
  const { isOnline } = useServiceWorker();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium z-50">
      <div className="flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        <span>Mode hors ligne - Certaines fonctionnalités sont limitées</span>
      </div>
    </div>
  );
}

/**
 * Composant pour afficher la notification de mise à jour
 */
export function UpdateNotification() {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();

  if (!isUpdateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Mise à jour disponible</h3>
          <p className="text-sm text-gray-300 mb-3">
            Une nouvelle version de l'application est disponible.
          </p>
          <button
            onClick={updateServiceWorker}
            className="w-full bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Mettre à jour maintenant
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook pour détecter la qualité de connexion
 */
export function useConnectionQuality() {
  const [quality, setQuality] = useState<'fast' | 'slow' | 'offline'>('fast');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateQuality = () => {
      if (!navigator.onLine) {
        setQuality('offline');
        return;
      }

      // @ts-ignore - API expérimentale
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

      if (connection) {
        const effectiveType = connection.effectiveType;

        if (effectiveType === '4g') {
          setQuality('fast');
        } else if (effectiveType === '3g' || effectiveType === '2g') {
          setQuality('slow');
        } else {
          setQuality('fast');
        }
      }
    };

    updateQuality();

    window.addEventListener('online', updateQuality);
    window.addEventListener('offline', updateQuality);

    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateQuality);
    }

    return () => {
      window.removeEventListener('online', updateQuality);
      window.removeEventListener('offline', updateQuality);
      if (connection) {
        connection.removeEventListener('change', updateQuality);
      }
    };
  }, []);

  return quality;
}

/**
 * Hook pour précharger les données critiques
 */
export function usePrefetch() {
  const prefetch = (url: string) => {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);

    logger.debug('Prefetching', { url });
  };

  const preload = (url: string, as: 'script' | 'style' | 'image' | 'font') => {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = as;
    document.head.appendChild(link);

    logger.debug('Preloading', { url, as });
  };

  return { prefetch, preload };
}
