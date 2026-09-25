'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useRef, useState } from 'react'

import { CanScene, type CanSceneHandle, type SceneQuality } from '@/components/scene/CanScene'
import { useScrollScene } from '@/components/scene/useScrollScene'
import type { FlavorConfig } from '@/lib/flavors'
import { flavors } from '@/lib/flavors'
import { SceneSection } from './SceneSection'

function useQuality(): SceneQuality {
  const [quality] = useState<SceneQuality>(() =>
    typeof window !== 'undefined' && window.innerWidth < 820 ? 'low' : 'high',
  )
  return quality
}

export function ProductExperience({ flavor }: { flavor: FlavorConfig }) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const progressRef = useRef<CanSceneHandle>({ progress: 0 })
  const quality = useQuality()
  useScrollScene(trackRef, progressRef)

  const otherFlavor = Object.values(flavors).find((f) => f.slug !== flavor.slug)!
  const p = flavor.pack

  const rootStyle = {
    '--accent': flavor.palette.accent,
    '--accent-deep': flavor.palette.deep,
    '--accent-leaf': flavor.palette.leaf,
  } as CSSProperties

  return (
    <div style={rootStyle}>
      <div className="scene-stage">
        <CanScene flavor={flavor} quality={quality} progressRef={progressRef} />
      </div>
      <div className="scene-scrim" />

      <div ref={trackRef} className="scene-track">
        {/* 1 — Hero */}
        <SceneSection align="center">
          <p className="font-display text-lg font-semibold tracking-[0.3em] text-mist/80">GADA</p>
          <h1 className="font-display text-[clamp(3.2rem,13vw,8rem)] font-extrabold leading-[0.92] tracking-tight text-mist drop-shadow-[0_8px_40px_rgba(0,0,0,0.55)]">
            {flavor.heroWord}
          </h1>
          <p className="font-sans text-sm uppercase tracking-wide3 text-haze">
            {p.frontSubtitle.join(' ')}
          </p>
          <p className="font-sans text-xs uppercase tracking-wide3 text-haze/70">{p.volume} · Soğuk çay</p>
        </SceneSection>

        {/* 2 — Aroma */}
        <SceneSection align="left" kicker="Aroma">
          <h2 className="font-display text-[clamp(2.2rem,7vw,4.5rem)] font-bold leading-[0.95] tracking-tight text-mist">
            {flavor.aromaHeadline}
          </h2>
          <p className="max-w-sm text-balance font-sans text-base text-haze sm:text-lg">
            {flavor.slug === 'seftali'
              ? 'Olgun şeftalinin sıcak, yumuşak aromasıyla harmanlanmış bir yudumluk tazelik.'
              : 'Ferahlatıcı limon aromasıyla harmanlanmış bir yudumluk tazelik.'}
          </p>
        </SceneSection>

        {/* 3 — Gerçek lezzet claim */}
        <SceneSection align="right" kicker="Gerçek Lezzet">
          <h2 className="font-display text-[clamp(1.8rem,6vw,3.6rem)] font-bold leading-[1.02] tracking-tight text-mist text-balance">
            {p.claimLine}
          </h2>
          <p className="max-w-sm text-balance font-sans text-base text-haze sm:text-lg">
            Soğuk çay temeliyle dengelenmiş, ferahlatıcı bir tarif.
          </p>
        </SceneSection>

        {/* 4 — Faces / ambalaj */}
        <SceneSection align="left" kicker="Ambalaj">
          <h2 className="font-display text-[clamp(1.8rem,6vw,3.4rem)] font-bold leading-[1.02] tracking-tight text-mist">
            {p.volume} Alüminyum Kutu
          </h2>
          <p className="max-w-sm text-balance font-sans text-base text-haze sm:text-lg">
            Dört yüzünde de aynı özenle tasarlanmış GADA kimliği — geri dönüştürülebilir alüminyumda.
          </p>
        </SceneSection>

        {/* 5 — İçindekiler */}
        <SceneSection align="right" kicker="İçindekiler" wide>
          <h2 className="font-display text-[clamp(1.8rem,5.5vw,3rem)] font-bold tracking-tight text-mist">
            Ne İçeriyor?
          </h2>
          <p className="text-balance font-sans text-sm text-haze sm:text-base">{p.ingredients}</p>

          <div className="info-panel mt-2 w-full max-w-xs self-center sm:max-w-sm sm:self-end">
            <p className="mb-2 font-sans text-xs uppercase tracking-wide3 text-haze/80">{p.nutritionBasis}</p>
            <dl className="divide-y divide-line text-sm">
              {p.nutrition.map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1.5">
                  <dt className="text-haze">{row.label}</dt>
                  <dd className="font-medium text-mist">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="font-sans text-xs text-haze/80">
            {p.allergen} Menşei: {p.origin}.
          </p>
        </SceneSection>

        {/* 6 — Hikâye */}
        <SceneSection align="left" kicker="Hikâye">
          <h2 className="font-display text-[clamp(2rem,6.5vw,4rem)] font-semibold italic leading-[1.05] tracking-tight text-mist text-balance">
            “{p.scriptTagline}”
          </h2>
          <ul className="flex flex-col gap-1.5 font-sans text-sm uppercase tracking-wide3 text-haze">
            {p.iconLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </SceneSection>

        {/* 7 — Marka / AN Zentrum */}
        <SceneSection align="center" kicker="Üretici">
          <h2 className="font-display text-[clamp(1.8rem,6vw,3.2rem)] font-bold tracking-tight text-mist">
            AN ZENTRUM
          </h2>
          <div className="info-panel flex flex-col items-center gap-2">
            <div className="font-sans text-sm text-haze">
              {p.manufacturerLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p className="font-mono text-xs tracking-widest text-haze/70">{p.barcode}</p>
          </div>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href={`/icecekler/${otherFlavor.slug}`}
              className="rounded-full border border-line px-6 py-2.5 font-sans text-xs uppercase tracking-wide3 text-mist transition-colors duration-300 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {otherFlavor.name}’yi keşfet
            </Link>
            <Link
              href="/icecekler"
              className="font-sans text-xs uppercase tracking-wide3 text-haze transition-colors duration-300 hover:text-mist"
            >
              Tüm içecekler
            </Link>
          </div>
        </SceneSection>
      </div>
    </div>
  )
}
