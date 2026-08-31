import Link from 'next/link';
import { Words } from '../Type';
import { ServiceVisual, type Variant } from '../ServiceVisual';
import { ServicesHero } from '../ServicesHero';
import type { Dict } from '@/content/tr';
import type { Locale } from '@/content/site';
import { anchors, homePath, servicePath } from '@/lib/dict';

/**
 * Services.
 *
 * Each service is a full editorial row with its own spatial visual, alternating
 * sides down the page — not six identical cards, and no cursor-following overlay
 * that could cover the text.
 *
 * All visuals here are CSS 3D depth compositions built from the agency's own
 * photography — no WebGL on the homepage.
 */
const VISUALS: Record<string, Variant> = {
  '01': 'video',
  '02': 'photo',
  '03': 'edit',
  '04': 'social',
  '05': 'post',
  '06': 'ads',
  '07': 'web',
};

export function Services({ dict, locale }: { dict: Dict; locale: Locale }) {
  const home = homePath(locale);
  const alts = dict.work.alts;

  return (
    <section id={anchors.services} className="relative" aria-labelledby="services-title">
      {/* Pinned, scroll-scrubbed 3D product hero. */}
      <ServicesHero dict={dict} />

      <div className="shell py-sect">
        <div className="mb-20 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="kicker mb-8 text-signal-lift">{dict.services.kicker}</p>
            <Words
              id="services-title"
              as="h2"
              text={dict.services.heading}
              className="display display-lg max-w-[12ch]"
            />
          </div>
          <p data-reveal="up" className="lead self-end text-mist lg:col-span-5">
            {dict.services.lead}
          </p>
        </div>

        <ul className="flex flex-col gap-sect">
          {dict.services.items.map((item, i) => {
            const flip = i % 2 === 1;
            const href = item.href ? servicePath(locale, item.href) : `${home}#${anchors.contact}`;

            return (
              <li key={item.no} className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
                {/* --- Visual ------------------------------------------- */}
                <div className={`lg:col-span-6 ${flip ? 'lg:order-2 lg:col-start-7' : 'lg:order-1'}`}>
                  <ServiceVisual variant={VISUALS[item.no] ?? 'photo'} alts={alts} />
                </div>

                {/* --- Copy --------------------------------------------- */}
                <div className={`lg:col-span-5 ${flip ? 'lg:order-1 lg:col-start-1' : 'lg:order-2 lg:col-start-8'}`}>
                  <div className="flex items-baseline gap-5">
                    <span className="numeral text-[clamp(3rem,6vw,6rem)]">{item.no}</span>
                    <span className="h-px flex-1 bg-white/12" aria-hidden="true" />
                  </div>

                  <h3 className="display mt-6 text-[clamp(1.9rem,3.6vw,3.1rem)] leading-none">{item.title}</h3>

                  <p data-reveal="up" className="prose-body mt-5 text-mist">
                    {item.desc}
                  </p>

                  <Link href={href} className="link-draw group mt-7 inline-flex items-center gap-2 text-sm text-paper">
                    {item.href ? dict.services.detailCta : dict.services.listCta}
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                      className="shrink-0 transition-transform duration-500 group-hover:translate-x-1"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
