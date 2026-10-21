import { Mail, Phone } from "lucide-react";
import { business } from "@/data/business";

/** Phone-sized screens only: call and email stay one tap away while reading. */
export function MobileCallBar() {
  return (
    <section id="call-bar" aria-label="Quick contact" className="on-dark fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-ink/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md gap-2">
        <a
          href={business.phone.href}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md bg-brand text-[0.95rem] font-semibold text-white active:bg-brand-deep"
        >
          <Phone aria-hidden className="size-4" />
          Call {business.phone.short}
        </a>
        <a
          href={business.emailHref}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/35 px-5 text-[0.95rem] font-semibold text-white active:bg-white/10"
        >
          <Mail aria-hidden className="size-4" />
          Email
        </a>
      </div>
    </section>
  );
}
