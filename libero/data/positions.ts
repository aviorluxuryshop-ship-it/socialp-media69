import { S } from '@/lib/scene';
import type { PositionId, Scene } from '@/lib/types';

export type Quality = 'hiz' | 'cevik' | 'dayan' | 'kuvvet' | 'guc' | 'denge';

export const QUALITY_NAME: Record<Quality, string> = {
  hiz: 'Sürat',
  cevik: 'Çeviklik',
  dayan: 'Dayanıklılık',
  kuvvet: 'Kuvvet',
  guc: 'Patlayıcı güç',
  denge: 'Denge ve koordinasyon',
};

export interface PositionProfile {
  id: PositionId;
  name: string;
  tagline: string;
  /** "nasıl düşünür" — birinci tekil cümleler */
  think: string[];
  onBall: string[];
  offBall: string[];
  defending: string[];
  keyTechs: string[];
  keyTactics: string[];
  /** öncelik 1–5 (genel eğilim; kişiye göre değişir) */
  qual: Record<Quality, number>;
  muscles: string[];
  tips: string[];
  mistakes: string[];
  scene: Scene;
  sceneNote: string;
}

export const POSITION_PROFILES: PositionProfile[] = [
  {
    id: 'kaleci',
    name: 'Kaleci',
    tagline: 'Son savunmacı, ilk oyun kurucu.',
    think: [
      'Top nerede olursa olsun, kale ile top arasındaki çizgide ve doğru uzaklıktayım.',
      'Şutu çıkmadan önce tahmin ederim: ayağın duruşu, gövde yönü, top mesafesi.',
      'Savunmaya konuşarak yön veririm; arkamdan tüm sahayı ben görürüm.',
      'Her kurtarıştan sonra bir sonraki topa hazırım: önce toparlanma.',
      'Topu aldığımda ilk soru: hızlı hücum başlatabilir miyim?',
    ],
    onBall: ['Ayakla ve elle kısa-uzun dağıtım', 'Baskı altında sakin pas', 'Hızlı atak başlatma'],
    offBall: ['Hat arkasını kontrol eden "süpürücü" pozisyonlama', 'Savunma hattıyla iletişim', 'Geri paslara hazır duruş'],
    defending: ['Şut kurtarışı', 'Orta çıkışı', 'Birebirde kapama ve açı kapama'],
    keyTechs: ['kaleci-durusu', 'yerden-sut-tutma', 'gogus-hizasi-tutma', 'plonjon-alcak', 'ust-kose-kurtaris', 'orta-kesme', 'yumruklama', 'yan-cikarma', 'birebirde-cikis', 'aci-kapama', 'ayakla-oyun-kurma', 'elle-atis', 'penalti-kaleci'],
    keyTactics: ['oyun-kurma', 'savunma-yerlesimi', 'karar-verme'],
    qual: { hiz: 3, cevik: 5, dayan: 2, kuvvet: 3, guc: 5, denge: 5 },
    muscles: ['core', 'glute', 'quad', 'shoulder', 'arm'],
    tips: ['Reaksiyon ve el-göz koordinasyonu için kısa mesafeli tepki çalışmaları yapın.', 'Düşme ve inişleri yumuşak zeminde öğrenin.', 'Ayakla oyun kurmayı günlük rutine ekleyin.'],
    mistakes: ['Topu gövdenin önünde tutmamak', 'Çok erken ya da çok geç çıkmak', 'Savunmayla iletişimsizlik'],
    scene: S('gk', 'K:k:2:34 A:a:12:26 B:b:20:12', [
      ['B kanatta topla; K kale ve top arasında doğru çizgide.', null, 'B'],
      ['B ortaya hazırlanırken K çıkış mesafesini ve savunma yerini kontrol eder.', { K: [3.5, 33] }, 'B', { txt: [{ x: 12, y: 40, s: 'konuş' }] }],
    ]),
    sceneNote: 'Kaleci, topun yerine göre pozisyonunu ayarlar ve savunmayı yönlendirir.',
  },
  {
    id: 'stoper',
    name: 'Stoper',
    tagline: 'Savunmanın beyni ve ilk pasörü.',
    think: [
      'Önce rakip forvetin ve topun yerine bakarım; ofsayt çizgisi ve boşluklar nerede?',
      'Hatımı düzenli tutarım: yanımdaki stoper ve bekle iletişimdeyim.',
      'Topa atılmadan önce müdahale kararım net olmalı; kaybetmeyeceğim bölgede risk almam.',
      'Topu kazandığımda ilk pas güvenli ve yön veren olmalı.',
      'Hava ve yerde ikili mücadelelerde zamanlamayı hiç kaçırmam.',
    ],
    onBall: ['Oyun kurma: kısa ve uzun pas', 'Baskı altında sakin ilk temas', 'Orta sahaya taşıma'],
    offBall: ['Hattı yönetme', 'Derinliği izleme', 'Duran toplarda hücuma çıkma'],
    defending: ['Birebir savunma', 'Hava topları', 'Araya girme ve kademe'],
    keyTechs: ['savunma-durusu', 'yan-yan-geri-kayma', 'birebir-savunma', 'top-kapma-blok', 'araya-girme', 'savunma-kafasi', 'ziplayarak-kafa', 'omuz-mucadelesi', 'sut-engelleme', 'savunma-hatti', 'baski-kademe', 'yerden-ic-yuz-pas', 'uzun-pas', 'baski-altinda-kontrol'],
    keyTactics: ['savunma-yerlesimi', 'oyun-kurma', 'pres', 'karar-verme'],
    qual: { hiz: 3, cevik: 3, dayan: 3, kuvvet: 5, guc: 4, denge: 4 },
    muscles: ['quad', 'hamstring', 'glute', 'core', 'calf'],
    tips: ['Her gün kısa mesafe geri sprint ve yön değiştirme çalışın.', 'Güçlü ve zayıf ayakla pas çalışması yapın.', 'Hava mücadelesi için zamanlama ve boyun gücü çalışın (yaşa uygun).'],
    mistakes: ['Hatta geri kalmak', 'Kayarak müdahaleyi çok erken denemek', 'Baskı altında geriye dönüp risk almak'],
    scene: S('defend', 'D1:a:24:24 D2:a:24:44 F:b:19:34 M:b:48:50', [
      ['Rakip forvet F savunma arkasına koşmaya hazırlanıyor; D1 ve D2 hattı koruyor.', null, 'M', { line: 24 }],
      ['Pas çıkarken D1 hattı yukarı çeker; F ofsayt arkasında kalır.', { D1: [30, 24], D2: [30, 44] }, 'M', { line: 30 }],
    ]),
    sceneNote: 'Stoperler hattı eşzamanlı yönetir; ofsayt çizgisiyle forveti etkisizleştirir.',
  },
  {
    id: 'bek',
    name: 'Bek',
    tagline: 'Hem savunmacı hem kanat oyuncusu: en çok koşan pozisyonlardan biri.',
    think: [
      'Topa sahip değilken kanat oyuncusunu izlerim; konumumu ona ve stopere göre ayarlarım.',
      'Hücumda ne zaman çıkıp ne zaman kalacağımı bilirim: bindirme mi, içe mi, güvenli mi?',
      'Yüksek tempoda ortayı doğru zamanda ve doğru bölgeye yaparım.',
      'Top kaybında hızla geri dönüp savunma hattına katılırım.',
      'Yanımdaki kanat oyuncusuyla iki kişilik oyun kurarım.',
    ],
    onBall: ['Bindirme ve içe binme', 'Alçak ve yüksek orta', 'Kısa kombinasyonla ilerleme'],
    offBall: ['Genişlik ve derinlik sağlama', 'Stoper ile hat uyumu', 'Karşı atak sırasında kenar koşusu'],
    defending: ['Birebir kanat savunması', 'Rakip kanat oyuncusunu içeri/dışarı yönlendirme', 'Orta bloklama'],
    keyTechs: ['yan-yan-geri-kayma', 'birebir-savunma', 'top-kapma-blok', 'kayarak-mudahale', 'bindirme', 'iceri-binme', 'orta-alcak', 'orta-yuksek', 'geri-cekme', 'hizli-top-surme', 'tac-atisi', 'savunma-hatti'],
    keyTactics: ['savunma-yerlesimi', 'oyun-kurma', 'kontra-atak'],
    qual: { hiz: 5, cevik: 4, dayan: 5, kuvvet: 3, guc: 3, denge: 3 },
    muscles: ['quad', 'hamstring', 'calf', 'glute', 'core'],
    tips: ['Tekrarlı sprint dayanıklılığı için aralıklı koşular yapın.', 'Orta ve bindirme zamanlamasını eşle birlikte çalışın.', 'Savunma duruşu ve yan yan kaymayı kısa ama yoğun setlerle tekrar edin.'],
    mistakes: ['Çok yukarıda kalıp arkada boşluk bırakmak', 'Ortada topu savunmacıya takmak', 'Geri dönüşte yavaş kalmak'],
    scene: S('half', 'W:a:80:50 B:a:70:58 D:b:84:52', [
      ['W içe çekilir; B bekin dışından hızlı bindirme koşusu yapar.', null, 'W'],
      ['W, B\'ye koşu yoluna pas verir; B savunmayı geçti.', { W: [82, 46], B: [92, 62] }, 'B'],
    ]),
    sceneNote: 'Bek, kanat oyuncusunun dışından bindirerek sayısal üstünlük kurar.',
  },
  {
    id: 'on-libero',
    name: 'Ön libero',
    tagline: 'Savunmanın önündeki kalkan ve oyunun metronomu.',
    think: [
      'Savunma önündeki boşluğu kapatır, hat arasındaki oyuncuyu engellerim.',
      'Her zaman iki-üç pas seçeneği sunar ve topu hızla yönlendiririm.',
      'Top kaybında önce yavaşlatır, sonra geri dönüş desteği veririm.',
      'Sahaya bakarım: stoperlere yakın mı, orta sahayla mı bağlantı kuracağım?',
      'Basit paslarla tempoyu kontrol eder, doğru anda ileri pas veririm.',
    ],
    onBall: ['Kısa ve uzun paslarla yön verme', 'Baskı altında ilk temas ve çıkış', 'Alan değiştirme'],
    offBall: ['Stoperler arasında ya da önünde seçenek', 'Hat arasında pozisyon alma', 'Karşı atağa karşı pozisyon koruma'],
    defending: ['Pas kesme', 'Hat arasındaki oyuncuya pres', 'Savunma hattıyla mesafe koruma'],
    keyTechs: ['cevre-tarama', 'baski-altinda-kontrol', 'araya-girme', 'top-kapma-blok', 'baski-kademe', 'tek-dokunus-pas', 'ara-pas', 'uzun-pas', 'top-koruma'],
    keyTactics: ['savunma-yerlesimi', 'karsi-pres', 'oyun-kurma', 'karar-verme'],
    qual: { hiz: 3, cevik: 4, dayan: 5, kuvvet: 4, guc: 3, denge: 4 },
    muscles: ['quad', 'hamstring', 'core', 'glute', 'adductor'],
    tips: ['Çevre taramayı her çalışmanın parçası yapın.', 'Orta mesafe pas isabetini artırın.', 'Dayanıklılık: orta şiddette uzun süreli koşuyla tekrarlı sprint karışımı.'],
    mistakes: ['Stoperlerin arkasında saklanmak', 'Topu aldıktan sonra duraksamak', 'Rakip hat arası oyuncusunu serbest bırakmak'],
    scene: S('defend', 'P:a:34:34 C1:a:20:22 C2:a:20:46 F:b:44:34 M:b:50:20', [
      ['P, savunma önünde; rakip on numara F hat arasında top bekliyor.', null, 'C1'],
      ['P, F\'nin arkasına geçip topu keser ve pas çizgisini kapatır.', { P: [40, 34] }, 'C1'],
    ]),
    sceneNote: 'Ön libero, hat arasındaki oyuncuyu kapatır ve oyun kurmada merkez seçenek olur.',
  },
  {
    id: 'merkez-orta-saha',
    name: 'Merkez orta saha',
    tagline: 'Takımın kalbi: hem top kazanır hem de oyunu bağlar.',
    think: [
      'Her zaman bir sonraki pas için iki çözüm düşünürüm.',
      'Topu almadan önce iki kez bakarım; ilk temas hazırlık içindir.',
      'Savunmaya yardım ederim, ancak hücum fırsatında ileri çıkarım.',
      'Boşlukları okur, arkadaşlarıma pas yolu açarım.',
      'Tempo ayarlarım: bazen hızlandırır, bazen yavaşlatırım.',
    ],
    onBall: ['Kısa, orta ve uzun pas', 'Dönerek çıkış ve taşıma', 'Uzaktan şut'],
    offBall: ['Pas açısı oluşturma', 'Üçüncü adam koşusu', 'Boşluk okuma ve konumlanma'],
    defending: ['Pres ve karşı pres', 'Pas kesme', 'Hat arası kapatma'],
    keyTechs: ['ilk-temas', 'yonlu-kontrol', 'cevre-tarama', 'kontrol-sonrasi-karar', 'tek-dokunus-pas', 'ara-pas', 'uzun-pas', 'pas-sonrasi-hareket', 'ucuncu-adam-kosusu', 'araya-girme', 'uzaktan-sut'],
    keyTactics: ['karsi-pres', 'ucgen-oyun', 'oyun-kurma', 'karar-verme'],
    qual: { hiz: 3, cevik: 4, dayan: 5, kuvvet: 3, guc: 3, denge: 4 },
    muscles: ['quad', 'hamstring', 'glute', 'core', 'adductor'],
    tips: ['Dar alanda çok sayıda ilk temas ve tek dokunuş çalışın.', 'Yüksek yoğunluklu aralıklı koşuyla oyun temposuna hazırlanın.', 'Video analizinde top almadan önceki bakış sayınızı sayın.'],
    mistakes: ['Topu aldıktan sonra bakmak', 'Hep aynı seçeneği oynamak', 'Pas sonrası durmak'],
    scene: S('half', 'C:a:60:34 A:a:68:24 B:a:70:44 D:b:66:34', [
      ['A topu almadan önce çevreyi tarıyor; D baskıya hazır.', null, 'C'],
      ['C pas verir; A topu karşılar ve B\'ye hareket seçeneği sunar.', { B: [74, 44] }, 'A'],
      ['A tek dokunuşla B\'ye aktarır; D yetişemedi.', { A: [72, 28] }, 'B'],
    ]),
    sceneNote: 'Orta saha oyuncusu tara–al–karar döngüsüyle tempoyu ve yönü belirler.',
  },
  {
    id: 'on-numara',
    name: 'On numara',
    tagline: 'Hatlar arasındaki yaratıcı: son pası ve bitişi düşünür.',
    think: [
      'Rakibin iki hattı arasında top alacağım boşluğu ararım.',
      'Topu aldığımda yüzüm kaleye dönük olmalı; ilk temasım bunu sağlar.',
      'Üç seçeneğim hep var: şut, son pas, geri çevirip yeniden alma.',
      'Bir pas yerine iki pası düşünürüm: hedef sadece arkadaşım değil, onun alacağı boşluktur.',
      'Bitiricilere zamanlama ve açı yaratırım.',
    ],
    onBall: ['Alıp dönme ve hat kıran pas', 'Aşırtma ve ara paslar', 'Uzaktan şut ve duran toplar'],
    offBall: ['Hat arasında konumlanma', 'Yarı alanlara girme', 'Santrforla bağlantı'],
    defending: ['Pres tetikleme', 'Rakip ön liberoyu kapatma', 'Karşı presin ilk adımı'],
    keyTechs: ['hat-arasi-alma', 'alip-donme', 'ara-pas', 'derinlik-pasi', 'asirtma-pas', 'kavisli-pas', 'sut-sahtesi', 'uzaktan-sut', 'serbest-vurus-duvar-ustu', 'ucuncu-adam-kosusu'],
    keyTactics: ['yari-alan', 'kontra-atak', 'ucgen-oyun', 'karar-verme'],
    qual: { hiz: 3, cevik: 5, dayan: 4, kuvvet: 2, guc: 3, denge: 5 },
    muscles: ['core', 'quad', 'glute', 'adductor', 'calf'],
    tips: ['Dar alanda baskı altında ilk temas ve dönüş çalışın.', 'Pas yollarını önceden görmek için çevre tarama sayısını artırın.', 'İki ayakla pas ve şut çalışmaları yapın.'],
    mistakes: ['Hat arasında topu alıp geri pas vermek', 'Fazla çalım: akışı bozmak', 'Savunma katkısını ihmal etmek'],
    scene: S('half', 'C:a:58:34 A:a:78:34 S:a:90:44 M1:b:70:28 M2:b:70:40 D1:b:86:28 D2:b:86:40', [
      ['A rakibin orta saha (M1–M2) ve savunma (D1–D2) hatları arasında.', null, 'C'],
      ['C topu A\'ya verir; A yüzünü kaleye çevirerek alır.', null, 'A'],
      ['S koşar; A hat kıran pasla S\'yi oyuna sokar.', { S: [94, 40] }, 'S'],
    ]),
    sceneNote: 'On numara hat arasında topu alıp son pası verir.',
  },
  {
    id: 'kanat',
    name: 'Kanat',
    tagline: 'Hız, birebir ve son pas: genişlik ve fark yaratır.',
    think: [
      'Savunmacıya karşı iki seçeneğim hep var: içeri ya da dışarı.',
      'Bekle iki kişilik oyun kurup bindirmeyi ve içe kesmeyi kullanırım.',
      'Top bende değilse, savunma arkasına koşar ya da boşluk açarım.',
      'Pas ya da şut kararını son anda değil, bakarak önceden veririm.',
      'Hücumda genişlik, savunmada ilk baskı hattıyım.',
    ],
    onBall: ['Birebir çalım ve hızlanma', 'İçe kesip şut', 'Orta ve geri çekme'],
    offBall: ['Savunma arkasına koşu', 'Geniş konumlanma', 'Kısa direk koşusu'],
    defending: ['Pres tetikleme', 'Rakip beke baskı', 'Kenar çizgisine yönlendirme'],
    keyTechs: ['birebir-hucum', 'govde-sahtesi', 'adim-ustu', 'ic-yuz-kesme', 'dis-yuz-kesme', 'iceri-kesip-sut', 'orta-alcak', 'orta-yuksek', 'geri-cekme', 'ust-dis-vurus', 'savunma-arkasina-kosu', 'kale-onu-kosulari'],
    keyTactics: ['kontra-atak', 'yari-alan', 'pres', 'hucum-gecisi'],
    qual: { hiz: 5, cevik: 5, dayan: 4, kuvvet: 2, guc: 4, denge: 4 },
    muscles: ['quad', 'hamstring', 'calf', 'glute', 'core'],
    tips: ['Kısa mesafe patlayıcı sürat ve yön değiştirme çalışın.', 'İki ayakla orta ve şut çalışması yapın.', 'Birebir çalışmalarında farklı çalımlar arasında seçim yapmayı öğrenin.'],
    mistakes: ['Hep aynı çalımı kullanmak', 'Geri çekme yerine inatla şut', 'Savunma katkısını unutmak'],
    scene: S('box', 'A:a:84:12 D:b:90:16 B:a:92:44 G:k:103.5:34', [
      ['A kanatta; D önünü kapatıyor. B ortada boşta.', null, 'A'],
      ['A topu içe keser, D\'yi geçer.', { A: [90, 26] }, 'A'],
      ['A seçeneğini kullanır: şut yerine B\'ye geri çekme.', { B: [92, 40] }, 'B'],
    ]),
    sceneNote: 'Kanat oyuncusu birebirde farkı yaratır; şut ya da geri çekme arasında seçim yapar.',
  },
  {
    id: 'santrfor',
    name: 'Santrfor',
    tagline: 'Ceza sahasının hâkimi: gol, bağlantı ve ilk savunma.',
    think: [
      'Her zaman kaleyi, kaleciyi ve savunmacının bacağını hesaba katarım.',
      'Topu almadan önce markörümün yerini bilirim; ofsayt çizgisinde dururum.',
      'Topa gelip dönerek ya da bırakarak oyuna bağlanırım.',
      'Sayıdan çok pozisyonu düşünürüm: doğru yer, doğru zaman.',
      'Kaybedilen topta ilk pres bana aittir; takımı yukarı iterim.',
    ],
    onBall: ['Bitiricilik: tek vuruş, kaleciyle birebir, kafa', 'Sırtı dönük kontrol ve bırakma', 'Hızlı dönüş ve şut'],
    offBall: ['Savunma arkasına koşu', 'Kale önü koşuları', 'Topa gelme ve kaçma'],
    defending: ['Yüksek pres', 'Kavisli baskı', 'Duran toplarda savunma'],
    keyTechs: ['kaleciyle-karsi-karsiya', 'tek-vurus-bitirme', 'donerek-bitirme', 'seken-topla-bitirme', 'kafa-ile-bitirme', 'sirti-donuk-kontrol', 'birakma-pasi', 'pivot-oyunu', 'savunma-arkasina-kosu', 'kale-onu-kosulari', 'topa-gelme-kacma', 'ofsayt-cizgisi-zamanlama'],
    keyTactics: ['pres', 'kontra-atak', 'hucum-gecisi', 'karar-verme'],
    qual: { hiz: 4, cevik: 4, dayan: 3, kuvvet: 4, guc: 5, denge: 4 },
    muscles: ['glute', 'quad', 'hamstring', 'core', 'calf'],
    tips: ['Bitiricilik çalışmalarını yorgunken de yapın.', 'Zamanlamalı koşular için hat ve ofsayt çizgisi çalışması.', 'Kafa çalışmaları yaşa uygun ve sınırlı olmalı.'],
    mistakes: ['Ofsayt çizgisini görmeden koşmak', 'Topu alırken çok fazla düşünmek', 'Pres yapmayıp topa dönmek'],
    scene: S('box', 'C:a:98:8 A:a:86:34 B:a:84:46 D:b:92:34 G:k:103.5:34', [
      ['A ceza sahası içinde; D arkasında, C kanattan ortaya hazır.', null, 'C'],
      ['A savunmacının görüş alanı dışında kısa direğe koşar.', { A: [96, 30] }, 'C'],
      ['C ortalar; A ilk vuruşla bitirir.', null, [105, 32], { shot: true }],
    ]),
    sceneNote: 'Santrfor ceza sahasında doğru yere ve doğru zamanda koşarak golü bulur.',
  },
];

export const POSITION_BY_ID: Record<string, PositionProfile> = Object.fromEntries(POSITION_PROFILES.map((p) => [p.id, p]));
