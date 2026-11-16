import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { site } from "@/data/site";
import { CartProvider } from "@/lib/cart";
import "./globals.css";

const display = Montserrat({ subsets: ["latin", "latin-ext"], weight: ["600", "700"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — Çocuk Giyim: 2–14 Yaş Takımlar`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [{ url: "/products/vintage-yesil.webp", width: 1024, height: 1536, alt: "Prime Kids takım giyen çocuk" }],
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#F7F4EE", width: "device-width", initialScale: 1 };

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: site.name,
  legalName: site.company.legalName,
  url: site.url,
  logo: `${site.url}/brand/logo.png`,
  email: site.contact.email,
  telephone: site.contact.phone,
  address: { "@type": "PostalAddress", streetAddress: site.company.address, addressCountry: "TR" },
  sameAs: [site.social.instagram.url, site.social.trendyol.url],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <CartProvider>
          <Header />
          <main id="icerik" className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
