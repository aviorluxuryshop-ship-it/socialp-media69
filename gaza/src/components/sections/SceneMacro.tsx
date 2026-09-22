import { Reveal } from '@/components/Reveal'
import { SceneSection } from './SceneSection'

/** Deliberately near-empty: this scene is the can's own material detail, not copy. */
export function SceneMacro() {
  return (
    <SceneSection id="icerik" layout="corner">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-wide3 text-cream/55">Yakın plan</p>
      </Reveal>
    </SceneSection>
  )
}
