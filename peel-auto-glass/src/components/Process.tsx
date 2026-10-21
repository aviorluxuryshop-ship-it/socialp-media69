import { steps } from "@/data/site";
import { SectionHeading } from "./SectionHeading";

export function Process() {
  return (
    <section id="process" className="relative overflow-hidden bg-navy-950 py-20 text-white sm:py-24">
      <div aria-hidden className="hero-glow absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-6xl px-4">
        <SectionHeading
          tone="dark"
          eyebrow="How it works"
          title="Back on the road in four steps"
          text="No runaround. Here's what to expect from first call to drive-away."
        />
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <span className="text-5xl font-extrabold italic leading-none text-transparent [-webkit-text-stroke:1.5px_var(--color-brand-cyan)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-white/70">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
