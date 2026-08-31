import Link from 'next/link';
import { site } from '@/content/site';
import type { Dict } from '@/content/tr';
import type { Locale } from '@/content/site';
import { homePath, servicePath } from '@/lib/dict';
import { logoMeta } from './Picture';
import { servicesByLocale } from '@/content/services';

export function Footer({ dict, locale }: { dict: Dict; locale: Locale }) {
  const home = homePath(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="hair border-t pb-[max(2rem,env(safe-area-inset-bottom))] pt-16">
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link href={home} aria-label={`Socialp Media — ${dict.nav.home}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/marks/socialp.png"
                alt="Socialp Media"
                width={logoMeta.width}
                height={logoMeta.height}
                loading="lazy"
                className="h-9 w-auto"
              />
            </Link>
            <p className="mt-6 max-w-xs text-sm text-mist-dim">{dict.footer.tagline}</p>
          </div>

          <nav className="lg:col-span-3" aria-label={dict.nav.services}>
            <h2 className="kicker mb-5 text-mist-dim">{dict.nav.services}</h2>
            <ul className="space-y-3">
              {servicesByLocale[locale].map((s) => (
                <li key={s.slug}>
                  <Link href={servicePath(locale, s.slug)} className="link-draw text-sm text-mist">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-4">
            <h2 className="kicker mb-5 text-mist-dim">{dict.nav.contact}</h2>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={site.tr.phoneHref} className="link-draw text-mist">
                  {site.tr.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.tr.email}`} className="link-draw wrap-anywhere text-mist">
                  {site.tr.email}
                </a>
              </li>
              <li>
                <a href={site.intl.phoneHref} className="link-draw text-mist">
                  {site.intl.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.intl.email}`} className="link-draw wrap-anywhere text-mist">
                  {site.intl.email}
                </a>
              </li>
              <li className="pt-2">
                <a
                  href={site.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-draw text-mist"
                >
                  Instagram — {site.instagram.handle}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="hair mt-16 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
          <p className="kicker text-mist-dim">
            © {year} {site.name}. {dict.footer.rights}
          </p>
          <div className="flex items-center gap-5">
            <a
              href={site.address.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="kicker link-draw text-mist-dim"
            >
              {site.address.district}
            </a>
            <Link href={`${home}#top`} className="kicker link-draw text-mist-dim">
              {dict.footer.backToTop}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
