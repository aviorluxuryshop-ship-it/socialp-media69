import { Picture } from '../Picture';
import { Words } from '../Type';
import type { Dict } from '@/content/tr';
import { anchors } from '@/lib/dict';

/**
 * About.
 *
 * Kept deliberately short: a statement, three paragraphs, and the office
 * signage — the most on-brand photograph in the library. Only facts published
 * on the agency's own site appear here (founded 2021, hundreds of brands).
 */
export function About({ dict }: { dict: Dict }) {
  return (
    <section id={anchors.about} className="relative py-sect" aria-labelledby="about-title">
      <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div data-img-reveal className="media aspect-[4/5]">
            <div data-parallax="10" className="absolute -inset-y-[8%] inset-x-0">
              <Picture
                id="ofis-tabela"
                alt={dict.work.alts['ofis-tabela']}
                sizes="(min-width: 1024px) 42vw, 92vw"
                className="cover"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <p className="kicker mb-8 text-signal-lift">{dict.about.kicker}</p>
          <Words id="about-title" as="h2" text={dict.about.heading} className="display display-lg max-w-[11ch]" />

          <div className="mt-10 space-y-6" data-stagger>
            {dict.about.body.map((p, i) => (
              <p key={i} data-stagger-item className="prose-body text-mist">
                {p}
              </p>
            ))}
          </div>

          <p data-reveal="up" className="display mt-12 text-2xl tracking-tight text-paper sm:text-3xl">
            {dict.about.signature}
          </p>
        </div>
      </div>

      {/* The five principles that used to caption the 3D exploded view now
          stand on their own as a typographic index — no empty space left. */}
      <div className="shell mt-sect">
        <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" data-stagger>
          {dict.about.parts.map((part, i) => (
            <li key={part.label} data-stagger-item className="hair border-t pt-6">
              <p className="kicker mb-4 flex items-center gap-3 text-[#3ECF8E]">
                <span className="inline-block h-px w-8 bg-[#3ECF8E]" aria-hidden="true" />
                {String(i + 1).padStart(2, '0')} · {part.label}
              </p>
              <h3 className="display text-xl tracking-tight sm:text-2xl">{part.title}</h3>
              <p className="prose-body mt-3 text-[0.9375rem] text-mist">{part.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
