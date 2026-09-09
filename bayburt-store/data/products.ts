export type SizeOption = 'S' | 'M' | 'L' | 'XL' | 'XXL'

export const SIZE_OPTIONS: readonly SizeOption[] = ['S', 'M', 'L', 'XL', 'XXL'] as const

export type ProductSlug = 'hisar' | 'coruh' | 'cinimacin'

export interface MediaAsset {
  /** Site-relative path under /public. Swap for a photo or render at any time. */
  src: string
  alt: string
  label: string
}

export interface ProductMedia {
  /** Ordered viewer assets: front, back, detail. */
  views: MediaAsset[]
  /**
   * Optional looping product film. Drop an .mp4 into /public/videos and set the
   * path here — the viewer picks it up automatically, no code changes needed.
   */
  video?: {
    src: string
    poster: string
  }
}

export interface SpecRow {
  label: string
  value: string
}

export interface FeatureRow {
  title: string
  description: string
}

export interface ProductStory {
  kicker: string
  heading: string
  source: string
  paragraphs: string[]
  motifs: string[]
}

export interface Product {
  slug: ProductSlug
  name: string
  displayName: string
  kind: string
  subtitle: string
  tagline: string
  price: number
  compareAtPrice?: number
  currency: 'TRY'
  currencySymbol: '₺'
  sku: string
  gtin: string
  colorway: string
  edition: string
  releaseYear: number
  availability: 'InStock' | 'PreOrder' | 'OutOfStock'
  palette: {
    base: string
    accent: string
    ink: string
    glow: string
  }
  media: ProductMedia
  sizes: readonly SizeOption[]
  fabric: string
  care: string[]
  specs: SpecRow[]
  features: FeatureRow[]
  story: ProductStory
}

export const products: Product[] = [
  {
    slug: 'hisar',
    name: 'Hisar',
    displayName: 'HİSAR',
    kind: 'Çubuklu Forma',
    subtitle: 'İç Saha',
    tagline: 'Surların ritmi, sahanın dokusu.',
    price: 2450,
    compareAtPrice: 2850,
    currency: 'TRY',
    currencySymbol: '₺',
    sku: 'BS-MRS-69-HSR',
    gtin: '8690690690012',
    colorway: 'Altın Sarı / Obsidyen',
    edition: 'Miras Koleksiyonu',
    releaseYear: 2025,
    availability: 'InStock',
    palette: {
      base: '#E9A21C',
      accent: '#050505',
      ink: '#050505',
      glow: 'rgba(233,162,28,0.35)',
    },
    media: {
      views: [
        {
          src: '/images/jerseys/hisar-front.svg',
          alt: 'Hisar çubuklu formanın ön görünümü: altın sarı zemin üzerinde siyah dikey çubuklar ve siyah polo yaka.',
          label: 'Ön',
        },
        {
          src: '/images/jerseys/hisar-back.svg',
          alt: 'Hisar çubuklu formanın arka görünümü: sırt numarası 69 ve Bayburt yazısı.',
          label: 'Arka',
        },
        {
          src: '/images/jerseys/hisar-detail.svg',
          alt: 'Hisar formasının yaka ve arma detayı.',
          label: 'Detay',
        },
      ],
    },
    sizes: SIZE_OPTIONS,
    fabric: '%92 Geri Dönüştürülmüş Polyester · %8 Elastan',
    care: [
      '30°C tersten yıkayın',
      'Ağartıcı kullanmayın',
      'Baskı üzerine ütü yapmayın',
      'Kuru temizlemeye vermeyin',
    ],
    specs: [
      { label: 'Kalıp', value: 'Athletic Fit — vücuda oturan, hareketi kısıtlamayan' },
      { label: 'Kumaş', value: '%92 Geri Dönüştürülmüş Polyester · %8 Elastan · 145 g/m²' },
      { label: 'Yaka', value: 'Örme polo yaka, çift altın biyeli' },
      { label: 'Baskı', value: 'Süblimasyon — solmaz, çatlamaz, dokunuşu bırakmaz' },
      { label: 'Arma', value: 'Yüksek yoğunluklu dokuma, ısı transferli' },
      { label: 'Şehir Rozeti', value: '69 · sağ etek, altın folyo' },
      { label: 'Üretim', value: 'Türkiye' },
    ],
    features: [
      {
        title: 'AeroDry Nem Yönetimi',
        description:
          'Dört kanallı fiber yapısı teri yüzeye taşır, buharlaşma alanını genişletir. Doksan dakika boyunca kuru kalır.',
      },
      {
        title: 'Kaleye Göre Ölçülmüş Çubuklar',
        description:
          'Çubuk genişlikleri Bayburt Kalesi surlarının burç aralıklarından türetildi; gövdede 48 mm, kolda kesintiye uğrar.',
      },
      {
        title: 'Dikişsiz Yan Panel',
        description:
          'Gövde yanları tek parça örülür. Sürtünme noktası yok, ısı atımı için mikro delikli bölge var.',
      },
      {
        title: 'Şehirde Üretim',
        description:
          'Kumaştan baskıya kadar tüm süreç Türkiye’de yürür. Tedarik zinciri kısa, sorumluluk açık.',
      },
    ],
    story: {
      kicker: 'Kaynak',
      heading: 'Bayburt Kalesi',
      source: 'Kale & Surlar',
      paragraphs: [
        'Çoruh’un kıyısındaki kayalığın üzerinde, şehre bin yıldır aynı açıyla bakan bir siluet var. Bayburt Kalesi bir savunma yapısı olmaktan çok, şehrin kendine anlattığı ilk cümle.',
        'Hisar’ın çubukları bu siluetten geliyor. Sarı ile siyahın nöbetleşe tekrarı, burçların gün ışığında bıraktığı gölge aralığının aynısı; geniş, sabit, tereddütsüz.',
        'Zemindeki ton sür ton grafik ise sur duvarının taş örgüsü. Uzaktan düz bir sarı görürsünüz; yaklaştığınızda taşın nasıl dizildiğini.',
      ],
      motifs: ['Burç aralığı', 'Taş örgüsü', 'Gölge ritmi'],
    },
  },
  {
    slug: 'coruh',
    name: 'Çoruh',
    displayName: 'ÇORUH',
    kind: 'Beyaz Forma',
    subtitle: 'Deplasman',
    tagline: 'Akan su, duran şehir.',
    price: 2450,
    compareAtPrice: 2850,
    currency: 'TRY',
    currencySymbol: '₺',
    sku: 'BS-MRS-69-CRH',
    gtin: '8690690690029',
    colorway: 'Saf Beyaz / Altın',
    edition: 'Miras Koleksiyonu',
    releaseYear: 2025,
    availability: 'InStock',
    palette: {
      base: '#FFFFFF',
      accent: '#D4AF37',
      ink: '#050505',
      glow: 'rgba(255,255,255,0.28)',
    },
    media: {
      views: [
        {
          src: '/images/jerseys/coruh-front.svg',
          alt: 'Çoruh beyaz formanın ön görünümü: beyaz zemin üzerinde merkezden geçen siyah ve altın dikey bant.',
          label: 'Ön',
        },
        {
          src: '/images/jerseys/coruh-back.svg',
          alt: 'Çoruh beyaz formanın arka görünümü: sırt numarası 69 ve Bayburt yazısı.',
          label: 'Arka',
        },
        {
          src: '/images/jerseys/coruh-detail.svg',
          alt: 'Çoruh formasının V yaka ve arma detayı.',
          label: 'Detay',
        },
      ],
    },
    sizes: SIZE_OPTIONS,
    fabric: '%92 Geri Dönüştürülmüş Polyester · %8 Elastan',
    care: [
      '30°C tersten yıkayın',
      'Ağartıcı kullanmayın',
      'Baskı üzerine ütü yapmayın',
      'Kuru temizlemeye vermeyin',
    ],
    specs: [
      { label: 'Kalıp', value: 'Athletic Fit — vücuda oturan, hareketi kısıtlamayan' },
      { label: 'Kumaş', value: '%92 Geri Dönüştürülmüş Polyester · %8 Elastan · 140 g/m²' },
      { label: 'Yaka', value: 'V yaka, siyah–altın çift biyeli örme rib' },
      { label: 'Baskı', value: 'Ton sür ton süblimasyon · nehir çizgileri' },
      { label: 'Arma', value: 'Yüksek yoğunluklu dokuma, ısı transferli' },
      { label: 'Şehir Rozeti', value: '69 · sağ etek, altın folyo' },
      { label: 'Üretim', value: 'Türkiye' },
    ],
    features: [
      {
        title: 'AeroDry Nem Yönetimi',
        description:
          'Beyazın en zor sınavı ter lekesidir. Kanallı fiber, nemi kumaşın içinde tutmaz; yüzeye taşır ve dağıtır.',
      },
      {
        title: 'Asimetrik Merkez Bant',
        description:
          'Siyah ve altın bant merkezden 40 mm sağa kaçar. Nehrin şehri ikiye bölmeyip yanından geçmesi gibi.',
      },
      {
        title: 'Işık Almayan Beyaz',
        description:
          'Optik parlatıcı kullanılmadan elde edilen saf beyaz; kamera altında mavi atmaz, sahada göz almaz.',
      },
      {
        title: 'Şehirde Üretim',
        description:
          'Kumaştan baskıya kadar tüm süreç Türkiye’de yürür. Tedarik zinciri kısa, sorumluluk açık.',
      },
    ],
    story: {
      kicker: 'Kaynak',
      heading: 'Çoruh Nehri',
      source: 'Nehir & Saflık',
      paragraphs: [
        'Çoruh, Bayburt’un içinden geçerken acele etmez. Şehir onun etrafında değil, onunla birlikte kurulmuştur; köprüler bir kıyıyı diğerine değil, iki hafızayı birbirine bağlar.',
        'Beyaz zemin bu suyun berraklığı. Üzerindeki neredeyse görünmez çizgiler ise akıntı: yalnızca ışık doğru açıdan düştüğünde ortaya çıkıyor, tıpkı nehrin yüzeyindeki desen gibi.',
        'Merkezden inen siyah ve altın bant, suyun içinden geçtiği yatağın kendisi. Formanın en sade parçası, aynı zamanda en keskin olanı.',
      ],
      motifs: ['Akıntı çizgisi', 'Köprü açıklığı', 'Berraklık'],
    },
  },
  {
    slug: 'cinimacin',
    name: 'Çinimaçın',
    displayName: 'ÇİNİMAÇIN',
    kind: 'Siyah Forma',
    subtitle: 'Üçüncü Takım',
    tagline: 'Ateşten geçen renk solmaz.',
    price: 2650,
    compareAtPrice: 2950,
    currency: 'TRY',
    currencySymbol: '₺',
    sku: 'BS-MRS-69-CNM',
    gtin: '8690690690036',
    colorway: 'Obsidyen / Altın',
    edition: 'Miras Koleksiyonu',
    releaseYear: 2025,
    availability: 'InStock',
    palette: {
      base: '#0A0A0A',
      accent: '#D4AF37',
      ink: '#FFFFFF',
      glow: 'rgba(212,175,55,0.28)',
    },
    media: {
      views: [
        {
          src: '/images/jerseys/cinimacin-front.svg',
          alt: 'Çinimaçın siyah formanın ön görünümü: obsidyen zemin üzerinde ton sür ton çini motifleri ve altın V yaka.',
          label: 'Ön',
        },
        {
          src: '/images/jerseys/cinimacin-back.svg',
          alt: 'Çinimaçın siyah formanın arka görünümü: sırt numarası 69 ve Bayburt yazısı.',
          label: 'Arka',
        },
        {
          src: '/images/jerseys/cinimacin-detail.svg',
          alt: 'Çinimaçın formasının çini motifi ve arma detayı.',
          label: 'Detay',
        },
      ],
    },
    sizes: SIZE_OPTIONS,
    fabric: '%92 Geri Dönüştürülmüş Polyester · %8 Elastan',
    care: [
      '30°C tersten yıkayın',
      'Ağartıcı kullanmayın',
      'Baskı üzerine ütü yapmayın',
      'Kuru temizlemeye vermeyin',
    ],
    specs: [
      { label: 'Kalıp', value: 'Athletic Fit — vücuda oturan, hareketi kısıtlamayan' },
      { label: 'Kumaş', value: '%92 Geri Dönüştürülmüş Polyester · %8 Elastan · 150 g/m²' },
      { label: 'Yaka', value: 'V yaka, çift sıra altın rib' },
      { label: 'Baskı', value: 'Ton sür ton çini deseni · mat–parlak kontrast' },
      { label: 'Arma', value: 'Yüksek yoğunluklu dokuma, ısı transferli' },
      { label: 'Şehir Rozeti', value: '69 · sağ etek, altın folyo' },
      { label: 'Üretim', value: 'Türkiye' },
    ],
    features: [
      {
        title: 'AeroDry Nem Yönetimi',
        description:
          'Omuz ve yan panellerde lazer mikro delik. Siyahın soğurduğu ısıyı kumaşta bırakmaz, dışarı verir.',
      },
      {
        title: 'Mat–Parlak Çini Deseni',
        description:
          'Desen mürekkeple değil, yüzey gerilimiyle çalışır. Aynı siyahın iki farklı yansıması motifi ışıkla ortaya çıkarır.',
      },
      {
        title: 'Chevron Geçiş',
        description:
          'Gövdedeki ok yapısı çini panolarının simetri eksenini taşır; hareket ettikçe desen katman değiştirir.',
      },
      {
        title: 'Şehirde Üretim',
        description:
          'Kumaştan baskıya kadar tüm süreç Türkiye’de yürür. Tedarik zinciri kısa, sorumluluk açık.',
      },
    ],
    story: {
      kicker: 'Kaynak',
      heading: 'Çini Motifleri',
      source: 'Çini & Direnç',
      paragraphs: [
        'Çini, Anadolu’nun sabrıdır. Toprak önce şekil alır, sonra ateşe girer; çıktığında rengi artık değişmez. Bu yüzden yüzyıllar sonra bile ilk günkü gibi durur.',
        'Çinimaçın’ın deseni bu sabırdan alındı. Siyahın üzerine siyah işlendi: uzaktan tek bir renk, yakından bir pano. Görmek için bakmak yeterli değil, ışığı beklemek gerekiyor.',
        'Altın yaka ve manşetler ise fırından çıkan parlaklık. Bir formanın üzerindeki en küçük detay, çoğu zaman en çok emek isteyen yeridir.',
      ],
      motifs: ['Sekizgen pano', 'Rumi kıvrım', 'Fırın parlaklığı'],
    },
  },
]

export const productSlugs: ProductSlug[] = products.map((product) => product.slug)

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug)
}

export function getRelatedProducts(slug: string): Product[] {
  return products.filter((product) => product.slug !== slug)
}
