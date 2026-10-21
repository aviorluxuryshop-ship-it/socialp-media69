import { Check } from "lucide-react";
import { ArrowLink } from "@/components/ArrowLink";
import { CtaBand } from "@/components/CtaBand";
import { FaqList } from "@/components/FaqList";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { allFaqs } from "@/data/faq";
import { tellUs } from "@/data/guidance";
import { steps } from "@/data/process";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "How It Works",
  description:
    "How Peel Auto Glass works with you, from your first call or email to the finished repair or replacement of your vehicle's glass in Mississauga, Ontario.",
  path: "/how-it-works",
});

const confirmed = [
  "Pricing for your vehicle and the type of work",
  "Appointment availability and how long the work takes",
  "Where and when the work can be done",
  "Payment, and any documentation you may need for an insurance claim",
];

export default function HowItWorksPage() {
  const faqs = ["estimate", "appointments", "location"].map((id) => allFaqs.find((f) => f.id === id)!);

  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="From first call to finished glass"
        crumbs={[{ label: "How It Works", href: "/how-it-works" }]}
      >
        <p>
          Four simple steps. There is no online form to fill in: you talk to us directly, and we explain your options
          before any work begins.
        </p>
      </PageHero>

      <section className="bg-white py-16 sm:py-24">
        <ol className="mx-auto max-w-6xl px-5">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="reveal grid gap-6 border-t border-line py-10 first:border-t-0 md:grid-cols-[7rem_1fr_1fr] md:gap-10 md:py-14"
            >
              <span aria-hidden className="font-display text-6xl font-bold leading-none text-brand md:text-7xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{s.title}</h2>
                <p className="mt-4 text-lg leading-relaxed text-muted">{s.text}</p>
              </div>
              <ul className="space-y-3 bg-mist p-6 md:self-start">
                {s.details.map((d) => (
                  <li key={d} className="flex gap-3 text-[0.98rem]">
                    <Check aria-hidden className="mt-1 size-4 shrink-0 text-brand" />
                    {d}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="on-dark relative isolate overflow-hidden bg-ink py-20 text-white sm:py-24">
        <div aria-hidden className="cols" />
        <div className="relative mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-2 lg:gap-20">
          <div className="reveal">
            <SectionHeading eyebrow="Before you call" title="Have this ready" dark>
              <p>It helps us give you a useful answer the first time.</p>
            </SectionHeading>
            <ul className="mt-8 space-y-4">
              {tellUs.map((t) => (
                <li key={t} className="flex gap-3 text-lg">
                  <Check aria-hidden className="mt-1.5 size-4 shrink-0 text-brand-soft" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="reveal">
            <SectionHeading eyebrow="Confirmed with you" title="What we confirm directly" dark>
              <p>
                We do not publish prices, turnaround times or insurance arrangements on this website. They depend on
                your vehicle and the job.
              </p>
            </SectionHeading>
            <ul className="mt-8 space-y-4">
              {confirmed.map((t) => (
                <li key={t} className="flex gap-3 text-lg">
                  <Check aria-hidden className="mt-1.5 size-4 shrink-0 text-brand-soft" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="reveal">
            <SectionHeading eyebrow="FAQ" title="Questions about the process" />
            <ArrowLink href="/faq" className="mt-8">
              View all FAQs
            </ArrowLink>
          </div>
          <div className="reveal">
            <FaqList items={faqs} />
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
