import Image from "next/image";
import { ArrowDown, Phone } from "lucide-react";
import hero from "@/assets/images/hero.jpg";
import { ButtonLink } from "@/components/ButtonLink";
import { business } from "@/data/business";

/** Full-screen opening: the photograph, the headline and two actions. Nothing else. */
export function Hero() {
  return (
    <section className="on-dark relative isolate flex min-h-[calc(100svh-4.5rem)] items-end overflow-hidden bg-ink text-white lg:items-center">
      <div className="glint absolute inset-0 -z-10">
        <Image
          src={hero}
          alt="Dark blue car with its side window glass reflecting a sunset sky and a bare tree"
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          className="object-cover object-[60%_38%]"
        />
        <div aria-hidden className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(10_19_38/0.94)_0%,rgb(10_19_38/0.72)_42%,rgb(10_19_38/0.1)_100%)] lg:block" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(0deg,rgb(10_19_38/0.96)_18%,rgb(10_19_38/0.45)_65%,rgb(10_19_38/0.2)_100%)] lg:hidden" />
      </div>
      <div aria-hidden className="cols -z-10" />

      <div className="mx-auto w-full max-w-6xl px-5 pb-32 pt-24 sm:pb-28 lg:py-28">
        <div className="max-w-3xl">
          <p className="hero-rise flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-soft">
            <span aria-hidden className="flex h-0.5 w-9">
              <span className="w-2/3 bg-brand" />
              <span className="w-1/3 bg-signal" />
            </span>
            Mississauga, Ontario
          </p>
          <h1 className="hero-rise hero-rise-2 mt-6 text-[2.75rem] font-bold leading-[1.02] sm:text-6xl lg:text-[4.75rem]">
            Professional Auto Glass Repair &amp; Replacement
          </h1>
          <p className="hero-rise hero-rise-3 mt-7 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">
            Reliable windshield, side window and rear glass services in Mississauga, Ontario.
          </p>
          <div className="hero-rise hero-rise-4 mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={business.phone.href}>
              <Phone aria-hidden />
              Call Us
            </ButtonLink>
            <ButtonLink href="/services" variant="outline-light">
              Our Services
            </ButtonLink>
          </div>
        </div>
      </div>

      <a
        href="#explore"
        className="hero-rise hero-rise-4 absolute bottom-6 right-5 hidden items-center gap-2 text-sm font-medium text-white/70 hover:text-white lg:flex xl:right-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]"
      >
        Explore
        <ArrowDown aria-hidden className="size-4" />
      </a>
    </section>
  );
}
