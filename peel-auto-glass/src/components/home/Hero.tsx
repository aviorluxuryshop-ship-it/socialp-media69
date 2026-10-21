import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import hero from "@/assets/images/hero.jpg";
import { ButtonLink } from "@/components/ButtonLink";
import { business } from "@/data/business";
import { services } from "@/data/services";

export function Hero() {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-ink text-white">
      <div aria-hidden className="cols" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-24">
        <div>
          <p className="hero-rise flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-soft">
            <span aria-hidden className="flex h-0.5 w-9">
              <span className="w-2/3 bg-brand" />
              <span className="w-1/3 bg-signal" />
            </span>
            Mississauga, Ontario
          </p>
          <h1 className="hero-rise hero-rise-2 mt-6 text-[2.6rem] font-bold leading-[1.02] sm:text-6xl lg:text-[4.25rem]">
            Professional Auto Glass Repair &amp; Replacement
          </h1>
          <p className="hero-rise hero-rise-3 mt-7 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
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
          <ul aria-label="Services" className="hero-rise hero-rise-4 mt-10 flex flex-wrap gap-2">
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-white/20 px-4 text-sm font-medium text-white/85 transition-colors hover:border-white/60 hover:bg-white/10 hover:text-white"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="hero-rise hero-rise-3 relative lg:pb-6">
          <div className="glint rake relative aspect-[4/5] bg-navy sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src={hero}
              alt="Dark blue car with its side window glass reflecting a sunset sky and a bare tree"
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 100vw"
              placeholder="blur"
              className="object-cover"
            />
          </div>
          <div className="relative -mt-8 ml-4 max-w-[17rem] bg-white p-5 text-ink shadow-[0_20px_50px_-12px_rgb(0_0_0/0.5)] sm:ml-8 lg:absolute lg:-bottom-0 lg:-left-8 lg:mt-0 lg:ml-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              <MapPin aria-hidden className="size-4 text-brand" />
              Visit us
            </p>
            <p className="mt-2 font-display text-lg font-bold leading-snug">
              {business.address.street}
              <br />
              {business.address.city}, {business.address.regionCode}
            </p>
            <p className="mt-2 text-sm text-muted">Please call before visiting.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
