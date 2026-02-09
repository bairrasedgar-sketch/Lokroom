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
  // Compression activée (Next.js génère automatiquement les fichiers compressés)
  compress: true,
  // Build ID unique pour cache busting
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Security Headers (complément au middleware)
  async headers() {
    return [
      {
        // Applique les headers à toutes les routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=(self), usb=(), bluetooth=(), magnetometer=(), accelerometer=(), gyroscope=(), ambient-light-sensor=()'
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding'
          },
        ],
      },
      {
        // Headers spécifiques pour les assets statiques
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding'
          },
        ],
      },
      {
        // Headers pour le Service Worker (push notifications)
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
