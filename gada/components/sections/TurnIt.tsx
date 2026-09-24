'use client'

import { products, type Face } from '@/data/products'
import { cn } from '@/lib/cn'
import { interaction, liveYaw, nearestFace, useInteraction } from '@/lib/stage/interaction'
import { useTurnable } from '@/lib/stage/useTurnable'
import { Reveal } from '@/components/ui/Reveal'
import { TurnIcon } from '@/components/ui/Icons'

export const FACE_LABELS: Record<Face, string> = { front: 'Ön', right: 'Sağ', back: 'Arka', left: 'Sol' }
const FACES: Face[] = ['front', 'right', 'back', 'left']

/**
 * The one place on the page where the visitor, not the scroll, turns the
 * can: drag it, use the arrow keys, or pick a face.
 */
export function TurnIt() {
  const choice = useInteraction()
  const product = products.find((p) => p.id === choice.flavor) ?? products[0]
  // After a drag the buttons follow the face the can actually shows.
  const shown = nearestFace(product.label.faces, choice.face, choice.drag)
  const note = product.design.find((d) => d.face === shown)

  const turnable = useTurnable((delta) => interaction.set({ drag: interaction.get().drag + delta }))

  const showFace = (face: Face) => {
    // Land on the face by the short way round from wherever the can is now.
    const base = -product.label.faces[face]
    const turns = Math.round((liveYaw[product.id] - base) / 360)
    interaction.set({ face, drag: turns * 360 })
  }

  return (
    <section data-beat="etkilesim" className="relative z-10 flex min-h-[100svh] flex-col pb-[6svh] pt-[60svh] lg:min-h-[115vh] lg:justify-center lg:py-[16vh]">
      {/* Drag surface over the can: right half on a wide screen, upper half on a phone. */}
      <div
        {...turnable}
        role="slider"
        tabIndex={0}
        aria-label={`GADA ${product.short} kutusunu döndür`}
        aria-valuetext={`${FACE_LABELS[shown]} yüz`}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round((((choice.drag + product.label.faces[choice.face]) % 360) + 360) % 360)}
        className="absolute inset-x-0 top-[9svh] h-[50svh] cursor-grab touch-pan-y select-none rounded-3xl outline-offset-[-12px] active:cursor-grabbing lg:inset-y-0 lg:left-[52%] lg:right-0 lg:top-0 lg:h-auto"
      />
      <div className="container pointer-events-none relative">
        <div className="pointer-events-auto story-card max-lg:!p-5 lg:w-[40%]">
          <Reveal as="p" className="eyebrow flex items-center gap-2 text-ink-soft">
            <TurnIcon className="h-4 w-4" /> 360°
          </Reveal>
          <Reveal as="h2" delay={0.06} className="display balance mt-3 text-[clamp(1.9rem,1.2rem+3.4vw,4.5rem)] lg:mt-5">
            Kutuyu kendiniz çevirin.
          </Reveal>
          <Reveal as="p" delay={0.12} className="lede mt-6 hidden lg:block">
            Kutuyu sürükleyin ya da bir yüz seçin.
          </Reveal>

          <Reveal delay={0.18}>
            <fieldset className="mt-5 lg:mt-9">
              <legend className="eyebrow mb-3 text-ink-faint max-lg:sr-only">Aroma</legend>
              <div className="inline-flex rounded-full bg-ink/[0.06] p-1">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={p.id === choice.flavor}
                    onClick={() => interaction.set({ flavor: p.id, face: 'front', drag: 0 })}
                    className={cn(
                      'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-[0.95rem] font-medium transition-colors duration-300',
                      p.id === choice.flavor ? 'bg-paper text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
                    )}
                  >
                    <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: p.colors.can }} />
                    {p.short}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-3 lg:mt-7">
              <legend className="eyebrow mb-3 text-ink-faint max-lg:sr-only">Yüz</legend>
              <div className="flex flex-wrap gap-1.5 lg:gap-2">
                {FACES.map((face) => (
                  <button
                    key={face}
                    type="button"
                    aria-pressed={face === shown}
                    onClick={() => showFace(face)}
                    className={cn(
                      'min-h-11 min-w-[3.6rem] cursor-pointer rounded-full border px-3 text-[0.95rem] transition-colors duration-300 lg:min-w-[4.5rem] lg:px-4',
                      face === shown ? 'border-ink bg-ink text-cream' : 'border-ink/15 hover:border-ink/40',
                    )}
                  >
                    {FACE_LABELS[face]}
                  </button>
                ))}
              </div>
            </fieldset>
            {note && (
              <p aria-live="polite" className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink-soft lg:mt-7 lg:min-h-[4.5rem]">
                <span className="font-medium text-ink">{note.title}.</span> {note.body}
              </p>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
