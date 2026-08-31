import { Picture } from '../Picture';
import { Words } from '../Type';
import type { Dict } from '@/content/tr';

/**
 * Approach statement.
 *
 * Asymmetric by design: the statement runs wide across the left seven columns
 * while a tall portrait plate anchors the right and drifts against the scroll.
 * The heading reveals word by word — a different rhythm from the hero's line
 * wipe, so the two do not read as the same effect twice.
 */
export function Manifesto({ dict }: { dict: Dict }) {
  return (
    <section className="relative py-sect" aria-labelledby="approach-title">
      <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <p className="kicker mb-10 text-signal-lift">{dict.manifesto.kicker}</p>

          <Words
            as="h2"
            id="approach-title"
            text={dict.manifesto.heading}
            className="display display-lg max-w-[13ch]"
          />

          <div className="mt-12 grid gap-8 sm:grid-cols-2" data-stagger>
            {dict.manifesto.body.map((p, i) => (
              <p key={i} data-stagger-item className="prose-body text-mist">
                {p}
              </p>
            ))}
          </div>

          <dl className="mt-16 grid grid-cols-3 gap-6" data-stagger>
            {dict.manifesto.facts.map((f) => (
              <div key={f.label} data-stagger-item className="hair border-t pt-5">
                <dt className="kicker mb-2 text-mist-dim">{f.label}</dt>
                <dd className="display text-2xl tracking-tight sm:text-3xl">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5 lg:pt-24">
          <div className="relative overflow-hidden">
            <div data-img-reveal className="media aspect-[3/4]">
              <div data-parallax="12" className="absolute -inset-y-[8%] inset-x-0">
                <Picture
                  id="ekip-salon"
                  alt={dict.work.alts['ekip-salon']}
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="cover"
                  position="50% 35%"
                />
              </div>
            </div>
          </div>
          <p className="kicker mt-4 text-mist-dim">{dict.about.signature}</p>
        </div>
      </div>
    </section>
  );
}
