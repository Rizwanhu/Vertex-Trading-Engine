import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AmbientBackground } from "@/components/ui/AmbientBackground";

export const metadata: Metadata = {
  title: "AlgoTrader Pro — Automated Trading Dashboard",
  description:
    "Professional algorithmic trading platform with real-time charts, risk management, and bot control.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg-primary text-text-primary min-h-screen antialiased">
        <AmbientBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
