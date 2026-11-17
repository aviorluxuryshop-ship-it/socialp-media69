import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Heart, Leaf, Smile, Star } from 'lucide-react'
import { PageHeader, TrustStrip } from '@/components/Common'
import { site } from '@/data/site'

export const metadata: Metadata = {
  title: 'Hakkımızda',
  description: 'PRIME KIDS: çocuklar için rahat, anne-babalar için güvenilir, herkes için havalı çocuk giyim.',
  alternates: { canonical: '/hakkimizda' },
}

export default function AboutPage() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Hakkımızda' }]} eyebrow="Hikâyemiz" title="Çocuklar rahat, anne-babalar huzurlu." />
      <section className="container section grid items-center gap-10 md:grid-cols-2">
        <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-3" aria-hidden="true">
          {['vintage-fusya', 'legend-bej', 'mini-inek-kahve', 'kolej-ekru'].map((f, i) => (
            <div key={f} className={`relative aspect-[3/4] overflow-hidden rounded-3xl bg-sand ${i % 2 ? 'translate-y-8' : ''}`}>
              <Image src={`/images/products/${f}.jpg`} alt="" fill sizes="(min-width:768px) 220px, 45vw" className="object-cover object-top" />
            </div>
          ))}
        </div>
        <div className="space-y-4 text-[17px] leading-relaxed text-ink-soft">
          <p>
            {site.name}, bir anne-babanın en sık sorduğu soruyla doğdu: <strong className="text-ink">“Hem rahat hem şık bir şey yok mu?”</strong>
          </p>
          <p>
            Çocuklar gün boyu koşar, tırmanır, yere oturur. Bu yüzden takımlarımızda lastikli belleri, yumuşak dokuları ve hareketi kısıtlamayan kalıpları
            önceliklendiriyoruz. Ama bunu yaparken çocukların kendilerini “havalı” hissettiği tasarımlardan da vazgeçmiyoruz.
          </p>
          <p>Her modeli, kendi çocuğumuza giydireceğimiz özenle seçiyor; renklerini kardeş kombinlerine uygun olacak şekilde planlıyoruz.</p>
          <Link href="/urunler" className="btn-primary mt-2">
            Koleksiyonu keşfet <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="bg-white py-14 md:py-20">
        <div className="container">
          <h2 className="text-[26px] md:text-[34px]">Değerlerimiz</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Smile, title: 'Önce konfor', text: 'Rahat kalıp, yumuşak doku, kolay giyilen detaylar.' },
              { icon: Star, title: 'Tarz sahibi', text: 'Çocukların kendini iyi hissettiği güncel tasarımlar.' },
              { icon: Heart, title: 'Güven', text: 'Şeffaf fiyat, net iade koşulları, gerçek destek.' },
              { icon: Leaf, title: 'Uzun ömür', text: 'Yıkamaya dayanıklı, kardeşe devredilebilir ürünler.' },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-3xl bg-cream p-6" data-reveal>
                <Icon className="h-7 w-7" strokeWidth={1.7} aria-hidden="true" />
                <h3 className="mt-4 text-[18px]">{title}</h3>
                <p className="mt-1 text-[15px] text-ink-soft">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="container section">
        <TrustStrip />
      </section>
    </>
  )
}
