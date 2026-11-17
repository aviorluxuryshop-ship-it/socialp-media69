/**
 * PRIME KIDS — mağazanın tüm marka, iletişim ve iş kuralı ayarları.
 *
 * Yayına almadan önce "GÜNCELLENECEK" yazan her değeri gerçek bilgiyle
 * değiştirin. Sözleşmeler, footer, iletişim sayfası ve ödeme ekranı bu
 * dosyadan beslenir; başka bir yerde değişiklik gerekmez.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://primekids.com.tr'

export const site = {
  name: 'PRIME KIDS',
  shortName: 'Prime Kids',
  tagline: 'Rahat giysin, havalı görünsün.',
  description:
    'PRIME KIDS çocuk giyim: 1-14 yaş kız ve erkek çocuk takımları, şardonlu kışlık eşofmanlar, denim ve kargo takımlar. Güvenli ödeme, 14 gün kolay iade, hızlı kargo.',

  contact: {
    // GÜNCELLENECEK — WhatsApp hattı, başında 90 olacak şekilde boşluksuz yazın.
    whatsapp: '905000000000',
    phoneDisplay: '0 (500) 000 00 00',
    phoneHref: '+905000000000',
    email: 'destek@primekids.com.tr',
    hours: 'Hafta içi 09:00 – 18:00 · Cumartesi 10:00 – 16:00',
    whatsappHours: 'WhatsApp hattımız her gün 09:00 – 21:00 arası yanıt verir.',
  },

  // Boş bırakılan bağlantılar sitede hiç gösterilmez.
  social: {
    instagram: 'https://www.instagram.com/primeekids/',
    instagramHandle: '@primeekids',
    // Paylaşım linkindeki takip parametreleri (kullanıcı no vb.) bilerek çıkarıldı.
    trendyol: 'https://www.trendyol.com/magaza/x-m-1241715',
  },

  /** Satıcı bilgileri — Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu için zorunludur. */
  company: {
    title: 'GÜNCELLENECEK — Şirket ünvanı / Şahıs adı soyadı',
    address: 'GÜNCELLENECEK — Açık adres, İlçe / İl',
    taxOffice: 'GÜNCELLENECEK',
    taxNumber: 'GÜNCELLENECEK',
    mersis: 'GÜNCELLENECEK',
    kep: 'GÜNCELLENECEK',
    etbis: '', // ETBİS kayıt numarası verildiğinde eklenir
  },

  /** Havale / EFT bilgileri (kart ödemesi bağlanana kadar kullanılır). */
  bank: {
    name: 'GÜNCELLENECEK — Banka adı',
    holder: 'GÜNCELLENECEK — Hesap sahibi',
    iban: 'TR00 0000 0000 0000 0000 0000 00',
  },

  shipping: {
    freeOver: 1000, // TL — bu tutar ve üzeri ücretsiz kargo
    fee: 79.9, // TL — eşiğin altındaki siparişlerde kargo ücreti
    cutoffHour: 15, // Hafta içi bu saate kadar verilen siparişler aynı gün kargoya verilir
    deliveryDays: [1, 3] as const, // Kargoya verildikten sonra tahmini teslim (iş günü)
    carrier: 'Anlaşmalı kargo firması', // GÜNCELLENECEK — örn. Yurtiçi Kargo
  },

  returns: {
    days: 14,
    freeReturn: true, // Anlaşmalı kargo ile iade ücretsiz
  },

  services: {
    giftWrap: true, // Ücretsiz hediye paketi
  },

  payment: {
    /**
     * Kart ödemesi için sağlayıcı (iyzico, PayTR vb.) bağlandığında `true`
     * yapın ve lib/payment.ts içindeki startPayment fonksiyonunu doldurun.
     * Bağlanana kadar siparişler Havale/EFT + WhatsApp onayı ile alınır.
     */
    cardEnabled: false,
  },

  /** Primo — sağ altta ara sıra selam veren küçük stil asistanı. */
  mascot: {
    enabled: true,
    firstDelayMs: 9000,
    maxPerSession: 3,
  },
} as const

export const nav = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/urunler', label: 'Ürünler' },
  { href: '/hizmetler', label: 'Hizmetler' },
  { href: '/galeri', label: 'Galeri' },
  { href: '/beden-rehberi', label: 'Beden Rehberi' },
  { href: '/iletisim', label: 'İletişim' },
] as const

export const whatsappLink = (text?: string) =>
  `https://wa.me/${site.contact.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`
