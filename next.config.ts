import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly set Turbopack workspace root to avoid inference errors
  turbopack: {
    root: __dirname,
  },
  reactStrictMode: true,
};

export default nextConfig;


