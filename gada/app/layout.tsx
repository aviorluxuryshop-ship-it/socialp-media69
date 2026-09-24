import type { Metadata, Viewport } from 'next'
import { Fraunces, Manrope } from 'next/font/google'
import type { ReactNode } from 'react'

import './globals.css'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Menu } from '@/components/layout/Menu'
import { Providers } from '@/components/providers/Providers'
import { site } from '@/data/site'

const display = Fraunces({
  subsets: ['latin', 'latin-ext'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-display',
  display: 'swap',
})

const sans = Manrope({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: '%s — GADA' },
  description: site.description,
  openGraph: {
    type: 'website',
    locale: site.locale,
    siteName: site.name,
    title: site.title,
    description: site.description,
  },
}

export const viewport: Viewport = {
  themeColor: '#F6F1E6',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className={`${display.variable} ${sans.variable}`}>
      <body>
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-cream"
          >
            İçeriğe geç
          </a>
          <Header />
          <Menu />
          <main id="main">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
