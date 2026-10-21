import Image from "next/image";
import Link from "next/link";
import { Check, Mail, Phone } from "lucide-react";
import { ArrowLink } from "@/components/ArrowLink";
import { ButtonLink } from "@/components/ButtonLink";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { ServiceIcon } from "@/components/ServiceIcon";
import { business } from "@/data/business";
import { services } from "@/data/services";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Auto Glass Services in Mississauga",
  description:
    "Windshield repair, windshield replacement, side window replacement and rear windshield replacement in Mississauga, Ontario. See what Peel Auto Glass offers.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Auto glass services in Mississauga"
        crumbs={[{ label: "Services", href: "/services" }]}
        actions={
          <>
            <ButtonLink href={business.phone.href}>
              <Phone aria-hidden />
              Call Us
            </ButtonLink>
            <ButtonLink href={business.emailHref} variant="outline-light">
              <Mail aria-hidden />
              Email Us
            </ButtonLink>
          </>
        }
      >
        <p>
          Repair when the damage is suitable. Replacement when it is not. Choose a service below, or call us and
          we will help you work out which one you need.
        </p>
      </PageHero>

      <section className="bg-white">
        <ol className="mx-auto max-w-6xl divide-y divide-line px-5">
          {services.map((s, i) => (
            <li key={s.slug} className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:gap-20">
              <div className={`reveal ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                <div className="zoom rake relative aspect-[4/3] overflow-hidden bg-mist">
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    placeholder="blur"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="reveal">
                <div className="flex items-center gap-4 text-brand">
                  <ServiceIcon slug={s.slug} className="size-11" />
                  <span aria-hidden className="font-display text-sm font-bold tabular-nums tracking-[0.18em] text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h2 className="mt-5 text-3xl font-bold leading-[1.1] sm:text-4xl">{s.title}</h2>
                <p className="mt-4 text-lg leading-relaxed text-muted">{s.lead}</p>
                <ul className="mt-6 space-y-3">
                  {s.glance.slice(0, 2).map((g) => (
                    <li key={g.label} className="flex gap-3">
                      <Check aria-hidden className="mt-1 size-4 shrink-0 text-brand" />
                      <span>
                        <span className="font-semibold">{g.label}:</span> {g.value}
                      </span>
                    </li>
                  ))}
                </ul>
                <ArrowLink href={`/services/${s.slug}`} className="mt-8">
                  {s.title} details
                </ArrowLink>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-mist py-20 sm:py-24">
        <div className="reveal mx-auto grid max-w-6xl items-center gap-8 px-5 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
          <SectionHeading eyebrow="Not sure?" title="Not sure which service you need?">
            <p>
              Describe the damage and your vehicle and we will tell you what we recommend. Our guide explains how
              repair and replacement differ, and what to have ready when you call.
            </p>
          </SectionHeading>
          <div className="flex flex-col gap-4 lg:items-start">
            <ArrowLink href="/auto-glass-guide">Read the auto glass guide</ArrowLink>
            <ArrowLink href="/how-it-works">See how it works</ArrowLink>
            <Link href="/faq" className="link-arrow inline-flex items-center gap-2 font-semibold text-brand-deep hover:text-brand">
              Browse the FAQ
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
