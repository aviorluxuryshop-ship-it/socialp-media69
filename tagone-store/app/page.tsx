import Link from 'next/link'
import { ArrowRight, ScanLine, Share2, Zap } from 'lucide-react'

import { ProductCard } from '@/components/ProductCard'
import { products } from '@/data/products'
import { siteConfig } from '@/data/site'

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-carbon text-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-signal opacity-20 blur-[120px]"
        />
        <div className="container relative grid gap-12 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/70">
              NFC Kartvizit Kartları
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              Kartını çıkarma, <span className="text-signal">dokundur.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-white/70">
              {siteConfig.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/urunler"
                className="inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-semibold text-carbon transition hover:bg-signal-dim"
              >
                Ürünleri Keşfet <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#nasil-calisir"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/50"
              >
                Nasıl Çalışır?
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm animate-fade-up [animation-delay:150ms]">
            <div className="animate-tap rounded-card border border-white/10 bg-gradient-to-br from-signal to-[#7fb800] p-8 shadow-signal">
              <div className="flex items-center justify-between text-carbon">
                <span className="text-xs font-bold uppercase tracking-[0.3em]">TagOne</span>
                <ScanLine className="h-6 w-6" />
              </div>
              <div className="mt-16">
                <p className="text-lg font-semibold text-carbon">Sinyal Yeşil</p>
                <p className="text-xs uppercase tracking-[0.2em] text-carbon/70">Dokun · Paylaş · Tanıt</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section id="nasil-calisir" className="border-b border-ink/10 bg-paper py-20">
        <div className="container">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Nasıl çalışır?</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { icon: Zap, title: '1. Bilgilerini gir', text: 'Profilini, sosyal medya linklerini, portfolyonu ya da menünü tek bir sayfada topla.' },
              { icon: ScanLine, title: '2. Kartını dokunt', text: 'TagOne kartını herhangi bir NFC destekli telefona yaklaştır, uygulama gerekmez.' },
              { icon: Share2, title: '3. Anında paylaş', text: 'Sayfan telefonda açılır — karşı taraf tek dokunuşla bilgilerine ulaşır, kaydeder.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-card border border-ink/10 bg-paper-raised p-6">
                <Icon className="h-6 w-6 text-signal-dim" strokeWidth={1.75} />
                <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm text-ink-mute">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ürünler */}
      <section className="bg-paper py-20">
        <div className="container">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Kartlar</h2>
            <Link href="/urunler" className="text-sm font-medium text-ink-soft hover:text-ink">
              Tümünü gör →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
