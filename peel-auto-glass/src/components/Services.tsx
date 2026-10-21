import { services } from "@/data/site";
import { SectionHeading } from "./SectionHeading";

export function Services() {
  return (
    <section id="services" className="bg-ice py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="What we do"
          title="Every kind of auto glass job"
          text="From a tiny chip to a full windshield replacement — one call and it's handled."
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="group rounded-2xl border border-navy-900/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-blue/10"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-linear-to-br from-brand-blue to-brand-cyan text-white">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-bold text-navy-900">{title}</h3>
              <p className="mt-2 leading-relaxed text-navy-900/70">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
