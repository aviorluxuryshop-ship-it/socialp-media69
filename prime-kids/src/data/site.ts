/**
 * MAĞAZA AYARLARI — şirket, iletişim, sosyal bağlantılar, kargo ve ödeme tek yerden yönetilir.
 *
 * ⚠️ "ÖRNEK" yorumlu her değer deneme aşaması için yazılmış gerçekçi bir yer tutucudur.
 *    Yayına almadan önce gerçekleriyle değiştirin (liste: README.md → "Örnek değerler").
 */

/** Bağlanabilecek ödeme sağlayıcıları. Yeni sağlayıcı: src/lib/payment/index.ts */
export type PaymentProviderId = "mock" | "iyzico" | "paytr";

export const site = {
  name: "Prime Kids",
  tagline: "Çocuklar için özenle seçilmiş takımlar",
  description:
    "Prime Kids: 2–14 yaş kız ve erkek çocuklar için üstü altı uyumlu, rahat ve şık takımlar. Güvenli ödeme, hızlı kargo, 14 gün içinde kolay iade.",
  // ÖRNEK — gerçek alan adı. Ortam değişkeni NEXT_PUBLIC_SITE_URL verilirse o kullanılır.
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.primeekids.com",
  currency: "TRY",

  company: {
    legalName: "Prime Kids Tekstil ve Ticaret Limited Şirketi", // ÖRNEK
    mersis: "0733058294100017", // ÖRNEK
    taxOffice: "Güngören", // ÖRNEK
    taxNo: "7330582941", // ÖRNEK
    address: "Mehmet Nesih Özmen Mah. Fatih Cad. No: 24/3, 34173 Güngören / İstanbul", // ÖRNEK
    kepEmail: "primekids@hs01.kep.tr", // ÖRNEK
  },

  contact: {
    phone: "+902125550142", // ÖRNEK — tel: bağlantısı için, + ve ülke koduyla
    phoneDisplay: "0 (212) 555 01 42", // ÖRNEK
    whatsapp: "905550100142", // ÖRNEK — ülke kodlu, + ve boşluksuz
    whatsappDisplay: "0 (555) 010 01 42", // ÖRNEK
    email: "destek@primeekids.com", // ÖRNEK
    // ÖRNEK — çalışma saatleri
    hours: [
      { days: "Pazartesi – Cumartesi", time: "09.30 – 18.30" },
      { days: "Pazar", time: "Kapalı (mesajlarınız pazartesi yanıtlanır)" },
    ],
  },

  social: {
    instagram: { handle: "primeekids", url: "https://www.instagram.com/primeekids" },
    trendyol: { url: "https://ty.gl/trs01opq42nkp" },
  },

  shipping: {
    freeThreshold: 1500, // ÖRNEK — TL; bu tutar ve üzeri kargo ücretsiz
    fee: 79, // ÖRNEK — TL
    carrier: "Yurtiçi Kargo", // ÖRNEK
    dispatchDays: "1-2 iş günü", // ÖRNEK — kargoya verme süresi
    deliveryDays: "2-4 iş günü", // ÖRNEK — kargoya verildikten sonra teslim süresi
    returnDays: 14, // 6502 sayılı Kanun: mesafeli satışta yasal cayma süresi
    returnAddress: "Mehmet Nesih Özmen Mah. Fatih Cad. No: 24/3, 34173 Güngören / İstanbul", // ÖRNEK
    // ÖRNEK — cayma hakkı iadelerinde iade kargosunu kimin ödediği (İade ve Değişim metninde aynen yer alır)
    returnShippingPolicy:
      "Cayma hakkı kapsamındaki iadelerde, talebinizin ardından size ileteceğimiz iade kodu ile anlaşmalı kargo firmamız üzerinden yapacağınız gönderimin ücreti tarafımızca karşılanır. Farklı bir kargo firmasıyla veya iade kodu olmadan yapılan gönderimlerde kargo ücreti göndericiye aittir.",
    giftWrap: true, // ÖRNEK — ücretsiz hediye paketi hizmeti sunuluyor mu?
  },

  payment: {
    /** Etkin ödeme sağlayıcısı. "mock" = deneme modu, gerçek ödeme almaz. */
    provider: "mock" as PaymentProviderId,
    /**
     * Gerçek sağlayıcı TEST (sandbox) anahtarlarıyla çalışırken true bırakın:
     * ödeme adımında "deneme modu" bilgilendirmesi gösterilir. Canlıya geçince false yapın.
     */
    sandbox: true,
    /** Yasal metinlerde ödeme kuruluşu olarak geçen ad. ÖRNEK — sağlayıcı kesinleşince güncelleyin. */
    legalName: "iyzico",
  },
};

/** true ise ödeme gerçek alınmıyor demektir; ödeme adımında dürüst bir uyarı gösterilir. */
export const isTestPayment = site.payment.provider === "mock" || site.payment.sandbox;

/** Ana menü — header, mobil menü ve footer aynı listeyi kullanır. */
export const mainNav = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/urunler", label: "Ürünler" },
  { href: "/hizmetlerimiz", label: "Hizmetlerimiz" },
  { href: "/galeri", label: "Galeri" },
  { href: "/iletisim", label: "İletişim" },
];

/** Beden rehberi — ÖRNEK ölçüler (yaş → boy / kilo aralığı). */
export const sizeGuide = [
  { age: "2 yaş", height: "86–92 cm", weight: "11–13 kg" },
  { age: "3 yaş", height: "93–98 cm", weight: "13–15 kg" },
  { age: "4 yaş", height: "99–104 cm", weight: "15–17 kg" },
  { age: "5 yaş", height: "105–110 cm", weight: "17–20 kg" },
  { age: "6 yaş", height: "111–116 cm", weight: "20–22 kg" },
  { age: "7 yaş", height: "117–122 cm", weight: "22–25 kg" },
  { age: "8 yaş", height: "123–128 cm", weight: "25–28 kg" },
  { age: "9 yaş", height: "129–134 cm", weight: "28–31 kg" },
  { age: "10 yaş", height: "135–140 cm", weight: "31–35 kg" },
  { age: "11 yaş", height: "141–146 cm", weight: "35–39 kg" },
  { age: "12 yaş", height: "147–152 cm", weight: "39–44 kg" },
  { age: "13 yaş", height: "153–158 cm", weight: "44–49 kg" },
  { age: "14 yaş", height: "159–164 cm", weight: "49–54 kg" },
];
