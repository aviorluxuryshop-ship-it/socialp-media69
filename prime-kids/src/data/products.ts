export type Category = "kiz" | "erkek" | "mini";

export type Color = {
  id: string;
  name: string;
  hex: string;
  image: string; // /products/...
};

export type Product = {
  slug: string;
  name: string;
  category: Category;
  price: number; // TL — ÖRNEK fiyat
  oldPrice?: number;
  badge?: string;
  short: string;
  description: string;
  includes: string[];
  features: string[];
  care: string[];
  sizes: string[];
  colors: Color[];
  featured?: boolean;
};

export const categories: { id: Category; label: string; blurb: string }[] = [
  { id: "kiz", label: "Kız Çocuk", blurb: "Şeritli, nakışlı, denimli takımlar" },
  { id: "erkek", label: "Erkek Çocuk", blurb: "Gömlek ceket ve kargo takımlar" },
  { id: "mini", label: "Mini", blurb: "2–5 yaş için rahat parçalar" },
];

const S = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${from + i} yaş`);

/**
 * ⚠️ Fiyatlar, bedenler ve ürün içerikleri ÖRNEKTİR — gerçek bilgilerle güncelleyin.
 * Renk görselleri /public/products altındadır.
 */
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
    care: ["30° ters çevirip yıkayın", "Ağartıcı kullanmayın", "Düşük ısıda ütüleyin"],
    sizes: S(6, 14),
    colors: [
      { id: "siyah", name: "Siyah", hex: "#1B1B1B", image: "/products/legend-siyah.webp" },
      { id: "mavi", name: "Buz Mavisi", hex: "#7FB2D4", image: "/products/legend-mavi.webp" },
      { id: "kahve", name: "Kahve", hex: "#4A2A2A", image: "/products/legend-kahve.webp" },
      { id: "bej", name: "Bej", hex: "#D8C6A8", image: "/products/legend-bej.webp" },
      { id: "yesil", name: "Zümrüt Yeşili", hex: "#0F5E52", image: "/products/legend-yesil.webp" },
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
    care: ["30° ters çevirip yıkayın", "Kurutma makinesinde kurutmayın", "Düşük ısıda ütüleyin"],
    sizes: S(6, 14),
    colors: [
      { id: "siyah", name: "Siyah", hex: "#1B1B1B", image: "/products/perfect-siyah.webp" },
      { id: "pembe", name: "Pembe", hex: "#E58AA7", image: "/products/perfect-pembe.webp" },
      { id: "ekru", name: "Ekru", hex: "#F2EEE6", image: "/products/perfect-ekru.webp" },
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
    care: ["30° ters çevirip yıkayın", "Ağartıcı kullanmayın", "Düşük ısıda ütüleyin"],
    sizes: S(6, 14),
    colors: [
      { id: "yesil", name: "Zümrüt Yeşili", hex: "#145A3A", image: "/products/vintage-yesil.webp" },
      { id: "fusya", name: "Fuşya", hex: "#D4175F", image: "/products/vintage-fusya.webp" },
      { id: "siyah", name: "Siyah", hex: "#1B1B1B", image: "/products/vintage-siyah.webp" },
      { id: "kahve", name: "Kahve", hex: "#4B2A24", image: "/products/vintage-kahve.webp" },
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
    care: ["30° ters çevirip yıkayın", "İlk yıkamada ayrı yıkayın", "Düşük ısıda ütüleyin"],
    sizes: S(6, 12),
    colors: [
      { id: "ekru-mavi", name: "Ekru / Mavi", hex: "#8DB7E6", image: "/products/varsity-mavi.webp" },
      { id: "siyah", name: "Siyah / Denim", hex: "#1B1B1B", image: "/products/varsity-siyah.webp" },
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
    care: ["30° ters çevirip yıkayın", "İlk yıkamada ayrı yıkayın", "Düşük ısıda ütüleyin"],
    sizes: S(6, 14),
    colors: [
      { id: "mavi", name: "Mavi", hex: "#4F85BD", image: "/products/denim-mavi.webp" },
      { id: "fume", name: "Füme", hex: "#55565A", image: "/products/denim-fume.webp" },
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
    care: ["30° ters çevirip yıkayın", "Kurutma makinesinde kurutmayın", "Düşük ısıda ütüleyin"],
    sizes: S(6, 14),
    colors: [
      { id: "kahve", name: "Kahve / Mavi", hex: "#3E2A22", image: "/products/felix-kahve.webp" },
      { id: "pembe", name: "Pembe / Mavi", hex: "#EE9DBB", image: "/products/felix-pembe.webp" },
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
    care: ["30° ters çevirip yıkayın", "Ağartıcı kullanmayın", "Düşük ısıda ütüleyin"],
    sizes: S(2, 5),
    colors: [
      { id: "kahve", name: "Kahve / Krem", hex: "#5A3622", image: "/products/cow-kahve.webp" },
    ],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const categoryLabel = (c: Category) => categories.find((x) => x.id === c)!.label;
export const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n) + " ₺";
