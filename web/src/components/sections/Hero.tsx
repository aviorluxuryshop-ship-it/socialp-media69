import Link from 'next/link';
import { Picture } from '../Picture';
import { Lines } from '../Type';
import type { Dict } from '@/content/tr';
import type { Locale } from '@/content/site';
import { anchors, homePath } from '@/lib/dict';

/**
 * Cinematic hero.
 *
 * Depth is built from real layers rather than an effect: a darkened backdrop
 * plate, then project photography floating on a CSS 3D stage at different
 * z-depths, with the headline deliberately sandwiched between those layers so
 * type and image occlude each other. The pointer drives each layer at a
 * different rate (`data-depth`) and tilts the whole stage a few degrees
 * (`data-tilt`); scroll sinks the composition (`data-hero-*`).
 *
 * All of it is transform/opacity only, and all of it is inert without JS.
 */
export function Hero({ dict, locale }: { dict: Dict; locale: Locale }) {
  const home = homePath(locale);

  return (
    <section
      data-hero
      className="relative isolate grid min-h-[100svh] grid-rows-[1fr_auto] overflow-hidden pt-24 grain"
      aria-labelledby="hero-title"
    >
      {/* --- Backdrop plate ------------------------------------------------ */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div data-hero-bed data-depth="14" className="absolute -inset-[6%]">
          <Picture
            id="mekan-video-kurulum"
            alt=""
            sizes="100vw"
            priority
            position="50% 42%"
            className="cover opacity-40"
          />
        </div>
        {/* Two-stop scrim keeps the headline legible over any part of the plate. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_20%,var(--color-ink)_100%)]" />
        <div className="glow" />
      </div>

      {/* --- Floating media frames ----------------------------------------- */}
      {/* They occupy the right margin the headline deliberately leaves free,
          overlapping it only at the edges so type and image interlock. */}
      <div className="stage pointer-events-none absolute inset-0 -z-[5]" aria-hidden="true">
        <div data-tilt="5" className="stage-inner absolute inset-0">
          <div
            data-depth="38"
            data-parallax="-14"
            className="absolute right-[-3%] top-[12%] hidden w-[24vw] max-w-[20rem] md:block"
            style={{ transform: 'translateZ(-90px)' }}
          >
            <div data-img-reveal className="media aspect-[3/4] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
              <Picture id="showroom-otomotiv" alt="" sizes="22vw" priority className="cover" />
            </div>
          </div>

          {/* Deepest layer, only where there is room to spare. */}
          <div
            data-depth="14"
            data-parallax="-6"
            className="absolute left-[2%] top-[9%] hidden w-[11vw] max-w-[9rem] 2xl:block"
            style={{ transform: 'translateZ(-170px)' }}
          >
            <div data-img-reveal className="media aspect-[4/5] opacity-55">
              <Picture id="restoran-masa" alt="" sizes="11vw" className="cover" />
            </div>
          </div>
        </div>
      </div>

      {/* --- Copy ----------------------------------------------------------- */}
      <div data-hero-copy className="shell relative z-20 flex flex-col justify-center">
        <p className="kicker mb-7 flex items-center gap-3 text-mist">
          <span className="inline-block h-px w-10 bg-signal" aria-hidden="true" />
          {dict.hero.eyebrow}
        </p>

        {/* Capped short of the shell so the frame column stays clear. */}
        <Lines
          as="h1"
          id="hero-title"
          lines={dict.hero.lines}
          className="display display-hero max-w-[min(100%,72rem)]"
        />

        <div className="mt-8 flex max-w-xl flex-col gap-6 sm:mt-10 sm:gap-7">
          <p data-reveal="up" className="lead text-mist">
            {dict.hero.lead}
          </p>
          <div data-reveal="up" className="flex flex-col gap-3 sm:flex-row">
            <Link href={`${home}#${anchors.contact}`} className="btn btn-solid flex-1 sm:flex-none" data-magnetic>
              {dict.hero.primaryCta}
            </Link>
            <Link href={`${home}#${anchors.work}`} className="btn btn-ghost flex-1 sm:flex-none" data-magnetic>
              {dict.hero.secondaryCta}
            </Link>
          </div>

          {/*
           * Small screens get their own composition rather than a shrunken
           * desktop one: the floating frames do not survive at this width, so
           * two staggered plates carry the photography instead.
           */}
          <div className="mt-2 grid grid-cols-2 gap-3 md:hidden" aria-hidden="true">
            <div data-img-reveal className="media aspect-square">
              <Picture id="showroom-otomotiv" alt="" sizes="45vw" priority className="cover" />
            </div>
            <div data-img-reveal className="media aspect-square translate-y-5">
              <Picture id="guzellik-merkezi" alt="" sizes="45vw" position="55% 40%" className="cover" />
            </div>
          </div>
        </div>
      </div>

      {/* Front plane: overlaps the back frame's lower-left corner, which is what
          actually sells the depth — two planes, clearly at different distances. */}
      <div
        data-depth="64"
        data-parallax="22"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[22%] right-[14%] z-30 hidden w-[13vw] max-w-[10.5rem] lg:block"
      >
        <div data-img-reveal className="media aspect-[4/5] shadow-[0_40px_120px_-24px_rgba(0,0,0,0.95)]">
          <Picture id="guzellik-merkezi" alt="" sizes="13vw" position="55% 40%" className="cover" />
        </div>
      </div>

      {/* --- Foot: scroll cue + service ticker ------------------------------ */}
      <div className="relative z-20 mt-10">
        <div className="shell mb-4 flex items-end justify-between gap-6">
          <p className="kicker flex items-center gap-3 text-mist-dim">
            <span className="relative flex h-8 w-4 items-start justify-center rounded-full border border-white/25 pt-1.5">
              <span className="scroll-bead h-1.5 w-px bg-white/70" />
            </span>
            {dict.hero.scroll}
          </p>
          <p className="kicker hidden text-right text-mist-dim sm:block">
            {dict.manifesto.facts[2].value} · {dict.manifesto.facts[0].value}
          </p>
        </div>

        <div className="marquee hair border-y py-4" style={{ ['--drift' as string]: '38s' }}>
          <div className="marquee-track" aria-hidden="true">
            {[0, 1].map((pass) => (
              <ul key={pass} className="flex shrink-0 items-center">
                {dict.services.items.map((s) => (
                  <li key={s.no} className="flex items-center gap-6 px-6">
                    <span className="kicker text-signal-lift">{s.no}</span>
                    <span className="display text-lg tracking-tight sm:text-xl">{s.title}</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
