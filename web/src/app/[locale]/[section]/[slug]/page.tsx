import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { locales, serviceSegment, type Locale } from '@/content/site';
import { getService, servicesByLocale } from '@/content/services';
import { getDict, isLocale, homePath, servicePath, anchors } from '@/lib/dict';
import { Picture } from '@/components/Picture';
import { Lines, Words } from '@/components/Type';

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    servicesByLocale[locale].map((service) => ({
      locale,
      section: serviceSegment[locale],
      slug: service.slug,
    })),
  );
}

type Params = Promise<{ locale: string; section: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, section, slug } = await params;
  if (!isLocale(locale) || section !== serviceSegment[locale]) return {};
  const service = getService(locale, slug);
  if (!service) return {};

  return {
    title: service.title,
    description: service.intro.slice(0, 180),
    alternates: { canonical: servicePath(locale, slug) },
  };
}

export default async function ServicePage({ params }: { params: Params }) {
  const { locale, section, slug } = await params;
  if (!isLocale(locale) || section !== serviceSegment[locale]) notFound();

  const typed = locale as Locale;
  const service = getService(typed, slug);
  if (!service) notFound();

  const dict = getDict(typed);
  const others = servicesByLocale[typed].filter((s) => s.slug !== slug);

  return (
    <article className="pt-32 sm:pt-40">
      {/* --- Masthead ------------------------------------------------------ */}
      <header className="shell">
        <Link href={homePath(typed)} className="kicker link-draw mb-12 inline-block text-mist-dim">
          ← {dict.serviceDetail.backToHome}
        </Link>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="numeral numeral-solid kicker mb-6 text-signal-lift">{service.no}</p>
            <Lines as="h1" lines={[service.title]} className="display display-lg" />
          </div>
        </div>

        <p data-reveal="up" className="prose-body mt-10 max-w-[64ch] text-mist">
          {service.intro}
        </p>
      </header>

      <div className="shell mt-16">
        <div data-img-reveal className="media aspect-[16/10] sm:aspect-[16/7]">
          <div data-parallax="12" className="absolute -inset-y-[12%] inset-x-0">
            <Picture
              id={service.hero}
              alt={dict.work.alts[service.hero] ?? ''}
              sizes="92vw"
              priority
              className="cover"
              position="50% 40%"
            />
          </div>
        </div>
      </div>

      {/* --- What it covers ------------------------------------------------- */}
      <section className="shell py-sect">
        <div className="grid gap-x-12 sm:grid-cols-2" data-stagger>
          {service.blocks.map((block, i) => (
            <div key={block.title} data-stagger-item className="hair border-t py-8">
              <div className="mb-4 flex items-baseline gap-4">
                <span className="numeral numeral-solid text-base text-signal-lift tabular">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="display text-xl tracking-tight sm:text-2xl">{block.title}</h2>
              </div>
              <p className="prose-body text-[0.9375rem] text-mist">{block.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- Working process ------------------------------------------------ */}
      {service.process ? (
        <section className="on-bone py-sect">
          <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4">
              <Words as="h2" text={service.process.title} className="display display-md lg:sticky lg:top-32" />
            </div>
            <ol className="relative lg:col-span-7 lg:col-start-6">
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-black/15" />
              <span
                data-scrub-fill
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-px origin-top bg-signal"
              />
              {service.process.steps.map((step, i) => (
                <li key={step.title} data-reveal="up" className="relative pb-12 pl-8 last:pb-0 sm:pl-12">
                  <div className="flex items-baseline gap-4">
                    <span className="numeral shrink-0 text-[clamp(2rem,4.5vw,3.25rem)]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="display text-xl tracking-tight sm:text-2xl">{step.title}</h3>
                  </div>
                  <p className="prose-body mt-3 text-slate">{step.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* --- Who it is for --------------------------------------------------- */}
      {service.audience ? (
        <section className="shell py-sect">
          <Words as="h2" text={service.audience.title} className="display display-md mb-12" />
          <ul className="grid grid-cols-2 gap-5 lg:grid-cols-3 lg:gap-7" data-stagger>
            {service.audience.items.map((item) => (
              <li key={item.label} data-stagger-item>
                <div className="media aspect-[4/5]">
                  <div data-parallax="8" className="absolute -inset-y-[8%] inset-x-0">
                    {/* Sector imagery: illustrative, not presented as client work. */}
                    <Picture
                      id={item.image}
                      alt=""
                      sizes="(min-width: 1024px) 30vw, 46vw"
                      className="cover opacity-80"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <span className="display absolute bottom-4 left-4 right-4 text-base tracking-tight sm:text-lg">
                    {item.label}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* --- Related frames --------------------------------------------------- */}
      {service.gallery.length ? (
        <section className="shell pb-sect">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7" data-stagger>
            {service.gallery.map((id) => (
              <div key={id} data-stagger-item className="media aspect-[4/5]">
                <div data-parallax="9" className="absolute -inset-y-[8%] inset-x-0">
                  <Picture
                    id={id}
                    alt={dict.work.alts[id] ?? ''}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                    className="cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* --- CTA + other services -------------------------------------------- */}
      <section className="shell pb-sect">
        <div className="hair border-t pt-12">
          <Lines as="h2" lines={[dict.serviceDetail.ctaHeading]} className="display display-lg max-w-[14ch]" />
          <Link href={`${homePath(typed)}#${anchors.contact}`} className="btn btn-solid mt-10" data-magnetic>
            {dict.hero.primaryCta}
          </Link>
        </div>

        <div className="mt-20">
          <h2 className="kicker mb-6 text-mist-dim">{dict.serviceDetail.otherServices}</h2>
          <ul>
            {others.map((other) => (
              <li key={other.slug} className="hair border-t">
                <Link
                  href={servicePath(typed, other.slug)}
                  className="group flex items-baseline justify-between gap-6 py-7"
                >
                  <span className="display text-[clamp(1.4rem,3vw,2.25rem)] leading-none">{other.title}</span>
                  <span className="kicker shrink-0 text-mist-dim transition-transform duration-500 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </li>
            ))}
            <li className="hair border-t" aria-hidden="true" />
          </ul>
        </div>
      </section>
    </article>
  );
}
