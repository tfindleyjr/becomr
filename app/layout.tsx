import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./readability.css";
import "./forge.css";
import "./customer-journey.css";
import "./mobile-pwa.css";
import "./continuation.css";
import "./weekly-trials.css";
import "./phase21-polish.css";
import "./weekly-ledger.css";
import "./mobile-app-shell.css";
import "./phase23-24.css";
import "./adaptive-status.css";
import TutorialOverlay from "./TutorialOverlay";
import PWAClient from "./PWAClient";
import ContinuationUnlock from "./ContinuationUnlock";
import CycleManager from "./CycleManager";
import WeeklyTrialDeck from "./WeeklyTrialDeck";
import WeeklyProgressLedger from "./WeeklyProgressLedger";
import MobileAppShell from "./MobileAppShell";
import AdaptiveTrialEngine from "./AdaptiveTrialEngine";
import AdaptiveWeeklyEngine from "./AdaptiveWeeklyEngine";
import PathControlCenter from "./PathControlCenter";
import Proof2Panel from "./Proof2Panel";
import AdaptiveStatus from "./AdaptiveStatus";

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
  return <html lang="en"><body>{children}<CycleManager/><AdaptiveTrialEngine/><AdaptiveWeeklyEngine/><AdaptiveStatus/><WeeklyTrialDeck/><WeeklyProgressLedger/><PathControlCenter/><Proof2Panel/><ContinuationUnlock/><PWAClient/><TutorialOverlay/><MobileAppShell/></body></html>;
}
