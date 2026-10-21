import { ChevronDown } from "lucide-react";
import { faqs } from "@/data/site";
import { SectionHeading } from "./SectionHeading";

export function Faq() {
  return (
    <section id="faq" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeading eyebrow="FAQ" title="Questions drivers ask us" />
        <div className="mt-10 divide-y divide-navy-900/10 rounded-2xl border border-navy-900/10">
          {faqs.map((f) => (
            <details key={f.q} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-bold text-navy-900 focus-visible:outline-2 focus-visible:outline-brand-blue">
                {f.q}
                <ChevronDown className="size-5 shrink-0 text-brand-blue transition group-open:rotate-180" aria-hidden />
              </summary>
              <p className="pb-5 leading-relaxed text-navy-900/70">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
