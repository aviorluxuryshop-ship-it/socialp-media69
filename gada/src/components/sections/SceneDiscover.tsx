import { Reveal } from '@/components/Reveal'
import { PRODUCTS } from '@/content/products'
import { useFlavor } from '@/state/flavor'
import { SceneSection } from './SceneSection'

export function SceneDiscover() {
  const product = PRODUCTS[useFlavor()]

  return (
    <SceneSection id="urun" layout="side">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-wide3 text-accent-400">Ürünü keşfet</p>
      </Reveal>
      <Reveal delay={100}>
        <h2 className="mt-4 font-display text-4xl font-bold leading-[1.1] text-cream sm:text-5xl lg:text-6xl">
          {product.sideClaim[0]}
          <br />
          {product.sideClaim[1]}
        </h2>
      </Reveal>
      <Reveal delay={200}>
        <p className="mt-4 text-sm text-cream/60">{product.name}</p>
      </Reveal>
    </SceneSection>
  )
}
