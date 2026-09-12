import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

import { JerseyViewer } from '@/components/product/JerseyViewer'
import { PurchasePanel } from '@/components/product/PurchasePanel'
import { GoldRule } from '@/components/ui/GoldRule'
import { JerseyImage } from '@/components/ui/JerseyImage'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { getProductBySlug, getRelatedProducts, products } from '@/data/products'
import { siteConfig } from '@/data/site'
import { absoluteUrl, formatPrice } from '@/lib/utils'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = getProductBySlug(slug)

  if (!product) {
    return {
      title: 'Forma bulunamadı',
      description: 'Aradığınız forma Miras Koleksiyonu’nda yer almıyor.',
      robots: { index: false, follow: true },
    }
  }

  const title = `${product.displayName} — ${product.kind}`
  const description = `${product.tagline} ${product.displayName}, ${siteConfig.collection} içinde ${product.colorway} renginde. ${product.fabric}. ${formatPrice(product.price)}.`
  const path = `/koleksiyon/${product.slug}`

  return {
    title,
    description,
    alternates: { canonical: path },
    keywords: [...siteConfig.keywords, `${product.name} forma`, product.colorway],
    openGraph: {
      type: 'website',
      url: absoluteUrl(path, siteConfig.url),
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      title: `${title} · ${siteConfig.name}`,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · ${siteConfig.name}`,
      description,
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = getProductBySlug(slug)

  if (!product) notFound()

  const related = getRelatedProducts(product.slug)
  const path = `/koleksiyon/${product.slug}`

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${siteConfig.name} ${product.displayName} ${product.kind}`,
    description: `${product.tagline} ${product.story.paragraphs[0] ?? ''}`.trim(),
    sku: product.sku,
    // No gtin13 and no mpn. A barcode is a claim that a specific article
    // exists in the global registry under that number; ours are placeholders,
    // and a wrong one points a shopping engine at somebody else's product.
    // Put them back when the real ones are issued.
    color: product.colorway,
    material: product.fabric,
    category: 'Apparel > Sportswear > Football Shirts',
    releaseDate: `${product.releaseYear}-08-01`,
    url: absoluteUrl(path, siteConfig.url),
    image: product.media.views.map((view) => absoluteUrl(view.src, siteConfig.url)),
    brand: { '@type': 'Brand', name: siteConfig.name },
    manufacturer: { '@type': 'Organization', name: siteConfig.legalName },
    size: [...product.sizes],
    additionalProperty: product.specs.map((spec) => ({
      '@type': 'PropertyValue',
      name: spec.label,
      value: spec.value,
    })),
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(path, siteConfig.url),
      priceCurrency: product.currency,
      price: product.price,
      priceValidUntil: `${product.releaseYear + 1}-12-31`,
      availability: `https://schema.org/${product.availability}`,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: siteConfig.legalName },
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Anasayfa', item: siteConfig.url },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Koleksiyon',
        item: absoluteUrl('/koleksiyon', siteConfig.url),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.displayName,
        item: absoluteUrl(path, siteConfig.url),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <section className="grain relative pb-16 pt-[calc(var(--header-height)+2.5rem)] lg:pb-24 lg:pt-[calc(var(--header-height)+4rem)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_0%,rgba(212,175,55,0.07),transparent_72%)]"
        />

        <div className="container relative">
          <nav aria-label="Konum" className="mb-10 flex flex-wrap items-center gap-2 font-sans text-[11px] uppercase tracking-wider2 text-ink-mute">
            <Link href="/" className="transition-colors duration-300 hover:text-ink">
              Anasayfa
            </Link>
            <span aria-hidden>/</span>
            <Link href="/koleksiyon" className="transition-colors duration-300 hover:text-ink">
              Koleksiyon
            </Link>
            <span aria-hidden>/</span>
            <span className="text-ink-soft">{product.displayName}</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <JerseyViewer product={product} />

            <div className="lg:pt-4">
              <p className="eyebrow">{product.edition}</p>

              <h1 className="mt-5 font-display text-[clamp(2.2rem,5.5vw,3.75rem)] font-semibold uppercase leading-[1] tracking-tight text-ink">
                {product.displayName}
              </h1>

              <p className="mt-3 font-sans text-sm uppercase tracking-wider2 text-ink-soft">
                {product.kind} · {product.subtitle}
              </p>

              <p className="mt-7 max-w-prose font-sans text-[15px] leading-relaxed text-pretty text-ink-soft">
                {product.tagline} {product.story.paragraphs[0]}
              </p>

              <div className="mt-9 flex items-end gap-4">
                <span className="font-sans text-[26px] font-medium tracking-tight text-ink">
                  {formatPrice(product.price)}
                </span>
                <span className="ml-auto pb-1.5 font-sans text-[11px] uppercase tracking-wider2 text-gold-800">
                  {siteConfig.plate} · {product.colorway}
                </span>
              </div>

              <div className="mt-9">
                <GoldRule />
              </div>

              <div className="mt-9">
                <PurchasePanel product={product} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ink/14 py-20 lg:py-28" aria-labelledby="teknik">
        <div className="container">
          <SectionHeading
            eyebrow="Teknik"
            title={<span id="teknik">Kumaş, kalıp ve yapım</span>}
            lead="Formanın nasıl çalıştığı, formanın nasıl göründüğü kadar önemlidir. Aşağıdaki değerler üretim dosyasından alınmıştır."
          />

          <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-20">
            <RevealGroup as="dl" className="divide-y divide-white/10 border-y border-ink/14">
              {product.specs.map((spec) => (
                <RevealItem
                  key={spec.label}
                  className="grid gap-2 py-5 sm:grid-cols-[160px_1fr] sm:gap-6"
                >
                  <dt className="font-sans text-[11px] uppercase tracking-wider2 text-gold-800">
                    {spec.label}
                  </dt>
                  <dd className="font-sans text-sm leading-relaxed text-ink-soft">{spec.value}</dd>
                </RevealItem>
              ))}
            </RevealGroup>

            <div>
              <RevealGroup className="space-y-8">
                {product.features.map((feature) => (
                  <RevealItem key={feature.title}>
                    <h3 className="font-display text-lg uppercase tracking-wider2 text-ink">
                      {feature.title}
                    </h3>
                    <p className="mt-3 max-w-prose font-sans text-sm leading-relaxed text-pretty text-ink-mute">
                      {feature.description}
                    </p>
                  </RevealItem>
                ))}
              </RevealGroup>

              <Reveal className="mt-12 border-t border-ink/14 pt-8">
                <p className="eyebrow-muted mb-5">Bakım</p>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {product.care.map((line) => (
                    <li key={line} className="font-sans text-sm text-ink-mute">
                      {line}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ink/14 py-20 lg:py-28" aria-labelledby="hikaye">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <Reveal as="p" className="eyebrow">
                {product.story.kicker} · {product.story.source}
              </Reveal>
              <Reveal
                as="h2"
                delay={0.06}
                className="mt-5 font-display text-[clamp(1.8rem,4.2vw,2.9rem)] font-semibold uppercase leading-[1.14] tracking-tight text-ink"
              >
                <span id="hikaye">{product.story.heading}</span>
              </Reveal>
            </div>

            <div className="space-y-5">
              {product.story.paragraphs.map((paragraph, index) => (
                <Reveal
                  as="p"
                  key={paragraph.slice(0, 24)}
                  delay={index * 0.06}
                  className="max-w-prose font-sans text-[15px] leading-relaxed text-pretty text-ink-soft"
                >
                  {paragraph}
                </Reveal>
              ))}
              <Reveal delay={0.2} className="pt-4">
                <Link
                  href={`/koleksiyon#${product.slug}`}
                  className="group inline-flex items-center gap-2.5 font-sans text-[11px] uppercase tracking-luxe text-gold-800 transition-colors duration-500 hover:text-gold-800"
                >
                  Koleksiyon hikâyesinin tamamı
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1"
                    aria-hidden
                  />
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ink/14 py-20 lg:py-28" aria-labelledby="digerleri">
        <div className="container">
          <SectionHeading eyebrow="Koleksiyonun devamı" title={<span id="digerleri">Diğer formalar</span>} />

          <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2">
            {related.map((item) => (
              <RevealItem key={item.slug}>
                <Link
                  href={`/koleksiyon/${item.slug}`}
                  className="group relative flex items-center gap-7 overflow-hidden rounded-sm border border-ink/14 bg-graphite-dark p-6 transition-colors duration-700 ease-luxe hover:border-gold-700/40 sm:p-8"
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 opacity-60 transition-opacity duration-700 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(46% 60% at 18% 70%, ${item.palette.glow} 0%, transparent 72%)`,
                    }}
                  />
                  <span className="relative aspect-square w-28 shrink-0 sm:w-32">
                    <JerseyImage
                      src={item.media.views[0]?.src ?? ''}
                      alt={item.media.views[0]?.alt ?? item.displayName}
                      sizes="140px"
                      className="drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)] transition-transform duration-700 ease-luxe group-hover:scale-105"
                    />
                  </span>
                  <span className="relative">
                    <span className="block font-sans text-[11px] uppercase tracking-wider2 text-ink-mute">
                      {item.kind}
                    </span>
                    <span className="mt-2 block font-display text-2xl font-semibold uppercase tracking-wide text-ink">
                      {item.displayName}
                    </span>
                    <span className="mt-3 block font-sans text-sm text-ink-soft">
                      {formatPrice(item.price)}
                    </span>
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </>
  )
}
