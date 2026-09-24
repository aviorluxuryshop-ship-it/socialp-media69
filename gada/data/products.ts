/**
 * The catalogue. Every fact here is read off the packaging (the four
 * reference views in media-source/) or the brand's own product listings —
 * nothing is inferred, and there are no health claims.
 *
 * Adding a flavour: run scripts/label on its four views to get a label
 * texture and its face angles, then add one entry below. The home page
 * story, the catalogue and the product page all read from this list.
 */

export type FlavorId = 'limon' | 'seftali'

export type Face = 'front' | 'right' | 'back' | 'left'

export interface NutritionRow {
  label: string
  value: string
  /** Indented sub-row (e.g. "of which saturates"). */
  sub?: boolean
}

export interface Ingredient {
  name: string
  /** What the ingredient does, as the label groups it. */
  role?: string
  /** Ingredients that only this flavour uses. */
  distinct?: boolean
}

export interface Product {
  id: FlavorId
  slug: string
  /** Product name as the brand lists it. */
  name: string
  short: string
  /** Name as printed on the can itself. */
  canName: string
  aroma: string
  tagline: string
  story: string[]
  volume: string
  origin: string
  ingredients: Ingredient[]
  nutrition: NutritionRow[]
  allergen: string
  storage: string[]
  /** Short notes printed on the can's side panels. */
  panelNotes: string[]
  sidePanelLine: string
  design: { face: Face; title: string; body: string }[]
  colors: {
    can: string
    tint: string
    deep: string
    ink: string
  }
  label: {
    src: string
    srcSmall: string
    /** u coordinate (0–1) of the centre of the front panel in the texture. */
    frontU: number
    /** Where each face's panel sits around the can, in degrees from the front. */
    faces: Record<Face, number>
  }
  still: string
}

const NUTRITION: NutritionRow[] = [
  { label: 'Enerji', value: '182 kJ / 43 kcal' },
  { label: 'Yağ', value: '0 g' },
  { label: 'Doymuş yağ', value: '0 g', sub: true },
  { label: 'Karbonhidrat', value: '10,5 g' },
  { label: 'Şeker', value: '10,4 g', sub: true },
  { label: 'Protein', value: '0 g' },
  { label: 'Tuz', value: '0 g' },
]

const STORAGE = ['Tüketmeden önce çalkalayınız.', 'Serin ve kuru yerde muhafaza ediniz.']

export const products: Product[] = [
  {
    id: 'limon',
    slug: 'limon',
    name: 'GADA Limon ve Soğuk Çay Aromalı İçecek',
    short: 'Limon',
    canName: 'Limon Aromalı Soğuk Çay',
    aroma: 'Limon',
    tagline: 'Gerçek limon, gerçek lezzet.',
    story: [
      'Limonlu GADA, siyah çay ekstraktını limon aromasıyla buluşturan bir soğuk çay. Kutunun üzerinde adı da böyle geçer: limon aromalı soğuk çay.',
      'Ambalaj sarı; logoyu iki limon dilimi ve iki yeşil yaprak çevreler. Sağ yüzde bütün bir limon ve kesilmiş yarısı durur, yanında dikey tek satır: “Gerçek limon, gerçek lezzet.”',
    ],
    volume: '330 ml',
    origin: 'Türkiye',
    ingredients: [
      { name: 'Su' },
      { name: 'Şeker' },
      { name: 'Sitrik asit', role: 'Asitlik düzenleyici' },
      { name: 'Sodyum sitrat', role: 'Asitlik düzenleyici' },
      { name: 'Siyah çay ekstraktı', distinct: true },
      { name: 'Limon aroması', distinct: true },
      { name: 'E102', role: 'Renklendirici', distinct: true },
      { name: 'Potasyum sorbat', role: 'Koruyucu' },
      { name: 'Sukraloz', role: 'Tatlandırıcı' },
    ],
    nutrition: NUTRITION,
    allergen: 'Alerjen içermez.',
    storage: STORAGE,
    panelNotes: ['Doğal aroma', 'Soğuk çay aroması', 'Ferahlatıcı tat'],
    sidePanelLine: 'Gerçek limon, gerçek lezzet',
    design: [
      {
        face: 'front',
        title: 'Ön yüz',
        body: 'Kırmızı, eğik GADA yazısı; arkasında limon dilimleri ve yeşil yapraklar. Altında “Limon aromalı soğuk çay”.',
      },
      {
        face: 'right',
        title: 'Sağ yüz',
        body: 'Dikey “Gerçek limon, gerçek lezzet” satırı ve yapraklarıyla bir limon illüstrasyonu.',
      },
      {
        face: 'back',
        title: 'Arka yüz',
        body: 'İçindekiler, 100 ml için besin değerleri, alerjen bilgisi, menşei ve üretici.',
      },
      {
        face: 'left',
        title: 'Sol yüz',
        body: 'Üç kısa not ve el yazısıyla: “Doğanın tazeliği her yudumda.”',
      },
    ],
    colors: { can: '#F5CF05', tint: '#F7EDC0', deep: '#6B5A00', ink: '#1B1A12' },
    label: {
      src: '/textures/lemon-label.webp',
      srcSmall: '/textures/lemon-label-1k.webp',
      frontU: 0.65380859375,
      faces: { front: 0, right: 81.1875, back: 181.875, left: 253.8125 },
    },
    still: '/images/can-limon.webp',
  },
  {
    id: 'seftali',
    slug: 'seftali',
    name: 'GADA Şeftali ve Soğuk Çay Aromalı İçecek',
    short: 'Şeftali',
    canName: 'Şeftali ve Çay Aromalı İçecek',
    aroma: 'Şeftali',
    tagline: 'Gerçek meyve, gerçek lezzet.',
    story: [
      'Şeftalili GADA, şeftali aromasını çay aromasıyla bir araya getiren gazsız bir içecek. Kutunun üzerinde adı “Şeftali ve çay aromalı içecek” olarak geçer.',
      'Ambalaj turuncu; logonun iki yanında yarım şeftaliler, üstünde yeşil yapraklar. Yazılar gümüş: sağ yüzde dikey tek satır, “Gerçek meyve, gerçek lezzet.”',
    ],
    volume: '330 ml',
    origin: 'Türkiye',
    ingredients: [
      { name: 'Su' },
      { name: 'Şeker' },
      { name: 'Sitrik asit', role: 'Asitlik düzenleyici' },
      { name: 'Sodyum sitrat', role: 'Asitlik düzenleyici' },
      { name: 'Şeftali aroması', distinct: true },
      { name: 'Çay aroması', distinct: true },
      { name: 'E160a', role: 'Renklendirici', distinct: true },
      { name: 'Potasyum sorbat', role: 'Koruyucu' },
      { name: 'Sukraloz', role: 'Tatlandırıcı' },
    ],
    nutrition: NUTRITION,
    allergen: 'Alerjen içermez.',
    storage: STORAGE,
    panelNotes: ['Şeftali aroması', 'Soğuk çay aroması', 'Ferahlatıcı tat'],
    sidePanelLine: 'Gerçek meyve, gerçek lezzet',
    design: [
      {
        face: 'front',
        title: 'Ön yüz',
        body: 'Kırmızı, eğik GADA yazısı; iki yanında yarım şeftaliler. Altında gümüş harflerle “Şeftali ve çay aromalı içecek”.',
      },
      {
        face: 'right',
        title: 'Sağ yüz',
        body: 'Dikey “Gerçek meyve, gerçek lezzet” satırı ve yapraklı bir şeftali dilimi.',
      },
      {
        face: 'back',
        title: 'Arka yüz',
        body: 'İçindekiler, 100 ml için besin değerleri, alerjen bilgisi, menşei ve üretici.',
      },
      {
        face: 'left',
        title: 'Sol yüz',
        body: 'Üç kısa not ve el yazısıyla: “Doğanın tazeliği her yudumda.”',
      },
    ],
    colors: { can: '#F56C04', tint: '#F8DCC6', deep: '#7A2F00', ink: '#1E150F' },
    label: {
      src: '/textures/peach-label.webp',
      srcSmall: '/textures/peach-label-1k.webp',
      frontU: 0.67919921875,
      faces: { front: 0, right: 79.875, back: 173.5, left: 246.125 },
    },
    still: '/images/can-seftali.webp',
  },
]

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug)
}

/** Ingredients both flavours share, in label order. */
export function sharedIngredients() {
  const [first, ...rest] = products
  return first.ingredients.filter(
    (ingredient) =>
      !ingredient.distinct &&
      rest.every((product) => product.ingredients.some((other) => other.name === ingredient.name)),
  )
}
