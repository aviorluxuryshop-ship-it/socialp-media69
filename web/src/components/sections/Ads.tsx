import Link from 'next/link';
import { Picture } from '../Picture';
import { Words } from '../Type';
import type { Dict } from '@/content/tr';
import type { Locale } from '@/content/site';
import { servicePath } from '@/lib/dict';

/**
 * Advertising.
 *
 * Full-bleed brand creative behind a numbered two-column index. The copy stays
 * strictly about method — targeting, optimisation, reporting — and makes no
 * outcome promises, matching how the agency describes the service itself.
 */
export function Ads({ dict, locale }: { dict: Dict; locale: Locale }) {
  const slug = locale === 'tr' ? 'meta-google-reklamlari' : 'meta-google-ads';

  return (
    <section className="relative isolate overflow-hidden py-sect grain" aria-labelledby="ads-title">
      {/* Brand creative plate, deliberately low-contrast behind the text. */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div data-parallax="16" className="absolute -inset-y-[10%] inset-x-0">
          <Picture id="meta-tepsi" alt="" sizes="100vw" className="cover opacity-25" position="50% 40%" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/55" />
      </div>

      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="kicker mb-8 text-signal-lift">{dict.ads.kicker}</p>
            <Words id="ads-title" as="h2" text={dict.ads.heading} className="display display-lg max-w-[11ch]" />
            <p data-reveal="up" className="prose-body mt-8 text-mist">
              {dict.ads.body}
            </p>

            <ul data-reveal="up" className="mt-8 flex flex-wrap gap-2">
              {dict.ads.platforms.map((p) => (
                <li key={p} className="hair kicker border px-3 py-2 text-mist">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 grid gap-x-12 sm:grid-cols-2" data-stagger>
          {dict.ads.items.map((item, i) => (
            <div key={item.title} data-stagger-item className="hair border-t py-8">
              <div className="mb-4 flex items-baseline gap-4">
                <span className="numeral numeral-solid text-lg text-signal-lift">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="display text-xl tracking-tight sm:text-2xl">{item.title}</h3>
              </div>
              <p className="prose-body text-[0.9375rem] text-mist">{item.desc}</p>
            </div>
          ))}
        </div>

        <Link href={servicePath(locale, slug)} className="btn btn-ghost mt-12" data-magnetic>
          {dict.ads.cta}
        </Link>
      </div>
    </section>
  );
}
