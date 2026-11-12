import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    deviceSizes: [640, 828, 1080, 1280, 1672, 1920, 2560],
  },
  experimental: {
    // Tree-shake icon + animation barrels so only used exports ship.
    optimizePackageImports: ["@phosphor-icons/react", "motion"],
  },
  async headers() {
    return [
      {
        // Long-lived cache for heavy media; rename the file to bust the cache.
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
