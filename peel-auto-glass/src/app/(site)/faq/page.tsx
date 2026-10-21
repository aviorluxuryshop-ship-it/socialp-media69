import Image from "next/image";
import crack from "@/assets/images/repair-crack.jpg";
import chip from "@/assets/images/repair-chip.jpg";
import { CtaBand } from "@/components/CtaBand";
import { FaqList } from "@/components/FaqList";
import { PageHero } from "@/components/PageHero";
import { faqGroups } from "@/data/faq";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "FAQ",
  description:
    "Answers about windshield repair, windshield replacement, side and rear window replacement, vehicle glass compatibility, estimates, appointments and insurance at Peel Auto Glass in Mississauga.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <PageHero eyebrow="FAQ" title="Frequently asked questions" crumbs={[{ label: "FAQ", href: "/faq" }]}>
        <p>
          Straight answers about repair, replacement, pricing and appointments. If your question is not here, call or
          email us.
        </p>
      </PageHero>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[15rem_1fr] lg:gap-16 lg:py-24">
        <nav aria-label="FAQ topics" className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Topics</p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 lg:block lg:space-y-1">
            {faqGroups.map((g) => (
              <li key={g.id}>
                <a
                  href={`#${g.id}`}
                  className="inline-block py-1.5 font-medium text-ink hover:text-brand-deep lg:border-l-2 lg:border-line lg:py-2 lg:pl-4 lg:hover:border-brand"
                >
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-20">
          {faqGroups.map((group, index) => (
            <section key={group.id} id={group.id} aria-labelledby={`${group.id}-title`} className="scroll-mt-28">
              <h2 id={`${group.id}-title`} className="text-2xl font-bold leading-tight sm:text-3xl">
                {group.title}
              </h2>
              {group.intro && <p className="mt-3 max-w-2xl leading-relaxed text-muted">{group.intro}</p>}

              {index === 0 && (
                <figure className="mt-8 grid grid-cols-[1.5fr_1fr] gap-3">
                  <div className="relative aspect-[3/2] overflow-hidden rounded-sm bg-mist">
                    <Image
                      src={crack}
                      alt="A cracked windshield with a star-shaped impact point and long cracks spreading across the glass"
                      fill
                      sizes="(min-width: 1024px) 28vw, 55vw"
                      placeholder="blur"
                      className="object-cover"
                    />
                  </div>
                  <div className="relative aspect-[3/2] overflow-hidden rounded-sm bg-mist">
                    <Image
                      src={chip}
                      alt="Close-up of a small star-shaped chip in glass with fine cracks radiating from the centre"
                      fill
                      sizes="(min-width: 1024px) 19vw, 38vw"
                      placeholder="blur"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="col-span-2 text-sm text-muted">
                    Two kinds of windshield damage: a star-shaped impact with long cracks, and a small chip. Send us a
                    description or photos and we will tell you what we recommend.
                  </figcaption>
                </figure>
              )}

              <div className="mt-8">
                <FaqList items={group.items} />
              </div>
            </section>
          ))}
        </div>
      </div>

      <CtaBand title="Still have a question?" text="Call or email us and we will help." />
    </>
  );
}
