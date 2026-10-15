import type { Metadata, Viewport } from 'next';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/hanken-grotesk/index.css';
import '@fontsource-variable/jetbrains-mono/index.css';
import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/ui.css';
import '@/styles/shell.css';
import '@/styles/pitch.css';
import '@/styles/pages.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Providers } from '@/components/Providers';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://libero.example';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Libero — Futbol Akademisi', template: '%s · Libero' },
  description:
    'Teknik kütüphanesi, top kontrolü, taktik tahtası, Futbol IQ testleri, kişisel antrenman programı ve gelişim takibi. Tamamen Türkçe.',
  applicationName: 'Libero Futbol Akademisi',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'Libero Futbol Akademisi',
    title: 'Libero — Futbol Akademisi',
    description: 'Futbolu anlayarak öğrenin: teknik, taktik, fiziksel hazırlık ve gelişim takibi.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a100d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
      </head>
      <body>
        <Providers>
          <Header />
          <main id="icerik">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
