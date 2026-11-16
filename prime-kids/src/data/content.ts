/**
 * SAYFA İÇERİKLERİ — hizmetler, galeri serileri ve ana sayfadaki kısa metinler.
 * Metinleri buradan değiştirebilirsiniz; tutarlar ve süreler site.ts'den okunur.
 */
import { site } from "./site";

const { shipping, contact } = site;

export type IconName =
  | "ruler" | "gift" | "return" | "truck" | "chat" | "boxes" | "shield" | "lock";

export type Service = {
  id: string;
  icon: IconName;
  title: string;
  summary: string; // kartta görünen tek cümle
  body: string[]; // hizmetler sayfasındaki açıklama
  cta: { label: string; href: string; external?: boolean };
};

const wa = (text: string) => `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`;

// ÖRNEK — sunduğunuz hizmetlere göre düzenleyin.
export const services: Service[] = [
  {
    id: "beden-danismanligi",
    icon: "ruler",
    title: "Beden danışmanlığı",
    summary: "Çocuğunuzun boyunu ve kilosunu yazın, doğru bedeni birlikte seçelim.",
    body: [
      "Çocuklar hızlı büyür; aynı yaştaki iki çocuk farklı beden giyebilir. Boy ve kilo bilgisini WhatsApp’tan iletmeniz yeterli: ürünün kalıbına göre size uygun bedeni öneririz.",
      "Her ürün sayfasında yaş, boy ve kilo aralıklarını gösteren beden rehberi de bulunur.",
    ],
    cta: { label: "WhatsApp’tan beden sorun", href: wa("Merhaba, beden seçimi için yardım almak istiyorum. Çocuğumun boyu ve kilosu:"), external: true },
  },
  {
    id: "hediye-paketi",
    icon: "gift",
    title: "Hediye paketi ve not",
    summary: "Siparişinizi ücretsiz hediye paketi ve el yazısı notla gönderelim.",
    body: [
      "Doğum günü, bayram ya da yeni bir kardeş… Ödeme adımında “Hediye paketi istiyorum” seçeneğini işaretleyin, dilerseniz kısa bir not yazın.",
      "Hediye gönderimlerinde pakete fiyat bilgisi içeren belge koymayız; faturanız e-posta adresinize iletilir.",
    ],
    cta: { label: "Hediye seçin", href: "/urunler" },
  },
  {
    id: "iade-degisim",
    icon: "return",
    title: "Kolay iade ve değişim",
    summary: `Teslimattan sonra ${shipping.returnDays} gün içinde iade ya da beden değişimi.`,
    body: [
      `Beden olmadıysa ya da ürün beklediğiniz gibi değilse, teslim aldıktan sonra ${shipping.returnDays} gün içinde bize yazın. Kullanılmamış, yıkanmamış ve etiketi üzerinde olan ürünlerde iade veya beden değişimi yapıyoruz.`,
      "Süreç boyunca ne yapmanız gerektiğini adım adım iletiyoruz; iade tutarı, ürün bize ulaşıp kontrol edildikten sonra ödeme yaptığınız karta aktarılır.",
    ],
    cta: { label: "İade ve değişim koşulları", href: "/yasal/iade-degisim" },
  },
  {
    id: "hizli-kargo",
    icon: "truck",
    title: "Hızlı ve takipli kargo",
    summary: `Siparişler ${shipping.dispatchDays} içinde ${shipping.carrier} ile yola çıkar.`,
    body: [
      `Siparişinizi ${shipping.dispatchDays} içinde özenle paketleyip ${shipping.carrier} ile gönderiyoruz. Kargoya verildiğinde takip numaranız e-posta ile iletilir; teslimat genellikle ${shipping.deliveryDays} sürer.`,
      `${new Intl.NumberFormat("tr-TR").format(shipping.freeThreshold)} ₺ ve üzeri siparişlerde kargo ücretsizdir; altındaki siparişlerde kargo ücreti ${shipping.fee} ₺’dir.`,
    ],
    cta: { label: "Teslimat ve kargo koşulları", href: "/yasal/teslimat-kargo" },
  },
  {
    id: "destek",
    icon: "chat",
    title: "WhatsApp ve telefon desteği",
    summary: "Sipariş öncesi ve sonrası sorularınıza gerçek bir kişi yanıt verir.",
    body: [
      "Kumaş kalınlığı, renk tonu, kargo durumu… Aklınıza takılan her şeyi WhatsApp’tan yazabilir ya da bizi arayabilirsiniz.",
      `Çalışma saatlerimiz: ${contact.hours[0].days}, ${contact.hours[0].time}. Mesai dışında gelen mesajları ilk iş günü yanıtlıyoruz.`,
    ],
    cta: { label: "İletişim bilgileri", href: "/iletisim" },
  },
  {
    id: "toplu-siparis",
    icon: "boxes",
    title: "Toplu ve kurumsal sipariş",
    summary: "Kardeş kombinleri, okul ve kreş etkinlikleri, butikler için toplu sipariş.",
    body: [
      "Aynı takımdan birden fazla beden ya da renk, okul ve kreş etkinlikleri, doğum günü kombinleri veya mağazanız için toplu alım yapmak isterseniz bize yazın.",
      "Adet ve bedenlere göre stok durumunu, teslim süresini ve fiyat teklifini iletelim.",
    ],
    cta: { label: "Toplu sipariş için yazın", href: "/iletisim?konu=toplu-siparis#form" },
  },
];

/** Ana sayfa: "Nasıl satın alırım?" adımları. */
export const buySteps = [
  { title: "Takımı seçin", text: "Ürün sayfasında rengi ve bedeni seçin. Emin olamazsanız beden rehberine bakın ya da bize sorun." },
  { title: "Sepete ekleyip bilgilerinizi girin", text: "Teslimat adresinizi yazın; üyelik gerekmez. Sözleşmeleri sipariş öncesinde okuyabilirsiniz." },
  { title: "Güvenle ödeyin, kapınıza gelsin", text: `Ödeme, ödeme kuruluşunun güvenli sayfasında kartla yapılır. Siparişiniz ${shipping.dispatchDays} içinde kargoya verilir.` },
];

/**
 * GALERİ — fotoğraflar seri mantığıyla gruplanır. Her kare bir ürün rengine bağlıdır:
 * { product: ürün slug'ı, color: renk id'si } → görsel, alt metni ve ürün bağlantısı products.ts'den gelir.
 */
export type GallerySeries = {
  id: string;
  title: string;
  kicker: string;
  text: string;
  shots: { product: string; color: string }[];
};

export const gallerySeries: GallerySeries[] = [
  {
    id: "sokak",
    kicker: "Seri 01 · Erkek",
    title: "Şehirde bir gün",
    text: "Legend gömlek ceket takımı, beş renkte. Dışarıda çekildi; çünkü bu takım okul çıkışına da, hafta sonu gezmesine de aynı rahatlıkla eşlik ediyor.",
    shots: [
      { product: "legend-gomlek-ceket-takimi", color: "siyah" },
      { product: "legend-gomlek-ceket-takimi", color: "bej" },
      { product: "legend-gomlek-ceket-takimi", color: "yesil" },
      { product: "legend-gomlek-ceket-takimi", color: "mavi" },
      { product: "legend-gomlek-ceket-takimi", color: "kahve" },
    ],
  },
  {
    id: "denim",
    kicker: "Seri 02 · Kız",
    title: "Denim, baştan ayağa",
    text: "Püsküllü ve Varsity takımlar: yumuşatılmış denim, geniş paça ve rahat kalıp. Beyaz tişörtle sade, tek başına bile yeterince iddialı.",
    shots: [
      { product: "puskullu-denim-takim", color: "mavi" },
      { product: "puskullu-denim-takim", color: "fume" },
      { product: "varsity-denim-takim", color: "ekru-mavi" },
      { product: "varsity-denim-takim", color: "siyah" },
    ],
  },
  {
    id: "tek-renk",
    kicker: "Seri 03 · Kız",
    title: "Tek renk, sakin duruş",
    text: "Vintage Vibes: nakış armalı yarım fermuarlı sweatshirt ve aynı tonda geniş paça pantolon. Dört renk, tek ve temiz bir çizgi.",
    shots: [
      { product: "vintage-vibes-yarim-fermuarli-takim", color: "yesil" },
      { product: "vintage-vibes-yarim-fermuarli-takim", color: "kahve" },
      { product: "vintage-vibes-yarim-fermuarli-takim", color: "siyah" },
      { product: "vintage-vibes-yarim-fermuarli-takim", color: "fusya" },
    ],
  },
  {
    id: "seritler",
    kicker: "Seri 04 · Kız",
    title: "Şeritli günler",
    text: "Perfect ve Felix Star: yan şeritler, yumuşak kumaşlar. Okul sonrası, park ve hafta sonu için hareketi kısıtlamayan takımlar.",
    shots: [
      { product: "perfect-denim-seritli-takim", color: "ekru" },
      { product: "perfect-denim-seritli-takim", color: "pembe" },
      { product: "perfect-denim-seritli-takim", color: "siyah" },
      { product: "felix-star-esofman-takimi", color: "pembe" },
      { product: "felix-star-esofman-takimi", color: "kahve" },
    ],
  },
  {
    id: "mini",
    kicker: "Seri 05 · Mini",
    title: "Minikler için",
    text: "Cow dama pantolon takımı: 2–5 yaş için yumuşak pamuklu kumaş, lastikli bel ve paça. Giydirmesi de çıkarması da kolay.",
    shots: [{ product: "cow-dama-pantolon-takimi", color: "kahve" }],
  },
];
