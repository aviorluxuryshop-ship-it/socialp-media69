import { Plus } from "lucide-react";
import type { Faq } from "@/data/faq";

/**
 * Accordion built on native <details>/<summary>: keyboard and touch accessible
 * without JavaScript, with a smooth open transition where the browser supports it.
 */
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="faq divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="flex min-h-14 cursor-pointer items-start justify-between gap-6 py-5 text-left font-display text-lg font-semibold leading-snug text-ink hover:text-brand-deep">
            <span>{item.q}</span>
            <Plus aria-hidden className="faq-icon mt-1 size-5 shrink-0 text-brand" />
          </summary>
          <p className="max-w-3xl pb-6 pr-10 leading-relaxed text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
