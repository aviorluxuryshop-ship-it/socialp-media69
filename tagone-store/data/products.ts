export type Product = {
  slug: string
  name: string
  short: string
  description: string
  price: number
  compareAt?: number
  color: string // brand accent per card, used for the product-card gradient
  material: string
  features: string[]
}

export const products: Product[] = [
  {
    slug: 'karbon-siyah',
    name: 'Karbon Siyah',
    short: 'Mat siyah PVC, imza serisi',
    description:
      'Mat siyah zemin üzerine lazerle kazınmış logo. TagOne\'ın en çok tercih edilen kartı — sade, kurumsal, her cepte iddialı durur.',
    price: 349,
    compareAt: 449,
    color: '#101114',
    material: 'Mat PVC + NFC çip (NTAG 215)',
    features: ['Telefona dokunmayla anında profil açılır', 'Çizilmeye dayanıklı mat kaplama', 'Tek kart, sınırsız güncellenebilir bağlantı'],
  },
  {
    slug: 'sinyal-yesil',
    name: 'Sinyal Yeşil',
    short: 'TagOne imza rengiyle parlayan kart',
    description:
      'Markanın imza rengi sinyal yeşili ile üretilen sınırlı seri. Etkinliklerde, networking\'te fark edilmek isteyenler için.',
    price: 379,
    color: '#C6FF3D',
    material: 'Parlak PVC + NFC çip (NTAG 215)',
    features: ['Yüksek görünürlük — kalabalıkta öne çıkar', 'Su ve leke direnci', 'Kişiye özel QR + NFC ikili çalışma'],
  },
  {
    slug: 'ahsap-dogal',
    name: 'Ahşap Doğal',
    short: 'Gerçek ahşap yüzey, gravür logo',
    description:
      'Gerçek ceviz kaplama üzerine gravürlü logo. Her kart kendine has damarlarıyla tek — sürdürülebilir ve sıcak bir doku arıyorsanız.',
    price: 429,
    color: '#8B5E34',
    material: 'Ceviz ahşap kaplama + NFC çip (NTAG 215)',
    features: ['Doğal ahşap desen, iki kart aynı değil', 'Hafif ve ince (0.8mm)', 'Hediye kutusuyla gönderilir'],
  },
  {
    slug: 'metal-gumus',
    name: 'Metal Gümüş',
    short: 'Fırçalanmış metal, premium seri',
    description:
      'Fırçalanmış paslanmaz çelik yüzey ve lazer kazıma logo. TagOne\'ın en premium kartı — üst düzey yöneticiler ve ajanslar için.',
    price: 599,
    compareAt: 699,
    color: '#B8BCC4',
    material: 'Paslanmaz çelik + gömülü NFC anten',
    features: ['Metal ağırlık hissi, kırılmaz gövde', 'Lazer kazıma logo/isim', 'Ömür boyu çizilmeye karşı garanti'],
  },
]

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug)
}
