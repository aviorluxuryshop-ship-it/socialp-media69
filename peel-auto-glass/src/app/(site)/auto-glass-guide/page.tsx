import Image from "next/image";
import { Check, Mail, Phone } from "lucide-react";
import chip from "@/assets/images/repair-chip.jpg";
import crack from "@/assets/images/repair-crack.jpg";
import { ArrowLink } from "@/components/ArrowLink";
import { ButtonLink } from "@/components/ButtonLink";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { business } from "@/data/business";
import { repairWhen, replaceWhen, tellUs } from "@/data/guidance";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Auto Glass Guide: Repair or Replace?",
  description:
    "A plain-language guide to windshield chips and cracks, when repair may be suitable, when replacement is safer, and what to tell Peel Auto Glass in Mississauga when you call.",
  path: "/auto-glass-guide",
});

const kinds = [
  {
    title: "A chip",
    text: "A small impact mark, often star-shaped, sometimes with fine cracks radiating from the centre. Small chips can often be repaired.",
  },
  {
    title: "A crack",
    text: "A line running through the glass. Short cracks may be repairable. Cracks that are long, spreading or near the edge usually call for replacement.",
  },
  {
    title: "Broken side or rear glass",
    text: "Side windows are normally tempered glass, designed to break into small pieces rather than crack in a line, so they are generally replaced rather than repaired.",
  },
];

export default function GuidePage() {
  return (
    <>
      <PageHero
        eyebrow="Guide"
        title="Repair or replace? A plain-language guide to auto glass damage"
        crumbs={[{ label: "Auto Glass Guide", href: "/auto-glass-guide" }]}
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
          What the damage on your glass means, and what usually decides between repair and replacement. This is
          general information: every vehicle and every piece of damage is different, so we assess yours before
          recommending anything.
        </p>
      </PageHero>

      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal">
            <SectionHeading index="01" eyebrow="Know what you are looking at" title="Chip, crack or break?" />
          </div>
          <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <ol className="divide-y divide-line border-y border-line">
              {kinds.map((k, i) => (
                <li key={k.title} className="reveal grid grid-cols-[3.5rem_1fr] gap-4 py-7 sm:grid-cols-[4.5rem_1fr]">
                  <span aria-hidden className="font-display text-3xl font-bold text-brand sm:text-4xl">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold leading-snug sm:text-2xl">{k.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{k.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <figure className="reveal">
              <div className="grid grid-cols-[1.5fr_1fr] gap-3">
                <div className="rake rake-sm relative aspect-[3/4] self-start bg-mist">
                  <Image
                    src={crack}
                    alt="A cracked windshield with a star-shaped impact point and long cracks spreading across the glass"
                    fill
                    sizes="(min-width: 1024px) 26vw, 55vw"
                    placeholder="blur"
                    className="object-cover"
                  />
                </div>
                <div className="relative mt-10 aspect-[3/4] self-start bg-mist">
                  <Image
                    src={chip}
                    alt="Close-up of a small star-shaped chip in glass with fine cracks radiating from the centre"
                    fill
                    sizes="(min-width: 1024px) 18vw, 38vw"
                    placeholder="blur"
                    className="object-cover"
                  />
                </div>
              </div>
              <figcaption className="mt-4 text-sm text-muted">
                A star-shaped impact with long cracks, and a small chip. Send us a description or photos and we will
                tell you what we recommend.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="bg-mist py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal">
            <SectionHeading index="02" eyebrow="The decision" title="When repair works, and when it does not">
              <p>
                These are guidelines, not promises. We look at the size, type and position of the damage on your
                windshield before recommending either.
              </p>
            </SectionHeading>
          </div>
          <div className="mt-12 grid gap-px bg-line md:grid-cols-2">
            <div className="reveal bg-white p-8 sm:p-10">
              <h3 className="font-display text-2xl font-bold">Repair may be suitable when</h3>
              <ul className="mt-6 space-y-4">
                {repairWhen.map((t) => (
                  <li key={t} className="flex gap-3">
                    <Check aria-hidden className="mt-1 size-4 shrink-0 text-brand" />
                    {t}
                  </li>
                ))}
              </ul>
              <ArrowLink href="/services/windshield-repair" className="mt-8">
                Windshield repair
              </ArrowLink>
            </div>
            <div className="reveal bg-white p-8 sm:p-10">
              <h3 className="font-display text-2xl font-bold">Replacement is usually safer when</h3>
              <ul className="mt-6 space-y-4">
                {replaceWhen.map((t) => (
                  <li key={t} className="flex gap-3">
                    <Check aria-hidden className="mt-1 size-4 shrink-0 text-ink" />
                    {t}
                  </li>
                ))}
              </ul>
              <ArrowLink href="/services/windshield-replacement" className="mt-8">
                Windshield replacement
              </ArrowLink>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-2 lg:gap-20">
          <div className="reveal">
            <SectionHeading index="03" eyebrow="Timing" title="Why it pays to act early" />
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-muted">
              <p>
                A chip or crack can spread as the vehicle flexes, as temperatures change, or as moisture and dirt work
                into the damage. Damage that could have been repaired may then need a full replacement.
              </p>
              <p>
                A windshield helps you see clearly and contributes to the strength of your vehicle&rsquo;s structure.
                Cracks can reduce visibility and weaken the glass, so have damage assessed as soon as you can. If you are
                unsure whether your vehicle is safe to drive, contact us.
              </p>
            </div>
          </div>
          <div className="reveal">
            <SectionHeading index="04" eyebrow="When you call" title="What to tell us" />
            <ul className="mt-6 space-y-4 text-lg">
              {tellUs.map((t) => (
                <li key={t} className="flex gap-3">
                  <Check aria-hidden className="mt-1.5 size-4 shrink-0 text-brand" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[0.95rem] text-muted">
              Pricing, appointment availability and insurance depend on your vehicle and policy, so we confirm them with
              you directly. Check your policy or ask your insurer what is covered.
            </p>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
