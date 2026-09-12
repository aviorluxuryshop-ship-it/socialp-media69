import type { Metadata, Viewport } from 'next'
import { Inter, Jost } from 'next/font/google'
import type { ReactNode } from 'react'

import './globals.css'

import { Footer } from '@/components/ui/Footer'
import { HideOnHome } from '@/components/ui/HideOnHome'
import { Header } from '@/components/ui/Header'
import { Providers } from '@/components/providers/Providers'
import { contact, siteConfig } from '@/data/site'

const jost = Jost({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.collection}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: 'shopping',
  alternates: { canonical: '/' },
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.collection}`,
    description: siteConfig.description,
  },
  twitter: {
    card: 'summary_large_image',
    site: contact.instagram,
    creator: contact.instagram,
    title: `${siteConfig.name} — ${siteConfig.collection}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

export const viewport: Viewport = {
  themeColor: '#050505',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

const organisationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: siteConfig.name,
  legalName: siteConfig.legalName,
  url: siteConfig.url,
  description: siteConfig.description,
  currenciesAccepted: 'TRY',
  // No telephone, no street address, no social profiles. Structured data is a
  // claim made to a search engine, and a wrong phone number or a shopfront
  // that is not there is a claim that costs someone a journey. The contact
  // page carries whatever the store wants to publish; this carries only what
  // can be stood behind. Add PostalAddress and sameAs here once the real
  // details are confirmed.
  areaServed: { '@type': 'Country', name: 'Türkiye' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={siteConfig.language} className={`${jost.variable} ${inter.variable}`}>
      <body className="relative min-h-screen bg-paper font-sans antialiased">
        {/* Ambient light. Flat black behind every page made the site read as a
            hole with type in it; this is a warm gold wash at the head and a
            cool one low down, both far too soft to notice as gradients, which
            together give the ground somewhere to go. */}
        <span
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(120%_70%_at_50%_-10%,rgba(212,175,55,0.16)_0%,transparent_58%)]"
        />
        <script
          type="application/ld+json"
          // Structured data is generated from local config, never user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationSchema) }}
        />
        {/* Scroll reveals start hidden. Without JS they must not stay that way. */}
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html: '[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}',
            }}
          />
        </noscript>
        <a
          href="#icerik"
          className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[60] focus:rounded-sm focus:border focus:border-gold-600 focus:bg-ink focus:px-4 focus:py-2 focus:font-sans focus:text-xs focus:uppercase focus:tracking-wider2 focus:text-paper"
        >
          İçeriğe geç
        </a>
        <Providers>
          <Header />
          <main id="icerik">{children}</main>
          <HideOnHome>
            <Footer />
          </HideOnHome>
        </Providers>
      </body>
    </html>
  )
}
