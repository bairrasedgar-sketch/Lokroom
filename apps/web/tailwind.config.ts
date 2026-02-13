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
        // Category icon animations
        'grid-tl': 'gridTL 0.6s ease-out',
        'grid-tr': 'gridTR 0.6s ease-out 0.1s',
        'grid-bl': 'gridBL 0.6s ease-out 0.2s',
        'grid-br': 'gridBR 0.6s ease-out 0.3s',
        'building-rise': 'buildingRise 0.5s ease-out',
        'building-rise-delay': 'buildingRise 0.5s ease-out 0.2s',
        'window-1': 'windowLight 0.3s ease-out 0.2s',
        'window-2': 'windowLight 0.3s ease-out 0.3s',
        'window-3': 'windowLight 0.3s ease-out 0.4s',
        'window-4': 'windowLight 0.3s ease-out 0.5s',
        'window-5': 'windowLight 0.3s ease-out 0.6s',
        'window-6': 'windowLight 0.3s ease-out 0.7s',
        'roof-drop': 'roofDrop 0.5s ease-out',
        'house-body': 'houseBody 0.5s ease-out 0.2s',
        'door-open': 'doorOpen 0.4s ease-out 0.4s',
        'chimney': 'chimney 0.3s ease-out',
        'smoke-1': 'smoke 1s ease-out infinite',
        'smoke-2': 'smoke 1s ease-out 0.3s infinite',
        'smoke-3': 'smoke 1s ease-out 0.6s infinite',
        'canvas-appear': 'canvasAppear 0.5s ease-out',
        'paint-line': 'paintLine 1s ease-out',
        'brush-draw': 'brushDraw 1s ease-out',
        'drop-1': 'drop 0.5s ease-out 0.8s',
        'drop-2': 'drop 0.5s ease-out 1s',
        'briefcase': 'briefcase 0.5s ease-out',
        'handle': 'handle 0.3s ease-out',
        'briefcase-open': 'briefcaseOpen 0.4s ease-out 0.3s',
        'doc-1': 'docFly 0.6s ease-out 0.5s',
        'doc-2': 'docFly 0.6s ease-out 0.6s',
        'person-center': 'personAppear 0.4s ease-out',
        'person-left': 'personAppear 0.4s ease-out 0.1s',
        'person-right': 'personAppear 0.4s ease-out 0.2s',
        'connect-left': 'connectLine 0.3s ease-out 0.5s',
        'connect-right': 'connectLine 0.3s ease-out 0.5s',
        'car-arrive': 'carArrive 0.8s ease-out',
        'headlight-blink': 'headlightBlink 0.5s ease-out 0.3s 2',
        'motion-line-1': 'motionLine 0.4s ease-out',
        'motion-line-2': 'motionLine 0.4s ease-out 0.1s',
        'rocket-launch': 'rocketLaunch 0.6s ease-out',
        'explosion-center': 'explosionCenter 0.5s ease-out 0.3s',
        'firework-rays': 'fireworkRays 0.6s ease-out 0.4s',
        'sparkle-1': 'sparkle 0.8s ease-out 0.5s',
        'sparkle-2': 'sparkle 0.8s ease-out 0.6s',
        'sparkle-3': 'sparkle 0.8s ease-out 0.7s',
        'sparkle-4': 'sparkle 0.8s ease-out 0.8s',
        'sparkle-5': 'sparkle 0.8s ease-out 0.9s',
        'sparkle-6': 'sparkle 0.8s ease-out 1s',
        'mic-pulse': 'micPulse 0.5s ease-out',
        'mic-stand': 'micStand 0.4s ease-out 0.2s',
        'wave-1': 'wave 0.6s ease-out 0.3s',
        'wave-2': 'wave 0.6s ease-out 0.4s',
        'wave-3': 'wave 0.6s ease-out 0.5s',
        'wave-4': 'wave 0.6s ease-out 0.6s',
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
        // Category animations
        gridTL: {
          '0%': { transform: 'translate(-10px, -10px)', opacity: '0' },
          '100%': { transform: 'translate(0, 0)', opacity: '1' },
        },
        gridTR: {
          '0%': { transform: 'translate(10px, -10px)', opacity: '0' },
          '100%': { transform: 'translate(0, 0)', opacity: '1' },
        },
        gridBL: {
          '0%': { transform: 'translate(-10px, 10px)', opacity: '0' },
          '100%': { transform: 'translate(0, 0)', opacity: '1' },
        },
        gridBR: {
          '0%': { transform: 'translate(10px, 10px)', opacity: '0' },
          '100%': { transform: 'translate(0, 0)', opacity: '1' },
        },
        buildingRise: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        windowLight: {
          '0%': { opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.7' },
        },
        roofDrop: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        houseBody: {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
        },
        doorOpen: {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
        chimney: {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
        },
        smoke: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-20px) scale(1.5)', opacity: '0' },
        },
        canvasAppear: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        paintLine: {
          '0%': { strokeDashoffset: '20' },
          '100%': { strokeDashoffset: '0' },
        },
        brushDraw: {
          '0%': { transform: 'translate(-10px, -10px)' },
          '50%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(-10px, -10px)' },
        },
        drop: {
          '0%': { transform: 'translateY(-5px)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(5px)', opacity: '0' },
        },
        briefcase: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        handle: {
          '0%': { transform: 'translateY(-5px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        briefcaseOpen: {
          '0%': { transform: 'scaleX(1)' },
          '50%': { transform: 'scaleX(1.1)' },
          '100%': { transform: 'scaleX(1)' },
        },
        docFly: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translate(0, -10px) rotate(10deg)', opacity: '0' },
        },
        personAppear: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        connectLine: {
          '0%': { strokeDasharray: '0 100' },
          '100%': { strokeDasharray: '100 0' },
        },
        carArrive: {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        headlightBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        motionLine: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-10px)', opacity: '0' },
        },
        rocketLaunch: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        explosionCenter: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fireworkRays: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        sparkle: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        micPulse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        micStand: {
          '0%': { strokeDasharray: '0 100' },
          '100%': { strokeDasharray: '100 0' },
        },
        wave: {
          '0%': { transform: 'scaleY(0)', opacity: '0' },
          '50%': { transform: 'scaleY(1)', opacity: '1' },
          '100%': { transform: 'scaleY(0.5)', opacity: '0.5' },
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

