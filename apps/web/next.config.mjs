/** @type {import('next').NextConfig} */

// Construis la liste des domaines autorisés dynamiquement
const remotePatterns = [
  // Cloudflare R2 (domaines publics habituels)
  { protocol: "https", hostname: "**.r2.dev" },
  { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },

  // Amazon S3 et compatibles
  { protocol: "https", hostname: "**.amazonaws.com" },

  // Divers hébergeurs d’images courants (si jamais tu en utilises)
  { protocol: "https", hostname: "**.googleusercontent.com" },
  { protocol: "https", hostname: "images.unsplash.com" },

  // En dev, si tu sers des images depuis un serveur local
  { protocol: "http", hostname: "localhost" },
];

// Si tu as un domaine public dédié dans l’ENV, on l’ajoute proprement
// Exemple: NEXT_PUBLIC_ASSET_HOST=cdn.mondomaine.com
if (process.env.NEXT_PUBLIC_ASSET_HOST) {
  remotePatterns.push({
    protocol: "https",
    hostname: process.env.NEXT_PUBLIC_ASSET_HOST,
  });
}

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true,
  },
  images: {
    remotePatterns,
    // Si tu veux forcer la taille minimale des formats, tu peux ajouter formats: ['image/avif','image/webp']
  },
};

export default nextConfig;
