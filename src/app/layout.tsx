import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Geist } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Euro School Election 2026 — Live Results",
  description:
    "Real-time vote tracking dashboard for Euro School elections 2026. Live candidate results, charts, and win probability.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable} ${geist.variable}`} suppressHydrationWarning>
      <body className="antialiased bg-[#07071a] font-inter">{children}</body>
    </html>
  );
}
