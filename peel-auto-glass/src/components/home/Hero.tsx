import Image from "next/image";
import { Phone } from "lucide-react";
import hero from "@/assets/images/hero.jpg";
import { ButtonLink } from "@/components/ButtonLink";
import { business } from "@/data/business";

export function Hero() {
  return (
    <section className="on-dark bg-ink text-white">
      <div className="grid lg:min-h-[41rem] lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left padding lines the copy up with the site's 72rem content column. */}
        <div className="flex items-center px-5 py-20 sm:px-10 lg:py-28 lg:pl-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))] lg:pr-16">
          <div className="max-w-2xl">
            <p className="hero-rise flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-soft">
              <span aria-hidden className="flex h-0.5 w-9">
                <span className="w-2/3 bg-brand" />
                <span className="w-1/3 bg-signal" />
              </span>
              Mississauga, Ontario
            </p>
            <h1 className="hero-rise hero-rise-2 mt-5 text-[2.5rem] font-bold leading-[1.04] sm:text-6xl lg:text-[3.75rem]">
              Professional Auto Glass Repair &amp; Replacement
            </h1>
            <p className="hero-rise hero-rise-3 mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
              Reliable windshield, side window and rear glass services in Mississauga, Ontario.
            </p>
            <div className="hero-rise hero-rise-4 mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={business.phone.href}>
                <Phone aria-hidden />
                Call Us
              </ButtonLink>
              <ButtonLink href="#services" variant="outline-light">
                Our Services
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="relative min-h-[22rem] sm:min-h-[30rem] lg:min-h-0">
          <Image
            src={hero}
            alt="Dark blue car with its side window glass reflecting a sunset sky and a bare tree"
            fill
            priority
            sizes="(min-width: 1024px) 48vw, 100vw"
            placeholder="blur"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
