import { Reveal } from '@/components/Reveal'
import { Footer } from '@/components/Footer'
import { COMMON, PRODUCTS } from '@/content/products'
import { useFlavor } from '@/state/flavor'
import { SceneSection } from './SceneSection'

export function FinalCTA() {
  const product = PRODUCTS[useFlavor()]

  return (
    <SceneSection id="final" layout="bottom" footer={<Footer />}>
      <Reveal>
        <h2 className="font-display text-5xl font-black leading-none tracking-[0.04em] text-cream sm:text-6xl">{COMMON.brand}</h2>
      </Reveal>
      <Reveal delay={100}>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide3 text-cream/65 sm:text-sm">{product.name}</p>
      </Reveal>
      <Reveal delay={180}>
        <p className="mt-2 text-xs font-semibold tracking-wide3 text-accent-400">{product.volume}</p>
      </Reveal>
      <Reveal delay={260}>
        <a
          href="#top"
          className="mt-8 inline-flex items-center rounded-full bg-accent-500 px-8 py-3 text-[11px] font-semibold uppercase tracking-wide3 text-void transition-colors duration-300 hover:bg-accent-400"
        >
          Başa dön <span aria-hidden="true">↑</span>
        </a>
      </Reveal>
    </SceneSection>
  )
}
