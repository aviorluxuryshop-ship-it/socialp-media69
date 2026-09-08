import { ImageResponse } from 'next/og'

import { getProductBySlug, products } from '@/data/products'
import { siteConfig } from '@/data/site'
import { formatPrice } from '@/lib/utils'

export const alt = `${siteConfig.name} — forma`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }))
}

export default async function ProductOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = getProductBySlug(slug)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(140deg, #050505 0%, #101010 55%, #050505 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontSize: 24, letterSpacing: 10 }}>BAYBURT</span>
            <span style={{ fontSize: 15, letterSpacing: 8, color: '#d4af37' }}>STORE</span>
          </div>
          <span style={{ fontSize: 15, letterSpacing: 8, color: '#71717a' }}>
            {siteConfig.collection.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ fontSize: 20, letterSpacing: 10, color: '#d4af37' }}>
              {(product?.kind ?? 'Forma').toUpperCase()}
            </span>
            <span style={{ fontSize: 116, letterSpacing: 4, lineHeight: 1.05, marginTop: 14 }}>
              {product?.displayName ?? 'MİRAS'}
            </span>
            <span style={{ fontSize: 24, color: '#a1a1aa', marginTop: 18 }}>
              {product?.tagline ?? siteConfig.tagline}
            </span>
          </div>

          <KitSwatch slug={product?.slug} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* The ₺ glyph is missing from the OG runtime's bundled font. */}
          <span style={{ fontSize: 20, letterSpacing: 6, color: '#d4d4d8' }}>
            {product ? `${formatPrice(product.price, '')} TL` : ''}
          </span>
          <span style={{ fontSize: 16, letterSpacing: 6, color: '#71717a' }}>
            {product?.colorway ?? ''}
          </span>
        </div>
      </div>
    ),
    size,
  )
}

/**
 * Kit identity as flat colour blocks. The satori renderer behind
 * `ImageResponse` has no SVG filter or pattern support, so the jersey render
 * itself cannot be embedded here — these bars carry the same read.
 */
function KitSwatch({ slug }: { slug?: string }) {
  const frame = {
    display: 'flex',
    width: 230,
    height: 230,
    borderRadius: 6,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.18)',
  } as const

  if (slug === 'hisar') {
    return (
      <div
        style={{
          ...frame,
          background: '#E9A21C',
          alignItems: 'stretch',
          justifyContent: 'center',
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              width: index % 2 === 0 ? 22 : 20,
              background: index % 2 === 0 ? '#0A0A0A' : 'transparent',
            }}
          />
        ))}
      </div>
    )
  }

  if (slug === 'coruh') {
    return (
      <div style={{ ...frame, background: '#FFFFFF', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', width: 122 }} />
        <div style={{ display: 'flex', width: 16, background: '#0A0A0A' }} />
        <div style={{ display: 'flex', width: 8 }} />
        <div style={{ display: 'flex', width: 40, background: '#E9A21C' }} />
      </div>
    )
  }

  return (
    <div style={{ ...frame, background: '#0F0F0F', flexDirection: 'column' }}>
      <div style={{ display: 'flex', height: 8, background: '#D4AF37' }} />
      <div style={{ display: 'flex', height: 10 }} />
      <div style={{ display: 'flex', height: 5, background: '#D4AF37' }} />
      <div style={{ display: 'flex', flex: 1, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', width: 46, background: '#1C1C1C' }} />
        <div style={{ display: 'flex', width: 30 }} />
        <div style={{ display: 'flex', width: 52, background: '#181818' }} />
        <div style={{ display: 'flex', width: 26 }} />
        <div style={{ display: 'flex', width: 44, background: '#1C1C1C' }} />
      </div>
    </div>
  )
}
