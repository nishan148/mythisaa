import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://mythmind.co"),
  title: { default: "MythMind — The AI Workspace That Builds With You", template: "%s | MythMind" },
  description: "Plan, research, code, and ship with a coordinated team of AI agents in one intelligent workspace.",
  keywords: ["AI workspace", "AI agents", "developer tools", "agentic AI", "research assistant"],
  openGraph: { title: "MythMind", description: "The AI workspace that builds with you.", type: "website", url: "/" },
  twitter: { card: "summary_large_image", title: "MythMind", description: "The AI workspace that builds with you." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#FAFAF9", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={inter.variable}>{children}</body></html>;
}