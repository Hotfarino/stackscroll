import {IconMaterials} from "./icon-materials";
import {NanoMotion} from "./nano-motion";
import {OfflineClient} from "./offline-client";
import "./nano-motion.css";
import "./profile.css";
import {DiagnosticsObserver} from "./diagnostics-client";
import type { Metadata } from "next";
import "./globals.css";
import "./glass-interface.css";
import "./signal-interface.css";
import "./reference-foundations.css";
import "./continuous-feed.css";
import "./popout-navigation.css";
import "./flashcard-texture.css";
import "./search-discovery.css";
export const metadata: Metadata = {
  title: "Stackscroll — Build your next level",
  description: "Your daily feed of IT knowledge. Learn networking, cloud, code, and AI through bite-sized lessons, original quizzes, and flashcards.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en" data-skin="signal" className="dark"><body><IconMaterials/><DiagnosticsObserver/><OfflineClient/><NanoMotion/>{children}</body></html>;
}
