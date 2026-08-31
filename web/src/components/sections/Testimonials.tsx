import { Words } from '../Type';
import type { Dict } from '@/content/tr';

/**
 * Testimonials.
 *
 * Set as oversized italic pull-quotes stacked down the page — no carousel, no
 * small cards. The source site publishes these without names, attributing them
 * only as "Müşterilerimizden", so that is exactly how they appear here; no
 * attribution is invented.
 */
export function Testimonials({ dict }: { dict: Dict }) {
  return (
    <section className="relative py-sect" aria-labelledby="testimonials-title">
      <div className="shell">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="kicker mb-8 text-signal-lift">{dict.testimonials.kicker}</p>
            <Words id="testimonials-title" as="h2" text={dict.testimonials.heading} className="display display-lg" />
          </div>
          <span className="kicker text-mist-dim tabular">
            {String(dict.testimonials.items.length).padStart(2, '0')}
          </span>
        </div>

        <div>
          {dict.testimonials.items.map((quote, i) => (
            <figure key={i} className="hair grid gap-6 border-t py-12 lg:grid-cols-12 lg:gap-10 lg:py-16">
              <div className="lg:col-span-2">
                <span className="numeral text-[clamp(2.5rem,4vw,3.5rem)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="lg:col-span-10">
                <blockquote data-reveal="up">
                  <p className="quote text-[clamp(1.6rem,3.6vw,3rem)]">
                    <span aria-hidden="true" className="text-signal-lift">
                      “
                    </span>
                    {quote}
                    <span aria-hidden="true" className="text-signal-lift">
                      ”
                    </span>
                  </p>
                </blockquote>
                <figcaption data-reveal="up" className="kicker mt-6 text-mist-dim">
                  — {dict.testimonials.attribution}
                </figcaption>
              </div>
            </figure>
          ))}
          <div className="hair border-t" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
