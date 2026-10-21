import type { Metadata } from "next";
import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Mail, Phone } from "lucide-react";
import { ArrowLink } from "@/components/ArrowLink";
import { ButtonLink } from "@/components/ButtonLink";
import { CtaBand } from "@/components/CtaBand";
import { FaqList } from "@/components/FaqList";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { ServiceIcon } from "@/components/ServiceIcon";
import { business, siteUrl } from "@/data/business";
import { allFaqs } from "@/data/faq";
import { getService, services } from "@/data/services";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const service = getService((await params).slug);
  if (!service) return {};
  return pageMetadata({
    title: service.heading,
    description: service.metaDescription,
    path: `/services/${service.slug}`,
  });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const service = getService((await params).slug);
  if (!service) notFound();

  const faqs = service.faqIds.map((id) => allFaqs.find((f) => f.id === id)!);
  const related = service.related.map((slug) => getService(slug)!);

  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.lead,
    ...(siteUrl ? { url: `${siteUrl}/services/${service.slug}` } : {}),
    provider: { "@type": "AutoRepair", name: business.name, telephone: business.phone.e164 },
    areaServed: { "@type": "City", name: business.address.city },
  };

  return (
    <>
      <PageHero
        eyebrow="Services"
        title={service.heading}
        crumbs={[
          { label: "Services", href: "/services" },
          { label: service.title, href: `/services/${service.slug}` },
        ]}
        image={{ src: service.image, alt: service.alt }}
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
        <p>{service.lead}</p>
      </PageHero>

      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-[1fr_21rem] lg:gap-20">
          <div className="space-y-14">
            {service.sections.map((section, i) => (
              <Fragment key={section.title}>
                <section aria-labelledby={`s${i}`} className="reveal">
                  <h2 id={`s${i}`} className="flex gap-4 text-2xl font-bold leading-tight sm:text-3xl">
                    <span
                      aria-hidden
                      className="font-display text-base font-bold tabular-nums text-brand sm:text-lg sm:leading-[2.1rem]"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {section.title}
                  </h2>
                  <div className="mt-5 space-y-4 pl-0 text-lg leading-relaxed text-muted sm:pl-10">
                    {section.paragraphs?.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                    {section.list && (
                      <ul className="space-y-3 text-ink">
                        {section.list.map((item) => (
                          <li key={item} className="flex gap-3 text-[1.02rem]">
                            <Check aria-hidden className="mt-1 size-4 shrink-0 text-brand" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
                {i === 0 && service.figure && (
                  <figure className="reveal">
                    <div className="rake relative aspect-[16/9] overflow-hidden bg-mist">
                      <Image
                        src={service.figure.image}
                        alt={service.figure.alt}
                        fill
                        sizes="(min-width: 1024px) 55vw, 100vw"
                        placeholder="blur"
                        className="object-cover"
                      />
                    </div>
                    {service.figure.caption && (
                      <figcaption className="mt-3 text-sm text-muted">{service.figure.caption}</figcaption>
                    )}
                  </figure>
                )}
              </Fragment>
            ))}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="border border-line">
              <div className="flex items-center gap-3 bg-mist px-6 py-4 text-brand">
                <ServiceIcon slug={service.slug} className="size-8" />
                <p className="font-display font-bold text-ink">At a glance</p>
              </div>
              <dl className="divide-y divide-line px-6">
                {service.glance.map((g) => (
                  <div key={g.label} className="py-4">
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{g.label}</dt>
                    <dd className="mt-1 font-medium">{g.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="on-dark bg-ink p-6 text-white">
              <p className="font-display text-xl font-bold leading-snug">Talk to us about your vehicle</p>
              <p className="mt-2 text-[0.95rem] text-white/70">
                Call or email with your vehicle details and a description of the damage.
              </p>
              <a
                href={business.phone.href}
                className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand font-semibold hover:bg-brand-deep"
              >
                <Phone aria-hidden className="size-4" />
                {business.phone.display}
              </a>
              <a
                href={business.emailHref}
                className="mt-3 block break-all text-center text-[0.9rem] text-brand-soft underline-offset-4 hover:underline"
              >
                {business.email}
              </a>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-mist py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="reveal">
            <SectionHeading eyebrow="FAQ" title={`Questions about ${service.title.toLowerCase()}`}>
              <p>More answers are on the full FAQ page.</p>
            </SectionHeading>
            <ArrowLink href="/faq" className="mt-8">
              View all FAQs
            </ArrowLink>
          </div>
          <div className="reveal bg-white px-6">
            <FaqList items={faqs} />
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal">
            <SectionHeading eyebrow="Related" title="Other services" />
          </div>
          <ul className="mt-12 grid gap-8 md:grid-cols-2">
            {related.map((r) => (
              <li key={r.slug} className="reveal">
                <article className="group relative grid grid-cols-[7.5rem_1fr] items-center gap-6 border border-line p-5 transition-colors hover:border-ink sm:grid-cols-[10rem_1fr]">
                  <div className="rake rake-sm relative aspect-square overflow-hidden bg-mist">
                    <Image src={r.image} alt="" fill sizes="160px" placeholder="blur" className="object-cover" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold leading-snug">
                      <Link href={`/services/${r.slug}`} className="stretch hover:text-brand-deep">
                        {r.title}
                      </Link>
                    </h3>
                    <p className="mt-2 hidden text-[0.95rem] leading-relaxed text-muted sm:block">{r.summary}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
