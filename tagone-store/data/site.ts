export const siteConfig = {
  name: 'TagOne',
  tagline: 'Dokun, tanıt.',
  description:
    'TagOne NFC kartvizit kartları: telefona dokunduğunda profilini, portfolyonu ya da menünü açan akıllı kart. Tek dokunuş, sınırsız paylaşım.',
  url: 'https://tagone.store',
  phone: '+90 555 000 00 00',
  email: 'merhaba@tagone.store',
  instagram: '@tagone.card',
  address: 'Türkiye — yurt içi kargo',
  currency: '₺',
}

export type NavLink = { label: string; href: string }

export const navLinks: NavLink[] = [
  { label: 'Ürünler', href: '/urunler' },
  { label: 'Nasıl Çalışır', href: '/#nasil-calisir' },
  { label: 'Hakkımızda', href: '/hakkimizda' },
  { label: 'İletişim', href: '/iletisim' },
]
