import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import installers from "@/assets/images/about-installers.jpg";
import glass from "@/assets/images/glass-sky.jpg";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { approach } from "@/data/approach";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "About Us",
  description:
    "Peel Auto Glass is an auto glass business in Mississauga, Ontario, focused on windshield repair and replacement, side window replacement and rear windshield replacement.",
  path: "/about",
});

const explore = [
  { href: "/services", title: "Our services", text: "Windshield repair and replacement, side and rear glass." },
  { href: "/how-it-works", title: "How it works", text: "From your first call to the finished work." },
  { href: "/auto-glass-guide", title: "Auto glass guide", text: "Repair or replace? What decides it." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="Auto glass handled with care and clear advice"
        crumbs={[{ label: "About Us", href: "/about" }]}
        image={{
          src: installers,
          alt: "Two technicians in blue gloves fitting a windshield to a car with suction-cup lifters",
        }}
      >
        <p>
          Peel Auto Glass is an auto glass business in Mississauga, Ontario, focused on windshield repair and
          replacement, side window replacement and rear windshield replacement.
        </p>
      </PageHero>

      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div className="reveal">
            <SectionHeading index="01" eyebrow="Our purpose" title="Why we do this work" />
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
          <div className="reveal">
            <div className="zoom rake relative aspect-[3/2] overflow-hidden bg-mist">
              <Image
                src={glass}
                alt="Cloudy sky and trees reflected in a car window"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                placeholder="blur"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-mist py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal">
            <SectionHeading index="02" eyebrow="Our approach" title="Four commitments to the way we work" />
          </div>
          <ol className="mt-14 grid gap-px bg-line md:grid-cols-2">
            {approach.map((a, i) => (
              <li key={a.title} className="reveal grid grid-cols-[3.5rem_1fr] gap-4 bg-mist p-0 py-8 md:bg-white md:p-10">
                <span aria-hidden className="font-display text-4xl font-bold text-brand">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-xl font-bold leading-snug sm:text-2xl">{a.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{a.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal">
            <SectionHeading index="03" eyebrow="Explore" title="Find out more" />
          </div>
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {explore.map((e) => (
              <li key={e.href} className="reveal">
                <div className="group relative h-full border border-line p-7 transition-colors hover:border-ink">
                  <h3 className="text-xl font-bold">
                    <Link href={e.href} className="stretch hover:text-brand-deep">
                      {e.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-muted">{e.text}</p>
                  <ArrowRight aria-hidden className="mt-6 size-5 text-brand transition-transform group-hover:translate-x-1" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
