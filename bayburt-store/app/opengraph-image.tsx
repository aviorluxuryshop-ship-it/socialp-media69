import { ImageResponse } from 'next/og'

import { products } from '@/data/products'
import { siteConfig } from '@/data/site'

export const alt = `${siteConfig.name} — ${siteConfig.collection}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
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
          background: 'linear-gradient(140deg, #050505 0%, #0d0d0d 52%, #050505 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontSize: 26, letterSpacing: 10, color: '#ffffff' }}>BAYBURT</span>
            <span style={{ fontSize: 16, letterSpacing: 8, color: '#d4af37' }}>STORE</span>
          </div>
          <span style={{ fontSize: 16, letterSpacing: 8, color: '#71717a' }}>1969 · 69</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 22, letterSpacing: 14, color: '#d4af37' }}>
            {siteConfig.collection.toUpperCase()}
          </span>
          <span style={{ fontSize: 148, letterSpacing: 8, lineHeight: 1.05, marginTop: 12 }}>
            MİRAS
          </span>
          <span style={{ fontSize: 24, color: '#a1a1aa', marginTop: 20 }}>
            {siteConfig.tagline}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {products.map((product) => (
            <div key={product.slug} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: product.palette.base,
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              />
              <span style={{ fontSize: 18, letterSpacing: 6, color: '#d4d4d8' }}>
                {product.displayName}
              </span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 16, letterSpacing: 6, color: '#71717a' }}>
            {siteConfig.url.replace('https://', '')}
          </span>
        </div>
      </div>
    ),
    size,
  )
}
