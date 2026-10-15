import type { CategoryId, Level } from '@/lib/types';

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  blurb: string;
  /** 1–5 yıldız için seviye odağı */
  focus: Record<Level, string>;
}

export const CATEGORIES: Category[] = [
  {
    id: 'pas',
    name: 'Pas',
    short: 'Pas',
    blurb: 'Yerden, havadan, kısa ve uzun; ağırlığı, yönü ve zamanlaması doğru paslar.',
    focus: {
      1: 'Durağan topla, tek ayakla, 5–10 m. Hedef: ayak kilidi, doğru temas yüzeyi ve topun ortasına vuruş.',
      2: 'Hareketli topla ve iki ayakla. Pas sonrası arkadaşına doğru adım at; isabet oranını say.',
      3: 'Tek-iki dokunuşla, orta mesafede. Pastan önce omuz üstü bakış; hız ve yön arkadaşın durumuna uysun.',
      4: 'Baskı altında, dar alanda, koşarak. Hat kıran ve zamanlaması kritik paslar.',
      5: 'Farklı yüzey, hız ve ağırlıkla rakibi yanıltan varyasyonlar; her pasın "neden"ini anlatabilmek.',
    },
  },
  {
    id: 'sut',
    name: 'Şut ve vuruşlar',
    short: 'Şut',
    blurb: 'Sert, plase, falsolu, vole ve üst dış vuruşlar; temas yüzeyine göre ayrılmış şut teknikleri.',
    focus: {
      1: 'Durağan topla, kale karşısında 10–12 m. Basma ayağı, vurucu ayağın kilidi ve topun ortası.',
      2: 'Yavaş hareketli topla iki ayakla vur. Hedef: kaleye isabet, sonra köşelere yönlendirme.',
      3: 'Tek vuruş ve koşuyla gelen toptan şut. Kaleciyi ve açıyı okuyarak köşe seçme.',
      4: 'Savunmacı baskısıyla, dönerek ve zayıf ayakla. Vuruşun türünü (plase, falso, sert) duruma göre seç.',
      5: 'Vole, üst dış, füze (knuckle) gibi ileri vuruşları maç temposunda ve baskı altında uygula.',
    },
  },
  {
    id: 'kontrol',
    name: 'Top kontrolü',
    short: 'Kontrol',
    blurb: 'İlk temas, yönlü kontrol, havadan gelen top ve baskı altında kontrol; sonrasında doğru karar.',
    focus: {
      1: 'Yerden gelen topu iç yüzle durdur. Top ayağından 1 adımdan uzağa gitmesin.',
      2: 'Topu durdurmak yerine gideceğin tarafa yönlendir; iki ayakla ve hafif hareket halinde.',
      3: 'Havadan gelen top, ters yönde hareket ve tek dokunuşla yön değiştirme. Kontrolden önce çevreyi tara.',
      4: 'Rakip baskısı, sırtı dönük ve dar alanda kontrol. İlk temas rakibi geride bırakmalı.',
      5: 'Zor toplarda (sert, sektiren, yüksek) kontrolü tek hareketle bitir; sonraki pası/şutu kontrol içine kat.',
    },
  },
  {
    id: 'surme',
    name: 'Top sürme ve çalım',
    short: 'Çalım',
    blurb: 'Temel sürüşten yön değiştirmeye, bedensel hareketlerden ileri çalımlara; rakibi geçmenin yolları.',
    focus: {
      1: 'Yavaş tempoda iki ayakla, topu yakın tut. Başını kaldırma alışkanlığı kazan.',
      2: 'Tempoyu değiştir; iç ve dış yüzle yön değiştir. Koniler arasında temas sayısını azalt.',
      3: 'Pasif savunmacıya karşı çalım seç: bedensel sahte + yön değiştirme + ivmelenme.',
      4: 'Aktif baskı altında, dar alanda ve tam hızda; çalımdan sonra pas/şut/ortaya bağla.',
      5: 'Çalımları birleştir (kombinasyon), zayıf ayağı eşit kullan ve maçta doğru anı seç.',
    },
  },
  {
    id: 'kafa',
    name: 'Kafa vuruşları',
    short: 'Kafa',
    blurb: 'Alından vuruş, sıçrama, uzatma ve savunma kafası. Çocuk yaş gruplarında sınırlı ve dikkatli.',
    focus: {
      1: 'Hafif ve yumuşak toplarla (balon/espuma), durağan. Yalnızca alın, gözler açık, boyun sert.',
      2: 'Kısa mesafeden atılan toplarla, yerinde sıçramadan. Topa doğru hareket et.',
      3: 'Sıçrayarak ve yön vererek; ortaya koşuyla uyumlu zamanlama.',
      4: 'Rakip baskısı altında hava mücadelesi; yönlendirme (kale/uzatma) kontrolü.',
      5: 'Dalış, uzatma ve savunma kafasını maç temposunda; doğru an ve doğru yön seçimi.',
    },
  },
  {
    id: 'bitiricilik',
    name: 'Bitiricilik',
    short: 'Bitiricilik',
    blurb: 'Kaleciyle karşı karşıya, tek vuruş, dönerek ve ceza sahası içi kalabalıkta gol bulma.',
    focus: {
      1: 'Boş kaleye ve durağan kaleciye karşı sakin kal; plase ve köşe seçimi.',
      2: 'Kaleciyle karşı karşıya: hızlı değil sakin; topu yere yakın tut, köşe seç.',
      3: 'Tek vuruş, rebound ve geri çekmeden gol. Kaleci hareketine göre seçim yap.',
      4: 'Savunmacı baskısı ve kapalı açıda; kısa sürede karar ve temiz vuruş.',
      5: 'Maç temposunda, yorgunken ve her türlü pozisyonda gol bulma rutini.',
    },
  },
  {
    id: 'hucum',
    name: 'Hücum oyunu',
    short: 'Hücum',
    blurb: 'Orta, geri çekme, bindirme, pivot oyunu ve birebir hücum: topla ve topsuz ikili/üçlü oyun.',
    focus: {
      1: 'Basit ikili oyun (pas-ve-hareket) ve temel orta. Önce güvenli ve tutarlı yap.',
      2: 'Kanat oyunu: kanattan ortalama ve geri çekme; arkadaşın koşusunu bekle.',
      3: 'İkili ve üçlü kombinasyonlar; koşu ve pasın zamanlaması.',
      4: 'Rakip organizeyken hücum çözümleri: bindirme, içe kat, hat arası.',
      5: 'Pozisyona göre rol esnekliği; oyunu okuyarak çözüm üret.',
    },
  },
  {
    id: 'savunma',
    name: 'Savunma',
    short: 'Savunma',
    blurb: 'Duruş, yan yan geri kayma, top kapma, araya girme ve blok; birebirden takım savunmasına.',
    focus: {
      1: 'Savunma duruşu ve yan yan geri kayma. Rakibi yavaşlat; topa atılma.',
      2: 'Birebirde mesafeyi doğru ayarla ve rakibi dış kanada yönlendir.',
      3: 'Araya girme, blok ve doğru zamanda müdahale; yardım ve kademe.',
      4: 'Baskı altında karar: ne zaman müdahale, ne zaman bekle. Hat savunması.',
      5: 'Takım savunmasını yönlendir; rakibin hamlesini önceden oku.',
    },
  },
  {
    id: 'kalecilik',
    name: 'Kalecilik',
    short: 'Kalecilik',
    blurb: 'Duruş, tutuş, plonjon, çıkış, ortalar ve ayakla oyun kurma.',
    focus: {
      1: 'Temel duruş ve yerden/gövde hizasındaki toplar. Topu iki elle ve gövdenin arkasında tut.',
      2: 'Köşelere kısa plonjonlar, basit yüksek toplar; ayak hareketi.',
      3: 'Orta ve çıkış, açı kapama, ayakla dağıtım; iletişim.',
      4: 'Birebir, uzak köşe ve rebound; zor ortaları yönetme.',
      5: 'Tüm teknikleri maç temposunda ve defans organizasyonuyla birleştir.',
    },
  },
  {
    id: 'duran',
    name: 'Duran toplar',
    short: 'Duran top',
    blurb: 'Serbest vuruş, penaltı, korner ve taç atışı; hücum ve savunma organizasyonu.',
    focus: {
      1: 'Tekniğin temeli: taç atışı ve penaltıda sakin rutin.',
      2: 'Serbest vuruşta doğru temas ve yön; kısa kornerler.',
      3: 'Kavisli serbest vuruş ve korner; savunmada duvar ve alan sorumlulukları.',
      4: 'Planlanmış kombinasyonlar ve organize savunma.',
      5: 'Farklı varyasyonlar; rakibe göre seçim ve uygulama.',
    },
  },
  {
    id: 'topsuz',
    name: 'Topsuz hareketler',
    short: 'Topsuz',
    blurb: 'Boş alan yaratma, savunma arkasına koşu, pas açısı, zamanlama ve pas sonrası yeniden konumlanma.',
    focus: {
      1: 'Pas açısı oluştur: topu alana gel, boş alana yaklaş. Başını kaldır.',
      2: 'Pas sonrası hareket (pas-ve-hareket). Pasından sonra aynı yerde durma.',
      3: 'Zamanlamalı koşu ve boş alan okuma; savunmacının görüş alanından çık.',
      4: 'Sahte koşu, üçüncü adam ve hat arası pozisyon alma; takımın yapısını bozmadan hareket et.',
      5: 'Takım arkadaşlarının hareketine göre otomatik ve eşzamanlı koşu zinciri kur.',
    },
  },
];

export const CAT_BY_ID: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;
