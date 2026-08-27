import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./readability.css";
import "./forge.css";
import "./customer-journey.css";
import TutorialOverlay from "./TutorialOverlay";

export const metadata: Metadata = {
  title: "BECOMR — Become Capable",
  description: "Orient. Act. Prove. Grow. Reflect. Reorient.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "BECOMR", statusBarStyle: "black-translucent" }
};

export const viewport: Viewport = {
  themeColor: "#050504",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}<TutorialOverlay/></body></html>;
}
