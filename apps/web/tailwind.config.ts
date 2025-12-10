import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}", "./src/app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      screens: {
        // Breakpoint pour très petits écrans (petits mobiles)
        'xs': '480px',
        // Breakpoints par défaut de Tailwind
        // sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
        // Ajout de breakpoints pour très grands écrans
        '3xl': '1920px',  // Full HD
        '4xl': '2560px',  // QHD / 2K
        '5xl': '3840px',  // 4K
      },
      maxWidth: {
        '8xl': '88rem',   // 1408px
        '9xl': '96rem',   // 1536px
        '10xl': '120rem', // 1920px
      },
    },
  },
  plugins: [],
} satisfies Config;
