import { Phone } from "lucide-react";
import { site } from "@/data/site";

/** Sticky call / quote bar — phones only, where most glass emergencies start. */
export function MobileBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-white/10 bg-navy-950/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <a
        href={`tel:${site.phone.tel}`}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-red py-3 font-bold text-white"
      >
        <Phone className="size-4" aria-hidden /> Call now
      </a>
      <a href="#quote" className="inline-flex items-center justify-center rounded-full bg-brand-blue py-3 font-bold text-white">
        Free quote
      </a>
    </div>
  );
}
