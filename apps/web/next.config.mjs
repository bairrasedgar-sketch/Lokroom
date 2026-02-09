/** @type {import('next').NextConfig} */
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Construis la liste des domaines autorisés dynamiquement
const remotePatterns = [
  // Cloudflare R2 (domaines publics habituels)
  { protocol: "https", hostname: "**.r2.dev" },
  { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },

  // Amazon S3 et compatibles
  { protocol: "https", hostname: "**.amazonaws.com" },

  // Divers hébergeurs d'images courants (si jamais tu en utilises)
  { protocol: "https", hostname: "**.googleusercontent.com" },
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "images.pexels.com" },

  // En dev, si tu sers des images depuis un serveur local
  { protocol: "http", hostname: "localhost" },
];

// Si tu as un domaine public dédié dans l'ENV, on l'ajoute proprement
// Exemple: NEXT_PUBLIC_ASSET_HOST=cdn.mondomaine.com
if (process.env.NEXT_PUBLIC_ASSET_HOST) {
  remotePatterns.push({
    protocol: "https",
    hostname: process.env.NEXT_PUBLIC_ASSET_HOST,
  });
}

const nextConfig = {
  reactStrictMode: true,
  // Configuration pour Capacitor - PAS de mode export static
  // L'app mobile appelle directement le backend Vercel
  experimental: {
    instrumentationHook: true,
  },
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
};

export default withBundleAnalyzer(nextConfig);
