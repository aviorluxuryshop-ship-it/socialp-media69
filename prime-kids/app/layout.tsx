import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { FooterGate } from '@/components/FooterGate'
import { BottomNav } from '@/components/BottomNav'
import { CookieNotice } from '@/components/CookieNotice'
import { Mascot } from '@/components/Mascot'
import { UIProvider } from '@/components/UIProvider'
import { SITE_URL, isPreview, site } from '@/data/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${site.name} · Çocuk Giyim — Rahat giysin, havalı görünsün`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: site.name,
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: `${site.name} çocuk giyim` }],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
  formatDetection: { telephone: false },
  // Gerçek iletişim/şirket bilgileri girilene kadar Google'da listelenmez.
  ...(isPreview ? { robots: { index: false, follow: false } } : {}),
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#faf7f2',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: site.name,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo.svg`,
    email: site.contact.email,
    telephone: site.contact.phoneHref,
    sameAs: [site.social.instagram, site.social.trendyol].filter(Boolean),
  }
  return (
    <html lang="tr">
      <head>
        <link rel="preload" href="/fonts/montserrat-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/nunito-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      </head>
      <body>
        <UIProvider>
          <a
            href="#icerik"
            className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-white"
          >
            İçeriğe geç
          </a>
          <Header />
          <main id="icerik" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <FooterGate>
            <Footer />
          </FooterGate>
          <BottomNav />
          <CookieNotice />
          <Mascot />
        </UIProvider>
      </body>
    </html>
  )
}
