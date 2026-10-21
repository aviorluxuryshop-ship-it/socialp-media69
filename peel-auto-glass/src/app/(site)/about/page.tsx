import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import installers from "@/assets/images/about-installers.jpg";
import { ButtonLink } from "@/components/ButtonLink";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { business } from "@/data/business";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "About Us",
  description:
    "Peel Auto Glass is an auto glass business in Mississauga, Ontario, focused on windshield repair and replacement, side window replacement and rear windshield replacement.",
  path: "/about",
});

const principles = [
  {
    title: "Assess before we recommend",
    text: "We look at what the damage is, where it is and how large it is before suggesting repair or replacement. Some damage can be repaired. For other damage, replacement is the better answer.",
  },
  {
    title: "Match the glass to the vehicle",
    text: "Glass varies by make, model and year. We confirm what your vehicle needs, including features such as sensors, heating or antennas, before the work begins.",
  },
  {
    title: "Explain, then do the work",
    text: "We tell you what we recommend and why, in plain language, and complete the work you agree to.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About Us" title="Auto glass handled with care and clear advice">
        <p>
          Peel Auto Glass is an auto glass business in Mississauga, Ontario, focused on windshield repair and
          replacement, side window replacement and rear windshield replacement.
        </p>
      </PageHero>

      <section className="bg-white py-24 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-2 lg:gap-20">
          <div className="reveal">
            <div className="relative aspect-[16/9] overflow-hidden rounded-sm bg-mist">
              <Image
                src={installers}
                alt="Two technicians in blue gloves fitting a windshield to a car with suction-cup lifters"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                placeholder="blur"
                className="object-cover"
              />
            </div>
            <p className="mt-3 text-sm text-muted">Windshield installation requires care and the right tools.</p>
          </div>
          <div className="reveal">
            <SectionHeading eyebrow="Our purpose" title="Why we do this work" />
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-muted">
              <p>
                Vehicle glass does more than let you see out. A windshield gives you a clear view of the road and
                contributes to the strength of your vehicle&rsquo;s structure, while side and rear windows protect you
                and your passengers.
              </p>
              <p>
                When glass is damaged, you deserve straightforward advice about what to do next. Peel Auto Glass exists
                to help vehicle owners in Mississauga and the surrounding area restore damaged glass with honest
                recommendations, clear communication and careful workmanship.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-mist py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal">
            <SectionHeading eyebrow="Our approach" title="How we approach auto glass" />
          </div>
          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {principles.map((p, i) => (
              <li key={p.title} className="reveal border-t-2 border-ink pt-6">
                <span aria-hidden className="font-display text-sm font-bold uppercase tracking-[0.18em] text-brand-deep">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-2xl font-bold leading-tight">{p.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="on-dark bg-ink py-20 text-white sm:py-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 md:flex-row md:items-center md:justify-between">
          <div className="reveal max-w-2xl">
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">Have damaged glass on your vehicle?</h2>
            <p className="mt-4 text-lg text-white/75">
              Call or email us with your vehicle details and a description of the damage.
            </p>
          </div>
          <div className="reveal flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={business.phone.href}>
              <Phone aria-hidden />
              Call Us
            </ButtonLink>
            <ButtonLink href={business.emailHref} variant="outline-light">
              <Mail aria-hidden />
              Email Us
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
