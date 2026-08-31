import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Socialp Media',
  robots: { index: false, follow: true },
  alternates: {
    languages: {
      tr: '/tr/',
      en: '/en/',
      'x-default': '/tr/',
    },
  },
};

/**
 * Language gate at `/`.
 *
 * The site is statically exported, so there is no server to negotiate the
 * locale. We read the browser's own preference on the client; no-JS visitors and
 * crawlers get the two links instead, which is a perfectly good fallback.
 */
export default function LocaleGate() {
  const redirect = `(function(){try{var l=(navigator.languages&&navigator.languages[0])||navigator.language||'';location.replace(/^tr/i.test(l)?'/tr/':'/en/')}catch(e){location.replace('/tr/')}})()`;

  return (
    <main className="grid min-h-dvh place-items-center p-8 text-center">
      <script dangerouslySetInnerHTML={{ __html: redirect }} />
      <div className="flex flex-col items-center gap-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/marks/socialp.png" alt="Socialp Media" width={741} height={298} className="w-56" />
        <nav className="flex flex-wrap justify-center gap-4" aria-label="Dil seçimi / Language">
          <Link href="/tr/" className="btn btn-solid">
            Türkçe
          </Link>
          <Link href="/en/" className="btn btn-ghost">
            English
          </Link>
        </nav>
      </div>
    </main>
  );
}
