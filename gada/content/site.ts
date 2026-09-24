/**
 * Sitedeki bütün metin ve bilgiler.
 *
 * Kural: burada yalnızca doğrulanabilen bilgi durur. Her kalemin kaynağı
 * KAYNAKLAR.md dosyasında yazılıdır. Ürün bilgileri (içindekiler, besin
 * değerleri, üretici, menşe) kutuların kendi etiketlerinden aktarılmıştır.
 * Kuruluş yılı, resmî slogan, ödül, sertifika gibi doğrulanamayan hiçbir
 * bilgi eklenmemiştir.
 */

export const site = {
  name: 'GADA',
  // Resmî bir alan adı doğrulanamadı; yayın adresi ortam değişkeninden gelir.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000'),
  title: 'GADA — Şeftali ve Limon',
  description:
    'GADA’nın iki kutusu: şeftali ve çay aromalı içecek ile limon aromalı soğuk çay. Bayburt’ta, AN Zentrum tarafından üretilir.',
  instagram: { handle: '@gadatea', url: 'https://www.instagram.com/gadatea/' },
  facebook: { label: 'AN Zentrum', url: 'https://www.facebook.com/anzentrumtr/' },
  year: 2026,
}

export const nav = [
  { no: '01', label: 'Ana Sayfa', href: '#ana-sayfa' },
  { no: '02', label: 'GADA', href: '#gada' },
  { no: '03', label: 'Ürünler', href: '#urunler' },
  { no: '04', label: 'Hikâye', href: '#hikaye' },
  { no: '05', label: 'İçerik', href: '#icerik' },
  { no: '06', label: 'İletişim', href: '#iletisim' },
] as const

export const manufacturer = {
  legalName: 'AN Zentrum Gıda İçecek Üretim İthalat İhracat Ltd. Şti.',
  shortName: 'AN Zentrum',
  // Kutuların arka yüzündeki üretici adresi
  productionAddress: 'Bayburt Organize Sanayi Bölgesi, Bayburt / Türkiye',
  // Şirketin harita ve firma rehberi kaydındaki adres ve telefonu
  officeAddress: 'Akşar, Esentepe Mevkii, Merkez / Bayburt',
  phone: { label: '+90 458 222 73 69', href: 'tel:+904582227369' },
  origin: 'Türkiye',
}

export const hero = {
  product: 'Şeftali & Çay',
  volume: '330 ml',
  cue: 'Aşağı kaydırın',
}

export const about = {
  eyebrow: '02 — GADA',
  title: ['GADA', 'hakkında'],
  lead: 'GADA, Bayburt’ta üretilen bir soğuk çay markası.',
  body: [
    'Markanın arkasında AN Zentrum var. Bayburtlu girişimci Muhammet Karaoğlu’nun Almanya’da, Köln’de kurduğu şirket bugün memleketi Bayburt’ta da merkez ofisiyle çalışıyor; ByBurt 69 enerji içeceği de aynı çatı altından çıkıyor.',
    'Bu sayfada GADA’nın iki kutusu var: turuncu kutuda şeftali ve çay aromalı içecek, sarı kutuda limon aromalı soğuk çay. İkisi de aynı ince, 330 ml’lik alüminyum kutuda.',
  ],
  facts: [
    { label: 'Marka', value: 'GADA' },
    { label: 'Üretici', value: 'AN Zentrum' },
    { label: 'Üretim yeri', value: 'Bayburt' },
    { label: 'Menşei', value: 'Türkiye' },
    { label: 'Ambalaj', value: '330 ml alüminyum kutu' },
    { label: 'Instagram', value: '@gadatea' },
  ],
}

export type Product = {
  id: 'seftali' | 'limon'
  no: string
  name: string
  nameLines: string[]
  short: string
  tags: string[]
  story: { eyebrow: string; lead: string; body: string[]; quote?: { text: string; source: string } }
  ingredients: { name: string; detail?: string }[]
  design: { title: string; text: string }[]
  palette: { name: string; hex: string }[]
}

const nutrition = [
  { label: 'Enerji', value: '182 kJ / 43 kcal' },
  { label: 'Yağ', value: '0 g' },
  { label: 'Doymuş yağ', value: '0 g' },
  { label: 'Karbonhidrat', value: '10,5 g' },
  { label: 'Şeker', value: '10,4 g' },
  { label: 'Protein', value: '0 g' },
  { label: 'Tuz', value: '0 g' },
]

export const label = {
  nutritionTitle: 'Enerji ve besin öğeleri',
  nutritionUnit: '100 ml’de',
  nutrition,
  allergen: 'Alerjen içermez.',
  notes: ['Tüketmeden önce çalkalayınız.', 'Serin ve kuru yerde muhafaza ediniz.'],
  source: 'Bilgiler ürün etiketinden aktarılmıştır.',
}

export const products: Product[] = [
  {
    id: 'seftali',
    no: '01',
    name: 'Şeftali ve Çay Aromalı İçecek',
    nameLines: ['Şeftali', 've çay', 'aromalı', 'içecek'],
    short: 'Turuncu kutu. Şeftali aroması ile çay aroması bir arada.',
    tags: ['Şeftali aroması', 'Çay aroması', '330 ml'],
    story: {
      eyebrow: 'Hikâye · Şeftali',
      lead: 'Şeftali ile çayın buluşması.',
      body: [
        'Adı her şeyi söylüyor: şeftali ve çay aromalı içecek. Kutunun arkasındaki listede şeftali aroması ile çay aroması yan yana duruyor.',
        'Sol yüzde üç kısa not var: şeftali aroması, soğuk çay aroması, ferahlatıcı tat. Altlarında el yazısıyla tek bir cümle.',
      ],
      quote: { text: 'Doğanın tazeliği her yudumda.', source: 'Kutunun sol yüzünden' },
    },
    ingredients: [
      { name: 'Su' },
      { name: 'Şeker' },
      { name: 'Asitlik düzenleyiciler', detail: 'sitrik asit, sodyum sitrat' },
      { name: 'Şeftali aroması' },
      { name: 'Çay aroması' },
      { name: 'Renklendirici', detail: 'E160a' },
      { name: 'Koruyucu', detail: 'potasyum sorbat' },
      { name: 'Tatlandırıcı', detail: 'sukraloz' },
    ],
    design: [
      {
        title: 'Meyve',
        text: 'Yan yüzde ısırılmış bir şeftali ve iki yaprak. Üstünde gümüş renkli, dikey iki satır.',
      },
      {
        title: 'Logo',
        text: 'Kırmızı GADA harfleri beyaz bir kontur ve koyu kırmızı bir gölgeyle öne çıkıyor. Arkada şeftali dilimleri ve yeşil yapraklar.',
      },
      {
        title: 'Bütün kutu',
        text: 'Turuncu zemin, kırmızı logo, yeşil yaprak ve gümüş kapak. Dört yüz, tek bir kutu.',
      },
    ],
    palette: [
      { name: 'Şeftali turuncusu', hex: '#EE6F0E' },
      { name: 'GADA kırmızısı', hex: '#CF2116' },
      { name: 'Koyu kırmızı', hex: '#971210' },
      { name: 'Yaprak yeşili', hex: '#16842A' },
      { name: 'Gümüş', hex: '#B9B3AF' },
    ],
  },
  {
    id: 'limon',
    no: '02',
    name: 'Limon Aromalı Soğuk Çay',
    nameLines: ['Limon', 'aromalı', 'soğuk', 'çay'],
    short: 'Sarı kutu. Siyah çay ekstraktı ve limon aroması.',
    tags: ['Siyah çay ekstraktı', 'Limon aroması', '330 ml'],
    story: {
      eyebrow: 'Hikâye · Limon',
      lead: 'Siyah çay ve limon.',
      body: [
        'Sarı kutu, GADA’nın limon aromalı soğuk çayı. Şeftali kutusundan farkı içindekiler listesinde başlıyor: burada çay aroması yerine siyah çay ekstraktı, şeftali yerine limon aroması var.',
        'Kutunun yan yüzünde yapraklarıyla bütün bir limon ve ortadan kesilmiş yarısı duruyor.',
      ],
    },
    ingredients: [
      { name: 'Su' },
      { name: 'Şeker' },
      { name: 'Asitlik düzenleyiciler', detail: 'sitrik asit, sodyum sitrat' },
      { name: 'Siyah çay ekstraktı' },
      { name: 'Limon aroması' },
      { name: 'Renklendirici', detail: 'E102' },
      { name: 'Koruyucu', detail: 'potasyum sorbat' },
      { name: 'Tatlandırıcı', detail: 'sukraloz' },
    ],
    design: [
      {
        title: 'Yan yüz',
        text: 'Aynı üç ikon ve aynı el yazısı, bu kez sarı zeminde koyu yeşil.',
      },
      {
        title: 'Logo',
        text: 'Aynı GADA harfleri; arkalarında bu kez limon dilimleri, yeşil yapraklar ve küçük damlalar.',
      },
      {
        title: 'Bütün kutu',
        text: 'Sarı zemin, kırmızı logo, yeşil yazı ve gümüş kapak. Aynı sistem, başka bir meyve.',
      },
    ],
    palette: [
      { name: 'Limon sarısı', hex: '#F2CE0C' },
      { name: 'GADA kırmızısı', hex: '#CF2116' },
      { name: 'Yaprak yeşili', hex: '#16842A' },
      { name: 'Koyu yeşil', hex: '#1E6A09' },
      { name: 'Gümüş', hex: '#B9B3AF' },
    ],
  },
]

export const origin = {
  eyebrow: 'Üretim',
  title: ['Nereden', 'geliyor?'],
  lead: 'Bayburt, Türkiye.',
  body: 'İki kutunun arkasında da aynı üretici bilgisi yazıyor: AN Zentrum Gıda İçecek Üretim İthalat İhracat Ltd. Şti., Bayburt Organize Sanayi Bölgesi. Menşei: Türkiye.',
  city: 'Bayburt',
  coords: '40°15′ K · 40°13′ D',
  seas: { north: 'Karadeniz', south: 'Akdeniz' },
}

export const contact = {
  eyebrow: '06 — İletişim',
  title: 'İletişim',
  lead: 'GADA’ya ve üreticisi AN Zentrum’a buradan ulaşabilirsiniz.',
}
