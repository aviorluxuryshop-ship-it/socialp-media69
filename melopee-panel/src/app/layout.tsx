import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, Marcellus } from "next/font/google";
import { Boot } from "@/components/Boot";
import "./globals.css";

// Web sitesiyle aynı aile: başlıklar Bricolage Grotesque, metin Figtree, logo yazısı Marcellus.
const figtree = Figtree({ subsets: ["latin", "latin-ext"], variable: "--font-figtree", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin", "latin-ext"], variable: "--font-bricolage", display: "swap" });
const marcellus = Marcellus({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-marcellus", display: "swap" });

export const metadata: Metadata = {
  title: "Melopee Panel",
  description: "Melopee Nail Art Studio — randevu, müşteri, personel, gelir-gider ve raporlama paneli.",
  applicationName: "Melopee Panel",
  robots: { index: false, follow: false },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fbf9f7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${figtree.variable} ${bricolage.variable} ${marcellus.variable}`}>
      <body>
        <Boot>{children}</Boot>
      </body>
    </html>
  );
}
