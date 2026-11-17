import { site } from '@/data/site'

const fmt = (n: number) => `${new Intl.NumberFormat('tr-TR').format(n)} TL`

export const faqGroups = [
  {
    title: 'Beden ve ürün',
    items: [
      {
        q: 'Çocuğuma hangi beden olur?',
        a: `Bedenlerimiz yaşa göre etiketlidir ama en doğru sonuç için çocuğunuzun boyuna bakın. Beden Rehberi sayfamızda boyu yazmanız yeterli; size bedeni hemen önerelim. İki beden arasında kaldıysanız bir büyük bedeni öneriyoruz.`,
      },
      {
        q: 'Kalıplar dar mı, geniş mi?',
        a: 'Takımlarımız rahat (regular/oversize) kesimdir; çocukların rahat hareket edebileceği şekilde tasarlanır. Bol paça modellerde paça geniştir, jogger modellerde paça manşetlidir.',
      },
      {
        q: '“Şardonlu” ne demek?',
        a: 'Şardonlu kumaşın iç yüzeyi fırçalanarak yumuşak, hafif tüylü hâle getirilir. Bu sayede daha sıcak tutar ve tene yumuşacık dokunur — kış ayları için idealdir.',
      },
      {
        q: 'Takımlar tek parça satılıyor mu?',
        a: 'Ürünler takım olarak satılır; takımın içeriği her ürün sayfasında “Takımda neler var?” başlığında yazar.',
      },
    ],
  },
  {
    title: 'Sipariş ve ödeme',
    items: [
      {
        q: 'Üye olmam gerekiyor mu?',
        a: 'Hayır. Üye olmadan, sadece teslimat bilgilerinizi yazarak birkaç dakikada sipariş verebilirsiniz.',
      },
      {
        q: 'Hangi ödeme yöntemleri var?',
        a: site.payment.cardEnabled
          ? 'Kredi kartı, banka kartı (3D Secure ile) ve Havale/EFT ile ödeme yapabilirsiniz.'
          : 'Şu an Havale/EFT ile ödeme alıyoruz; kartla online ödeme çok yakında aktif olacak. Siparişinizi verdikten sonra IBAN bilgimiz ekranda ve WhatsApp mesajında gösterilir.',
      },
      {
        q: 'Kart bilgilerim güvende mi?',
        a: 'Evet. Kart bilgileriniz bize hiç ulaşmaz; ödeme, lisanslı ödeme kuruluşunun güvenli sayfasında 3D Secure doğrulamasıyla alınır.',
      },
      {
        q: 'Fatura veriyor musunuz?',
        a: 'Evet, her siparişe fatura kesilir ve e-posta adresinize gönderilir.',
      },
    ],
  },
  {
    title: 'Kargo, iade ve değişim',
    items: [
      {
        q: 'Kargo ücreti ne kadar?',
        a: `${fmt(site.shipping.freeOver)} ve üzeri siparişlerde kargo ücretsiz. Altındaki siparişlerde kargo ücreti ${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(site.shipping.fee)} TL’dir.`,
      },
      {
        q: 'Siparişim ne zaman gelir?',
        a: `Hafta içi saat ${site.shipping.cutoffHour}:00’e kadar verilen siparişler aynı gün kargoya verilir. Kargoya verildikten sonra genellikle ${site.shipping.deliveryDays[0]}-${site.shipping.deliveryDays[1]} iş günü içinde teslim edilir.`,
      },
      {
        q: 'Beden olmazsa ne yapacağım?',
        a: `Hiç sorun değil. Teslimattan itibaren ${site.returns.days} gün içinde bize WhatsApp’tan yazın; beden değişimini veya iadeyi hemen başlatalım.${site.returns.freeReturn ? ' Anlaşmalı kargo ile iade ücretsizdir.' : ''}`,
      },
      {
        q: 'Param ne zaman iade edilir?',
        a: 'İade ürününüz bize ulaştıktan sonra en geç 14 gün içinde, ödeme yaptığınız yönteme iade edilir. Kart iadelerinin hesabınıza yansıması bankanıza göre birkaç gün sürebilir.',
      },
    ],
  },
]
