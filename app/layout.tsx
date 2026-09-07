import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Stackscroll — Build your next level",
  description: "Your daily feed of IT knowledge. Learn networking, cloud, code, and AI through bite-sized lessons, original quizzes, and flashcards.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en" className="dark"><body>{children}</body></html>;
}
