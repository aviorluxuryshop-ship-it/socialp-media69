import { ShieldCheck } from "lucide-react";
import { reasons } from "@/data/site";
import { SectionHeading } from "./SectionHeading";

export function WhyUs() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading eyebrow="Why Peel Auto Glass" title="Glass you can trust with your safety" />
        <ul className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {reasons.map((r) => (
            <li key={r.title} className="flex gap-4">
              <span className="mt-1 grid size-10 shrink-0 place-items-center rounded-full bg-brand-red/10 text-brand-red">
                <ShieldCheck className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-lg font-bold text-navy-900">{r.title}</h3>
                <p className="mt-1 leading-relaxed text-navy-900/70">{r.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
