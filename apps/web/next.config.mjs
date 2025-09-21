/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // You already had this: keep it
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },

  // Security headers (baseline). Adjust later if you add external CDNs, analytics, etc.
  async headers() {
    const csp = [
      "default-src 'self'",
      // If you add 3rd-party scripts (analytics, maps), you must list them here.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;

