import { Reveal } from '@/components/Reveal'
import { COMMON } from '@/content/products'
import { SceneSection } from './SceneSection'

/**
 * Where the reference site's checkout/shipping flow sat in the scroll —
 * deliberately not rebuilt. GADA has no cart or delivery flow, so this slot
 * is an original brand/catalog section instead: where and who makes it, in
 * the can's own words.
 */
export function SceneBrand() {
  return (
    <SceneSection id="marka" layout="side">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-wide3 text-accent-400">Marka</p>
      </Reveal>
      <Reveal delay={100}>
        <p className="font-display text-2xl font-bold italic leading-[1.15] text-cream sm:text-4xl lg:text-5xl">“{COMMON.slogan}.”</p>
      </Reveal>

      <Reveal delay={220}>
        <dl className="mt-5 space-y-2.5 border-t border-cream/10 pt-4 text-xs sm:mt-8 sm:space-y-4 sm:pt-6 sm:text-sm">
          <div>
            <dt className="text-[10px] uppercase tracking-wide3 text-cream/40 sm:text-[11px]">Üretici</dt>
            <dd className="mt-0.5 text-cream/75 sm:mt-1">{COMMON.producer}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide3 text-cream/40 sm:text-[11px]">Tesis</dt>
            <dd className="mt-0.5 text-cream/75 sm:mt-1">{COMMON.address}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide3 text-cream/40 sm:text-[11px]">Menşei</dt>
            <dd className="mt-0.5 text-cream/75 sm:mt-1">{COMMON.origin}</dd>
          </div>
        </dl>
      </Reveal>

      {/* the usage note is the least essential line here, and mobile has the least room to spare */}
      <Reveal delay={320}>
        <p className="mt-6 hidden text-xs text-cream/40 sm:block">{COMMON.usage.join(' ')}</p>
      </Reveal>
    </SceneSection>
  )
}
