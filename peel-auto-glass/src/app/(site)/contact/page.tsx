import Image from "next/image";
import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import mirror from "@/assets/images/contact-mirror.jpg";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { business } from "@/data/business";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Contact Us",
  description:
    "Contact Peel Auto Glass in Mississauga, Ontario. Call +1 437-339-9054 or email peelautoglass@yahoo.com about windshield, side window or rear glass repair and replacement.",
  path: "/contact",
});

const block = "border-t border-line py-8 first:border-t-0 first:pt-0";
const label = "text-xs font-semibold uppercase tracking-[0.16em] text-muted";

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact Us" title="Talk to Peel Auto Glass" crumbs={[{ label: "Contact Us", href: "/contact" }]}>
        <p>Call or email us with your vehicle details and a description of the damage.</p>
      </PageHero>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-16 px-5 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
          <div>
            <div className={block}>
              <p className={label}>Phone</p>
              <a
                href={business.phone.href}
                className="mt-2 block font-display text-3xl font-bold tracking-tight hover:text-brand-deep sm:text-4xl"
              >
                {business.phone.display}
              </a>
              <ButtonLink href={business.phone.href} className="mt-5">
                <Phone aria-hidden />
                Call Us
              </ButtonLink>
            </div>

            <div className={block}>
              <p className={label}>Email</p>
              <a
                href={business.emailHref}
                className="mt-2 block break-all font-display text-2xl font-bold tracking-tight hover:text-brand-deep sm:text-3xl"
              >
                {business.email}
              </a>
              <ButtonLink href={business.emailHref} variant="outline-dark" className="mt-5">
                <Mail aria-hidden />
                Email Us
              </ButtonLink>
            </div>

            <div className={block}>
              <p className={label}>Address</p>
              <address className="mt-2 flex gap-3 font-display text-2xl font-bold not-italic leading-snug tracking-tight">
                <MapPin aria-hidden className="mt-1.5 size-6 shrink-0 text-brand" />
                <span>
                  {business.address.street}
                  <br />
                  {business.address.city}, {business.address.region}
                  <br />
                  {business.address.country}
                </span>
              </address>
              <ButtonLink href={business.directionsUrl} variant="outline-dark" className="mt-5" external>
                Get Directions
                <ExternalLink aria-hidden />
              </ButtonLink>
              <p className="mt-4 max-w-md text-[0.95rem] text-muted">
                Please call before visiting so we can confirm service details.
              </p>
            </div>
          </div>

          <aside>
            <div className="zoom relative aspect-[4/3] overflow-hidden rounded-sm bg-mist">
              <Image
                src={mirror}
                alt="Side mirror and window glass of a dark car, with a building reflected in the mirror"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                placeholder="blur"
                className="object-cover"
              />
            </div>
            <div className="mt-8 bg-mist p-7">
              <h2 className="text-xl font-bold">Have this ready when you contact us</h2>
              <ul className="mt-4 space-y-2.5 text-[0.98rem]">
                {[
                  "Your vehicle's year, make and model",
                  "Which glass is damaged: windshield, side window or rear window",
                  "Where the damage is and roughly how large it is",
                  "Photos of the damage, if you are emailing",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span aria-hidden className="mt-[0.7em] h-0.5 w-4 shrink-0 bg-brand" />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[0.95rem] text-muted">
                This website does not have an online booking or quote form. Please contact us by phone or email.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
