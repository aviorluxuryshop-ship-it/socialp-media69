import { Reveal } from '@/components/Reveal'
import { SceneSection } from './SceneSection'

export function SceneDiscover() {
  return (
    <SceneSection id="urun" layout="side">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-wide3 text-gaza-400">Ürünü keşfet</p>
      </Reveal>
      <Reveal delay={100}>
        <h2 className="mt-4 font-display text-4xl font-bold leading-[1.1] text-cream sm:text-5xl lg:text-6xl">
          Tanıdık tat.
          <br />
          Farklı bir dokunuş.
        </h2>
      </Reveal>
    </SceneSection>
  )
}
