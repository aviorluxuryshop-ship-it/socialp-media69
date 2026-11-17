import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { products } from '@/data/products'
import { site } from '@/data/site'
import { ProductCard } from '@/components/ProductCard'
import { TrustStrip } from '@/components/Common'
import { InstagramIcon, StoreIcon } from '@/components/BrandIcons'
import { Heart, Star } from '@/components/Doodles'

const categories = [
  { label: 'Kız Çocuk', sub: '5-14 yaş', href: '/urunler?kategori=kiz', image: '/images/products/vintage-fusya.jpg', bg: 'bg-pink-soft', accent: 'text-pink' },
  { label: 'Erkek Çocuk', sub: '5-14 yaş', href: '/urunler?kategori=erkek', image: '/images/products/legend-buz-mavisi.jpg', bg: 'bg-sky', accent: 'text-brand' },
  { label: 'Bebek & Mini', sub: '1-5 yaş', href: '/urunler?kategori=mini', image: '/images/products/mini-inek-kahve.jpg', bg: 'bg-sun-soft', accent: 'text-[#a15c00]' },
]

export default function HomePage() {
  const list = [...products].sort((a, b) => a.order - b.order)

  return (
    <>
      {/* ---------- KARŞILAMA ---------- */}
      <section className="container pt-4 md:pt-8">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-sun-soft via-white to-sky px-5 pb-6 pt-8 md:px-12 md:py-14">
          <Star className="absolute right-[6%] top-6 w-8 motion-safe:animate-twinkle md:w-11" />
          <Heart className="absolute bottom-6 left-[46%] hidden w-7 md:block" />
          <div className="grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
            <div className="relative">
              <h1 className="text-[38px] font-bold leading-[1.08] sm:text-[48px] lg:text-[60px]">
                Rahat giysin, <span className="text-brand">havalı</span> görünsün!
              </h1>
              <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink-soft md:text-[19px]">
                1-14 yaş kız ve erkek çocuk takımları. Yumuşak kumaş, lastikli bel, rahat kalıp.
              </p>
              <Link href="/urunler" className="btn-primary mt-6 h-14 w-full px-9 text-[17px] sm:w-auto">
                Ürünleri Gör <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[15px] font-semibold text-ink-soft">
                {['1.000 TL üzeri kargo bedava', `${site.returns.days} gün kolay iade`].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-mint-bright text-white">
                      <Check className="h-3.5 w-3.5" strokeWidth={3.5} aria-hidden="true" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto grid w-full max-w-[460px] grid-cols-3 items-end gap-2.5 md:max-w-[580px] md:gap-4" aria-hidden="true">
              {[
                { f: 'perfect-pembe', c: 'rotate-[-4deg] translate-y-3' },
                { f: 'legend-siyah', c: 'z-10 scale-[1.08]' },
                { f: 'yildiz-pembe', c: 'rotate-[4deg] translate-y-3' },
              ].map(({ f, c }, i) => (
                <div key={f} className={`relative aspect-[3/4.4] overflow-hidden rounded-[22px] border-4 border-white bg-sand shadow-card ${c}`}>
                  <Image src={`/images/products/${f}.jpg`} alt="" fill priority={i === 1} sizes="(min-width:768px) 190px, 31vw" className="object-cover object-top" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- KATEGORİLER ---------- */}
      <section className="container mt-10 md:mt-14" aria-labelledby="kategoriler">
        <h2 id="kategoriler" className="text-[26px] md:text-[34px]">
          Kimin için bakıyorsunuz?
        </h2>
        <ul className="mt-5 grid grid-cols-3 gap-3 md:gap-5">
          {categories.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className={`group flex h-full flex-col overflow-hidden rounded-[24px] ${c.bg} transition duration-300 ease-soft hover:-translate-y-1 hover:shadow-card`}>
                <div className="relative aspect-square overflow-hidden md:aspect-[4/3]">
                  <Image src={c.image} alt="" fill sizes="(min-width:768px) 30vw, 31vw" className="object-cover object-[50%_18%] transition duration-500 group-hover:scale-105" />
                </div>
                <div className="flex flex-1 items-center justify-between gap-1 p-3 md:p-5">
                  <span>
                    <span className={`block font-display text-[15px] font-semibold leading-tight md:text-[22px] ${c.accent}`}>{c.label}</span>
                    <span className="block text-[12.5px] font-semibold text-ink-muted md:text-[15px]">{c.sub}</span>
                  </span>
                  <ArrowRight className={`hidden h-6 w-6 shrink-0 md:block ${c.accent}`} aria-hidden="true" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- ÜRÜNLER ---------- */}
      <section className="container mt-12 md:mt-16" aria-labelledby="urunler">
        <div className="flex items-end justify-between gap-3">
          <h2 id="urunler" className="text-[26px] md:text-[34px]">
            Yeni sezon
          </h2>
          <Link href="/urunler" className="inline-flex min-h-[44px] items-center gap-1 font-display text-[16px] font-semibold text-brand">
            Tümü <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {list.map((p, i) => (
            <ProductCard key={p.slug} product={p} priority={i < 2} />
          ))}
        </div>
      </section>

      {/* ---------- GÜVENCE ---------- */}
      <section className="container mt-14 md:mt-20" aria-label="Alışveriş güvenceleri">
        <TrustStrip />
      </section>

      {/* ---------- SOSYAL ---------- */}
      {(site.social.instagram || site.social.trendyol) && (
        <section className="container mt-10 md:mt-14">
          <div className="flex flex-col items-start gap-5 rounded-[28px] bg-pink-soft p-6 md:flex-row md:items-center md:justify-between md:p-10">
            <div>
              <h2 className="text-[24px] md:text-[30px]">Bizi takip edin</h2>
              <p className="mt-1 text-[16px] text-ink-soft">Yeni ürünler ve kombinler önce Instagram’da!</p>
            </div>
            <div className="grid w-full gap-3 sm:flex sm:w-auto">
              {site.social.instagram && (
                <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="btn bg-pink text-white hover:bg-[#a61e4d]">
                  <InstagramIcon className="h-5 w-5" /> {site.social.instagramHandle}
                </a>
              )}
              {site.social.trendyol && (
                <a href={site.social.trendyol} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                  <StoreIcon className="h-5 w-5" /> Trendyol mağazamız
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
