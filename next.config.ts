import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Optimize images
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },

  async rewrites() {
    return [
      // Route legacy admin auth endpoints to the new admin session APIs.
      // (We keep the old endpoints for backward compatibility.)
      {
        source: "/api/auth/:path*",
        destination: "/api/admin/session/:path*",
      },
    ];
  },

  async redirects() {
    return [
      // Legacy links from the admin login UI.
      {
        source: "/login",
        destination: "/admin/forgot-password",
        permanent: false,
      },
      {
        source: "/register",
        destination: "/admin/register",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
