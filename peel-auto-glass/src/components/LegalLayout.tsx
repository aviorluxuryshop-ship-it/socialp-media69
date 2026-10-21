import type { ReactNode } from "react";
import { PageHero } from "@/components/PageHero";
import { business } from "@/data/business";

export type LegalSection = { id: string; title: string; body: ReactNode };

/**
 * Shared layout for policy pages: title band, a short table of contents, and
 * readable long-form sections.
 */
export function LegalLayout({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero eyebrow="Legal" title={title}>
        <p>{intro}</p>
        <p className="mt-3 text-sm text-white/60">Last updated: {business.policiesUpdated}</p>
      </PageHero>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:py-20 lg:grid-cols-[16rem_1fr] lg:gap-16">
        <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">On this page</p>
          <ol className="mt-4 space-y-1 text-[0.95rem]">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex gap-2 py-1.5 text-ink hover:text-brand-deep">
                  <span aria-hidden className="w-5 shrink-0 text-muted">
                    {i + 1}.
                  </span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="legal max-w-3xl">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`}>
              <h2 id={`${s.id}-h`} className={i === 0 ? "!mt-0" : undefined}>
                {i + 1}. {s.title}
              </h2>
              {s.body}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}

/** Standard contact block reused at the end of each policy. */
export function PolicyContact() {
  return (
    <>
      <p>Peel Auto Glass</p>
      <ul>
        <li>
          Phone: <a href={business.phone.href}>{business.phone.display}</a>
        </li>
        <li>
          Email: <a href={business.emailHref}>{business.email}</a>
        </li>
        <li>Address: {business.address.oneLine}</li>
      </ul>
    </>
  );
}
