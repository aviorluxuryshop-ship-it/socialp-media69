import { S } from '@/lib/scene';
import type { PositionId, Scene } from '@/lib/types';

export interface Tactic {
  id: string;
  title: string;
  tag: 'Savunma' | 'Hücum' | 'Geçiş' | 'Zihin';
  summary: string;
  /** ilke listesi */
  principles: string[];
  /** pozisyona göre rol */
  roles: { pos: PositionId; text: string }[];
  mistakes: string[];
  tryIt: string[];
  scene: Scene;
  aliases: string[];
  related: string[];
  /** yıldız seviyesi önerisi */
  lv: 1 | 2 | 3 | 4 | 5;
}

export const TACTICS: Tactic[] = [
  {
    id: 'pres',
    title: 'Pres ve pres tetikleyicileri',
    tag: 'Savunma',
    lv: 3,
    summary:
      'Pres, topu rakipten hızla geri kazanmak için takımın birlikte ve organize biçimde yaptığı baskıdır. Her koşu rastgele değil, bir tetikleyiciye göre ve pas yollarını kapatarak yapılır.',
    principles: [
      'Takım olarak baskı yapın: bir oyuncu topa giderken diğerleri pas seçeneklerini kapatır.',
      'Kapatma gölgesi (pas yolunu gövdenizle kapatmak) için topa kavisli koşun: rakip bir yöne yönelsin.',
      'Tetikleyici kullanın: kötü ilk temas, geri pas, kenar çizgisine pas, sırtı dönük alıcı.',
      'Hatlar arası mesafeyi kısa tutun; savunma hattı da yukarı çıksın, arkada boşluk bırakmayın.',
      'Rakibi kenara yönlendirin: kenar çizgisi sizin ek savunmacınızdır.',
    ],
    roles: [
      { pos: 'santrfor', text: 'İlk baskıyı yapar; kavisli koşuyla stoperi bir tarafa yönlendirir.' },
      { pos: 'kanat', text: 'Rakip beke ya da orta sahaya pas yolunu kapatır; kenara yönlendirmeyi tamamlar.' },
      { pos: 'merkez-orta-saha', text: 'Boş kalan oyuncuya yaklaşarak içeri pasları kapatır.' },
      { pos: 'stoper', text: 'Hattı yukarı iter; rakip forveti ve uzun topu izler.' },
    ],
    mistakes: [
      'Tek başına pres yapmak: arkanızdan boşluk bırakmak.',
      'Doğrudan düz koşuyla topa gitmek: rakip kolayca pas verir.',
      'Savunma hattını geride bırakıp orta sahayı açık bırakmak.',
    ],
    tryIt: [
      '4v4+kaleciler küçük alan oyununda pres tetikleyicisini (geri pas) belirleyin.',
      'Üç kişilik baskı ve pas yolunu kapatma oyunu (3v3+1).',
      'Presten sonra hızlı ileri pas ve bitiriş çalışması.',
    ],
    scene: S('half', 'K:b:101:34 B2:b:92:20 B3:b:92:48 B4:b:84:6 A1:a:82:34 A2:a:76:16 A3:a:76:52 A4:a:68:34', [
      ['Rakip kaleci K topla; A1, A2, A3 pres için hazır.', null, 'K'],
      ['K, stoper B2\'ye verir. A1 kavisli koşuyla B2\'ye yaklaşır ve B3\'e pas yolunu kapatır.', { A1: [90, 24], A2: [80, 12] }, 'B2'],
      ['B2 tek seçenek olarak kenardaki B4\'e verir.', { A3: [80, 50] }, 'B4'],
      ['A2 ve A1 B4\'ü kenara sıkıştırır; A4 orta saha sıkışıklığını sağlar.', { A2: [84, 12], A1: [88, 16], A4: [74, 30] }, 'B4'],
    ]),
    aliases: ['yüksek pres', 'high press', 'pres yapmak', 'baskı', 'tetikleyici', 'kapatma gölgesi'],
    related: ['karsi-pres', 'savunma-yerlesimi'],
  },
  {
    id: 'karsi-pres',
    title: 'Karşı pres (gegenpressing)',
    tag: 'Geçiş',
    lv: 4,
    summary:
      'Topu kaybettiğiniz an, rakip düzenini kurmadan hemen topun çevresinde baskı yapıp topu 5–6 saniye içinde geri kazanmaya çalışmaktır. En iyi top çalma fırsatı, topu yeni kazanan rakibin dengesiz olduğu andır.',
    principles: [
      'Top kaybı sonrası en yakın oyuncu hemen topa baskı yapar; diğerleri pas seçeneklerini kapatır.',
      'Geri çekilmek yerine ileri doğru kısa mesafeden baskı: rakibin ilk pasını zorlayın.',
      'Rakibin ilk pasını çıkış oyuncusuna kapatın; topu geriye ya da yana yönlendirin.',
      'Karşı pres başarısız olursa hızlıca geri dönün (savunma geçişi).',
      'Takım yapısı kompakt: top kaybı öncesi oyuncular birbirine yakın olmalı.',
    ],
    roles: [
      { pos: 'merkez-orta-saha', text: 'Top kaybı çevresinde ilk baskıyı yapar ve ikinci topu kazanır.' },
      { pos: 'on-libero', text: 'Rakip karşı atağını yavaşlatır; arkadaki boşluğu korur.' },
      { pos: 'kanat', text: 'Kenarda baskıyla rakibi sıkıştırır.' },
    ],
    mistakes: [
      'Herkesin baskı yapması: arkada boşluk.',
      'Baskıyı topla uzaktan yapmak.',
      'Karşı presin başarısız olduğu anda geri dönmemek.',
    ],
    tryIt: [
      '5v5 küçük alan maçı: top kaybedince 6 saniye baskı, sonra sıfırlama.',
      '4v2 rondo: topu kaybeden oyuncu hemen baskı yapar.',
      'Karşı pres + hızlı bitiriş oyunu.',
    ],
    scene: S('half', 'A1:a:70:34 A2:a:74:24 A3:a:74:44 A4:a:66:30 B1:b:78:34 B2:b:84:20 B3:b:84:48', [
      ['A1 topu kaybetti: B1 topu aldı.', null, 'B1'],
      ['A1 ve A2 hemen B1\'e baskı yapar; A3 B3\'e pas yolunu kapatır.', { A1: [75, 34], A2: [77, 27], A3: [78, 44] }, 'B1'],
      ['B1 sıkışıp geri pasa zorlanır; A4 ikinci topa hazır.', { A4: [72, 30] }, [72, 36]],
      ['A4 topu kazanır; rakip dengesizken hızlı atak başlar.', { A4: [74, 34] }, 'A4'],
    ]),
    aliases: ['gegenpressing', 'counter press', 'karşı baskı', 'top kaybı sonrası pres'],
    related: ['pres', 'hucum-gecisi'],
  },
  {
    id: 'hucum-gecisi',
    title: 'Hücum geçişi',
    tag: 'Geçiş',
    lv: 3,
    summary:
      'Topu kazandığınız ilk saniyelerde rakip düzensizdir. Hücum geçişinde ilk karar hızlıdır: mümkünse dikey ve hızlı pas, değilse güvenli dönüş.',
    principles: [
      'Top kazanır kazanmaz başınızı kaldırın: ileride boşta oyuncu var mı?',
      'İlk pas ileri ve hızlı; rakibin geri dönmesini beklemeyin.',
      'Yan ve derin koşular açın: boşlukta oyuncular topla buluşsun.',
      '3–4 saniye içinde ileri seçenek bulunamazsa topu koruyup yeniden organize olun.',
      'Güvenlik: top kaybına karşı yedek oyuncular arkada kalsın.',
    ],
    roles: [
      { pos: 'merkez-orta-saha', text: 'Topu alıp hızla ileriye yönlendirir; ilk pası verir.' },
      { pos: 'kanat', text: 'Derin ve geniş koşular yapar; geçişin hızını artırır.' },
      { pos: 'santrfor', text: 'Savunma arkasına koşar; pasları açar.' },
    ],
    mistakes: [
      'Topu kazanıp geriye dönmek: geçiş fırsatını kaçırmak.',
      'Karar vermeden önce başın aşağıda olması.',
      'Acele edip riskli pas: top kaybı ve ters atak.',
    ],
    tryIt: [
      '4v3 geçiş oyunu: topu kazanınca 5 saniye içinde bitirmeye çalışın.',
      'Top kazanma + ileri pas + koşu zinciri.',
      'Savunma → atak geçişi için yarım saha oyunu.',
    ],
    scene: S('full', 'D1:a:36:30 M:a:46:34 W:a:60:12 S:a:66:40 B1:b:50:30 B2:b:60:38 B3:b:70:28', [
      ['D1 topu kazanmaya çalışıyor; takım düşük bloktan geçişe hazır.', null, [38, 31]],
      ['M topu kazanır ve hemen başını kaldırır; W ve S koşuya başlar.', { W: [72, 10], S: [74, 40] }, 'M'],
      ['M ilk pası hızlıca W\'ye ya da S\'ye boşluğa gönderir.', null, 'W'],
      ['W topla ilerlerken S ceza sahasına koşar; rakip dengesiz.', { W: [86, 14], S: [92, 38] }, 'W'],
    ]),
    aliases: ['transition', 'savunmadan hücuma geçiş', 'top kazanma sonrası', 'hızlı geçiş'],
    related: ['kontra-atak', 'karsi-pres'],
  },
  {
    id: 'kontra-atak',
    title: 'Kontra atak (3 koşu hattı)',
    tag: 'Hücum',
    lv: 3,
    summary:
      'Rakip hücumdayken top kazanıp sayısal üstünlükle hızla bitirme planıdır. Üç oyuncu üç koşu hattında ilerler: ortada topla taşıyan, iki yanda sprint atan oyuncular.',
    principles: [
      'Topu taşıyan oyuncu merkezde hızla ilerler; savunmayı kendine bağlar.',
      'Kanat oyuncuları açılıp derinde hızlanır; savunmacıyı yanlara çeker.',
      'Pas zamanı: savunmacı topa kilitlendiğinde, boştaki oyuncuya.',
      'Bitirişi hızlı yapın: kısa seçenek, tek-iki dokunuş.',
      'Üçüncü ve dördüncü oyuncular gecikmeden destek verir.',
    ],
    roles: [
      { pos: 'on-numara', text: 'Topu merkeze taşır; doğru anda pas ya da şut seçer.' },
      { pos: 'kanat', text: 'Kanal koşusu yapar; açılır ve derinde bekler.' },
      { pos: 'santrfor', text: 'Savunma arkasına koşup şut ya da orta için hazır olur.' },
    ],
    mistakes: [
      'Topu taşıyanın pası geç vermesi: savunma toparlanır.',
      'Hepsinin aynı hatta koşması.',
      'Kanat oyuncusunun çok erken içeri kesmesi.',
    ],
    tryIt: [
      '3v2 kontra atak oyunu: pas zamanı ve koşular.',
      '4v3 geçiş ve bitiriş.',
      'Kontra atakta bitirmeye 10 saniye sınırı ile maç.',
    ],
    scene: S('half', 'C:a:62:34 W1:a:60:10 W2:a:60:58 D1:b:82:28 D2:b:82:40 G:k:103.5:34', [
      ['C topla; W1 ve W2 yanlarda, D1 ve D2 savunmada.', null, 'C'],
      ['C merkezde ilerler; W1 ve W2 derin koşu yapar.', { C: [76, 34], W1: [84, 10], W2: [84, 58] }, 'C'],
      ['D1 ve D2 C\'ye kilitlendi; C boştaki W1\'e pas verir.', { D1: [82, 32], D2: [82, 38] }, 'W1'],
      ['W1 bitirir ya da ortaya hazır; W2 ve C destekte.', { W1: [92, 20], W2: [92, 52] }, 'W1'],
    ]),
    aliases: ['counter attack', 'kontra', 'hızlı hücum', '3v2', 'üçe iki'],
    related: ['hucum-gecisi', 'ucgen-oyun'],
  },
  {
    id: 'savunma-yerlesimi',
    title: 'Savunma yerleşimi ve kompaktlık',
    tag: 'Savunma',
    lv: 3,
    summary:
      'Organize savunmada takım iki sıra (4-4) halinde, topa göre kayarak ve hatlar arası mesafeyi kısa tutarak oynar. Hedef, merkezi kapatıp rakibi kanatlara yönlendirmektir.',
    principles: [
      'Hatlar kısa mesafede olsun: iki hat arasında rakibin oynayabileceği boşluk bırakmayın.',
      'Top nerede ise takım oraya kayar; uzak taraftaki oyuncular içeri sıkışır.',
      'Merkezi kapatın, rakibi kanata yönlendirin ve orada baskıyı artırın.',
      'Uzak taraf oyuncusu yaklaşık yarı alanda "denge" pozisyonunu korur.',
      'Birbirinizi yönlendirin ve konuşun: "Sol kayıyor!", "Çık!" gibi.',
    ],
    roles: [
      { pos: 'stoper', text: 'Hattı yönetir; kısa ve uzun toplara karşı pozisyonu ayarlar.' },
      { pos: 'bek', text: 'Kanatta baskı yapan oyuncuya karşı yardım ve kademe.' },
      { pos: 'merkez-orta-saha', text: 'Hatlar arasındaki boşluğu kapatır; merkezi korur.' },
      { pos: 'on-libero', text: 'Savunmanın önünde hat arası oyuncuları engeller.' },
    ],
    mistakes: [
      'Hatların birbirinden uzak kalması.',
      'Topa yakın tarafa yeterince kaymamak.',
      'Uzak taraf oyuncusunun topa bakıp yer değiştirmemesi.',
    ],
    tryIt: [
      '4-4 hat ve kayma çalışması: antrenör topu sağa/sola oynatır.',
      '8v8 yarım saha savunma organizasyonu.',
      'Pas yollarını kapatma oyunu (savunma hattı konilerle).',
    ],
    scene: S('defend', 'D1:a:22:10 D2:a:22:26 D3:a:22:42 D4:a:22:58 M1:a:34:10 M2:a:34:26 M3:a:34:42 M4:a:34:58 B:b:44:12 B2:b:44:34', [
      ['4-4 savunma; rakip B topla sol kanatta.', null, 'B'],
      ['Takım topun olduğu tarafa kayar; uzak taraf içeri sıkışır.', { D1: [22, 6], D2: [22, 18], D3: [22, 31], D4: [22, 44], M1: [34, 4], M2: [34, 17], M3: [34, 30], M4: [34, 43] }, 'B', { z: [{ x: 18, y: 50, w: 20, h: 14, k: 'danger', l: 'zayıf taraf' }] }],
    ]),
    aliases: ['kompaktlık', 'blok savunma', 'defensive shape', 'savunma organizasyonu', '4-4-2 savunma'],
    related: ['pres', 'savunma-hatti'],
  },
  {
    id: 'oyun-kurma',
    title: 'Arkadan oyun kurma',
    tag: 'Hücum',
    lv: 3,
    summary:
      'Kaleciden başlayan oyun kurma, rakibin baskısına karşı açı ve sayısal üstünlük yaratmaktır. Kaleci ve stoperler geniş açılır, ön libero ya da bek seçenek verir.',
    principles: [
      'Kaleci ve stoperler geniş açılır; rakip forvetleri uzatmak için aralık bırakın.',
      'Ön libero stoperlerin arasında ya da önünde, pas seçeneği olarak konumlanır.',
      'Beklerin konumu yüksek ve geniş: rakip kanat oyuncusunu bağlar.',
      'Pres geldiğinde topu ileriye taşıyan oyuncuya yaklaşıp seçenek sunun.',
      'Rakip baskıda uzaksa taşıyarak çıkın; yakınsa tek-iki dokunuşla pas.',
    ],
    roles: [
      { pos: 'kaleci', text: 'Oyun kurmaya başlar; ayağıyla pas seçeneği sunar.' },
      { pos: 'stoper', text: 'Genişleyip açı yaratır; topu taşır ya da pas verir.' },
      { pos: 'on-libero', text: 'Hatlar arasında pas seçeneği; baskıyı kırar.' },
      { pos: 'bek', text: 'Geniş ve yüksek konumlanır; çıkış pası alır.' },
    ],
    mistakes: [
      'Stoperlerin birbirine çok yakın durması.',
      'Pivotun savunmacıların arkasında saklanması.',
      'Baskı altında riskli pas.',
    ],
    tryIt: [
      '4v2 kaleci dahil oyun kurma oyunu.',
      '6v4 yarım saha oyun kurma.',
      'Pres altında çıkış ve bitiriş.',
    ],
    scene: S('defend', 'K:k:3:34 C1:a:12:34 C2:a:14:48 P:a:26:34 F1:b:20:28 F2:b:22:42 FB1:a:28:8 FB2:a:28:60', [
      ['K topla; C1, C2 stoperleri henüz birbirine yakın, F1 ve F2 baskı yapıyor.', null, 'K'],
      ['C1 ve C2 geniş açılır; P iki rakip forvetin arasında seçenek olur.', { C1: [12, 20], C2: [12, 48] }, 'K'],
      ['K, C1\'e verir; F1 C1\'e yaklaşırken P boşalır.', { F1: [14, 22] }, 'C1'],
      ['C1 pasla P\'yi bulur; iki forvet bypass edildi.', { P: [24, 34] }, 'P'],
    ]),
    aliases: ['build up', 'oyun başlatma', 'çıkış', 'kaleciden oyun kurma', 'pres kırma'],
    related: ['ayakla-oyun-kurma', 'pres'],
  },
  {
    id: 'yari-alan',
    title: 'Yarı alan (half-space) kullanımı',
    tag: 'Hücum',
    lv: 4,
    summary:
      'Sahayı uzunlamasına beş koridora böldüğünüzde, kanat ile merkez arasında kalan alanlara yarı alan denir. Rakip orta saha ile bek-stoper arası geçişte savunması zayıf kalır; burada top alan oyuncu rakiple karşılaşmadan kolay seçenek bulur.',
    principles: [
      'Yarı alanda top alan oyuncu hem merkezi hem kanadı görür; çok seçenek sunar.',
      'Bek–stoper arasındaki boşlukta konumlanın: savunmacı hangisini takip edeceğini seçmek zorunda kalır.',
      'Kanat oyuncusu genişte kalırsa içeri giren oyuncu yarı alanı kullanır.',
      'Yarı alan topu aldığınızda hızlı karar: şut, hat kıran pas ya da kanada açılan arkadaş.',
      'Çok fazla oyuncu aynı koridorda olmamalı.',
    ],
    roles: [
      { pos: 'on-numara', text: 'Yarı alanda hat arasında topu alır; yüzü kaleye dönük oynar.' },
      { pos: 'kanat', text: 'Geniş kalır ya da yarı alana girer; oyunun yönünü ayarlar.' },
      { pos: 'merkez-orta-saha', text: 'Yarı alana koşu yaparak bindirme ya da içe binme yapar.' },
    ],
    mistakes: [
      'Yarı alanda topu alıp duraksamak.',
      'Hepsinin aynı koridorda yığılması.',
      'Rakip savunmacıya sırtı dönük top almak.',
    ],
    tryIt: [
      'Koni ile koridor çalışması: her koridor için bir oyuncu.',
      '4v3 yarı alan oyunu: yarı alanda top alıp bitiriş.',
      'Hat arası pas ve içe giriş koşularını tekrar edin.',
    ],
    scene: S('half', 'C:a:60:34 W:a:78:6 M:a:72:44 S:a:84:34 D1:b:80:14 D2:b:84:26 D3:b:84:42 D4:b:80:56', [
      ['Yarı alan koridorları: D1 ile D2 arasındaki (sol) alan boş.', null, 'C', { z: [{ x: 78, y: 17, w: 12, h: 9, k: 'free', l: 'yarı alan' }, { x: 78, y: 42, w: 12, h: 9, k: 'free', l: 'yarı alan' }] }],
      ['M yarı alana içeri girer; D2 mi D4 mü takip edecek karar vermek zorunda.', { M: [82, 46] }, 'C', { z: [] }],
      ['C pas verir; M yarı alanda topla, S ve W seçenek.', { S: [90, 34], W: [90, 8] }, 'M'],
    ]),
    aliases: ['half space', 'yarım alan', 'koridor', 'channel', 'iç koridor'],
    related: ['hat-arasi-alma', 'ucgen-oyun'],
  },
  {
    id: 'ucgen-oyun',
    title: 'Pozisyon oyunu ve üçgenler',
    tag: 'Hücum',
    lv: 3,
    summary:
      'Her oyuncunun topu alan oyuncuya iki farklı açıdan seçenek sunduğu üçgen düzeni, pas oyununun omurgasıdır. Üçgenin köşelerindeki oyuncular topun yerine göre sürekli hareket eder.',
    principles: [
      'Topu taşıyanın her zaman iki pas seçeneği olmalı (üçgen).',
      'Pas verince hareket edin ve yeni bir üçgen yaratın.',
      'Hatlar arasında ve rakibin gerisinde seçenekler: derinlik ve genişlik.',
      'Mesafe: ne çok yakın ne çok uzak; yaklaşık 10–15 m.',
      'Rakip bir yöne kayınca diğer taraftaki boşluğu kullanın.',
    ],
    roles: [
      { pos: 'merkez-orta-saha', text: 'Üçgenin taşıyıcısı ya da seçeneği; topu yönlendirir.' },
      { pos: 'bek', text: 'Kanatta üçgen oluşturur: kanatla ve orta sahayla.' },
      { pos: 'kanat', text: 'Geniş ve derin seçeneği yaratır.' },
    ],
    mistakes: [
      'Hepsi aynı hatta durmak: pas seçeneği azalır.',
      'Pas sonrası durmak.',
      'Mesafelerin çok uzak ya da çok yakın olması.',
    ],
    tryIt: [
      '3v1 rondo: üçgen tutarak pas ve hareket.',
      '4v2 rondo, tek dokunuş.',
      '6v3 pozisyon oyunu: üç bölgeli alan.',
    ],
    scene: S('half', 'A:a:60:30 B:a:70:46 C:a:78:28 D:b:68:36', [
      ['A, B ve C üçgen; D ortada baskı yapıyor.', null, 'A'],
      ['A, B\'ye verir ve yeni bir üçgen noktası için hareket eder.', { A: [68, 22] }, 'B'],
      ['B, C\'ye aktarır; D yetişemez.', null, 'C'],
      ['C, A\'nın yeni konumuna geri çevirir; üçgen yeniden oluştu.', { B: [76, 44] }, 'A'],
    ]),
    aliases: ['pozisyon oyunu', 'positional play', 'üçgen', 'rondo', 'pas düzeni'],
    related: ['ucgen-kombinasyon', 'yari-alan'],
  },
  {
    id: 'karar-verme',
    title: 'Futbol zekâsı: karar verme çerçevesi',
    tag: 'Zihin',
    lv: 2,
    summary:
      'İyi karar vermek; bakmak, değerlendirmek ve uygulamak döngüsüdür. "Tara – Değerlendir – Karar – Uygula" sırası ve bölgeye göre risk seviyesi, doğru karar için basit bir çerçeve sunar.',
    principles: [
      'Top gelmeden önce tara: kim açık, rakip nerede, hangi alan boş?',
      'Seçenek sırası: önce gol/fırsat, sonra ilerleme, sonra güvenli devam.',
      'Bölgeye göre risk: kendi yarı alanda güvenli, orta sahada ilerleme, rakip kalesine yakın cesur.',
      'Kararı geciktirmeyin: iki saniyeden uzun düşünmek rakibe fırsat verir.',
      'Hatadan sonra hemen sıfırlayın: bir sonraki aksiyona odaklanın.',
    ],
    roles: [
      { pos: 'merkez-orta-saha', text: 'Topu aldığında üç seçeneği (ileri, yan, geri) hızla tartar.' },
      { pos: 'stoper', text: 'Güvenli çıkış ve risk dengesi: top kaybı en pahalı olduğu bölgede.' },
      { pos: 'santrfor', text: 'Son bölgede cesur ve hızlı: şut kararı ve zamanlaması.' },
    ],
    mistakes: [
      'Hep aynı seçeneği tercih etmek.',
      'Kendi ceza sahası yakınında gereksiz risk almak.',
      'Karar vermeden önce topa hâkim olmayı beklemek.',
    ],
    tryIt: [
      'Renk kodlu karar oyunu: renk söylenince o yöne pas.',
      '3 seçenekli küçük alan oyunu: her pasta neden bu seçenek diye açıklama.',
      'Video analizinde: topu aldığınız anlarda üç seçeneği not edin.',
    ],
    scene: S('half', 'A:a:62:34 B:a:80:20 C:a:70:50 D:b:70:34 G:b:88:34', [
      ['A topla; üç seçenek: B (ileri-kanat), C (yan), geriye (güvenli).', null, 'A', { txt: [{ x: 60, y: 28, s: 'tara' }] }],
      ['Bölge: rakip yarı alan; B boşta ve ileri seçenek var: risk düşük, kazanç yüksek.', null, 'A', { txt: [] }],
      ['A, B\'ye açılan pası verir; karar zamanında uygulandı.', { B: [84, 18] }, 'B'],
    ]),
    aliases: ['karar', 'decision making', 'futbol iq', 'oyun zekası', 'futbol zekası'],
    related: ['kontrol-sonrasi-karar', 'cevre-tarama'],
  },
];

export const TACTIC_BY_ID: Record<string, Tactic> = Object.fromEntries(TACTICS.map((t) => [t.id, t]));
