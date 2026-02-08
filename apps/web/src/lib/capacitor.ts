import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

/**
 * Détecte si l'app tourne dans un environnement mobile natif (iOS/Android)
 */
export const isNativeMobile = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Détecte la plateforme (web, ios, android)
 */
export const getPlatform = () => {
  return Capacitor.getPlatform();
};

/**
 * Initialise les plugins Capacitor pour mobile
 */
export const initializeCapacitor = async () => {
  if (!isNativeMobile()) return;

  try {
    // Configuration de la barre de statut
    if (Capacitor.isPluginAvailable('StatusBar')) {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
    }

    // Masquer le splash screen après le chargement
    if (Capacitor.isPluginAvailable('SplashScreen')) {
      await SplashScreen.hide();
    }

    // Configuration du clavier
    if (Capacitor.isPluginAvailable('Keyboard')) {
      await Keyboard.setAccessoryBarVisible({ isVisible: true });
    }

    console.log('✅ Capacitor initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Capacitor:', error);
  }
};

/**
 * Hook pour détecter si on est sur mobile
 */
export const useIsMobile = () => {
  return isNativeMobile();
};
