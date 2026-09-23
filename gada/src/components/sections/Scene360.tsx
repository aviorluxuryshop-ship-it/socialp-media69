import { Reveal } from '@/components/Reveal'
import { COMMON } from '@/content/products'
import { SceneSection } from './SceneSection'

export function Scene360() {
  return (
    <SceneSection id="hikaye" layout="side">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-wide3 text-accent-400">360°</p>
      </Reveal>
      <Reveal delay={100}>
        <h2 className="font-display text-4xl font-bold leading-[1.1] text-cream sm:text-5xl lg:text-6xl">Her açıdan GADA.</h2>
      </Reveal>

      <Reveal delay={260}>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-wide3 text-cream/45">{COMMON.nutritionBasis}</p>
        <dl className="mt-3 max-w-[15rem] divide-y divide-cream/10 text-sm">
          {COMMON.nutrition.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 py-1.5">
              <dt className="text-cream/55">{label}</dt>
              <dd className="font-medium text-cream/85">{value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </SceneSection>
  )
}
