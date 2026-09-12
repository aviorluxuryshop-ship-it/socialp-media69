export interface NavItem {
  label: string
  href: string
  description: string
}

export interface SocialLink {
  label: string
  handle: string
  href: string
}

export const siteConfig = {
  name: 'Bayburt Store',
  legalName: 'Bayburt Store — Bayburtspor Resmî Mağazası',
  collection: 'Miras Koleksiyonu',
  locale: 'tr_TR',
  language: 'tr',
  /**
   * Where the site actually answers. There is no domain yet, so this is the
   * deployment's own address rather than a name nobody owns: canonical tags,
   * the sitemap and every absolute URL in the structured data have to point at
   * something that resolves, or they are worse than absent. Set
   * NEXT_PUBLIC_SITE_URL the day a domain exists and everything follows.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ??
    'https://socialp-media69-asb3.vercel.app',
  tagline: 'Geçmişten gelen, geleceğe taşınan.',
  description:
    'Bayburt Store — Bayburtspor Miras Koleksiyonu. Hisar, Çoruh ve Çinimaçin formaları; şehrin kalesinden, nehrinden ve çini motiflerinden doğan üç tasarım.',
  keywords: [
    'Bayburt Store',
    'Bayburtspor',
    'Miras Koleksiyonu',
    'Hisar forma',
    'Çoruh forma',
    'Çinimaçin forma',
    'Bayburt forma',
    '69 Bayburt',
    'futbol forması',
  ],
  founded: 1969,
  /** Bayburt'un plaka numarası. */
  plate: '69',
  city: 'Bayburt',
  ogImage: '/opengraph-image',
} as const

export const navigation: NavItem[] = [
  { label: 'Anasayfa', href: '/', description: 'Miras üçlemesi' },
  { label: 'Koleksiyon', href: '/koleksiyon', description: 'Hikâyenin kaynağı' },
  { label: 'Hakkımızda', href: '/hakkimizda', description: 'Bayburtspor mirası' },
  { label: 'İletişim', href: '/iletisim', description: 'Mağaza ve kanallar' },
]

export const contact = {
  phone: '+90 458 211 69 69',
  phoneHref: 'tel:+904582116969',
  email: 'merhaba@bayburtstore.com',
  emailHref: 'mailto:merhaba@bayburtstore.com',
  web: 'bayburtstore.com',
  webHref: 'https://bayburtstore.com',
  instagram: '@bayburtstore',
  instagramHref: 'https://instagram.com/bayburtstore',
  store: {
    name: 'Bayburt Store Flagship',
    addressLine: 'Şingah Mah. Cumhuriyet Cad. No: 69',
    district: 'Merkez / Bayburt',
    postalCode: '69000',
    country: 'Türkiye',
    hours: 'Pazartesi — Cumartesi · 10.00 — 20.00',
    mapsHref: 'https://maps.google.com/?q=Bayburt+Merkez',
  },
} as const

export const socials: SocialLink[] = [
  { label: 'Instagram', handle: contact.instagram, href: contact.instagramHref },
  { label: 'X', handle: '@bayburtstore', href: 'https://x.com/bayburtstore' },
  { label: 'YouTube', handle: '@bayburtstore', href: 'https://youtube.com/@bayburtstore' },
]
