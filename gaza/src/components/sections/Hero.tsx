import { Reveal } from '@/components/Reveal'
import { SceneSection } from './SceneSection'

export function Hero() {
  return (
    <SceneSection id="top" layout="bottom">
      <Reveal delay={600}>
        <h1 className="font-display text-6xl font-black leading-none tracking-[0.04em] text-cream sm:text-7xl">GAZA</h1>
      </Reveal>
      <Reveal delay={750}>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide3 text-cream/65 sm:text-sm">Portakallı ve Çay Aromalı İçecek</p>
      </Reveal>
      <Reveal delay={900}>
        <a
          href="#urun"
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-cream/20 px-6 py-3 text-[11px] font-semibold uppercase tracking-wide3 text-cream/85 transition-colors duration-300 hover:border-gaza-400/70 hover:text-gaza-300"
        >
          Keşfet <span aria-hidden="true">↓</span>
        </a>
      </Reveal>
    </SceneSection>
  )
}
