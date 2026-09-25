/**
 * Every string in `pack` is transcribed from the can's own printed faces —
 * front, back, left and right — exactly as it reads, spelling included. The
 * two flavours' cans do not agree with each other on some of that spelling
 * (the back label reads "AN Zentrum" / "Bayburt" on Şeftali and "AnZentrum" /
 * "Beyburt" on Limon), and that is kept rather than silently "corrected",
 * because the job here is to represent the real object, not a tidied one.
 * Nothing in `story` claims a fact the pack doesn't already print.
 */

export type FlavorSlug = 'seftali' | 'limon'

export interface NutritionRow {
  label: string
  value: string
}

export interface FlavorPalette {
  accent: string
  deep: string
  leaf: string
  ink: string
}

export interface FlavorPack {
  displayName: string
  frontSubtitle: string[]
  backSubtitle: string[]
  claimLine: string
  iconLines: string[]
  scriptTagline: string
  ingredients: string
  nutritionBasis: string
  nutrition: NutritionRow[]
  allergen: string
  origin: string
  manufacturerLines: string[]
  volume: string
  barcode: string
  care: string[]
}

export interface FlavorConfig {
  slug: FlavorSlug
  name: string
  heroWord: string
  palette: FlavorPalette
  texture: {
    label: string
    cutout: string
  }
  aromaHeadline: string
  particleTheme: 'peach' | 'citrus'
  pack: FlavorPack
}

export const flavors: Record<FlavorSlug, FlavorConfig> = {
  seftali: {
    slug: 'seftali',
    name: 'GADA Şeftali',
    heroWord: 'ŞEFTALİ',
    palette: {
      accent: '#F4842E',
      deep: '#C4631A',
      leaf: '#12741F',
      ink: '#180D06',
    },
    texture: {
      label: '/textures/seftali/label.jpg',
      cutout: '/images/seftali-can.png',
    },
    aromaHeadline: 'ŞEFTALİ AROMASI',
    particleTheme: 'peach',
    pack: {
      displayName: 'GADA Şeftali',
      frontSubtitle: ['ŞEFTALİ VE ÇAY', 'AROMALI İÇECEK'],
      backSubtitle: ['ŞEFTALİ VE ÇAY', 'AROMALI İÇECEK'],
      claimLine: 'GERÇEK MEYVE GERÇEK LEZZET',
      iconLines: ['ŞEFTALİ AROMASI', 'SOĞUK ÇAY AROMASI', 'FERAHLATICI TAT'],
      scriptTagline: 'Doğanın tazeliği her yudumda',
      ingredients:
        'Su, şeker, asitlik düzenleyiciler (sitrik asit, sodyum sitrat), şeftali aroması, çay aromass, renklendirici (E160a), koruyucu (potasyum sorbat), tatlandırıcı (sukraloz).',
      nutritionBasis: 'Enerji ve Besin Öğeleri (100 ml’de)',
      nutrition: [
        { label: 'Enerji', value: '182 kJ / 43 kcal' },
        { label: 'Yağ', value: '0 g' },
        { label: 'Doymuş Yağ', value: '0 g' },
        { label: 'Karbonhidrat', value: '10,5 g' },
        { label: 'Şeker', value: '10,4 g' },
        { label: 'Protein', value: '0 g' },
        { label: 'Tuz', value: '0 g' },
      ],
      allergen: 'Alerjen içermez.',
      origin: 'Türkiye',
      manufacturerLines: [
        'AN Zentrum Gıda İçecek Üretim',
        'İthalat İhracat Ltd. Şti.',
        'Bayburt Organize Sanayi Bölgesi',
        'Bayburt / Türkiye',
      ],
      volume: '330 ml',
      barcode: '8683984027310',
      care: ['Tüketmeden önce çalkalayınız.', 'Serin ve kuru yerde muhafaza ediniz.'],
    },
  },
  limon: {
    slug: 'limon',
    name: 'GADA Limon',
    heroWord: 'LİMON',
    palette: {
      accent: '#F7DC30',
      deep: '#D6A80E',
      leaf: '#317D29',
      ink: '#12130A',
    },
    texture: {
      label: '/textures/limon/label.jpg',
      cutout: '/images/limon-can.png',
    },
    aromaHeadline: 'LİMON AROMASI',
    particleTheme: 'citrus',
    pack: {
      displayName: 'GADA Limon',
      frontSubtitle: ['LİMON AROMALI', 'SOĞUK ÇAY'],
      backSubtitle: ['LİMON AROMALI', 'SOĞUK ÇAY'],
      claimLine: 'GERÇEK LİMON GERÇEK LEZZET',
      iconLines: ['DOĞAL AROMA', 'SOĞUK ÇAY AROMASI', 'FERAHLATICI TAT'],
      scriptTagline: 'Doğanın tazeliği her yudumda',
      ingredients:
        'Su, şeker, asitlik düzenleyiciler (sitrik asit, sodyum sitrat), siyah çay ekstraktı, limon aroması, renklendirici (E102), koruyucu (potasyum sorbat), tatlandırıcı (sukraloz).',
      nutritionBasis: 'Enerji ve Besin Öğeleri (100 ml’de)',
      nutrition: [
        { label: 'Enerji', value: '182 kJ / 43 kcal' },
        { label: 'Yağ', value: '0 g' },
        { label: 'Doymuş Yağ', value: '0 g' },
        { label: 'Karbonhidrat', value: '10,5 g' },
        { label: 'Şeker', value: '10,4 g' },
        { label: 'Protein', value: '0 g' },
        { label: 'Tuz', value: '0 g' },
      ],
      allergen: 'Alerjen içermez.',
      origin: 'Türkiye',
      manufacturerLines: [
        'AnZentrum Gıda İçecek Üretim',
        'İthalat İhracat Ltd. Şti.',
        'Beyburt Organize Sanayi Bölgesi',
        'Beyburt / Türkiye',
      ],
      volume: '330 ml',
      barcode: '8683984027310',
      care: ['Tüketmeden önce çalkalayınız.', 'Serin ve kuru yerde muhafaza ediniz.'],
    },
  },
}

export const flavorList = Object.values(flavors)
