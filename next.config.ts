import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds even when ESLint reports warnings/errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
