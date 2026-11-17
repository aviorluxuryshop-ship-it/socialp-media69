import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Gift, MessageCircleHeart, PackageCheck, RefreshCw, Ruler, School, Truck, Users } from 'lucide-react'
import { PageHeader, SectionHeading } from '@/components/Common'
import { WhatsAppIcon } from '@/components/BrandIcons'
import { site, whatsappLink } from '@/data/site'
import { formatPrice } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Hizmetlerimiz — Beden Danışmanlığı, Hediye Paketi, Kolay Değişim',
  description: 'PRIME KIDS hizmetleri: ücretsiz beden danışmanlığı, ücretsiz hediye paketi, kolay değişim, hızlı kargo ve toplu siparişler.',
  alternates: { canonical: '/hizmetler' },
}

const services = [
  {
    icon: Ruler,
    tint: 'bg-sky',
    title: 'Ücretsiz Beden Danışmanlığı',
    text: 'Çocuğunuzun boyunu ve kilosunu WhatsApp’tan yazın; modelin kalıbına göre en doğru bedeni birlikte seçelim.',
    cta: { label: 'Beden sor', href: whatsappLink('Merhaba, beden danışmanlığı almak istiyorum. Çocuğumun boyu: … cm, kilosu: … kg'), external: true },
  },
  {
    icon: RefreshCw,
    tint: 'bg-sage',
    title: 'Kolay Değişim ve İade',
    text: `Beden olmadı mı? Teslimattan itibaren ${site.returns.days} gün içinde tek mesajla değişim veya iade başlatın.${site.returns.freeReturn ? ' Anlaşmalı kargo ile iade ücretsiz.' : ''}`,
    cta: { label: 'İade koşulları', href: '/yasal/iade-ve-degisim' },
  },
  {
    icon: Truck,
    tint: 'bg-butter',
    title: 'Aynı Gün Kargo',
    text: `Hafta içi ${site.shipping.cutoffHour}:00’e kadar verilen siparişler aynı gün kargoda. ${formatPrice(site.shipping.freeOver)} üzeri kargo ücretsiz.`,
    cta: { label: 'Kargo bilgileri', href: '/yasal/kargo-ve-teslimat' },
  },
  {
    icon: Gift,
    tint: 'bg-blush',
    title: 'Ücretsiz Hediye Paketi',
    text: 'Doğum günü, bayram ya da yeni kardeş hediyesi… Sepette “hediye paketi” seçin, fiyat etiketini çıkarıp notunuzu ekleyelim.',
    cta: { label: 'Alışverişe başla', href: '/urunler' },
  },
  {
    icon: Users,
    tint: 'bg-sky',
    title: 'Kardeş Kombini',
    text: 'Aynı modelin farklı renkleriyle kardeşlere uyumlu ama birbirinin aynısı olmayan kombinler hazırlıyoruz.',
    cta: { label: 'Kombin iste', href: whatsappLink('Merhaba, kardeşlerim için kombin önerisi istiyorum. Yaşları: …'), external: true },
  },
  {
    icon: School,
    tint: 'bg-sage',
    title: 'Toplu & Etkinlik Siparişleri',
    text: 'Okul gösterisi, doğum günü partisi ya da kreş etkinliği için toplu siparişlerde özel destek ve planlama.',
    cta: { label: 'Teklif al', href: whatsappLink('Merhaba, toplu sipariş hakkında bilgi almak istiyorum.'), external: true },
  },
]

const steps = [
  { title: 'Ürünü seçin', text: 'Renk yuvarlaklarına dokunarak tüm renkleri görün.' },
  { title: 'Bedeni bulun', text: 'Boyu yazın, beden önerimizi alın.' },
  { title: 'Sepete ekleyin', text: 'Hediye paketi isterseniz sepette seçin.' },
  { title: 'Güvenle ödeyin', text: 'Üyeliksiz, birkaç dakikada sipariş.' },
]

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Hizmetler' }]}
        eyebrow="Hizmetlerimiz"
        title="Ürün satmaktan fazlası"
        lead="Doğru bedeni bulmaktan hediye paketine kadar, alışverişin her adımında yanınızdayız. Hepsi ücretsiz."
      />

      <section className="section container">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {services.map(({ icon: Icon, tint, title, text, cta }) => (
            <li key={title} className="flex flex-col rounded-[28px] bg-white p-6 ring-1 ring-line transition duration-300 ease-soft hover:-translate-y-1 hover:shadow-card" data-reveal>
              <span className={`grid h-14 w-14 place-items-center rounded-2xl ${tint}`}>
                <Icon className="h-7 w-7" strokeWidth={1.7} aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-[19px]">{title}</h2>
              <p className="mt-2 flex-1 text-[15.5px] text-ink-soft">{text}</p>
              {cta.external ? (
                <a href={cta.href} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-[44px] items-center gap-1.5 self-start font-display text-[14.5px] font-bold underline underline-offset-4">
                  {cta.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : (
                <Link href={cta.href} className="mt-5 inline-flex min-h-[44px] items-center gap-1.5 self-start font-display text-[14.5px] font-bold underline underline-offset-4">
                  {cta.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white py-14 md:py-20" data-reveal>
        <div className="container">
          <SectionHeading eyebrow="Nasıl çalışır?" title="4 adımda sipariş" />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative rounded-3xl bg-cream p-6">
                <span className="font-display text-[40px] font-bold leading-none text-ink/15">0{i + 1}</span>
                <h3 className="mt-3 text-[17px]">{s.title}</h3>
                <p className="mt-1 text-[15px] text-ink-soft">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container section" data-reveal>
        <div className="flex flex-col items-start gap-6 rounded-[32px] bg-ink p-7 text-white md:flex-row md:items-center md:justify-between md:p-12">
          <div className="flex items-start gap-4">
            <MessageCircleHeart className="mt-1 h-9 w-9 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-[24px] text-white md:text-[30px]">Bir sorunuz mu var?</h2>
              <p className="mt-1 text-white/75">{site.contact.whatsappHours}</p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <a href={whatsappLink('Merhaba, bir sorum var.')} target="_blank" rel="noopener noreferrer" className="btn-whatsapp h-14 px-7">
              <WhatsAppIcon className="h-5 w-5" /> WhatsApp’tan Yaz
            </a>
            <Link href="/iletisim" className="btn h-14 border border-white/30 px-7 text-white hover:bg-white/10">
              <PackageCheck className="h-5 w-5" aria-hidden="true" /> İletişim
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
