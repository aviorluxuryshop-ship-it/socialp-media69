import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { products, getProduct, CATEGORY_LABEL } from '@/data/products'
import { SITE_URL, site } from '@/data/site'
import { ProductDetail, ProductDetailRouted } from '@/components/ProductDetail'
import { ProductCard } from '@/components/ProductCard'
import { SectionHeading } from '@/components/Common'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = getProduct(slug)
  if (!p) return {}
  const colors = p.colors.map((c) => c.name).join(', ')
  return {
    title: `${p.name} — ${CATEGORY_LABEL[p.category]}`,
    description: `${p.short}. ${p.colors.length > 1 ? `${p.colors.length} renk (${colors}). ` : ''}${site.returns.days} gün kolay iade, güvenli ödeme.`,
    alternates: { canonical: `/urun/${p.slug}` },
    openGraph: { images: [{ url: p.colors[0].image, width: 1024, height: 1536, alt: p.colors[0].alt }] },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()

  const related = products
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category) || a.order - b.order)
    .slice(0, 4)

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ProductGroup',
    name: product.name,
    description: product.description,
    brand: { '@type': 'Brand', name: site.name },
    productGroupID: product.slug,
    variesBy: ['https://schema.org/color', 'https://schema.org/size'],
    hasVariant: product.colors.map((c) => ({
      '@type': 'Product',
      name: `${product.name} — ${c.name}`,
      color: c.name,
      image: `${SITE_URL}${c.image}`,
      offers: {
        '@type': 'Offer',
        url: `${SITE_URL}/urun/${product.slug}?renk=${c.id}`,
        priceCurrency: 'TRY',
        price: product.price.toFixed(2),
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Suspense fallback={<ProductDetail product={product} initialColor={null} />}>
        <ProductDetailRouted product={product} />
      </Suspense>
      <section className="container pb-6 pt-8" data-reveal>
        <SectionHeading eyebrow="Bunlar da hoşunuza gidebilir" title="Benzer ürünler" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {related.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </>
  )
}
