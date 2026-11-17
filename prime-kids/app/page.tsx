import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Baby, Check, Feather, Gift, Ruler, Shirt, Sparkles, Users, WashingMachine } from 'lucide-react'
import { products, AGE_FILTERS, productsForSize, galleryItems } from '@/data/products'
import { site, whatsappLink } from '@/data/site'
import { faqGroups } from '@/data/faq'
import { ProductCard } from '@/components/ProductCard'
import { Accordion, SectionHeading, TrustStrip } from '@/components/Common'
import { SizeFinder } from '@/components/SizeFinder'
import { ColorStory } from '@/components/ColorStory'
import { WhatsAppIcon, InstagramIcon, StoreIcon } from '@/components/BrandIcons'

const shortcuts = [
  { label: 'Kız Çocuk', href: '/urunler?kategori=kiz', image: '/images/products/vintage-fusya.jpg' },
  { label: 'Erkek Çocuk', href: '/urunler?kategori=erkek', image: '/images/products/legend-buz-mavisi.jpg' },
  { label: 'Mini 1-5 Yaş', href: '/urunler?kategori=mini', image: '/images/products/mini-inek-kahve.jpg' },
  { label: 'Kışlık', href: '/urunler?ozellik=sardonlu', image: '/images/products/yildiz-pembe.jpg' },
  { label: 'Denim', href: '/urunler?ara=denim', image: '/images/products/stargirl-mavi.jpg' },
  { label: 'Galeri', href: '/galeri', image: '/images/products/kolej-siyah.jpg' },
]

export default function HomePage() {
  const featured = [...products].sort((a, b) => a.order - b.order)
  const legend = products.find((p) => p.slug === 'legend-kargo-takim')!
  const faqs = faqGroups.flatMap((g) => g.items).filter((_, i) => [0, 5, 8, 10].includes(i))

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-blush/70 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-40 top-64 h-[420px] w-[420px] rounded-full bg-sky/80 blur-3xl" aria-hidden="true" />
        <div className="container relative grid items-center gap-8 pb-10 pt-6 md:grid-cols-[1.02fr_1fr] md:gap-10 md:pb-20 md:pt-12">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 font-display text-[12px] font-bold uppercase tracking-[0.14em] text-ink-soft ring-1 ring-line">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Yeni Sezon · Kış 2026
            </p>
            <h1 className="mt-4 text-[38px] font-bold leading-[1.05] sm:text-[48px] lg:text-[62px]">
              Rahat giysin,
              <br />
              <span className="relative inline-block">
                havalı görünsün.
                <svg className="absolute -bottom-2 left-0 h-3 w-full text-coral" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 9c60-6 140-8 296-3" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-5 max-w-[34rem] text-[17px] leading-relaxed text-ink-soft md:text-[19px]">
              1-14 yaş için yumuşacık şardonlu eşofmanlar, denim ve kargo takımlar. Lastikli beller, rahat kalıplar — çocuğunuz gün boyu özgür, siz içiniz rahat.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/urunler" className="btn-primary h-14 px-8 text-[16px]">
                Ürünlere Göz At <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link href="/beden-rehberi" className="btn-secondary h-14 px-7 text-[16px]">
                <Ruler className="h-5 w-5" aria-hidden="true" /> Bedenimi Bul
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-semibold text-ink-soft">
              {['Üye olmadan sipariş', `${site.returns.days} gün kolay iade`, 'WhatsApp’tan beden danışmanlığı'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-success" strokeWidth={3} aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Kolaj */}
          <div className="relative mx-auto h-[360px] w-full max-w-[520px] sm:h-[500px] md:h-[560px]" aria-hidden="true">
            <div className="absolute left-0 top-10 w-[46%] rotate-[-5deg] overflow-hidden rounded-[28px] bg-white p-1.5 shadow-lift">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[22px]">
                <Image src="/images/products/perfect-pembe.jpg" alt="" fill sizes="(min-width:768px) 240px, 45vw" className="object-cover object-top" />
              </div>
            </div>
            <div className="absolute right-0 top-16 w-[44%] rotate-[5deg] overflow-hidden rounded-[28px] bg-white p-1.5 shadow-lift">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[22px]">
                <Image src="/images/products/mini-inek-kahve.jpg" alt="" fill sizes="(min-width:768px) 230px, 44vw" className="object-cover object-top" />
              </div>
            </div>
            <div className="absolute inset-x-0 top-0 z-10 mx-auto w-[54%] overflow-hidden rounded-[32px] bg-white p-1.5 shadow-lift motion-safe:animate-float">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[26px]">
                <Image src="/images/products/legend-siyah.jpg" alt="" fill sizes="(min-width:768px) 290px, 54vw" className="object-cover object-top" priority />
              </div>
            </div>
            <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2.5 font-display text-[13px] font-bold shadow-lift ring-1 ring-line sm:bottom-10">
              <span className="flex -space-x-1.5">
                {['#1b1b1d', '#4a2a2f', '#7fb4d1', '#d8c7b0', '#0f5c52'].map((c) => (
                  <span key={c} className="h-4 w-4 rounded-full ring-2 ring-white" style={{ background: c }} />
                ))}
              </span>
              Legend Takım · 5 renk
            </div>
          </div>
        </div>
      </section>

      {/* ---------- HIZLI KISAYOLLAR (story) ---------- */}
      <section aria-label="Hızlı kategoriler" className="container">
        <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-6 md:px-0">
          {shortcuts.map((s) => (
            <li key={s.href} className="snap-start">
              <Link href={s.href} className="group flex w-[76px] flex-col items-center gap-2 text-center md:w-auto">
                <span className="rounded-full bg-gradient-to-tr from-coral via-[#f2b7c5] to-[#9cc9e3] p-[3px] transition-transform duration-300 ease-soft group-hover:scale-105">
                  <span className="relative block h-[68px] w-[68px] overflow-hidden rounded-full border-[3px] border-cream md:h-24 md:w-24">
                    <Image src={s.image} alt="" fill sizes="96px" className="object-cover object-[50%_12%] scale-[1.6]" />
                  </span>
                </span>
                <span className="text-[13px] font-bold leading-tight text-ink-soft md:text-[14px]">{s.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- GÜVEN ---------- */}
      <section className="container mt-10 md:mt-14" aria-label="Alışveriş güvenceleri" data-reveal>
        <TrustStrip />
      </section>

      {/* ---------- YENİ SEZON ---------- */}
      <section className="section container" data-reveal>
        <SectionHeading
          eyebrow="Yeni Sezon"
          title="Bu kışın favorileri"
          lead="Renk yuvarlaklarına dokunarak diğer renkleri görebilirsiniz."
          action={
            <Link href="/urunler" className="btn-secondary hidden md:inline-flex">
              Tümünü Gör <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {featured.slice(0, 4).map((p, i) => (
            <ProductCard key={p.slug} product={p} priority={i < 2} />
          ))}
        </div>
        <Link href="/urunler" className="btn-primary mt-8 w-full md:hidden">
          Tüm Ürünleri Gör ({products.length}) <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>

      {/* ---------- YAŞA GÖRE ---------- */}
      <section className="bg-white py-14 md:py-20" data-reveal>
        <div className="container">
          <SectionHeading eyebrow="Kolay alışveriş" title="Çocuğunuz kaç yaşında?" lead="Yaşı seçin, yalnızca o bedende bulunan ürünleri gösterelim." />
          <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 md:grid-cols-9 md:gap-3">
            {AGE_FILTERS.map((age, i) => {
              const tints = ['bg-blush', 'bg-sky', 'bg-sage', 'bg-butter']
              const n = productsForSize(age).length
              return (
                <li key={age}>
                  <Link
                    href={`/urunler?yas=${age}`}
                    className={`flex h-[88px] flex-col items-center justify-center rounded-3xl ${tints[i % 4]} transition duration-300 ease-soft hover:-translate-y-1 hover:shadow-card`}
                  >
                    <span className="font-display text-[22px] font-bold leading-none tabular">{age}</span>
                    <span className="mt-1 text-[12.5px] font-semibold text-ink-soft">yaş · {n} ürün</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* ---------- RENK HİKAYESİ ---------- */}
      <section className="section container" data-reveal>
        <ColorStory product={legend} />
      </section>

      {/* ---------- KIŞLIK BANNER ---------- */}
      <section className="container" data-reveal>
        <div className="relative overflow-hidden rounded-[36px] bg-ink text-white">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div className="relative z-10 p-7 md:p-14">
              <p className="eyebrow text-white/60">Şardonlu · Kışlık</p>
              <h2 className="mt-2 text-[30px] leading-tight text-white md:text-[42px]">İçi pamuk gibi yumuşak, dışı tarz.</h2>
              <p className="mt-4 max-w-md text-[16.5px] text-white/75">
                Şardonlu kumaşın iç yüzeyi yumuşacık tüylüdür; soğuk sabahlarda okula giderken içini sıcak tutar, tene yumuşak dokunur.
              </p>
              <Link href="/urunler?ozellik=sardonlu" className="btn mt-7 h-14 bg-white px-8 text-ink hover:bg-cream">
                Kışlık Takımlar <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 pb-4 md:gap-3 md:p-6" aria-hidden="true">
              {['vintage-kahve', 'perfect-ekru', 'yildiz-kahve'].map((f, i) => (
                <div key={f} className={`relative aspect-[3/4.4] overflow-hidden rounded-3xl ${i === 1 ? 'md:-translate-y-6' : 'md:translate-y-4'}`}>
                  <Image src={`/images/products/${f}.jpg`} alt="" fill sizes="(min-width:768px) 200px, 31vw" className="object-cover object-top" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- BEDEN BUL + ANNE GÖZÜYLE ---------- */}
      <section className="section container" data-reveal>
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <div id="beden-bul">
            <p className="eyebrow">10 saniyede beden</p>
            <h2 className="mt-1.5 text-[26px] leading-tight md:text-[36px]">Bedenden emin değil misiniz?</h2>
            <p className="mt-2 mb-5 text-[16px] text-ink-soft">Boyu yazın, doğru bedeni hemen önerelim. Yine de olmazsa {site.returns.days} gün içinde değiştiriyoruz.</p>
            <SizeFinder />
          </div>
          <div>
            <p className="eyebrow">Anne-baba gözüyle</p>
            <h2 className="mt-1.5 text-[26px] leading-tight md:text-[36px]">Seçerken neye dikkat ettik?</h2>
            <ul className="mt-6 grid grid-cols-2 gap-3">
              {[
                { icon: Feather, title: 'Yumuşak dokular', text: 'Şardonlu ve pamuk karışımlı kumaşlar tene yumuşak dokunur.' },
                { icon: Baby, title: 'Kendi giyebilir', text: 'Lastikli bel, fermuar ve çıtçıt — sabah telaşında kolaylık.' },
                { icon: WashingMachine, title: 'Kolay bakım', text: '30°C’de makinede yıkanır, ütü derdi az.' },
                { icon: Users, title: 'Kardeş kombini', text: 'Aynı modelin farklı renkleriyle kardeşlere uyumlu stil.' },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-3xl bg-white p-4 ring-1 ring-line md:p-5">
                  <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
                  <h3 className="mt-3 text-[15px] md:text-[16px]">{title}</h3>
                  <p className="mt-1 text-[13.5px] leading-snug text-ink-soft md:text-[14.5px]">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- HİZMETLER ---------- */}
      <section className="bg-sand/70 py-14 md:py-20" data-reveal>
        <div className="container">
          <SectionHeading
            eyebrow="Hizmetlerimiz"
            title="Alışverişin her adımında yanınızdayız"
            action={
              <Link href="/hizmetler" className="btn-secondary self-start">
                Tüm hizmetler <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
          <ul className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Shirt, title: 'Ücretsiz beden danışmanlığı', text: 'Boy-kilo bilgisini WhatsApp’tan yazın, birlikte doğru bedeni seçelim.' },
              { icon: Gift, title: 'Ücretsiz hediye paketi', text: 'Doğum günü mü var? Sepette “hediye paketi” seçin, notunuzu biz ekleyelim.' },
              { icon: Sparkles, title: 'Kolay değişim', text: `Beden olmazsa ${site.returns.days} gün içinde değişim — tek mesajla başlar.` },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-3xl bg-white p-6 shadow-card">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-butter">
                  <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[17px]">{title}</h3>
                <p className="mt-1.5 text-[15px] text-ink-soft">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- GALERİ ---------- */}
      <section className="section container" data-reveal>
        <SectionHeading
          eyebrow="Galeri"
          title="Stil ilhamı"
          lead="Beğendiğiniz kareye dokunun, ürüne gidin."
          action={
            <Link href="/galeri" className="btn-secondary self-start">
              Galeriye git <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />
        <ul className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
          {galleryItems
            .filter((_, i) => [1, 6, 14, 3, 11, 17].includes(i))
            .map((g) => (
              <li key={g.src}>
                <Link href={g.href} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-sand md:rounded-3xl">
                  <Image src={g.src} alt={g.alt} fill sizes="(min-width:768px) 16vw, 32vw" className="object-cover object-top transition duration-500 ease-soft group-hover:scale-105" />
                </Link>
              </li>
            ))}
        </ul>
        {(site.social.instagram || site.social.trendyol) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {site.social.instagram && (
              <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <InstagramIcon className="h-5 w-5" /> Instagram’da takip et {site.social.instagramHandle}
              </a>
            )}
            {site.social.trendyol && (
              <a href={site.social.trendyol} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <StoreIcon className="h-5 w-5" /> Trendyol mağazamız ve yorumlar
              </a>
            )}
          </div>
        )}
      </section>

      {/* ---------- SSS ---------- */}
      <section className="container pb-6" data-reveal>
        <div className="grid gap-8 md:grid-cols-[1fr_1.4fr] md:gap-12">
          <div>
            <p className="eyebrow">Merak edilenler</p>
            <h2 className="mt-1.5 text-[26px] leading-tight md:text-[36px]">Aklınızda soru kalmasın</h2>
            <p className="mt-3 text-[16px] text-ink-soft">Cevabı bulamazsanız WhatsApp’tan yazın; ekibimizden biri yanıtlasın.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              <a href={whatsappLink('Merhaba, bir sorum var.')} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                <WhatsAppIcon className="h-5 w-5" /> WhatsApp’tan Sor
              </a>
              <Link href="/sss" className="btn-secondary">
                Tüm sorular
              </Link>
            </div>
          </div>
          <Accordion items={faqs} />
        </div>
      </section>
    </>
  )
}
