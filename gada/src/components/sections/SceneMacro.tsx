import { Reveal } from '@/components/Reveal'
import { PRODUCTS } from '@/content/products'
import { useFlavor } from '@/state/flavor'
import { SceneSection } from './SceneSection'

/** Mostly empty by design — this scene is the can's own material detail. The one line of copy is the real ingredient list, off in the corner. */
export function SceneMacro() {
  const product = PRODUCTS[useFlavor()]

  return (
    <SceneSection id="icerik" layout="corner">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-wide3 text-cream/55">İçindekiler</p>
      </Reveal>
      <Reveal delay={100}>
        <p className="mt-3 max-w-[19rem] text-sm leading-relaxed text-cream/60">{product.ingredients}</p>
      </Reveal>
    </SceneSection>
  )
}
