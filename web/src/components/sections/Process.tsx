import { Words } from '../Type';
import type { Dict } from '@/content/tr';

/**
 * Production process.
 *
 * The one light section on the page — it breaks a long dark scroll and reads as
 * the blueprint between two cinematic stretches.
 *
 * Structure is a spine, not cards: a hairline runs the height of the steps and
 * a crimson rule fills down it in step with scroll progress (`data-scrub-fill`),
 * so the section literally draws itself as you read.
 */
export function Process({ dict }: { dict: Dict }) {
  return (
    <section className="on-bone relative py-sect" aria-labelledby="process-title">
      <div className="shell grid gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <p className="kicker mb-8 text-signal">{dict.process.kicker}</p>
            <Words id="process-title" as="h2" text={dict.process.heading} className="display display-lg max-w-[10ch]" />
            <p data-reveal="up" className="prose-body mt-8 text-slate">
              {dict.process.lead}
            </p>
          </div>
        </div>

        <ol className="relative lg:col-span-7 lg:col-start-6">
          {/* Spine: static hairline with a progress rule filling over it. */}
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-0 top-0 w-px bg-black/15 sm:left-[2px]"
          />
          <span
            data-scrub-fill
            aria-hidden="true"
            className="absolute bottom-0 left-0 top-0 w-px origin-top bg-signal sm:left-[2px]"
          />

          {dict.process.steps.map((step) => (
            <li key={step.no} data-reveal="up" className="relative pb-14 pl-8 last:pb-0 sm:pl-14">
              <span
                aria-hidden="true"
                className="absolute left-0 top-[0.55em] h-px w-4 bg-black/25 sm:w-8"
              />
              <div className="flex items-baseline gap-4 sm:gap-6">
                <span className="numeral shrink-0 text-[clamp(2.75rem,7vw,5.5rem)]">
                  {step.no}
                </span>
                <h3 className="display text-[clamp(1.5rem,3.4vw,2.5rem)] leading-none">{step.title}</h3>
              </div>
              <p className="prose-body mt-4 text-slate sm:ml-[calc(clamp(2.75rem,7vw,5.5rem)+1.5rem)]">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
