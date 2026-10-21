import Image from "next/image";
import { Check } from "lucide-react";
import chip from "@/assets/images/repair-chip.jpg";
import crack from "@/assets/images/repair-crack.jpg";
import { ArrowLink } from "@/components/ArrowLink";
import { SectionHeading } from "@/components/SectionHeading";
import { repairWhen, replaceWhen } from "@/data/guidance";

const col = "border-t-2 pt-5";

export function RepairOrReplace() {
  return (
    <section className="bg-mist py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
        <div className="reveal grid grid-cols-[1.4fr_1fr] gap-3">
          <div className="rake rake-sm relative aspect-[3/4] bg-white">
            <Image
              src={crack}
              alt="A cracked windshield with a star-shaped impact point and long cracks spreading across the glass"
              fill
              sizes="(min-width: 1024px) 28vw, 55vw"
              placeholder="blur"
              className="object-cover"
            />
          </div>
          <div className="relative mt-12 aspect-[3/4] bg-white">
            <Image
              src={chip}
              alt="Close-up of a small star-shaped chip in glass with fine cracks radiating from the centre"
              fill
              sizes="(min-width: 1024px) 19vw, 38vw"
              placeholder="blur"
              className="object-cover"
            />
          </div>
        </div>

        <div className="reveal">
          <SectionHeading index="02" eyebrow="Repair or replace?" title="Not every chip needs a new windshield">
            <p>
              The size, type and position of the damage decide the answer. Here is the short version. The full guide
              covers it in more detail.
            </p>
          </SectionHeading>
          <div className="mt-9 grid gap-8 sm:grid-cols-2">
            <div className={`${col} border-brand`}>
              <h3 className="font-display text-lg font-bold">Repair may suit</h3>
              <ul className="mt-4 space-y-3 text-[0.95rem]">
                {repairWhen.map((t) => (
                  <li key={t} className="flex gap-3">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${col} border-ink`}>
              <h3 className="font-display text-lg font-bold">Replacement is safer</h3>
              <ul className="mt-4 space-y-3 text-[0.95rem]">
                {replaceWhen.map((t) => (
                  <li key={t} className="flex gap-3">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-ink" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <ArrowLink href="/auto-glass-guide" className="mt-9">
            Read the auto glass guide
          </ArrowLink>
        </div>
      </div>
    </section>
  );
}
