import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Better compatibility for older browsers
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
    // Skip waiting to ensure updates are applied
    skipWaiting: true,
    clientsClaim: true,
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Ensure proper transpilation for older browsers
  transpilePackages: [],
  // Add headers for better compatibility
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
