import clsx from 'clsx'
import { Reveal } from '@/components/Reveal'
import { FLAVOR_ORDER, PRODUCTS } from '@/content/products'
import { setFlavor, useFlavor } from '@/state/flavor'
import { SceneSection } from './SceneSection'

/**
 * The flavor picker: switches the global flavor store, which the 3D can,
 * the backdrop tint and the fruit accents all read — this is the one
 * section where the page is genuinely interactive rather than scroll-driven.
 */
export function SceneFlavors() {
  const active = useFlavor()
  const product = PRODUCTS[active]

  return (
    <SceneSection id="aromalar" layout="side">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-wide3 text-accent-400">Aromalar</p>
      </Reveal>
      <Reveal delay={100}>
        <h2 className="font-display text-4xl font-bold leading-[1.1] text-cream sm:text-5xl lg:text-6xl">İki aroma, tek karakter.</h2>
      </Reveal>

      <Reveal delay={220}>
        <div className="mt-7 flex gap-3" role="group" aria-label="Aroma seç">
          {FLAVOR_ORDER.map((id) => {
            const p = PRODUCTS[id]
            const isActive = id === active
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFlavor(id)}
                aria-pressed={isActive}
                className={clsx(
                  'flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300 ease-luxe',
                  isActive ? 'border-transparent text-void' : 'border-cream/20 text-cream/75 hover:border-cream/40',
                )}
                style={isActive ? { backgroundColor: p.colors.can } : undefined}
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.colors.can }} aria-hidden="true" />
                {p.short}
              </button>
            )
          })}
        </div>
      </Reveal>

      <Reveal key={product.id} delay={80}>
        <ul className="mt-7 flex flex-col gap-2.5">
          {product.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-sm text-cream/70">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: product.colors.can }} aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>
      </Reveal>
    </SceneSection>
  )
}
