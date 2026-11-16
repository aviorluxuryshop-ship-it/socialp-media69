/**
 * ÜRÜNLER — yeni ürün eklemek, fiyat/beden/stok değiştirmek için yalnızca bu dosyayı düzenleyin.
 *
 * ⚠️ ÖRNEK: Fiyatlar, beden aralıkları, kumaş/kompozisyon bilgileri, bakım önerileri ve stok
 *    adetleri deneme aşaması için yazılmış gerçekçi örneklerdir. Gerçek ürün etiketlerine göre güncelleyin.
 *
 * Yeni ürün: görseli public/products/ altına koyun (dikey, tercihen 1024×1536 .webp) ve aşağıdaki
 * listeye bir kayıt ekleyin. Sunucu tarafı fiyat hesabı da bu dosyayı kullanır.
 */
export type Category = "kiz" | "erkek" | "mini";

export type Color = {
  id: string;
  name: string;
  hex: string; // renk seçicide görünen ton
  image: string; // /products/...
  alt: string; // görselin kısa tarifi (erişilebilirlik + SEO)
};

export type Product = {
  slug: string;
  name: string;
  category: Category;
  price: number; // TL, KDV dahil — ÖRNEK
  badge?: string; // kart üzerindeki kısa etiket (ör. "Yeni", "Şardonlu")
  short: string;
  description: string;
  includes: string[]; // takım içeriği
  features: string[];
  fabric: { composition: string; note: string }; // ÖRNEK
  care: string[]; // ÖRNEK
  sizes: string[]; // "6 yaş" biçiminde; beden rehberi site.ts → sizeGuide
  colors: Color[];
  /**
   * Stok — ÖRNEK. Yalnızca istisnaları yazın: stock[renkId][beden] = adet.
   * Yazılmayan renk/beden "stokta" kabul edilir. 0 = tükendi, 1–3 = "Son X adet" uyarısı.
   */
  stock?: Record<string, Record<string, number>>;
  featured?: boolean; // ana sayfada "Öne çıkanlar"
};

export const categories: { id: Category; label: string; blurb: string; image: string }[] = [
  { id: "kiz", label: "Kız Çocuk", blurb: "Denim, eşofman ve şardonlu takımlar · 6–14 yaş", image: "/products/denim-mavi.webp" },
  { id: "erkek", label: "Erkek Çocuk", blurb: "Gömlek ceket ve kargo takımlar · 6–14 yaş", image: "/products/legend-mavi.webp" },
  { id: "mini", label: "Mini", blurb: "Minikler için yumuşak takımlar · 2–5 yaş", image: "/products/cow-kahve.webp" },
];

const S = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${from + i} yaş`);

export const products: Product[] = [
  {
    slug: "legend-gomlek-ceket-takimi",
    name: "Legend Gömlek Ceket Takımı",
    category: "erkek",
    price: 1290,
    featured: true,
    short: "Cepli gömlek ceket + kargo pantolon",
    description:
      "Çıtçıtlı gömlek ceket ve lastikli paçalı kargo pantolondan oluşan sokak stili takım. Beyaz baskılı tişörtle bir araya geldiğinde okula da, hafta sonuna da yakışır.",
    includes: ["Çıtçıtlı cepli gömlek ceket", "Yan cepli kargo pantolon"],
    features: [
      "Çıtçıtlı ön kapama ve iki büyük cep",
      "Bel ve paçada lastik, ayarlanabilir bağcık",
      "Yumuşak dokulu, dik duran kumaş",
    ],
    fabric: {
      composition: "%98 pamuk, %2 elastan · gabardin dokuma",
      note: "Dik duran ama sertleşmeyen, orta kalınlıkta gabardin. Üç mevsim giyilebilir.",
    },
    care: ["30° ters çevirip yıkayın", "Ağartıcı kullanmayın", "Düşük ısıda ütüleyin"],
    sizes: S(6, 14),
    stock: {"siyah": {"8 yaş": 2}, "yesil": {"14 yaş": 0}},
    colors: [
      { id: "siyah", name: "Siyah", hex: "#1B1B1B", image: "/products/legend-siyah.webp", alt: "Siyah renk Legend gömlek ceket takımı giyen erkek çocuk" },
      { id: "mavi", name: "Buz Mavisi", hex: "#7FB2D4", image: "/products/legend-mavi.webp", alt: "Buz Mavisi renk Legend gömlek ceket takımı giyen erkek çocuk" },
      { id: "kahve", name: "Kahve", hex: "#4A2A2A", image: "/products/legend-kahve.webp", alt: "Kahve renk Legend gömlek ceket takımı giyen erkek çocuk" },
      { id: "bej", name: "Bej", hex: "#D8C6A8", image: "/products/legend-bej.webp", alt: "Bej renk Legend gömlek ceket takımı giyen erkek çocuk" },
      { id: "yesil", name: "Zümrüt Yeşili", hex: "#0F5E52", image: "/products/legend-yesil.webp", alt: "Zümrüt Yeşili renk Legend gömlek ceket takımı giyen erkek çocuk" },
    ],
  },
  {
    slug: "perfect-denim-seritli-takim",
    name: "Perfect Denim Şeritli Takım",
    category: "kiz",
    price: 1190,
    badge: "Şardonlu",
    featured: true,
    short: "Şardonlu sweatshirt + geniş paça pantolon",
    description:
      "Yan şerit ve denim detaylı, içi şardonlu kışlık takım. Geniş paça kesimi ve bisiklet yaka sweatshirt ile hem rahat hem trend.",
    includes: ["Bisiklet yaka sweatshirt", "Geniş paça pantolon"],
    features: [
      "İçi yumuşak şardonlu, kışlık kalınlık",
      "Kol ve paçada denim blok detayı",
      "Yan şeritli, bağcıklı bel",
    ],
    fabric: {
      composition: "%80 pamuk, %20 polyester · üç iplik şardonlu",
      note: "İçi şardonlu (tüylü) kışlık kumaş; denim bloklar %100 pamuk.",
    },
    care: ["30° ters çevirip yıkayın", "Kurutma makinesinde kurutmayın", "Düşük ısıda ütüleyin"],
    sizes: S(6, 14),
    stock: {"pembe": {"6 yaş": 0, "7 yaş": 3}},
    colors: [
      { id: "siyah", name: "Siyah", hex: "#1B1B1B", image: "/products/perfect-siyah.webp", alt: "Siyah renk Perfect denim şeritli takım giyen kız çocuk" },
      { id: "pembe", name: "Pembe", hex: "#E58AA7", image: "/products/perfect-pembe.webp", alt: "Pembe renk Perfect denim şeritli takım giyen kız çocuk" },
      { id: "ekru", name: "Ekru", hex: "#F2EEE6", image: "/products/perfect-ekru.webp", alt: "Ekru renk Perfect denim şeritli takım giyen kız çocuk" },
    ],
  },
  {
    slug: "vintage-vibes-yarim-fermuarli-takim",
    name: "Vintage Vibes Yarım Fermuarlı Takım",
    category: "kiz",
    price: 1090,
    short: "Nakışlı sweatshirt + dikişli geniş paça pantolon",
    description:
      "Yarım fermuarlı, nakış arma işlemeli kalın sweatshirt ve ön dikişli geniş paça pantolon. Tek renk, temiz bir görünüm.",
    includes: ["Yarım fermuarlı sweatshirt", "Ön dikişli geniş paça pantolon"],
    features: [
      "Göğüste nakış işleme",
      "Dik yaka, yarım fermuar",
      "Bel bağcığı ve yan cepler",
    ],
    fabric: {
      composition: "%80 pamuk, %20 polyester · üç iplik şardonlu",
      note: "Kalın ve yumuşak dokulu kışlık kumaş; nakış işleme yıkamada dökülmez.",
    },
    care: ["30° ters çevirip yıkayın", "Ağartıcı kullanmayın", "Düşük ısıda ütüleyin"],
    sizes: S(6, 14),
    stock: {"fusya": {"12 yaş": 3, "14 yaş": 0}},
    colors: [
      { id: "yesil", name: "Zümrüt Yeşili", hex: "#145A3A", image: "/products/vintage-yesil.webp", alt: "Zümrüt Yeşili renk Vintage Vibes yarım fermuarlı takım giyen kız çocuk" },
      { id: "fusya", name: "Fuşya", hex: "#D4175F", image: "/products/vintage-fusya.webp", alt: "Fuşya renk Vintage Vibes yarım fermuarlı takım giyen kız çocuk" },
      { id: "siyah", name: "Siyah", hex: "#1B1B1B", image: "/products/vintage-siyah.webp", alt: "Siyah renk Vintage Vibes yarım fermuarlı takım giyen kız çocuk" },
      { id: "kahve", name: "Kahve", hex: "#4B2A24", image: "/products/vintage-kahve.webp", alt: "Kahve renk Vintage Vibes yarım fermuarlı takım giyen kız çocuk" },
    ],
  },
  {
    slug: "varsity-denim-takim",
    name: "Varsity Denim Takım",
    category: "kiz",
    price: 1390,
    badge: "Yeni",
    short: "Denim bloklu ceket + kargo cepli denim pantolon",
    description:
      "Peluş harf işlemeli, püskül kenarlı denim bloklu ceket ve geniş kesim kargo cepli denim pantolon. Okul koridorlarından ilham alan bir takım.",
    includes: ["Denim bloklu çıtçıtlı ceket", "Kargo cepli geniş denim pantolon"],
    features: [
      "Peluş harf nakışı",
      "Ribana manşet, püskül detay",
      "Büyük yan cepler, lastikli bel",
    ],
    fabric: {
      composition: "Denim: %100 pamuk · Üst blok: %95 pamuk, %5 elastan",
      note: "Yumuşatılmış denim; ribana manşetler esnek ve rahattır.",
    },
    care: ["30° ters çevirip yıkayın", "İlk yıkamada ayrı yıkayın", "Düşük ısıda ütüleyin"],
    sizes: S(6, 12),
    stock: {"siyah": {"12 yaş": 1}},
    colors: [
      { id: "ekru-mavi", name: "Ekru / Mavi", hex: "#8DB7E6", image: "/products/varsity-mavi.webp", alt: "Ekru / Mavi renk Varsity denim takım giyen kız çocuk" },
      { id: "siyah", name: "Siyah / Denim", hex: "#1B1B1B", image: "/products/varsity-siyah.webp", alt: "Siyah / Denim renk Varsity denim takım giyen kız çocuk" },
    ],
  },
  {
    slug: "puskullu-denim-takim",
    name: "Püsküllü Denim Takım",
    category: "kiz",
    price: 1290,
    badge: "Yeni",
    featured: true,
    short: "Kısa denim ceket + püsküllü geniş paça pantolon",
    description:
      "Yıkamalı denim kısa ceket ve yanlarında püskül detaylı geniş paça pantolon. Beyaz tişörtle sade, tek başına bile iddialı bir denim takım.",
    includes: ["Çıtçıtlı kısa denim ceket", "Yüksek bel geniş paça denim pantolon"],
    features: [
      "Yıkamalı, soluk denim görünümü",
      "Pantolon yanlarında püskül detay",
      "Cepli ceket, metal çıtçıt kapama",
    ],
    fabric: {
      composition: "%99 pamuk, %1 elastan · yıkamalı denim",
      note: "Taş yıkamalı, yumuşatılmış denim. Hafif esneme payı hareketi kolaylaştırır.",
    },
    care: ["30° ters çevirip yıkayın", "İlk yıkamada ayrı yıkayın", "Düşük ısıda ütüleyin"],
    sizes: S(6, 14),
    stock: {"fume": {"10 yaş": 0}},
    colors: [
      { id: "mavi", name: "Mavi", hex: "#4F85BD", image: "/products/denim-mavi.webp", alt: "Mavi renk püsküllü denim takım giyen kız çocuk" },
      { id: "fume", name: "Füme", hex: "#55565A", image: "/products/denim-fume.webp", alt: "Füme renk püsküllü denim takım giyen kız çocuk" },
    ],
  },
  {
    slug: "felix-star-esofman-takimi",
    name: "Felix Star Eşofman Takımı",
    category: "kiz",
    price: 1190,
    short: "Fermuarlı şeritli ceket + geniş paça eşofman",
    description:
      "Kol ve paçada kontrast şeritli, yıldız armalı fermuarlı eşofman takımı. İçine tişört giyilerek günlük kombinin kolay parçası.",
    includes: ["Dik yaka fermuarlı ceket", "Yan şeritli geniş paça eşofman altı"],
    features: [
      "Göğüste yıldız arma",
      "Kolda ve yanda kontrast şerit",
      "Ribana manşet ve etek ucu",
    ],
    fabric: {
      composition: "%95 pamuk, %5 elastan · iki iplik",
      note: "İnce astarlı, mevsim geçişlerine uygun iki iplik kumaş.",
    },
    care: ["30° ters çevirip yıkayın", "Kurutma makinesinde kurutmayın", "Düşük ısıda ütüleyin"],
    sizes: S(6, 14),
    colors: [
      { id: "kahve", name: "Kahve / Mavi", hex: "#3E2A22", image: "/products/felix-kahve.webp", alt: "Kahve / Mavi renk Felix Star eşofman takımı giyen kız çocuk" },
      { id: "pembe", name: "Pembe / Mavi", hex: "#EE9DBB", image: "/products/felix-pembe.webp", alt: "Pembe / Mavi renk Felix Star eşofman takımı giyen kız çocuk" },
    ],
  },
  {
    slug: "cow-dama-pantolon-takimi",
    name: "Cow Dama Pantolon Takımı",
    category: "mini",
    price: 890,
    badge: "Mini",
    featured: true,
    short: "Baskılı sweatshirt + dama desen pantolon",
    description:
      "Sevimli inek baskılı sweatshirt ve lastikli paçalı dama desen pantolon. Minikler için yumuşak ve hareket etmeye uygun.",
    includes: ["Baskılı sweatshirt", "Dama desen lastikli paça pantolon"],
    features: [
      "Sevimli inek baskısı",
      "Bel ve paçada lastik",
      "Yan cepli, bol ve rahat kesim",
    ],
    fabric: {
      composition: "%100 pamuk · üç iplik şardonlu",
      note: "Hassas ciltler düşünülerek seçilmiş yumuşak pamuklu kumaş.",
    },
    care: ["30° ters çevirip yıkayın", "Ağartıcı kullanmayın", "Düşük ısıda ütüleyin"],
    sizes: S(2, 5),
    stock: {"kahve": {"3 yaş": 2}},
    colors: [
      { id: "kahve", name: "Kahve / Krem", hex: "#5A3622", image: "/products/cow-kahve.webp", alt: "Kahve / Krem renk Cow dama pantolon takımı giyen erkek çocuk" },
    ],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const categoryLabel = (c: Category) => categories.find((x) => x.id === c)!.label;

/** Stokta sayılan varsayılan adet (stock alanında yazılmayan renk/bedenler için). */
const DEFAULT_STOCK = 20;
export const LOW_STOCK = 3;
export const MAX_QTY_PER_LINE = 9;

export function stockOf(p: Product, colorId: string, size: string): number {
  return p.stock?.[colorId]?.[size] ?? DEFAULT_STOCK;
}

/** "6–14 yaş" gibi kısa beden aralığı. */
export function sizeRange(p: Product): string {
  const n = (s: string) => s.replace(" yaş", "");
  return `${n(p.sizes[0])}–${n(p.sizes[p.sizes.length - 1])} yaş`;
}
