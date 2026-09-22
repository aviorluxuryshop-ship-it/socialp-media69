import { Reveal } from '@/components/Reveal'
import { SceneSection } from './SceneSection'

export function Scene360() {
  return (
    <SceneSection id="hikaye" layout="side">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-wide3 text-gaza-400">360°</p>
      </Reveal>
      <Reveal delay={100}>
        <h2 className="mt-4 font-display text-4xl font-bold leading-[1.1] text-cream sm:text-5xl lg:text-6xl">Her açıdan GAZA.</h2>
      </Reveal>
    </SceneSection>
  )
}
