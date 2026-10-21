import { SectionHeading } from "@/components/SectionHeading";

const steps = [
  {
    title: "Contact us",
    text: "Call or email Peel Auto Glass. Have your vehicle's year, make and model ready.",
  },
  {
    title: "Describe the damage",
    text: "Tell us what happened, where the damage is and roughly how large it is. Photos help if you are emailing.",
  },
  {
    title: "Assess the right solution",
    text: "We explain whether repair or replacement is appropriate for your vehicle, and what the work involves.",
  },
  {
    title: "Complete the agreed work",
    text: "Once you are happy with the plan, we complete the agreed repair or replacement.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="on-dark bg-navy py-24 text-white sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal">
          <SectionHeading eyebrow="How it works" title="From first call to finished glass" dark />
        </div>
        <ol className="mt-14 grid gap-px overflow-hidden bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="reveal bg-navy p-8">
              <span aria-hidden className="font-display text-5xl font-bold text-brand-soft">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-white/70">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-3xl text-[0.95rem] text-white/60">
          Pricing, appointment availability and timing depend on your vehicle and the job, and are confirmed directly
          with you when you contact us.
        </p>
      </div>
    </section>
  );
}
