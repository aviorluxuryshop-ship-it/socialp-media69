import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import { site } from '@/content/site'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  axes: ['wdth'],
  display: 'swap',
  variable: '--font-archivo',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: site.name,
    title: site.title,
    description: site.description,
  },
  twitter: { card: 'summary_large_image', title: site.title, description: site.description },
}

export const viewport: Viewport = {
  themeColor: '#F7E7D8',
  width: 'device-width',
  initialScale: 1,
}

// JS varsa, kaydırmayla açılan bölümler ilk boyamadan önce gizlenir; yoksa her şey görünür kalır.
const boot = `document.documentElement.classList.add('js')`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={archivo.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
        <link rel="preload" href="/img/seftali-on.webp" as="image" type="image/webp" fetchPriority="high" />
      </head>
      <body>{children}</body>
    </html>
  )
}
