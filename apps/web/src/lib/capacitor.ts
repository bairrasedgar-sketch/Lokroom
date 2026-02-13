// apps/web/src/lib/capacitor.ts
import { Capacitor } from '@capacitor/core';
import { logger } from "@/lib/logger";


/**
 * Détecte si l'app tourne dans Capacitor (app native iOS/Android)
 */
export function isCapacitor(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Alias pour isCapacitor (compatibilité)
 */
export function isNativeMobile(): boolean {
  return isCapacitor();
}

/**
 * Détecte la plateforme native (ios, android, ou web)
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

/**
 * Détecte si on est sur mobile web (pas l'app native)
 */
export function isMobileWeb(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && !isCapacitor();
}

/**
 * Initialise Capacitor (appelé au démarrage de l'app)
 */
export function initializeCapacitor(): void {
  // Capacitor s'initialise automatiquement
  // Cette fonction existe pour la compatibilité
  if (isCapacitor()) {
    logger.debug('[Capacitor] App native détectée', { platform: getPlatform() });
  }
}
