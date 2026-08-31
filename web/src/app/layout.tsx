import type { Metadata, Viewport } from 'next';
import { Archivo, Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';

/**
 * Three families, each with a job:
 *  - Archivo   display grotesque, carries the oversized headlines and numerals
 *  - Inter     interface and body text, the workhorse at small sizes
 *  - Instrument Serif  italic pull-quotes only, for editorial contrast
 *
 * latin-ext is required throughout: the copy is Turkish (ı, İ, ğ, ş, ç, ö, ü).
 */
const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-archivo',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const instrument = Instrument_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.socialpmedia.com'),
  title: 'Socialp Media',
  description: 'Video, içerik üretimi, sosyal medya yönetimi ve dijital reklam ajansı.',
  icons: {
    icon: [
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#08080a',
  // Zoom is never disabled.
  width: 'device-width',
  initialScale: 1,
};

/**
 * Runs before first paint: decides whether the logo intro should play at all.
 * Kept inline and tiny so it cannot delay rendering, and wrapped in try/catch
 * because sessionStorage throws outright in some privacy modes.
 */
const INTRO_GATE = `(function(){try{
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
if(sessionStorage.getItem('sp-intro')==='1')return;
sessionStorage.setItem('sp-intro','1');
document.documentElement.classList.add('is-intro');
}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The intro gate below adds a class to <html> before hydration, which React
    // would otherwise report as an attribute mismatch.
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${archivo.variable} ${inter.variable} ${instrument.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
        {children}
      </body>
    </html>
  );
}
