import metrics from '@/lib/photo-metrics.json'

/**
 * Everything the site says about the products, transcribed from the
 * client's can photos (media-source/*-4-gorunum.jpg). Nothing here is
 * invented: names, claims, ingredients, nutrition, producer — all as printed.
 * Two obvious print typos in the source sheets are corrected in the page
 * copy only (the 3D can shows the photos as they are):
 *   şeftali back label "çay aromass" → "çay aroması"
 *   limon back label "Beyburt" → "Bayburt"
 */

export type FlavorId = 'limon' | 'seftali'
export type ViewId = 'onden' | 'sagdan' | 'arkadan' | 'soldan'

export type Product = {
  id: FlavorId
  /** Short name used in toggles and menus. */
  short: string
  /** Full product name as printed on the front. */
  name: string
  /** The two-line product name as set on the front of the can. */
  nameLines: [string, string]
  volume: string
  /** Vertical claim on the right-hand side of the can. */
  sideClaim: [string, string]
  /** The three icon lines on the left-hand side of the can. */
  features: [string, string, string]
  ingredients: string
  colors: {
    /** Printed ground of the can, measured from the photos. */
    can: string
    /** Deeper shade for type on a pale background. */
    deep: string
    /** Pale tint used as a page background behind the can. */
    tint: string
  }
  /** Folder of the four cropped, flattened views the 3D label is built from. */
  textures: string
  /** Untouched product photos for 2D use. */
  photos: Record<ViewId, string>
}

const photos = (id: FlavorId): Record<ViewId, string> => ({
  onden: `/products/${id}-onden.webp`,
  sagdan: `/products/${id}-sagdan.webp`,
  arkadan: `/products/${id}-arkadan.webp`,
  soldan: `/products/${id}-soldan.webp`,
})

export const PRODUCTS: Record<FlavorId, Product> = {
  limon: {
    id: 'limon',
    short: 'Limon',
    name: 'Limon Aromalı Soğuk Çay',
    nameLines: ['Limon Aromalı', 'Soğuk Çay'],
    volume: '330 ml',
    sideClaim: ['Gerçek Limon', 'Gerçek Lezzet'],
    features: ['Doğal Aroma', 'Soğuk Çay Aroması', 'Ferahlatıcı Tat'],
    ingredients:
      'Su, şeker, asitlik düzenleyiciler (sitrik asit, sodyum sitrat), siyah çay ekstraktı, limon aroması, renklendirici (E102), koruyucu (potasyum sorbat), tatlandırıcı (sukraloz).',
    colors: { can: metrics.flavors.limon.printedColor, deep: '#8A6A00', tint: '#FFF6C9' },
    textures: '/textures/limon',
    photos: photos('limon'),
  },
  seftali: {
    id: 'seftali',
    short: 'Şeftali',
    name: 'Şeftali ve Çay Aromalı İçecek',
    nameLines: ['Şeftali ve Çay', 'Aromalı İçecek'],
    volume: '330 ml',
    sideClaim: ['Gerçek Meyve', 'Gerçek Lezzet'],
    features: ['Şeftali Aroması', 'Soğuk Çay Aroması', 'Ferahlatıcı Tat'],
    ingredients:
      'Su, şeker, asitlik düzenleyiciler (sitrik asit, sodyum sitrat), şeftali aroması, çay aroması, renklendirici (E160a), koruyucu (potasyum sorbat), tatlandırıcı (sukraloz).',
    colors: { can: metrics.flavors.seftali.printedColor, deep: '#9A3F00', tint: '#FFE6D2' },
    textures: '/textures/seftali',
    photos: photos('seftali'),
  },
}

export const FLAVOR_ORDER: FlavorId[] = ['limon', 'seftali']

/** Printed identically on both cans. */
export const COMMON = {
  brand: 'GADA',
  slogan: 'Doğanın tazeliği her yudumda',
  nutritionBasis: 'Enerji ve Besin Öğeleri (100 ml’de)',
  nutrition: [
    ['Enerji', '182 kJ / 43 kcal'],
    ['Yağ', '0 g'],
    ['Doymuş Yağ', '0 g'],
    ['Karbonhidrat', '10,5 g'],
    ['Şeker', '10,4 g'],
    ['Protein', '0 g'],
    ['Tuz', '0 g'],
  ] as Array<[string, string]>,
  allergens: 'Alerjen içermez.',
  origin: 'Türkiye',
  producer: 'AnZentrum Gıda İçecek Üretim İthalat İhracat Ltd. Şti.',
  address: 'Bayburt Organize Sanayi Bölgesi, Bayburt / Türkiye',
  maker: 'ANZENTRUM',
  usage: ['Tüketmeden önce çalkalayınız.', 'Serin ve kuru yerde muhafaza ediniz.'],
  barcode: '8 683984 027310',
}
