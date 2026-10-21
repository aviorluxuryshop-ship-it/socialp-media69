import { MapPin } from "lucide-react";
import { areas, site } from "@/data/site";
import { SectionHeading } from "./SectionHeading";

export function ServiceArea() {
  return (
    <section id="area" className="bg-ice py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4">
        <SectionHeading
          eyebrow="Service area"
          title={`Serving ${site.region}`}
          text="Mobile appointments across Mississauga, Brampton, Caledon and nearby. Not on the list? Ask — we may still be able to help."
        />
        <ul className="mt-10 flex flex-wrap justify-center gap-3">
          {areas.map((a) => (
            <li
              key={a}
              className="inline-flex items-center gap-2 rounded-full border border-navy-900/10 bg-white px-5 py-2.5 font-semibold text-navy-900 shadow-sm"
            >
              <MapPin className="size-4 text-brand-red" aria-hidden /> {a}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
