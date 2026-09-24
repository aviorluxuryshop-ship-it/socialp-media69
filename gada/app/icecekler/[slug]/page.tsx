import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CanViewer } from '@/components/product/CanViewer'
import { IngredientList } from '@/components/product/IngredientList'
import { NutritionTable } from '@/components/product/NutritionTable'
import { Reveal } from '@/components/ui/Reveal'
import { ArrowIcon } from '@/components/ui/Icons'
import { company } from '@/data/company'
import { getProduct, products } from '@/data/products'

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = getProduct((await params).slug)
  if (!product) return {}
  return {
    title: `GADA ${product.short}`,
    description: `${product.name}: içindekiler, besin değerleri ve ambalaj. ${product.volume}, menşei ${product.origin}.`,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = getProduct((await params).slug)
  if (!product) notFound()
  const others = products.filter((p) => p.id !== product.id)

  const specs: [string, string][] = [
    ['Ürün', product.name],
    ['Ambalajdaki ad', product.canName],
    ['Aroma', product.aroma],
    ['Hacim', `${product.volume}, alüminyum kutu`],
    ['Menşei', product.origin],
    ['Alerjen', product.allergen],
    ['Üretici', `${company.legalName}, ${company.city}`],
  ]

  return (
    <div style={{ background: product.colors.tint }} className="relative">
      <div className="container grid gap-10 pb-24 pt-[calc(var(--header-h)+1.5rem)] lg:grid-cols-[1fr_1fr] lg:gap-16 lg:pb-36">
        <div className="lg:sticky lg:top-[var(--header-h)] lg:h-[calc(100vh-var(--header-h)-2rem)] lg:self-start">
          <CanViewer product={product} className="h-[62svh] lg:h-full" />
        </div>

        <article className="lg:pt-[10vh]">
          <Reveal as="p" className="eyebrow flex items-center gap-3 text-ink-soft">
            <Link href="/#icecekler" className="underline-offset-4 hover:underline">
              İçeceklerimiz
            </Link>
            <span aria-hidden className="h-px w-6 bg-ink/25" />
            <span style={{ color: product.colors.deep }}>{product.short}</span>
          </Reveal>
          <Reveal as="div" delay={0.06}>
            <h1 className="display mt-5 text-[clamp(3rem,1.8rem+5vw,6.5rem)]">GADA {product.short}</h1>
          </Reveal>
          <Reveal as="p" delay={0.1} className="mt-3 text-xl text-ink-soft">
            {product.aroma} ve soğuk çay aromalı içecek
          </Reveal>
          <Reveal as="p" delay={0.14} className="mt-8 font-display text-[clamp(1.5rem,1.2rem+1vw,2rem)] italic">
            “{product.tagline}”
          </Reveal>
          {product.story.map((paragraph, i) => (
            <Reveal as="p" key={i} delay={0.18 + i * 0.04} className="lede mt-6 max-w-prose">
              {paragraph}
            </Reveal>
          ))}

          <Reveal delay={0.1}>
            <dl className="mt-14 divide-y divide-ink/10 border-y border-ink/10">
              {specs.map(([term, value]) => (
                <div key={term} className="grid grid-cols-[9rem_1fr] gap-4 py-3.5 sm:grid-cols-[11rem_1fr]">
                  <dt className="text-ink-soft">{term}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal as="h2" className="eyebrow mt-16 text-ink-soft">
            İçindekiler
          </Reveal>
          <Reveal delay={0.06}>
            <IngredientList product={product} className="mt-5" />
            <p className="mt-4 text-sm text-ink-soft">Renkli işaretliler bu aromaya özgü.</p>
          </Reveal>

          <Reveal delay={0.06} className="mt-14 max-w-md">
            <NutritionTable product={product} />
          </Reveal>

          <Reveal as="h2" className="eyebrow mt-16 text-ink-soft">
            Saklama
          </Reveal>
          <Reveal as="ul" delay={0.06} className="mt-4 space-y-1.5">
            {product.storage.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </Reveal>

          <Reveal as="h2" className="eyebrow mt-16 text-ink-soft">
            Ambalajın dört yüzü
          </Reveal>
          <Reveal as="div" delay={0.06}>
            <ul className="mt-5 grid gap-px overflow-hidden rounded-2xl bg-ink/10 sm:grid-cols-2">
              {product.design.map((item) => (
                <li key={item.face} className="p-6" style={{ background: product.colors.tint }}>
                  <p className="font-display text-xl">{item.title}</p>
                  <p className="mt-2 text-[0.97rem] leading-relaxed text-ink-soft">{item.body}</p>
                </li>
              ))}
            </ul>
          </Reveal>

          {others.map((other) => (
            <Reveal key={other.id} delay={0.06}>
              <Link
                href={`/icecekler/${other.slug}/`}
                className="group mt-16 flex items-center justify-between gap-6 rounded-2xl p-7 transition-transform duration-500 ease-luxe hover:-translate-y-0.5"
                style={{ background: other.colors.can, color: other.colors.ink }}
              >
                <span>
                  <span className="eyebrow block opacity-70">Diğer içecek</span>
                  <span className="mt-2 block font-display text-3xl">GADA {other.short}</span>
                </span>
                <ArrowIcon className="h-7 w-7 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
              </Link>
            </Reveal>
          ))}
        </article>
      </div>
    </div>
  )
}
