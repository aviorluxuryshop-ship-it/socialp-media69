import type { ReactNode } from "react";
import { SectionHeading } from "./SectionHeading";

/** Compact dark header band for interior pages. */
export function PageHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="on-dark bg-ink text-white">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="hero-rise">
          <SectionHeading as="h1" eyebrow={eyebrow} title={title} dark>
            {children}
          </SectionHeading>
        </div>
      </div>
    </section>
  );
}
