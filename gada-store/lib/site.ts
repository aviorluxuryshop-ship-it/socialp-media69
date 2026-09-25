export interface NavItem {
  label: string
  href: string
}

export const siteConfig = {
  name: 'GADA',
  tagline: 'Doğanın tazeliği her yudumda',
  description:
    'GADA — gerçek meyve ve soğuk çay aromalı içecekler. Şeftali ve Limon, AN Zentrum güvencesiyle Bayburt’ta üretilir.',
  keywords: ['GADA', 'GADA içecek', 'soğuk çay', 'şeftali soğuk çay', 'limon soğuk çay', 'AN Zentrum', 'Bayburt'],
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ??
    'https://gada-store.vercel.app',
  manufacturer: {
    legalName: 'AN Zentrum Gıda İçecek Üretim İthalat İhracat Ltd. Şti.',
    city: 'Bayburt',
    country: 'Türkiye',
  },
} as const

export const navigation: NavItem[] = [
  { label: 'Ana Sayfa', href: '/' },
  { label: 'İçeceklerimiz', href: '/icecekler' },
  { label: 'GADA Hakkında', href: '/hakkimizda' },
  { label: 'GADA’nın Hikâyesi', href: '/hikaye' },
  { label: 'İletişim', href: '/iletisim' },
]
