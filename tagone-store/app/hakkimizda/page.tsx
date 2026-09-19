import type { Metadata } from 'next'

import { siteConfig } from '@/data/site'

export const metadata: Metadata = {
  title: 'Hakkımızda',
  description: `${siteConfig.name} kimdir, NFC kartvizit kartlarını nasıl üretiyoruz.`,
  alternates: { canonical: '/hakkimizda' },
}

export default function AboutPage() {
  return (
    <section className="bg-paper py-20">
      <div className="container-prose">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Hakkımızda</h1>
        <div className="mt-6 space-y-5 text-ink-soft">
          <p>
            {siteConfig.name}, kağıt kartvizitlerin çöpe attığın, unuttuğun, tükendiğinde yeniden bastırman gereken halini
            geride bırakmak için kuruldu. Her kartımızın içine gömülü bir NFC çip var — telefona dokunduğu an profilini,
            portfolyonu ya da menünü açıyor. Uygulama yok, kod okutma yok, sadece dokunuş.
          </p>
          <p>
            Kartlarımızı Türkiye&apos;de üretiyor, elle kontrol ediyor ve yurt içi kargoyla gönderiyoruz. Her kart, bağlı
            olduğu sayfayı istediğin zaman güncelleyebileceğin şekilde tasarlandı — kart elinde kalır, üzerindeki bilgi
            değişebilir.
          </p>
          <p>
            İster kişisel bir kartvizit, ister bir işletme menüsü, ister etkinlik networking&apos;i için — {siteConfig.name}
            tek dokunuşla paylaşımı senin için basitleştirir.
          </p>
        </div>
      </div>
    </section>
  )
}
