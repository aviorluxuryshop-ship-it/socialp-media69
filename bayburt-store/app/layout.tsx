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
  telephone: contact.phone,
  email: contact.email,
  currenciesAccepted: 'TRY',
  address: {
    '@type': 'PostalAddress',
    streetAddress: contact.store.addressLine,
    addressLocality: siteConfig.city,
    postalCode: contact.store.postalCode,
    addressCountry: 'TR',
  },
  sameAs: [contact.instagramHref],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={siteConfig.language} className={`${jost.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-obsidian font-sans antialiased">
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
          className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[60] focus:rounded-sm focus:border focus:border-gold-600 focus:bg-obsidian focus:px-4 focus:py-2 focus:font-sans focus:text-xs focus:uppercase focus:tracking-wider2 focus:text-white"
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
