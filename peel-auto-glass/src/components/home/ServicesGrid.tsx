import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { ServiceIcon } from "@/components/ServiceIcon";
import { services } from "@/data/services";

export function ServicesGrid() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <SectionHeading index="01" eyebrow="Services" title="Auto glass services for your vehicle" />
          <p className="text-lg leading-relaxed text-muted">
            Repair when the damage is suitable. Replacement when it is not. Windshields, side windows and rear glass,
            explained clearly before any work begins.
          </p>
        </div>

        <ul className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <li key={s.slug} className="reveal">
              <article className="group relative flex h-full flex-col">
                <div className="zoom rake rake-sm relative aspect-[4/3] overflow-hidden bg-mist">
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 100vw"
                    placeholder="blur"
                    className="object-cover"
                  />
                </div>
                <div className="mt-6 flex items-center gap-3 text-brand">
                  <ServiceIcon slug={s.slug} className="size-8" />
                  <span aria-hidden className="h-px flex-1 bg-line" />
                </div>
                <h3 className="mt-4 text-xl font-bold leading-snug">
                  <Link href={`/services/${s.slug}`} className="stretch hover:text-brand-deep">
                    {s.title}
                  </Link>
                </h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{s.summary}</p>
                <span className="link-arrow mt-auto inline-flex items-center gap-2 pt-5 text-[0.95rem] font-semibold text-brand-deep">
                  Learn more
                  <ArrowRight aria-hidden className="size-4" />
                </span>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
