import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bitget AI Trading Desk",
  description: "Development shell for the decision-stress-testing vertical slice."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
