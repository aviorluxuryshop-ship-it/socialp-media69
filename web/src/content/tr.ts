import { site } from './site';

/**
 * Turkish copy. Descriptive service, about and testimonial text is taken verbatim
 * (or lightly re-set) from socialpmedia.com. Headlines and section framing are new
 * and original, written around the agency's real services.
 */
export const tr = {
  locale: 'tr' as const,
  htmlLang: 'tr',
  dir: 'ltr' as const,

  meta: {
    title: 'Socialp Media — Video Çekimi, İçerik Üretimi ve Sosyal Medya Ajansı',
    description:
      'Çekimden kurguya, sosyal medya yönetiminden Meta & Google reklamlarına kadar markanızın dijital üretim sürecini tek elden yönetiyoruz. İstanbul merkezli içerik ve sosyal medya ajansı.',
  },

  nav: {
    home: 'Ana Sayfa',
    services: 'Hizmetler',
    work: 'Çalışmalarımız',
    about: 'Hakkımızda',
    contact: 'İletişim',
    menu: 'Menü',
    close: 'Kapat',
    openMenu: 'Menüyü aç',
    closeMenu: 'Menüyü kapat',
    skipToContent: 'İçeriğe geç',
  },

  langSwitch: {
    label: 'Dil seçimi',
    tr: 'Türkçe',
    en: 'English',
  },

  hero: {
    eyebrow: 'Farklı fikirler · Özgün içerikler',
    // Verb-driven headline built from what the agency actually does end to end.
    lines: ['Çekiyoruz.', 'Kurguluyoruz.', 'Büyütüyoruz.'],
    lead:
      'Kamera arkasından reklam yönetimine kadar, markanızın dijitaldeki tüm üretim sürecini tek elden yürütüyoruz.',
    primaryCta: 'Projenizi konuşalım',
    secondaryCta: 'Çalışmalarımız',
    scroll: 'Kaydır',
  },

  strip: {
    // Deliberately neutral: the marks appear on the agency's own site, but we make
    // no explicit client claim on their behalf.
    label: 'Socialp Media dünyasından',
  },

  manifesto: {
    kicker: '(01) Yaklaşım',
    heading: 'İçerikler tesadüfen değil, stratejiyle üretilir.',
    body: [
      'Yüzlerce markaya sunduğumuz dijital çözümlerle markaların büyüme yolculuğuna eşlik ediyoruz. Sosyal medya yönetiminden içerik üretimine kadar tüm süreçleri profesyonelce yönetiyoruz.',
      'Her markanın hedef kitlesi ve iletişim dili farklıdır. Çekim öncesinden paylaşım sonrasına kadar tüm süreci planlıyor, markanıza özel içerikler üreterek sürdürülebilir bir sosyal medya yönetimi sunuyoruz.',
    ],
    facts: [
      { value: '2021', label: 'Kuruluş' },
      { value: '100+', label: 'Marka iş birliği' },
      { value: 'İstanbul', label: 'Merkez' },
    ],
  },

  services: {
    kicker: '(02) Hizmetler',
    heading: 'Uçtan uca dijital üretim.',
    lead:
      'Fikirden yayına kadar tüm süreç tek ekipte. Ayrı ayrı tedarikçiyle uğraşmadan, tutarlı bir marka dili kurun.',
    detailCta: 'Detaylı incele',
    listCta: 'Bilgi al',
    items: [
      {
        no: '01',
        title: 'Video Çekimi',
        desc: 'Marka, ürün, mekân ve kampanyalar için profesyonel video prodüksiyon. Konsept, ışık, kamera ve yönetim dahil.',
        long:
          'Profesyonel çekimlerle markanızın hikâyesini en doğru şekilde yansıtıyor, fikirlerinizi güçlü ve etkileyici görsellere dönüştürüyoruz.',
        image: 'showroom-otomotiv',
      },
      {
        no: '02',
        title: 'Fotoğraf Çekimi',
        desc: 'Ürün, işletme, mekân ve kampanya fotoğrafçılığı. Sosyal medya ve reklam kullanımına hazır kareler.',
        long:
          'Markanızın kimliğini yansıtan profesyonel fotoğraflar üretiyor, ürün ve hizmetlerinizi sosyal medyada güçlü bir görsel dille öne çıkarıyoruz.',
        image: 'guzellik-merkezi',
      },
      {
        no: '03',
        title: 'Video Edit',
        desc: 'Reels, kısa video ve reklam formatlarına göre optimize edilmiş kurgu ve post prodüksiyon.',
        long:
          'Çektiğiniz görüntüleri dikkat çekici ve akıcı içeriklere dönüştürüyor, markanızın mesajını doğru tempo ve görsel anlatımla izleyiciye aktarıyoruz.',
        image: 'roportaj-stüdyo',
      },
      {
        no: '04',
        title: 'Sosyal Medya Yönetimi',
        desc: 'İçerik planlaması, paylaşım, hesap yönetimi, topluluk etkileşimi ve performans analizi.',
        long:
          'Markanızın dijital dünyadaki varlığını baştan sona yönetiyor, doğru içerik ve stratejiyle hedef kitlenizle güçlü bir bağ kuruyoruz.',
        image: 'ekip-salon',
        href: 'sosyal-medya-yonetimi',
      },
      {
        no: '05',
        title: 'Post & Story',
        desc: 'Markanıza özel tasarlanmış post ve story içerikleri. Tutarlı bir görsel dil, düzenli bir akış.',
        long:
          'Markanızın sosyal medya kimliğine uygun, düzenli ve dikkat çekici post ve story içerikleri hazırlayarak profilinizin bütünlüğünü güçlendiriyoruz.',
        image: 'instagram-tepsi',
      },
      {
        no: '06',
        title: 'Meta & Google Reklamları',
        desc: 'Hedef kitle analizi, kampanya kurulumu, sürekli optimizasyon ve şeffaf performans raporlaması.',
        long:
          'Meta ve Google reklamlarını doğru hedef kitleye ulaştıracak şekilde planlıyor, bütçenizi verimli kullanarak markanızın dijital erişimini büyütüyoruz.',
        image: 'meta-tepsi',
        href: 'meta-google-reklamlari',
      },
      {
        no: '07',
        title: 'Web Tasarımı',
        desc: 'Mobil uyumlu, hızlı açılan ve SEO altyapısına sahip modern web siteleri ve dijital çözümler.',
        image: 'bilboard-mockup',
        href: 'web-tasarim-kurulum',
      },
    ],
  },

  process: {
    kicker: '(03) Süreç',
    heading: 'Fikirden büyümeye, tek akış.',
    lead:
      'Çekim öncesinden paylaşım sonrasına kadar her adımı biz yürütüyoruz. Aradaki koordinasyon yükü sizde kalmıyor.',
    steps: [
      { no: '01', title: 'Fikir', desc: 'Marka, sektör ve hedef kitle analizi. Konsept ve içerik stratejisi.' },
      { no: '02', title: 'Çekim', desc: 'Profesyonel ekip, ışık ve ekipmanla video ve fotoğraf prodüksiyonu.' },
      { no: '03', title: 'Kurgu', desc: 'Platforma göre kurgu, renk, ses ve tasarım. Yayına hazır çıktı.' },
      { no: '04', title: 'Paylaşım', desc: 'İçerik takvimi, paylaşım yönetimi ve topluluk etkileşimi.' },
      { no: '05', title: 'Büyüme', desc: 'Reklam yönetimi, optimizasyon ve şeffaf performans raporlaması.' },
    ],
  },

  work: {
    kicker: '(04) Çalışmalarımız',
    heading: 'Kamera arkası ve çıkan iş.',
    lead: 'Farklı sektörlerden markalar için ürettiğimiz içerik ve prodüksiyon çalışmalarından bir seçki.',
    filters: {
      all: 'Tümü',
      video: 'Video Çekimleri',
      photo: 'Fotoğraf Çekimleri',
      brand: 'Marka İçerikleri',
      social: 'Sosyal Medya İçerikleri',
    },
    /** Turkish alt text, largely mirroring the alt text the agency uses on its own site. */
    alts: {
      'showroom-otomotiv': 'Otomotiv showroom reklam çekimi: gimbal üzerinde kamera ve softbox kurulumu',
      'mekan-video-kurulum': 'Mekân tanıtım videosu çekimi için kamera ve monitör kurulumu',
      'konsept-editorial': 'Siyah beyaz konsept video çekimi',
      'kafe-tanitim': 'Kafe tanıtım videosu çekimi',
      'roportaj-stüdyo': 'Stüdyoda röportaj çekimi kurulumu',
      'icerik-hazir': 'Set arkası: yeni içerik çekimine hazırlık',
      'guzellik-merkezi': 'Güzellik merkezi sosyal medya çekimi',
      'restoran-masa': 'Restoran menü ve mekân çekimi',
      'studyo-sanat': 'Stüdyo çekimi: ışık kurulumu ve set',
      'kamera-detay': 'Çekim sırasında kamera ekranından kadraj kontrolü',
      'mekan-isik': 'Mekân çekimi için profesyonel ışık kurulumu',
      'telefon-tepsi': 'Socialp Media marka içeriği: gümüş tepside sosyal medya içeriği',
      'meta-tepsi': 'Socialp Media marka içeriği: Meta reklam yönetimi görseli',
      'instagram-tepsi': 'Socialp Media marka içeriği: Instagram yönetimi görseli',
      'bilboard-mockup': 'Dijital reklam ve web çalışması görseli',
      'sokak-tabela': 'Socialp Media marka içeriği: sokakta tabela taşıyan model',
      'fon-perde': 'Açık havada çekim fonu: “Sosyal medyanın bize ihtiyacı var!”',
      'nail-dergi': 'Nail studio için konsept sosyal medya çekimi',
      'gazete-siyahbeyaz': 'Siyah beyaz editoryal marka çekimi',
      'cekim-mavi': 'Set arkası: mekân çekimi',
      'cekim-kamera': 'Set arkası: kamera ile içerik çekimi',
      'cekim-studyo': 'Set arkası: stüdyo içerik çekimi',
      'ekip-salon': 'Socialp Media ekibi işletme içinde içerik çekimi yaparken',
      'ofis-tabela': 'Socialp Media ofis tabelası',
      'ekip-beyaz': 'Socialp Media ekip tişörtü: farklı fikirler, özgün içerikler',
      'ekip-siyah': 'Socialp Media ekip tişörtü: farklı fikirler, özgün içerikler',
      'sektor-guzellik': 'Kozmetik ürün fotoğrafçılığı',
      'sektor-portre': 'Güzellik sektörü portre çekimi',
      'sektor-restoran': 'Restoran ve kafe mekân görseli',
      'sektor-egitim': 'Eğitim kurumları için görsel',
      'sektor-insaat': 'İnşaat sektörü için görsel',
      'sektor-kurumsal': 'Kurumsal firmalar için görsel',
    } as Record<string, string>,
  },

  social: {
    kicker: '(05) Sosyal Medya Yönetimi',
    heading: 'Hesabınızı yönetmiyoruz — markanızı konumlandırıyoruz.',
    body:
      'Markanızın dijital dünyadaki kimliğini profesyonel bir şekilde yönetiyoruz. Hedef kitlenize uygun içerik stratejileri oluşturuyor, özgün fotoğraf ve video çekimleri gerçekleştiriyor, yaratıcı tasarımlar hazırlıyor ve düzenli içerik planlaması yapıyoruz.',
    points: [
      'İçerik planlaması ve içerik takvimi',
      'Post ve story tasarımı',
      'Paylaşım ve hesap yönetimi',
      'Topluluk etkileşimi ve mesaj yönetimi',
      'Tutarlı görsel dil ve marka iletişimi',
      'Performans analizi ve raporlama',
    ],
    cta: 'Sosyal medya yönetimi',
  },

  ads: {
    kicker: '(06) Reklam Yönetimi',
    heading: 'Doğru kişiye, doğru bütçeyle.',
    body:
      'Meta ve Google tarafında kampanyalarınızı kuruyor, sürekli optimize ediyor ve sonuçları şeffaf raporlarla paylaşıyoruz.',
    items: [
      {
        title: 'Hedef Kitle Analizi',
        desc: 'Markanız için en doğru hedef kitleyi belirliyor; yaş, ilgi alanı, konum ve davranış analizleriyle reklamlarınızı potansiyel müşterilerinize ulaştırıyoruz.',
      },
      {
        title: 'Reklam Stratejisi',
        desc: 'İşletmenizin hedeflerine uygun kampanyalar oluşturuyor; marka bilinirliği, etkileşim, web sitesi trafiği veya satış odaklı reklam planları hazırlıyoruz.',
      },
      {
        title: 'Sürekli Optimizasyon',
        desc: 'Yayınlanan reklamları düzenli olarak analiz ediyor, performansı artırmak için hedefleme, kreatif ve bütçe optimizasyonları gerçekleştiriyoruz.',
      },
      {
        title: 'Performans Raporlama',
        desc: 'Reklam sonuçlarını detaylı raporlarla takip ediyor; erişim, tıklama, dönüşüm ve yatırım getirisi gibi tüm verileri şeffaf bir şekilde sizinle paylaşıyoruz.',
      },
    ],
    platforms: ['Meta Ads', 'Instagram', 'Facebook', 'Google Ads'],
    cta: 'Reklam yönetimi',
  },

  testimonials: {
    kicker: '(07) Referanslar',
    heading: 'Müşterilerimizden.',
    // Verbatim from socialpmedia.com. The source site attributes these only as
    // "Müşterilerimizden" — no names are published, so none are invented here.
    attribution: 'Müşterilerimizden',
    items: [
      'Sektöre bu kadar hakim olup aynı zamanda sosyal medya yönetimini ilmek ilmek işleyen ajans. Kısa sürede farkını fazlasıyla ortaya koydu. Socialp Media farkı diyebiliriz!',
      'Dijitalde görünür olmak istiyorsanız, isminizi ve markanızı bilindik kılmak istiyorsanız doğru hareket etmelisiniz. Socialp Media bu hareketin kesinlikle ilk adımı. Tanımanız ve çalışmanız gereken bir ekip.',
      'Reklam çekimi sürecinde ekip arkadaşlarımızla harika bir uyum yakaladık. Profesyonel, enerjik ve çok ilgili bir ekipti. Birlikte çalışmak gerçekten çok keyifliydi.',
    ],
  },

  about: {
    kicker: '(08) Hakkımızda',
    heading: 'Markanız için üretiyoruz.',
    body: [
      `${site.founded} yılında kurulan ajansımız, markaların dijital dünyada güçlü, sürdürülebilir ve dikkat çekici bir varlık oluşturması hedefiyle yola çıktı. Kurulduğumuz günden bu yana farklı sektörlerden yüzlerce markayla iş birliği yaparak, her birine özel stratejiler geliştirdik.`,
      'Sosyal medya yönetimi, içerik üretimi ve dijital strateji alanlarında uçtan uca hizmet sunarak markaların yalnızca görünür olmasını değil, doğru kitleye ulaşmasını ve etkileşim kurmasını sağlıyoruz. Her markanın kendine özgü bir dili olduğuna inanıyor, bu doğrultuda özgün ve etkili içerikler üretiyoruz.',
      'Her projeye aynı özen ve profesyonellikle yaklaşarak markanızı dijitalde bir adım öne taşımayı hedefliyoruz.',
    ],
    signature: 'Farklı fikirler, özgün içerikler.',
    /** Exploded-view steps: each maps to a component of the 3D camera. */
    parts: [
      {
        label: 'Objektif',
        title: 'Bakış açısı',
        text: 'Yaratıcı bakış açımızla her projeye kendine özgü bir perspektif kazandırıyoruz.',
      },
      {
        label: 'Gövde',
        title: 'Prodüksiyon',
        text: 'Profesyonel ekipman ve saha deneyimiyle markaların hikâyesini görsel dünyaya taşıyoruz.',
      },
      {
        label: 'Ekran',
        title: 'Strateji',
        text: 'İçeriği yalnızca üretmiyor, doğru strateji ve planlamayla yönetiyoruz.',
      },
      {
        label: 'Mikrofon',
        title: 'İletişim',
        text: 'Markanızın sesini doğru kitleye, doğru dille ulaştırıyoruz.',
      },
      {
        label: 'Çekirdek',
        title: 'Süreklilik',
        text: 'Her projenin merkezinde üretim enerjisi ve sürdürülebilir bir çalışma disiplini var.',
      },
    ],
  },

  contact: {
    kicker: '(09) İletişim',
    heading: 'Dijitalde güçlü görünün.',
    lead: 'Projenizi konuşmak için bize doğrudan ulaşın. Telefon, WhatsApp veya e-posta — hangisi kolayınıza gelirse.',
    trTitle: 'Türkiye',
    intlTitle: 'ABD · Kanada · İngiltere · Avustralya · Almanya',
    phoneLabel: 'Telefon',
    whatsappLabel: 'WhatsApp',
    emailLabel: 'E-posta',
    addressLabel: 'Adres',
    instagramLabel: 'Instagram',
  },

  footer: {
    tagline: 'Farklı fikirler, özgün içerikler.',
    rights: 'Tüm hakları saklıdır.',
    backToTop: 'Yukarı dön',
  },

  serviceDetail: {
    backToHome: 'Ana sayfaya dön',
    otherServices: 'Diğer hizmetler',
    ctaHeading: 'Bu hizmet hakkında konuşalım.',
  },
};

export type Dict = typeof tr;
