'use client'

import { useState } from 'react'

import { Reveal } from '@/components/ui/Reveal'
import { products, type Face } from '@/data/products'
import { cn } from '@/lib/cn'

const LABELS: Record<Face, string> = { front: 'Ön', right: 'Sağ', back: 'Arka', left: 'Sol' }

/**
 * The label taken off the can and laid flat — the very texture the 3D can
 * wears — with each face marked where it sits.
 */
export function Dieline() {
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState<Face | null>(null)
  const product = products[index]
  // Roll the sheet so it reads front → right → back → left, the front panel
  // starting an eighth of the way in. The texture wraps, so two copies side
  // by side are slid along rather than cut.
  const roll = (product.label.frontU - 0.125 + 1) % 1
  const markers = (Object.keys(product.label.faces) as Face[]).map((face) => ({
    face,
    left: ((((product.label.frontU + product.label.faces[face] / 360 - roll) % 1) + 1) % 1) * 100,
  }))

  return (
    <section id="tasarim" className="relative z-10 bg-paper-deep py-24 lg:py-36">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Reveal as="p" className="eyebrow text-ink-soft">
              Ambalaj tasarımı
            </Reveal>
            <Reveal as="h2" delay={0.06} className="display balance mt-5 text-[clamp(2.25rem,1.4rem+3.4vw,4.5rem)]">
              Dört yüz, tek etiket.
            </Reveal>
          </div>
          <Reveal as="p" delay={0.12} className="lede max-w-prose">
            Etiketi kutudan çıkarıp düz serdiğinizde dört yüz yan yana gelir. Aşağıdaki açılım, yukarıdaki üç boyutlu
            kutunun üzerine sarılan etiketin kendisidir.
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-12 flex flex-wrap items-center gap-2" >
          {products.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-5 text-[0.95rem] font-medium transition-colors duration-300',
                i === index ? 'border-ink bg-ink text-cream' : 'border-ink/15 hover:border-ink/40',
              )}
            >
              <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: p.colors.can }} />
              {p.short}
            </button>
          ))}
        </Reveal>

        <Reveal delay={0.16} as="figure" className="mt-8">
          <div className="relative mx-auto max-w-[min(100%,80vh)]">
            {/* Face markers ride above the sheet. */}
            <div aria-hidden className="relative mb-3 h-6">
              {markers.map(({ face, left }) => (
                <span
                  key={face}
                  className={cn(
                    'eyebrow absolute -translate-x-1/2 transition-colors duration-300',
                    hovered === face ? 'text-ink' : 'text-ink-faint',
                  )}
                  style={{ left: `${left}%` }}
                >
                  {LABELS[face]}
                </span>
              ))}
            </div>
            <div
              className="relative overflow-hidden rounded-2xl shadow-[0_30px_60px_-30px_rgba(27,26,20,0.35)] ring-1 ring-ink/5"
              style={{ aspectRatio: '2048 / 1683' }}
            >
              <div
                key={product.id}
                className="flex h-full w-[200%] animate-[fadein_0.8s_cubic-bezier(0.16,1,0.3,1)]"
                style={{ transform: `translateX(-${roll * 50}%)` }}
              >
                {[0, 1].map((copy) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={copy}
                    src={product.label.src}
                    alt={copy === 0 ? `GADA ${product.short} etiketinin düz açılımı: ön, sağ, arka ve sol yüzler yan yana.` : ''}
                    aria-hidden={copy === 1 || undefined}
                    width={2048}
                    height={1683}
                    loading="lazy"
                    className="block h-full w-1/2 object-fill"
                  />
                ))}
              </div>
              {markers.map(({ face, left }) => (
                <span
                  key={face}
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute inset-y-0 w-px border-l border-dashed transition-opacity duration-300',
                    hovered === face ? 'border-ink/60 opacity-100' : 'border-ink/25 opacity-60',
                  )}
                  style={{ left: `${left}%` }}
                />
              ))}
            </div>
          </div>
          <figcaption className="sr-only">GADA {product.short} etiket açılımı</figcaption>
        </Reveal>

        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
          {product.design.map((item, i) => (
            <Reveal
              as="li"
              key={item.face}
              delay={0.05 * i}
              className="bg-paper-deep p-6 transition-colors duration-300 hover:bg-paper lg:p-7"
            >
              <div onMouseEnter={() => setHovered(item.face)} onMouseLeave={() => setHovered(null)}>
                <p className="eyebrow text-ink-faint">{LABELS[item.face]}</p>
                <p className="mt-3 font-display text-2xl">{item.title}</p>
                <p className="mt-3 text-[0.97rem] leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
