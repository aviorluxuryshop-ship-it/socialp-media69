/**
 * What is publicly verifiable about GADA and the company behind it.
 *
 * Every entry carries its source. Where a source is the company describing
 * itself rather than a register or the press, it says so. Anything that
 * could not be confirmed — a founding story for GADA itself, a launch date,
 * a dedicated GADA website or social account — is left out on purpose.
 */

export interface Source {
  label: string
  url: string
}

export const sources = {
  registry: {
    label: 'Ticaret sicili kaydı (Find.com.tr firma rehberi)',
    url: 'https://www.find.com.tr/Company/anzentrumgidaicecekuretimithalatihracatlimitedsirketi',
  },
  governorate: {
    label: 'T.C. Bayburt Valiliği, 04.06.2021',
    url: 'https://www.bayburt.gov.tr/turkiyenin-ilk-helal-sertifikali-enerji-icecegi-bayburtspora-sponsor-oldu',
  },
  municipality: {
    label: 'Bayburt Belediyesi, 03.06.2021',
    url: 'https://bayburt.bel.tr/haberler/belediye-baskanimiz-bayburt-ozel-idarespor-ve-anzentrum-arasinda-yapilan-isim-sponsorlugu-imza-torenine-katildi-1',
  },
  iha: {
    label: 'İhlas Haber Ajansı, 09.06.2021',
    url: 'https://www.iha.com.tr/bayburt-haberleri/-3036666',
  },
  selfProfile: {
    label: 'AN Zentrum’un kendi firma tanıtımı (TijaraHub B2B profili)',
    url: 'https://tijarahub.com/index.php?dispatch=companies.view&company_id=89',
  },
  instagram2019: {
    label: 'Byburt69 Energy Instagram, 13.05.2019',
    url: 'https://www.instagram.com/p/Bxa2SNABQQl/',
  },
  trendyolLimon: {
    label: 'GADA Limon ürün kaydı (satıcı: AN Zentrum, Bayburt)',
    url: 'https://www.trendyol.com/an-zentrum/gada-limon-ve-soguk-cay-aromali-icecek-p-892027333',
  },
  trendyolSeftali: {
    label: 'GADA Şeftali ürün kaydı (satıcı: AN Zentrum, Bayburt)',
    url: 'https://www.trendyol.com/an-zentrum/gada-seftali-ve-soguk-cay-aromali-icecek-p-892024935',
  },
  imprint: {
    label: 'byburt69.com künye / iletişim sayfası',
    url: 'https://byburt69.com/impressum-iletisim/',
  },
} satisfies Record<string, Source>

export const company = {
  brand: 'GADA',
  legalName: 'AN Zentrum Gıda İçecek Üretim İthalat İhracat Ltd. Şti.',
  shortName: 'AN Zentrum',
  founded: '12 Temmuz 2017',
  city: 'Bayburt',
  country: 'Türkiye',
  chairman: 'Muhammet Karaoğlu',
  address: {
    lines: ['Akşar Köyü, Esentepe Mevkii', 'Belediye Sk. No: 120', 'Merkez / Bayburt, Türkiye'],
    source: sources.trendyolLimon,
  },
  phone: { display: '+90 458 222 73 69', href: 'tel:+904582227369', source: sources.imprint },
  email: { display: 'info@byburt69.com', href: 'mailto:info@byburt69.com', source: sources.imprint },
  germany: {
    name: 'AN Zentrum Köln GmbH',
    lines: ['Merowingerstr. 14', '50677 Köln, Almanya'],
    phone: { display: '+49 221 328 723', href: 'tel:+49221328723' },
    email: { display: 'info@byburt-energy.de', href: 'mailto:info@byburt-energy.de' },
    source: sources.imprint,
  },
  social: [
    { label: 'Facebook', handle: 'anzentrumtr', url: 'https://www.facebook.com/anzentrumtr/' },
    { label: 'Instagram', handle: 'byburt69energy', url: 'https://www.instagram.com/byburt69energy/' },
  ],
}

export interface Milestone {
  year: string
  date?: string
  title: string
  body: string
  source: Source
}

export const milestones: Milestone[] = [
  {
    year: '2013',
    date: '1 Temmuz 2013',
    title: 'Köln’de dört içecek marketi',
    body: 'Şirketin kendi anlatımına göre AN Zentrum, Köln’de dört içecek marketiyle yola çıktı. Zamanla kendi markasını yaratma isteği doğdu.',
    source: sources.selfProfile,
  },
  {
    year: '2017',
    date: 'Ocak 2017',
    title: 'Laboratuvarda ilk ürün',
    body: 'Aynı anlatıma göre şirketin ilk kendi ürünü olan Byburt enerji içeceği, Ocak 2017’de laboratuvarda geliştirilmeye başlandı.',
    source: sources.selfProfile,
  },
  {
    year: '2017',
    date: '12 Temmuz 2017',
    title: 'Bayburt’ta şirket kuruluşu',
    body: 'AN Zentrum Gıda İçecek Üretim İthalat İhracat Limited Şirketi, Bayburt’ta tescil edildi.',
    source: sources.registry,
  },
  {
    year: '2021',
    date: 'Haziran 2021',
    title: 'Akşar’daki yerel merkez',
    body: 'Şirketin yönetim kurulu başkanı Muhammet Karaoğlu, Köln’de başlayan üretimin yerel merkezini doğduğu köy Akşar’a kurduklarını anlattı. Aynı ay şirket, Bayburt Özel İdarespor’un isim sponsoru oldu; kulüp 2021–2022 sezonunda “AN Zentrum Bayburtspor” adını kullandı.',
    source: sources.governorate,
  },
  {
    year: 'Bugün',
    title: 'GADA',
    body: 'AN Zentrum’un soğuk çay markası GADA, limon ve şeftali aromalı iki içecekle 330 ml kutularda. Ürün kayıtlarında satıcı AN Zentrum, konum Bayburt, menşei Türkiye.',
    source: sources.trendyolLimon,
  },
]
