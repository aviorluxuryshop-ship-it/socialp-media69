/**
 * Ürün kataloğu.
 *
 * Fiyatlar, kumaş içerikleri ve bedenler başlangıç değerleridir —
 * yayından önce gerçek bilgilerle güncelleyin (README › "Yayın öncesi").
 * Yeni ürün eklemek için bir nesne daha ekleyip fotoğrafını
 * public/images/products/ içine koymanız yeterli.
 */

export type Category = 'kiz' | 'erkek' | 'mini'
export type Badge = 'yeni' | 'sardonlu'

export interface ColorVariant {
  id: string
  name: string
  /** Renk yuvarlağında gösterilen ton */
  hex: string
  image: string
  alt: string
}

export interface Product {
  slug: string
  name: string
  /** Kartlarda görünen tek satırlık açıklama */
  short: string
  category: Category
  price: number
  badges: Badge[]
  pieces: string[]
  description: string
  highlights: string[]
  fabric: string
  care: string[]
  sizes: string[]
  colors: ColorVariant[]
  /** Kartlarda ve listelerde sıralama için (küçük olan önce) */
  order: number
}

export const CATEGORY_LABEL: Record<Category, string> = {
  kiz: 'Kız Çocuk',
  erkek: 'Erkek Çocuk',
  mini: 'Mini (1-5 Yaş)',
}

export const BADGE_LABEL: Record<Badge, string> = {
  yeni: 'Yeni Sezon',
  sardonlu: 'Şardonlu · Kışlık',
}

/** Beden tablosu — ortalama ölçüler (cm). */
export const SIZE_CHART = [
  { size: '1-2', label: '1-2 Yaş', height: [80, 92], chest: 52, waist: 50 },
  { size: '2-3', label: '2-3 Yaş', height: [92, 98], chest: 54, waist: 51 },
  { size: '3-4', label: '3-4 Yaş', height: [98, 104], chest: 56, waist: 52 },
  { size: '4-5', label: '4-5 Yaş', height: [104, 110], chest: 58, waist: 53 },
  { size: '5-6', label: '5-6 Yaş', height: [110, 116], chest: 60, waist: 54 },
  { size: '7-8', label: '7-8 Yaş', height: [122, 128], chest: 64, waist: 57 },
  { size: '9-10', label: '9-10 Yaş', height: [134, 140], chest: 68, waist: 60 },
  { size: '11-12', label: '11-12 Yaş', height: [146, 152], chest: 74, waist: 63 },
  { size: '13-14', label: '13-14 Yaş', height: [158, 164], chest: 80, waist: 66 },
] as const

export const sizeLabel = (size: string) => SIZE_CHART.find((s) => s.size === size)?.label ?? `${size} Yaş`

const KID_SIZES = ['5-6', '7-8', '9-10', '11-12', '13-14']
const MINI_SIZES = ['1-2', '2-3', '3-4', '4-5']

const img = (file: string) => `/images/products/${file}.jpg`

export const products: Product[] = [
  {
    slug: 'legend-kargo-takim',
    name: 'Legend Kargo Takım',
    short: 'Gömlek ceket + baskılı tişört + kargo jogger',
    category: 'erkek',
    price: 899.9,
    badges: ['yeni'],
    order: 1,
    pieces: ['Çıtçıt düğmeli gömlek ceket', '“Legend” baskılı beyaz tişört', 'Kargo cepli jogger pantolon'],
    description:
      'Okulda da, hafta sonu gezmesinde de “hazır” görünen üç parçalı takım. Gömlek ceket tek başına ceket gibi açık, ya da düğmeli giyilebilir; lastikli bel ve paçalar sayesinde pantolon gün boyu yerinde durur.',
    highlights: [
      '3 parça: ceket, tişört ve pantolon bir arada',
      'Lastikli, bağcıklı bel — kemer gerektirmez',
      'Manşetli paça, koşarken ayağa dolanmaz',
      'Kapaklı göğüs ve yan kargo cepleri',
    ],
    fabric: 'Yumuşak dokulu pamuk karışımlı kumaş. Tişört %100 pamuk.', // GÜNCELLENECEK
    care: ['30°C’de ters çevirerek yıkayın', 'Çamaşır suyu kullanmayın', 'Düşük ısıda ütüleyin', 'Kurutma makinesi önerilmez'],
    sizes: KID_SIZES,
    colors: [
      { id: 'siyah', name: 'Siyah', hex: '#1b1b1d', image: img('legend-siyah'), alt: 'Siyah Legend kargo takım giymiş erkek çocuk' },
      { id: 'murdum', name: 'Mürdüm', hex: '#4a2a2f', image: img('legend-murdum'), alt: 'Mürdüm rengi Legend kargo takım giymiş erkek çocuk' },
      { id: 'buz-mavisi', name: 'Buz Mavisi', hex: '#7fb4d1', image: img('legend-buz-mavisi'), alt: 'Buz mavisi Legend kargo takım giymiş erkek çocuk' },
      { id: 'bej', name: 'Bej', hex: '#d8c7b0', image: img('legend-bej'), alt: 'Bej Legend kargo takım giymiş erkek çocuk' },
      { id: 'zumrut', name: 'Zümrüt', hex: '#0f5c52', image: img('legend-zumrut'), alt: 'Zümrüt yeşili Legend kargo takım giymiş erkek çocuk' },
    ],
  },
  {
    slug: 'perfect-denim-seritli-takim',
    name: 'Perfect Denim Şeritli Takım',
    short: 'İçi şardonlu sweat + bol paça eşofman',
    category: 'kiz',
    price: 849.9,
    badges: ['yeni', 'sardonlu'],
    order: 2,
    pieces: ['Denim kollu “Perfect” sweatshirt', 'Denim garnili bol paça eşofman altı'],
    description:
      'Kış sabahlarında içini sıcacık tutan şardonlu (içi yumuşak tüylü) kumaş; denim parçalar ve çift şerit detayıyla da her kombine yakışan bir takım. Lastikli kol ağzı ve bel, gün boyu rahatlık sağlar.',
    highlights: [
      'İçi şardonlu, sıcak tutan kışlık kumaş',
      'Denim kol ve paça garnisi',
      'Bağcıklı lastikli bel, yan cepler',
      'Bol paça kesim — rahat ve trend',
    ],
    fabric: 'Şardonlu pamuk karışımlı kumaş, denim garni.', // GÜNCELLENECEK
    care: ['30°C’de ters çevirerek yıkayın', 'Denim parçalar ilk yıkamalarda renk verebilir, benzer renklerle yıkayın', 'Çamaşır suyu kullanmayın'],
    sizes: KID_SIZES,
    colors: [
      { id: 'siyah', name: 'Siyah', hex: '#161618', image: img('perfect-siyah'), alt: 'Siyah Perfect denim şeritli takım giymiş kız çocuk' },
      { id: 'pembe', name: 'Pembe', hex: '#e48ba6', image: img('perfect-pembe'), alt: 'Pembe Perfect denim şeritli takım giymiş kız çocuk' },
      { id: 'ekru', name: 'Ekru', hex: '#f3efe6', image: img('perfect-ekru'), alt: 'Ekru Perfect denim şeritli takım giymiş kız çocuk' },
    ],
  },
  {
    slug: 'vintage-vibes-takim',
    name: 'Vintage Vibes Takım',
    short: 'Yarım fermuarlı sweat + geniş paça eşofman',
    category: 'kiz',
    price: 799.9,
    badges: ['yeni', 'sardonlu'],
    order: 3,
    pieces: ['Nakışlı yarım fermuarlı sweatshirt', 'Dikiş detaylı geniş paça eşofman altı'],
    description:
      'Göğsünde “Vintage Vibes” nakışı olan yarım fermuarlı sweat ve önü dikiş detaylı geniş paça alt. İçi şardonlu kumaşı sayesinde soğuk günlerde bile tek başına yeter; dik yaka boynu rüzgârdan korur.',
    highlights: [
      'İçi şardonlu, kışlık kalın doku',
      'Yarım fermuarlı dik yaka',
      'Nakış işlemeli göğüs detayı',
      'Geniş paça, lastikli bağcıklı bel',
    ],
    fabric: 'Şardonlu pamuk karışımlı kumaş.', // GÜNCELLENECEK
    care: ['30°C’de ters çevirerek yıkayın', 'Nakışlı bölgeyi ütülemeyin', 'Kurutma makinesi önerilmez'],
    sizes: KID_SIZES,
    colors: [
      { id: 'kahve', name: 'Kahve', hex: '#4a2c22', image: img('vintage-kahve'), alt: 'Kahverengi Vintage Vibes takım giymiş kız çocuk' },
      { id: 'siyah', name: 'Siyah', hex: '#18181a', image: img('vintage-siyah'), alt: 'Siyah Vintage Vibes takım giymiş kız çocuk' },
      { id: 'zumrut', name: 'Zümrüt', hex: '#1e5a3d', image: img('vintage-zumrut'), alt: 'Zümrüt yeşili Vintage Vibes takım giymiş kız çocuk' },
      { id: 'fusya', name: 'Fuşya', hex: '#d0196b', image: img('vintage-fusya'), alt: 'Fuşya Vintage Vibes takım giymiş kız çocuk' },
    ],
  },
  {
    slug: 'star-kolej-denim-takim',
    name: 'Star Kolej Denim Takım',
    short: 'Kolej yakalı denim ceket + kargo jean',
    category: 'kiz',
    price: 999.9,
    badges: ['yeni'],
    order: 4,
    pieces: ['Havlu harfli kolej denim ceket', 'Çift kargo cepli bol paça jean'],
    description:
      'Üstü kolej ceket, altı denim: püskül detaylı geçişi ve havlu harfleriyle tam bir “stil sahibi” takım. Bol paça kargo jean hareket ettikçe rahat, çift cepleri ise küçük hazineler için ideal.',
    highlights: [
      'Havlu (tüylü) harf aplikeler',
      'Çizgili ribana kol ağzı',
      'Püskül detaylı denim geçiş',
      'Lastikli bel, iki büyük kargo cep',
    ],
    fabric: 'Pamuklu denim, pamuk karışımlı üst parça.', // GÜNCELLENECEK
    care: ['30°C’de ters çevirerek yıkayın', 'İlk yıkamalarda ayrı yıkayın', 'Aplike üzerine ütü basmayın'],
    sizes: ['4-5', '5-6', '7-8', '9-10', '11-12'],
    colors: [
      { id: 'ekru-mavi', name: 'Ekru · Mavi', hex: '#e9eef5', image: img('kolej-ekru'), alt: 'Ekru ve mavi Star kolej denim takım giymiş kız çocuk' },
      { id: 'siyah-mavi', name: 'Siyah · Mavi', hex: '#1c1d22', image: img('kolej-siyah'), alt: 'Siyah ve mavi Star kolej denim takım giymiş kız çocuk' },
    ],
  },
  {
    slug: 'star-girl-denim-takim',
    name: 'Star Girl Denim Takım',
    short: 'Kısa denim ceket + tişört + püsküllü bol jean',
    category: 'kiz',
    price: 949.9,
    badges: ['yeni'],
    order: 5,
    pieces: ['Kısa kesim denim ceket', '“Star Girl” baskılı tişört', 'Püskül detaylı bol paça jean'],
    description:
      'Kısa denim ceket, beyaz baskılı tişört ve yanları püskül detaylı bol paça jean. Tek tek de giyilebilen üç parça; okul servisinden doğum günü partisine kadar her yere uyar.',
    highlights: ['3 parça takım', 'Yıkamalı denim görünüm', 'Yan püskül detaylı bol paça', 'Yüksek bel, düğme + fermuar kapama'],
    fabric: 'Pamuklu denim. Tişört %100 pamuk.', // GÜNCELLENECEK
    care: ['30°C’de ters çevirerek yıkayın', 'İlk yıkamalarda ayrı yıkayın', 'Çamaşır suyu kullanmayın'],
    sizes: ['7-8', '9-10', '11-12', '13-14'],
    colors: [
      { id: 'mavi', name: 'Mavi', hex: '#5381b3', image: img('stargirl-mavi'), alt: 'Mavi Star Girl denim takım giymiş kız çocuk' },
      { id: 'fume', name: 'Füme', hex: '#4a4a4d', image: img('stargirl-fume'), alt: 'Füme Star Girl denim takım giymiş kız çocuk' },
    ],
  },
  {
    slug: 'yildiz-seritli-esofman-takimi',
    name: 'Yıldız Şeritli Eşofman Takımı',
    short: 'Fermuarlı ceket + şeritli bol paça alt',
    category: 'kiz',
    price: 749.9,
    badges: ['yeni', 'sardonlu'],
    order: 6,
    pieces: ['Dik yakalı fermuarlı ceket', 'Yan şeritli bol paça eşofman altı'],
    description:
      'Kolları ve paçaları kontrast şeritli, göğsünde yıldız armalı fermuarlı eşofman takımı. İçi şardonlu kumaşı sıcak tutar; fermuarı sayesinde giyip çıkarmak çocuklar için çok kolay.',
    highlights: ['İçi şardonlu, kışlık', 'Kontrast renk şerit detayı', 'Yıldız arma', 'Fermuarlı — kendi başına giyebilir'],
    fabric: 'Şardonlu pamuk karışımlı kumaş.', // GÜNCELLENECEK
    care: ['30°C’de ters çevirerek yıkayın', 'Fermuarı kapatarak yıkayın', 'Kurutma makinesi önerilmez'],
    sizes: KID_SIZES,
    colors: [
      { id: 'pembe', name: 'Pembe', hex: '#e79ab4', image: img('yildiz-pembe'), alt: 'Pembe yıldız şeritli eşofman takımı giymiş kız çocuk' },
      { id: 'kahve', name: 'Kahve · Saks', hex: '#3d2a23', image: img('yildiz-kahve'), alt: 'Kahverengi saks şeritli yıldız eşofman takımı giymiş kız çocuk' },
    ],
  },
  {
    slug: 'mini-inek-takim',
    name: 'Mini İnek Takım',
    short: 'İnek baskılı sweat + damalı jogger',
    category: 'mini',
    price: 549.9,
    badges: ['yeni', 'sardonlu'],
    order: 7,
    pieces: ['İnek baskılı sweatshirt', 'Damalı lastikli paça jogger'],
    description:
      'Küçükler için gülümseten bir takım: sevimli inek baskılı sweat ve dama desenli jogger. Lastikli bel ve paçalar sayesinde emeklerken, koşarken, oynarken hep yerinde.',
    highlights: ['İçi yumuşak şardonlu sweat', 'Lastikli bel ve paça', 'Unisex — kız ve erkek için', 'Bez değişimine uygun rahat kalıp'],
    fabric: 'Şardonlu pamuk karışımlı kumaş.', // GÜNCELLENECEK
    care: ['30°C’de ters çevirerek yıkayın', 'Baskı üzerine ütü basmayın', 'Çamaşır suyu kullanmayın'],
    sizes: MINI_SIZES,
    colors: [
      { id: 'kahve', name: 'Kahve · Krem', hex: '#5a3a2a', image: img('mini-inek-kahve'), alt: 'İnek baskılı kahverengi sweat ve damalı pantolon giymiş küçük çocuk' },
    ],
  },
]

export const getProduct = (slug: string) => products.find((p) => p.slug === slug)

export const getVariant = (product: Product, colorId?: string | null) =>
  product.colors.find((c) => c.id === colorId) ?? product.colors[0]

/** Bir yaş aralığına uyan ürünler (ör. "7-8") */
export const productsForSize = (size: string) => products.filter((p) => p.sizes.includes(size))

export const AGE_FILTERS = ['1-2', '2-3', '3-4', '4-5', '5-6', '7-8', '9-10', '11-12', '13-14']

/** Çocuğun boyuna göre beden önerisi */
export function recommendSize(heightCm: number) {
  if (!Number.isFinite(heightCm) || heightCm < 70 || heightCm > 180) return null
  for (const row of SIZE_CHART) {
    if (heightCm >= row.height[0] && heightCm <= row.height[1]) return { row, between: false }
  }
  // İki beden arasında kaldıysa büyük olanı öner — çocuklar hızlı büyür.
  const bigger = SIZE_CHART.find((row) => row.height[0] > heightCm)
  if (bigger) return { row: bigger, between: true }
  return { row: SIZE_CHART[SIZE_CHART.length - 1], between: false }
}

/** Galeri — tüm kareler, ürün sayfalarına bağlı */
export const galleryItems = products.flatMap((p) =>
  p.colors.map((c) => ({
    src: c.image,
    alt: c.alt,
    product: p,
    color: c,
    href: `/urun/${p.slug}?renk=${c.id}`,
  })),
)
