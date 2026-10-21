import { ArrowLink } from "@/components/ArrowLink";
import { SectionHeading } from "@/components/SectionHeading";
import { steps } from "@/data/process";

export function ProcessStrip() {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-ink py-20 text-white sm:py-28">
      <div aria-hidden className="cols" />
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="reveal flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading index="04" eyebrow="How it works" title="From first call to finished glass" dark />
          <ArrowLink href="/how-it-works" light>
            See the full process
          </ArrowLink>
        </div>
        <ol className="mt-14 grid gap-px bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="reveal bg-ink p-7">
              <span aria-hidden className="font-display text-5xl font-bold text-brand-soft">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-white/70">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
