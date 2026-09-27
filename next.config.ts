import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false, // Disables development overlay badges
  images: {
    unoptimized: true, // 🚀 CRUCIAL: Globally disables Next.js image optimization processing, which is unsupported on Hostinger shared servers
  },
};

export default nextConfig;
