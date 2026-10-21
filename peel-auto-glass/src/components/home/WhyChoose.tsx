import Image from "next/image";
import glass from "@/assets/images/glass-sky.jpg";
import { SectionHeading } from "@/components/SectionHeading";

const reasons = [
  {
    title: "An honest repair-or-replace assessment",
    text: "Not every chip can be repaired, and not every crack needs a new windshield. We look at the size, type and position of the damage and explain which option is appropriate.",
  },
  {
    title: "Glass matched to your vehicle",
    text: "Glass differs by make, model, year and features such as sensors, heating or antennas. We confirm what your vehicle needs before work begins.",
  },
  {
    title: "Clear communication",
    text: "You will know what the work involves and what to expect, in plain language, before you agree to go ahead.",
  },
  {
    title: "Professional workmanship",
    text: "Auto glass is a safety component, not just a window. We treat every repair and installation with the care that deserves.",
  },
];

export function WhyChoose() {
  return (
    <section className="bg-mist py-24 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="reveal lg:sticky lg:top-28 lg:self-start">
          <SectionHeading eyebrow="Why Peel Auto Glass" title="A careful, honest approach to auto glass">
            <p>Our approach is built on four simple commitments to the way we work with vehicle owners.</p>
          </SectionHeading>
          <div className="zoom relative mt-10 hidden aspect-[3/2] overflow-hidden rounded-sm lg:block">
            <Image
              src={glass}
              alt="Cloudy sky and trees reflected in a car window"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              placeholder="blur"
              className="object-cover"
            />
          </div>
        </div>

        <ol className="divide-y divide-line border-y border-line">
          {reasons.map((r, i) => (
            <li key={r.title} className="reveal grid grid-cols-[3.5rem_1fr] gap-4 py-8 sm:grid-cols-[4.5rem_1fr]">
              <span aria-hidden className="font-display text-3xl font-bold text-brand sm:text-4xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-xl font-bold leading-snug sm:text-2xl">{r.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{r.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
