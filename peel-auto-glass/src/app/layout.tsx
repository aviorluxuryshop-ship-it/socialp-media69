import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { isPlaceholderContact, site } from "@/data/site";
import "./globals.css";

const title = `${site.name} | Windshield Repair & Replacement in Peel Region, ON`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title,
    description: site.description,
    locale: "en_CA",
    url: "/",
  },
  twitter: { card: "summary_large_image", title, description: site.description },
  // Keep placeholder contact details out of search results until real ones are set in data/site.ts.
  robots: isPlaceholderContact ? { index: false, follow: false } : { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#060b1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" className={GeistSans.variable}>
      <body className="font-sans antialiased">
        <a
          href="#services"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:text-navy-900"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
