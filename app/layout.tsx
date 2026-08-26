import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BECOMR — Become Capable",
  description: "Turn real-world growth into an immersive progression system.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "BECOMR", statusBarStyle: "black-translucent" }
};

export const viewport: Viewport = {
  themeColor: "#070A0D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}