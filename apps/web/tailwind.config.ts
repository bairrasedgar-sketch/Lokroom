import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "./src/app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      screens: {
        // Breakpoints optimisés pour tous les téléphones
        'xs': '375px',      // iPhone SE, petits téléphones
        'sm': '640px',      // Téléphones standards
        'md': '768px',      // Tablettes portrait
        'lg': '1024px',     // Tablettes paysage / petits laptops
        'xl': '1280px',     // Laptops
        '2xl': '1536px',    // Grands écrans
        '3xl': '1920px',    // Full HD
        '4xl': '2560px',    // QHD / 2K
        '5xl': '3840px',    // 4K

        // Breakpoints spécifiques pour téléphones
        'iphone-se': '375px',        // iPhone SE (4.7")
        'iphone': '390px',           // iPhone 14/15 (6.1")
        'iphone-pro': '393px',       // iPhone 14 Pro (6.1")
        'iphone-max': '430px',       // iPhone 14 Pro Max (6.7")
        'android-small': '360px',    // Petits Android
        'android': '412px',          // Android standards (Pixel, Galaxy)
        'android-large': '428px',    // Grands Android
      },
      maxWidth: {
        '8xl': '88rem',   // 1408px
        '9xl': '96rem',   // 1536px
        '10xl': '120rem', // 1920px
      },
      // Espacements optimisés pour mobile (safe areas)
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // Hauteurs optimisées pour mobile
      height: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'screen-ios': 'calc(100vh - 88px)', // Hauteur avec notch iOS
      },
      // Tailles de police responsive
      fontSize: {
        'xs-mobile': ['0.625rem', { lineHeight: '0.875rem' }],  // 10px
        'sm-mobile': ['0.75rem', { lineHeight: '1rem' }],       // 12px
        'base-mobile': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'lg-mobile': ['1rem', { lineHeight: '1.5rem' }],        // 16px
        'xl-mobile': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
      },
      // Animations optimisées pour mobile
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      // Zones tactiles optimisées (minimum 44x44px pour iOS)
      minHeight: {
        'touch': '44px',
        'touch-android': '48px',
      },
      minWidth: {
        'touch': '44px',
        'touch-android': '48px',
      },
    },
  },
  plugins: [],
} satisfies Config;

