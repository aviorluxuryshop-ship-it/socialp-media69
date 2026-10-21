import { Mail, MapPin, Phone } from "lucide-react";
import { business } from "@/data/business";

const item = "flex items-start gap-4 px-5 py-6 sm:px-8";
const label = "text-xs font-semibold uppercase tracking-[0.16em] text-muted";
const value = "mt-1 font-display text-lg font-semibold leading-snug text-ink";

/** Real contact details directly under the hero. */
export function ContactStrip() {
  return (
    <section aria-label="Contact details" className="border-b border-line bg-white">
      <div className="mx-auto grid max-w-6xl divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className={item}>
          <Phone aria-hidden className="mt-1 size-5 shrink-0 text-brand" />
          <div>
            <p className={label}>Call</p>
            <a href={business.phone.href} className={`${value} block hover:text-brand-deep`}>
              {business.phone.display}
            </a>
          </div>
        </div>
        <div className={item}>
          <Mail aria-hidden className="mt-1 size-5 shrink-0 text-brand" />
          <div>
            <p className={label}>Email</p>
            <a href={business.emailHref} className={`${value} block break-all hover:text-brand-deep`}>
              {business.email}
            </a>
          </div>
        </div>
        <div className={item}>
          <MapPin aria-hidden className="mt-1 size-5 shrink-0 text-brand" />
          <div>
            <p className={label}>Visit</p>
            <p className={value}>
              {business.address.street}, {business.address.city}, {business.address.regionCode}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
