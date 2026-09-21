import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

import { BRANDING } from "@/config/branding";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#E7E9E6",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://ais-pre-76vg2p4vjuywawauv5ec3l-725903868758.europe-west2.run.app"),
  title: `${BRANDING.PRODUCT_NAME} | ${BRANDING.TAGLINE}`,
  description: "Adversarial pre-trade risk workbench for tokenized equities. Deterministic stress testing, off-hours basis decoupling analysis, and thesis vs. position deconstruction.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: `${BRANDING.PRODUCT_NAME} | ${BRANDING.TAGLINE}`,
    description: "Adversarial pre-trade risk workbench for tokenized equities. Deterministic verdict bands computed, not generated.",
    images: [
      {
        url: BRANDING.LOGOS.OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${BRANDING.PRODUCT_NAME} — ${BRANDING.TAGLINE}`,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRANDING.PRODUCT_NAME} | ${BRANDING.TAGLINE}`,
    description: "Adversarial pre-trade risk workbench for tokenized equities. Deterministic verdict bands computed, not generated.",
    images: [BRANDING.LOGOS.OG_IMAGE],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

import { PwaProvider } from "@/components/pwa/PwaManager";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased font-sans bg-[var(--rt-surface-base)] text-[var(--rt-text-primary)]">
        <PwaProvider>
          {children}
        </PwaProvider>
      </body>
    </html>
  );
}


