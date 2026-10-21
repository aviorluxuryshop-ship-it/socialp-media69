import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { siteUrl } from "@/data/business";
import "./globals.css";

// Self-hosted variable fonts (SIL Open Font Licence, see src/fonts). No third-party font requests.
const inter = localFont({
  src: "../fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});
const archivo = localFont({
  src: "../fonts/archivo-latin-wght-normal.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: "Peel Auto Glass | Windshield Repair & Replacement in Mississauga, ON",
    template: "%s | Peel Auto Glass",
  },
  description:
    "Windshield repair and replacement, side window replacement and rear windshield replacement in Mississauga, Ontario. Call Peel Auto Glass at +1 437-339-9054.",
  applicationName: "Peel Auto Glass",
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#0a1326",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" className={`${inter.variable} ${archivo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
