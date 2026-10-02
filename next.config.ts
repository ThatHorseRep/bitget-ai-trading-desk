import type { NextConfig } from "next";

// Security headers applied to every response (pages, API routes, static assets).
// Baseline hardening from the 2026-10-01 submission audit: responses previously
// carried only the default X-Powered-By leak.
//
// CSP note (honest scope): script-src keeps 'unsafe-inline' because the App
// Router embeds inline hydration scripts and layout.tsx ships an inline theme
// bootstrap; a nonce-based policy would require middleware and is deferred
// post-submission. The policy still blocks all remote script/style/font
// sources, so external-host injection is refused; the app itself is fully
// same-origin (relative /api/* fetches, local fonts, local media).
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Applied to this host only (no includeSubDomains) so other name.ng
  // subdomains outside this project are unaffected.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

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
  // Stop leaking framework fingerprint on every response.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
