import { ArrowLink } from "@/components/ArrowLink";
import { SectionHeading } from "@/components/SectionHeading";
import { approach } from "@/data/approach";

export function ApproachStrip() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading index="03" eyebrow="Why Peel Auto Glass" title="A careful, honest approach" />
          <ArrowLink href="/about">More about us</ArrowLink>
        </div>
        <ol className="mt-14 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {approach.map((a, i) => (
            <li key={a.title} className="reveal bg-white py-2 sm:p-8 sm:first:pl-0 lg:py-0 lg:pr-8 lg:pl-8 lg:first:pl-0">
              <span aria-hidden className="font-display text-4xl font-bold text-brand">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-lg font-bold leading-snug">{a.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{a.short}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
