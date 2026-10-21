import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { SectionHeading } from "./SectionHeading";

/**
 * Dark title band for interior pages: breadcrumb trail, heading, lead and an
 * optional raked photograph.
 */
export function PageHero({
  eyebrow,
  title,
  children,
  crumbs,
  image,
  actions,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  crumbs: Crumb[];
  image?: { src: StaticImageData; alt: string };
  actions?: ReactNode;
}) {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-ink text-white">
      <div aria-hidden className="cols" />
      <div
        className={`relative mx-auto max-w-6xl px-5 py-14 sm:py-20 ${
          image ? "grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16" : ""
        }`}
      >
        <div>
          <Breadcrumbs crumbs={crumbs} />
          <div className="hero-rise hero-rise-2 mt-8">
            <SectionHeading as="h1" eyebrow={eyebrow} title={title} dark>
              {children}
            </SectionHeading>
          </div>
          {actions && <div className="hero-rise hero-rise-3 mt-9 flex flex-col gap-3 sm:flex-row">{actions}</div>}
        </div>
        {image && (
          <div className="hero-rise hero-rise-3 glint rake relative aspect-[4/3] bg-navy">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              placeholder="blur"
              className="object-cover"
            />
          </div>
        )}
      </div>
      <div aria-hidden className="relative h-0.5 bg-[linear-gradient(90deg,var(--color-brand)_0_66%,var(--color-signal)_66%_100%)]" />
    </section>
  );
}
