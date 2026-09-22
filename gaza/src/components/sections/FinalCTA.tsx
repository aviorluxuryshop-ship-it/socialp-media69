import { Reveal } from '@/components/Reveal'
import { Footer } from '@/components/Footer'
import { SceneSection } from './SceneSection'

export function FinalCTA() {
  return (
    <SceneSection id="final" layout="bottom" footer={<Footer />}>
      <Reveal>
        <h2 className="font-display text-5xl font-black leading-none tracking-[0.04em] text-cream sm:text-6xl">GAZA</h2>
      </Reveal>
      <Reveal delay={100}>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide3 text-cream/65 sm:text-sm">Portakallı ve Çay Aromalı İçecek</p>
      </Reveal>
      <Reveal delay={180}>
        <p className="mt-2 text-xs font-semibold tracking-wide3 text-gaza-400">330 ml</p>
      </Reveal>
      <Reveal delay={260}>
        <a
          href="#top"
          className="mt-8 inline-flex items-center rounded-full bg-gaza-500 px-8 py-3 text-[11px] font-semibold uppercase tracking-wide3 text-void transition-colors duration-300 hover:bg-gaza-400"
        >
          Keşfet
        </a>
      </Reveal>
    </SceneSection>
  )
}
