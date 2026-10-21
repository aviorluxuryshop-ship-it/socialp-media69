import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { services } from "@/data/services";

export function Services() {
  return (
    <section id="services" className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <SectionHeading eyebrow="Services" title="Auto glass services for your vehicle" />
          <p className="text-lg leading-relaxed text-muted">
            Repair when the damage is suitable. Replacement when it is not. Windshields, side windows and rear glass,
            explained clearly before any work begins.
          </p>
        </div>

        <ul className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {services.map((s) => (
            <li key={s.id} className="reveal">
              <article className="flex h-full flex-col">
                <div className="zoom relative aspect-[4/3] overflow-hidden rounded-sm bg-mist">
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    placeholder="blur"
                    className="object-cover"
                  />
                </div>
                <h3 className="mt-6 text-2xl font-bold leading-tight">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{s.summary}</p>
                <ul className="mt-5 space-y-2 border-t border-line pt-5 text-[0.95rem] text-ink">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-3">
                      <span aria-hidden className="mt-[0.7em] h-0.5 w-4 shrink-0 bg-brand" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className="mt-auto inline-flex items-center gap-2 pt-6 font-semibold text-brand-deep hover:text-brand"
                >
                  Contact us about this service
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
