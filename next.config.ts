import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly set Turbopack workspace root to avoid inference errors
  turbopack: {
    root: __dirname,
  },
  // Tailwind v4's PostCSS plugin (@tailwindcss/postcss) loads platform-native
  // bindings via require with fallback paths (e.g. @tailwindcss/oxide-win32-x64-msvc
  // on Windows). Turbopack cannot statically resolve those fallbacks when it
  // bundles the plugin, which breaks production builds on Windows dev machines.
  // Keeping it external loads it from node_modules at runtime instead.
  serverExternalPackages: ["@tailwindcss/postcss"],
  reactStrictMode: true,
  output: "standalone",
};

export default nextConfig;


