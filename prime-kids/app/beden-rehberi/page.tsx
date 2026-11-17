import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/Common'
import { SizeFinder, SizeTable } from '@/components/SizeFinder'
import { WhatsAppIcon } from '@/components/BrandIcons'
import { site, whatsappLink } from '@/data/site'

export const metadata: Metadata = {
  title: 'Beden Rehberi — Çocuğunuzun Bedenini 10 Saniyede Bulun',
  description: 'PRIME KIDS çocuk beden tablosu: yaş, boy, göğüs ve bel ölçüleri. Boy yazın, beden önerisi alın.',
  alternates: { canonical: '/beden-rehberi' },
}

export default function SizeGuidePage() {
  return (
    <>
      <PageHeader crumbs={[{ label: 'Beden Rehberi' }]} eyebrow="Beden Rehberi" title="Doğru beden, 10 saniyede" lead="Çocuğunuzun boyunu yazın, size uygun bedeni önerelim. Arada kalırsanız bir büyük bedeni öneriyoruz — çocuklar hızlı büyür!" />
      <div className="container section grid gap-10 lg:grid-cols-2">
        <div id="beden-bul" className="min-w-0 scroll-mt-28">
          <SizeFinder />
          <div className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-line md:p-6">
            <h2 className="text-[19px]">Nasıl ölçerim?</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15.5px] text-ink-soft">
              <li><strong className="text-ink">Boy:</strong> Çocuğunuz ayakkabısız, sırtı duvara yaslı dik dursun; başının üstünden yere kadar ölçün.</li>
              <li><strong className="text-ink">Göğüs:</strong> Kolların altından, göğsün en geniş yerinden mezurayı sıkmadan geçirin.</li>
              <li><strong className="text-ink">Bel:</strong> Göbek deliğinin hemen üstünden, doğal bel çizgisinden ölçün.</li>
            </ol>
            <p className="mt-4 text-[14px] text-ink-muted">İpucu: Evde mezura yoksa çocuğunuzun iyi oturan bir eşofmanını düz zemine serip ölçebilir, bize WhatsApp’tan gönderebilirsiniz.</p>
          </div>
        </div>
        <div className="min-w-0">
          <h2 className="text-[22px]">Beden tablosu</h2>
          <p className="mb-4 mt-1 text-[14.5px] text-ink-muted">Ölçüler santimetredir ve ortalama değerlerdir (±2 cm).</p>
          <SizeTable />
          <div className="mt-6 rounded-3xl bg-ink p-6 text-white">
            <h2 className="text-[19px] text-white">Hâlâ emin değil misiniz?</h2>
            <p className="mt-1 text-white/75">Boy ve kiloyu yazın, modelin kalıbına göre bedeni birlikte seçelim. Olmazsa {site.returns.days} gün içinde değiştiriyoruz.</p>
            <a href={whatsappLink('Merhaba, beden danışmanlığı istiyorum. Boy: … cm, kilo: … kg, model: …')} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-4 w-full sm:w-auto">
              <WhatsAppIcon className="h-5 w-5" /> WhatsApp’tan danış
            </a>
          </div>
          <Link href="/urunler" className="mt-6 inline-flex min-h-[44px] items-center font-display font-semibold underline underline-offset-4">
            Ürünlere dön →
          </Link>
        </div>
      </div>
    </>
  )
}
