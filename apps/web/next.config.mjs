/** @type {import('next').NextConfig} */
import bundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';

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

// Configuration pour Capacitor mobile build
const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

const nextConfig = {
  reactStrictMode: true,

  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configuration pour Capacitor - Export statique si CAPACITOR_BUILD=true
  ...(isCapacitorBuild && {
    output: 'export',
    images: {
      unoptimized: true,
    },
    trailingSlash: true,
  }),

  // Configuration normale pour le web
  ...(!isCapacitorBuild && {
    experimental: {
      instrumentationHook: true,
    },
    compress: true,
    generateBuildId: async () => {
      return `build-${Date.now()}`;
    },
    compiler: {
      // Supprimer console.log en production
      removeConsole: process.env.NODE_ENV === 'production' ? {
        exclude: ['error', 'warn'],
      } : false,
    },
  }),

  images: {
    ...(isCapacitorBuild ? { unoptimized: true } : {
      remotePatterns,
      formats: ['image/avif', 'image/webp'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      minimumCacheTTL: 60,
    }),
  },

  // Redirects for 404 pages
  async redirects() {
    if (isCapacitorBuild) return [];

    return [
      {
        source: '/lokcover',
        destination: '/insurance',
        permanent: true,
      },
      {
        source: '/accessibility',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/press',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/investors',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/gift-cards',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Security Headers (complément au middleware)
  async headers() {
    if (isCapacitorBuild) return [];

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

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Supprime les logs Sentry pendant le build
  silent: true,

  // Organisation et projet Sentry
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token pour upload des source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload des source maps uniquement en production
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
};

// Export avec Sentry wrapper
export default withSentryConfig(
  withBundleAnalyzer(nextConfig),
  sentryWebpackPluginOptions
);
