import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/styles/globals.css";

export const metadata: Metadata = {
  // Change to your public URL when you deploy (used for social preview images).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Bogotá | Our ideal smart city",
  description: "Fly through our ideal Bogotá, a city where technology, mobility and nature coexist. English B1 project.",
  openGraph: { images: ["/media/og.webp"] },
};

export const viewport: Viewport = {
  themeColor: "#0b0f14",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} data-locked="true">
      <head>
        {/* the intro film is the first thing that plays: start fetching it immediately */}
        <link rel="preload" as="video" href="/media/bogota-0-intro.mp4" type="video/mp4" />
      </head>
      <body>{children}</body>
    </html>
  );
}
