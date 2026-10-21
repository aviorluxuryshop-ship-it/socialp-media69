import Image from "next/image";
import { ArrowRight, Check, Phone } from "lucide-react";
import { site } from "@/data/site";

const chips = ["Free quotes", "Mobile service", "Insurance claims handled"];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-navy-950 text-white">
      <div aria-hidden className="hero-glow absolute inset-0" />
      <div aria-hidden className="glass-grid absolute inset-0" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-28 md:grid-cols-[1.1fr_0.9fr] md:pb-24 md:pt-32 lg:pt-36">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-cyan">
            {site.region}
          </p>
          <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Cracked windshield?{" "}
            <span className="bg-linear-to-r from-brand-cyan via-white to-brand-red bg-clip-text text-transparent">
              Sorted fast.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
            {site.tagline} for drivers in Mississauga, Brampton and Caledon. Quality glass, careful fitting and a clear
            price before we start.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#quote"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-blue px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-brand-blue/30 transition hover:brightness-110"
            >
              Get a free quote <ArrowRight className="size-5" aria-hidden />
            </a>
            <a
              href={`tel:${site.phone.tel}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-base font-bold text-white transition hover:bg-white/10"
            >
              <Phone className="size-5" aria-hidden /> {site.phone.display}
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-white/80">
            {chips.map((c) => (
              <li key={c} className="inline-flex items-center gap-2">
                <Check className="size-4 text-brand-cyan" aria-hidden /> {c}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md md:max-w-none">
          <Image
            src="/logo.webp"
            alt="Peel Auto Glass logo — a technician holding a windshield in front of a blue car"
            width={1013}
            height={1100}
            priority
            sizes="(min-width: 768px) 42vw, 90vw"
            className="animate-float mx-auto h-auto w-full max-w-[460px] drop-shadow-[0_30px_60px_rgba(20,86,255,0.35)]"
          />
        </div>
      </div>
    </section>
  );
}
