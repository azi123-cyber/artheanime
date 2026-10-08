import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@consumet/extensions", "got-scraping"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },
};

export default nextConfig;
