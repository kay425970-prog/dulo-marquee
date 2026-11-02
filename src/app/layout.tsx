import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { MarqueeProvider } from "@/components/MarqueeProvider";
import { Navbar, Footer } from "@/components/Navbar";
import PlatformSupport from "@/components/PlatformSupport";

export const metadata: Metadata = {
  metadataBase: new URL("https://arkaflix.vercel.app"),
  title: {
    default: "Arkaflix — Watch Free Movies & TV Shows Online",
    template: "%s · Arkaflix",
  },
  description:
    "Stream movies, TV shows, anime and live TV in HD & 4K on Arkaflix — Cobalt-first playback with TMDB catalog aggregation.",
  applicationName: "Arkaflix",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/icon.svg", color: "#e02020" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Arkaflix",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "Arkaflix",
    title: "Arkaflix — Watch Free Movies & TV Shows Online",
    description:
      "Movies, shows, anime and live TV in one place. Cobalt-first streaming, no signup needed to browse.",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Arkaflix" }],
  },
  twitter: {
    card: "summary",
    title: "Arkaflix — Watch Free Movies & TV Shows Online",
    description:
      "Movies, shows, anime and live TV in one place. Cobalt-first streaming.",
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="beta-ui min-h-screen bg-[#0a0a0a] text-[#fafafa] antialiased selection:bg-[#e02020]/40 selection:text-white">
        <PlatformSupport />
        <MarqueeProvider>
          <div className="relative flex min-h-screen w-full flex-col overflow-x-clip bg-[#0a0a0a]">
            <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,#070606,#0b0b0c_42%,#060607)]" />
            <Navbar />
            <div className="relative z-10 flex-1">{children}</div>
            <Footer />
          </div>
        </MarqueeProvider>
      </body>
    </html>
  );
}
