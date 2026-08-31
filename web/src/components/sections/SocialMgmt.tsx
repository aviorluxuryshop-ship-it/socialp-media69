import Link from 'next/link';
import { Picture } from '../Picture';
import { Words } from '../Type';
import type { Dict } from '@/content/tr';
import type { Locale } from '@/content/site';
import { servicePath } from '@/lib/dict';

/**
 * Social media management.
 *
 * A sticky/scroll split: the argument holds still on the left while three
 * vertical plates travel past on the right, each drifting at its own rate. It
 * gives the section a scroll character of its own without another fade.
 */
export function SocialMgmt({ dict, locale }: { dict: Dict; locale: Locale }) {
  const slug = locale === 'tr' ? 'sosyal-medya-yonetimi' : 'social-media-management';
  const plates: { id: string; drift: number; className: string }[] = [
    { id: 'nail-dergi', drift: 8, className: 'aspect-[4/5]' },
    { id: 'cekim-kamera', drift: 14, className: 'aspect-[9/16] ml-[12%]' },
    { id: 'icerik-hazir', drift: 10, className: 'aspect-[3/4] mr-[10%]' },
  ];

  return (
    <section className="relative py-sect" aria-labelledby="social-title">
      <div className="shell grid gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <p className="kicker mb-8 text-signal-lift">{dict.social.kicker}</p>
            <Words id="social-title" as="h2" text={dict.social.heading} className="display display-md max-w-[16ch]" />
            <p data-reveal="up" className="prose-body mt-8 text-mist">
              {dict.social.body}
            </p>

            <ul className="mt-10" data-stagger>
              {dict.social.points.map((p) => (
                <li
                  key={p}
                  data-stagger-item
                  className="hair flex items-center gap-4 border-t py-3.5 text-[0.9375rem] text-mist"
                >
                  <span className="h-1 w-1 shrink-0 rounded-full bg-signal" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>

            <Link
              href={servicePath(locale, slug)}
              className="btn btn-ghost mt-10"
              data-magnetic
            >
              {dict.social.cta}
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-6 lg:col-start-7 lg:gap-16">
          {plates.map((plate) => (
            <div key={plate.id} data-img-reveal className={`media ${plate.className}`}>
              <div data-parallax={plate.drift} className="absolute -inset-y-[9%] inset-x-0">
                <Picture
                  id={plate.id}
                  alt={dict.work.alts[plate.id] ?? ''}
                  sizes="(min-width: 1024px) 46vw, 92vw"
                  className="cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
