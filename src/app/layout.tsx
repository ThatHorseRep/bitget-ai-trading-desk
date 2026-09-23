import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { BRANDING, COLOR } from "@/config/branding";
import { PwaProvider } from "@/components/pwa/PwaManager";

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

export const metadata: Metadata = {
  metadataBase: new URL(BRANDING.URL),
  title: {
    default: BRANDING.PRODUCT_NAME,
    template: `%s — ${BRANDING.SHORT_NAME}`,
  },
  description: BRANDING.DESCRIPTION,
  applicationName: BRANDING.SHORT_NAME,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: BRANDING.PRODUCT_NAME,
    title: BRANDING.PRODUCT_NAME,
    description: BRANDING.DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${BRANDING.PRODUCT_NAME} — ${BRANDING.TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BRANDING.PRODUCT_NAME,
    description: BRANDING.DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: COLOR.ink,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased font-sans">
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  );
}
