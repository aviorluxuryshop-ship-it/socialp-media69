import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { SectionHeading } from "@/components/SectionHeading";
import { business } from "@/data/business";

const label = "text-xs font-semibold uppercase tracking-[0.16em] text-white/55";

/** Dark contact band used on the homepage. */
export function ContactPanel() {
  return (
    <section id="contact" className="on-dark bg-ink py-24 text-white sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div className="reveal">
          <SectionHeading eyebrow="Contact" title="Talk to us about your vehicle's glass" dark>
            <p>
              Call or email with your vehicle details and a description of the damage. We will explain your options and
              confirm the details directly with you.
            </p>
          </SectionHeading>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={business.phone.href}>
              <Phone aria-hidden />
              Call {business.phone.short}
            </ButtonLink>
            <ButtonLink href={business.emailHref} variant="outline-light">
              <Mail aria-hidden />
              Email Us
            </ButtonLink>
          </div>
        </div>

        <dl className="reveal divide-y divide-white/15 border-y border-white/15">
          <div className="py-6">
            <dt className={label}>Phone</dt>
            <dd className="mt-2">
              <a href={business.phone.href} className="font-display text-2xl font-semibold hover:text-brand-soft">
                {business.phone.display}
              </a>
            </dd>
          </div>
          <div className="py-6">
            <dt className={label}>Email</dt>
            <dd className="mt-2">
              <a href={business.emailHref} className="break-all font-display text-xl font-semibold hover:text-brand-soft">
                {business.email}
              </a>
            </dd>
          </div>
          <div className="py-6">
            <dt className={label}>Address</dt>
            <dd className="mt-2">
              <address className="flex gap-3 text-lg not-italic leading-snug">
                <MapPin aria-hidden className="mt-1 size-5 shrink-0 text-brand-soft" />
                <span>
                  {business.address.street}
                  <br />
                  {business.address.city}, {business.address.region}, {business.address.country}
                </span>
              </address>
              <a
                href={business.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 font-semibold text-brand-soft underline-offset-4 hover:underline"
              >
                Get directions
                <ExternalLink aria-hidden className="size-4" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
