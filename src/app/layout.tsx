import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { MarqueeProvider } from "@/components/MarqueeProvider";
import { Navbar, Footer } from "@/components/Navbar";
import PlatformSupport from "@/components/PlatformSupport";

export const metadata: Metadata = {
  title: "dulo — Watch Free Movies & TV Shows Online",
  description:
    "Stream movies, TV shows, anime and live TV free in HD & 4K with prioritized VidCore playback and TMDB catalog aggregation.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="beta-ui min-h-screen bg-[#0a0a0a] text-[#fafafa] antialiased selection:bg-[#da1b1b]/40 selection:text-white">
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
