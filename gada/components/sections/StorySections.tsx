import Link from 'next/link'

import { IngredientList } from '@/components/product/IngredientList'
import { NutritionTable } from '@/components/product/NutritionTable'
import { Beat, FallbackStill, LEMON_STILL } from '@/components/stage/Beat'
import { Reveal } from '@/components/ui/Reveal'
import { ArrowIcon, BloomIcon, LeafIcon, TeaIcon } from '@/components/ui/Icons'
import { company } from '@/data/company'
import { products, type Product } from '@/data/products'

const [limon, seftali] = products

export function Hero() {
  return (
    <section
      id="ana-sayfa"
      data-beat="hero"
      className="relative z-10 flex min-h-[100svh] flex-col justify-end pb-[7svh] pt-[var(--header-h)] lg:justify-center lg:pb-0"
    >
      <FallbackStill {...LEMON_STILL} side="right" />
      <div className="container">
        <div className="lg:w-[46%]">
          <div className="story-card max-lg:-mx-2 max-lg:!p-5">
          <Reveal as="p" className="eyebrow text-ink-soft">
            Soğuk çay · {company.city}, {company.country}
          </Reveal>
          <Reveal as="div" delay={0.08}>
            <h1 className="display balance mt-5 text-[clamp(2.75rem,1.5rem+5.4vw,6.75rem)]">
              Doğanın tazeliği, her&nbsp;yudumda.
            </h1>
          </Reveal>
          <Reveal as="p" delay={0.16} className="lede mt-6 max-w-[30rem]">
            Limon ve şeftali aromalı iki soğuk çay. 330&nbsp;ml kutularda, {company.shortName} tarafından {company.city}’ta
            üretilir.
          </Reveal>
          <Reveal delay={0.24} className="mt-9 hidden lg:block">
            <Link href="/#icecekler" className="group inline-flex items-center gap-3 font-medium">
              <span className="underline-offset-[6px] group-hover:underline">İçecekleri keşfedin</span>
              <ArrowIcon className="h-5 w-5 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
            </Link>
          </Reveal>
          </div>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-9 hidden lg:block">
        <div className="container flex items-center gap-4 text-ink-faint">
          <span className="block h-px w-10 overflow-hidden bg-ink/10">
            <span className="block h-full w-1/2 animate-[cue_2.4s_cubic-bezier(0.16,1,0.3,1)_infinite] bg-ink/50" />
          </span>
          <span className="eyebrow">Kaydırın</span>
        </div>
      </div>
    </section>
  )
}

export function WhatIs() {
  const facts = [
    ['Hacim', '330 ml, alüminyum kutu'],
    ['Aromalar', 'Limon · Şeftali'],
    ['Menşei', company.country],
    ['Üretici', `${company.shortName}, ${company.city}`],
  ]
  return (
    <Beat id="gada-nedir" beat="nedir" side="right" still={LEMON_STILL}>
      <Reveal as="p" className="eyebrow text-ink-soft">
        GADA nedir?
      </Reveal>
      <Reveal as="h2" delay={0.06} className="display balance mt-5 text-[clamp(2.25rem,1.4rem+3.4vw,4.5rem)]">
        Bayburt’tan bir soğuk çay.
      </Reveal>
      <Reveal as="p" delay={0.12} className="lede mt-6">
        GADA, {company.shortName}’un soğuk çay markası. İki aroması var, limon ve şeftali; ikisi de 330&nbsp;ml
        kutuda, Türkiye’de üretiliyor. Kutunun sağ yüzünde tek satır yazar:{' '}
        <span className="text-ink">“Gerçek limon, gerçek lezzet.”</span>
      </Reveal>
      <Reveal delay={0.18}>
        <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-ink/10 pt-8">
          {facts.map(([term, value]) => (
            <div key={term}>
              <dt className="eyebrow text-ink-faint">{term}</dt>
              <dd className="mt-2 text-[1.05rem] font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </Beat>
  )
}

export function Ingredients() {
  return (
    <Beat id="icindekiler" beat="icindekiler" side="left" wide still={LEMON_STILL}>
      <Reveal as="p" className="eyebrow text-ink-soft">
        İçindekiler
      </Reveal>
      <Reveal as="h2" delay={0.06} className="display balance mt-5 text-[clamp(2.25rem,1.4rem+3.4vw,4.5rem)]">
        Kutunun arkasında yazanlar.
      </Reveal>
      <div className="mt-8 grid gap-10 lg:mt-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div>
          <Reveal as="p" delay={0.12} className="lede">
            Limonlu GADA’nın etiketi, sırasıyla:
          </Reveal>
          <Reveal delay={0.18}>
            <IngredientList product={limon} className="mt-5" />
          </Reveal>
          <Reveal as="p" delay={0.24} className="mt-6 text-[0.95rem] leading-relaxed text-ink-soft">
            Renkli işaretliler yalnızca limonda. Şeftalili GADA’da siyah çay ekstraktı yerine çay aroması, limon
            aroması yerine şeftali aroması, E102 yerine E160a bulunur.
          </Reveal>
        </div>
        <Reveal delay={0.2}>
          <NutritionTable product={limon} />
          <p className="mt-5 text-[0.95rem] leading-relaxed text-ink-soft">
            Besin değerleri ve alerjen bilgisi (“Alerjen içermez.”) iki kutuda aynıdır.
          </p>
        </Reveal>
      </div>
    </Beat>
  )
}

export function PanelNotes() {
  const icons = [LeafIcon, TeaIcon, BloomIcon]
  return (
    <Beat id="ambalaj" beat="ambalaj" side="right" still={LEMON_STILL}>
      <Reveal as="p" className="eyebrow text-ink-soft">
        Kutunun sol yüzü
      </Reveal>
      <Reveal as="h2" delay={0.06} className="display balance mt-5 text-[clamp(2.25rem,1.4rem+3.4vw,4.5rem)]">
        Üç kısa not.
      </Reveal>
      <ul className="mt-10 space-y-6">
        {limon.panelNotes.map((note, index) => {
          const Icon = icons[index]
          return (
            <Reveal as="li" key={note} delay={0.1 + index * 0.08} className="flex items-center gap-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-leaf/10 text-leaf-deep">
                <Icon className="h-6 w-6" />
              </span>
              <span className="font-display text-[clamp(1.5rem,1.2rem+1vw,2rem)]">{note}</span>
            </Reveal>
          )
        })}
      </ul>
      <Reveal as="p" delay={0.36} className="lede mt-10">
        Altında el yazısıyla tek cümle: <span className="text-ink">“Doğanın tazeliği her yudumda.”</span> Şeftalili
        kutuda ilk not “Şeftali aroması” olur.
      </Reveal>
    </Beat>
  )
}

function FlavorCopy({ product, index }: { product: Product; index: number }) {
  const facts = [
    ['Aroma', product.aroma],
    ['Çay', product.ingredients.find((i) => i.name.toLocaleLowerCase('tr').includes('çay'))?.name ?? '—'],
    ['Renklendirici', product.ingredients.find((i) => i.role === 'Renklendirici')?.name ?? '—'],
    ['Hacim', product.volume],
  ]
  return (
    <>
      <Reveal as="p" className="eyebrow flex items-center gap-3" >
        <span className="tabular text-ink-faint">{String(index + 1).padStart(2, '0')}</span>
        <span aria-hidden className="h-px w-8 bg-ink/25" />
        <span style={{ color: product.colors.deep }}>{product.short}</span>
      </Reveal>
      <Reveal as="h3" delay={0.06} className="display mt-5 text-[clamp(2.5rem,1.5rem+4vw,5.25rem)]">
        GADA {product.short}
      </Reveal>
      <Reveal as="p" delay={0.1} className="mt-3 text-lg text-ink-soft">
        {product.aroma} ve soğuk çay aromalı içecek
      </Reveal>
      <Reveal as="p" delay={0.14} className="lede mt-6">
        {product.story[0]}
      </Reveal>
      <Reveal delay={0.24}>
        <dl className="mt-9 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-ink/10 pt-7">
          {facts.map(([term, value]) => (
            <div key={term}>
              <dt className="eyebrow text-ink-faint">{term}</dt>
              <dd className="mt-1.5 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
      <Reveal delay={0.3} className="mt-9">
        <Link href={`/icecekler/${product.slug}/`} className="group inline-flex items-center gap-3 font-medium">
          <span className="underline-offset-[6px] group-hover:underline">Ürün sayfası</span>
          <ArrowIcon className="h-5 w-5 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
        </Link>
      </Reveal>
    </>
  )
}

export function Flavors() {
  return (
    <>
      <Beat id="icecekler" beat="limon" side="left" still={{ src: limon.still, alt: 'GADA Limon kutusu' }}>
        <Reveal as="p" className="eyebrow text-ink-soft">
          İçeceklerimiz
        </Reveal>
        <Reveal as="h2" delay={0.04} className="mb-10 mt-3 font-display text-[clamp(1.25rem,1rem+0.8vw,1.6rem)] text-ink-soft lg:mb-14">
          İki aroma, aynı kutu.
        </Reveal>
        <FlavorCopy product={limon} index={0} />
      </Beat>
      <Beat beat="seftali" side="left" still={{ src: seftali.still, alt: 'GADA Şeftali kutusu' }}>
        <FlavorCopy product={seftali} index={1} />
      </Beat>
    </>
  )
}

export function Pair() {
  const rows: [string, string, string][] = [
    ['Aroma', 'Limon aroması', 'Şeftali aroması'],
    ['Çay', 'Siyah çay ekstraktı', 'Çay aroması'],
    ['Renklendirici', 'E102', 'E160a'],
    ['Enerji · 100 ml', '43 kcal', '43 kcal'],
    ['Hacim', '330 ml', '330 ml'],
  ]
  return (
    <Beat beat="ikisi" side="left">
      <Reveal as="p" className="eyebrow text-ink-soft">
        Yan yana
      </Reveal>
      <Reveal as="h2" delay={0.06} className="display balance mt-5 text-[clamp(2.25rem,1.4rem+3.4vw,4.5rem)]">
        Aynı temel, iki karakter.
      </Reveal>
      <Reveal as="p" delay={0.12} className="lede mt-6">
        İki içecek de aynı temelden gelir: su, şeker, asitlik düzenleyiciler, koruyucu ve tatlandırıcı. Ayrıldıkları yer
        aroma ve renk.
      </Reveal>
      <Reveal delay={0.18}>
        <table className="mt-9 w-full text-[0.95rem]">
          <thead>
            <tr className="text-left">
              <th scope="col" className="sr-only">
                Özellik
              </th>
              {products.map((product) => (
                <th key={product.id} scope="col" className="pb-3 font-medium">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: product.colors.can }} />
                    {product.short}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, a, b]) => (
              <tr key={label} className="border-t border-ink/10">
                <th scope="row" className="py-2.5 pr-4 text-left font-normal text-ink-soft">
                  {label}
                </th>
                <td className="py-2.5 pr-4">{a}</td>
                <td className="py-2.5">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
    </Beat>
  )
}
