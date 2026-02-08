import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lokroom.app',
  appName: 'Lokroom',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // L'app mobile appelle le backend Vercel pour les APIs
    url: 'https://www.lokroom.com',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false
    }
  }
};

export default config;
