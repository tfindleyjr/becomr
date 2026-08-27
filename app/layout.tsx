import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./readability.css";
import "./forge.css";
import "./customer-journey.css";
import "./mobile-pwa.css";
import "./continuation.css";
import "./weekly-trials.css";
import "./phase21-polish.css";
import TutorialOverlay from "./TutorialOverlay";
import PWAClient from "./PWAClient";
import ContinuationUnlock from "./ContinuationUnlock";
import CycleManager from "./CycleManager";
import WeeklyTrialDeck from "./WeeklyTrialDeck";

export const metadata: Metadata = {
  title: "BECOMR — Become Capable",
  description: "Orient. Act. Prove. Grow. Reflect. Reorient.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "BECOMR", statusBarStyle: "black-translucent" },
  applicationName: "BECOMR"
};

export const viewport: Viewport = {
  themeColor: "#0e0d0b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}<CycleManager/><WeeklyTrialDeck/><ContinuationUnlock/><PWAClient/><TutorialOverlay/></body></html>;
}
