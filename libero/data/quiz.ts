import { S } from '@/lib/scene';
import type { Level, PositionId, Scene } from '@/lib/types';

export type QuizTheme = 'Karar' | 'Pres' | 'Geçiş' | 'Savunma' | 'Topsuz' | 'Hücum' | 'Duran top' | 'Kaleci';

export interface QuizOption {
  t: string;
  ok?: boolean;
  why: string;
}

export interface QuizQuestion {
  id: string;
  theme: QuizTheme;
  lv: Level;
  pos: PositionId[];
  /** durum anlatımı */
  q: string;
  /** İlk kare = durum; sonraki kareler = en iyi kararın uygulanışı */
  scene: Scene;
  opts: QuizOption[];
  explain: string;
}

export const QUIZ: QuizQuestion[] = [
  {
    id: 'q-bos-kanat',
    theme: 'Karar',
    lv: 2,
    pos: ['merkez-orta-saha', 'on-numara'],
    q: 'Orta saha oyuncusu A topla. Önde forvet S, savunmacı D1 tarafından sıkı markajda. Soldaki B’ye baskı yapmak için E hazır. Sağ kanat W ise tamamen boşta ve rakip bek uzak.',
    scene: S('half', 'A:a:66:34 S:a:84:34 D1:b:87:34 B:a:68:12 E:b:70:8 W:a:76:58 F:b:88:64', [
      ['Durum: A topla; seçenekleri tartıyor.', null, 'A', { z: [{ x: 74, y: 52, w: 12, h: 12, k: 'free', l: 'boş' }] }],
      ['A, boşta olan W’ye açılan pası verir.', { W: [80, 58] }, 'W', { z: [] }],
      ['W topla boşlukta ilerler; rakip savunma kaydı.', { W: [88, 52], D1: [86, 40] }, 'W'],
    ]),
    opts: [
      { t: 'S’ye sert pas vermek', why: 'S markajda; D1 pası keser. Risk yüksek, kazanç düşük.' },
      { t: 'B’ye pas vermek', why: 'E zaten baskıya hazır; B baskı altında topu kaybedebilir.' },
      { t: 'W’ye boşluğa açılan pas vermek', ok: true, why: 'W boşta ve rakip uzak: risk düşük, ilerleme yüksek.' },
      { t: 'Topla tek başına ilerlemek', why: 'Önünüz kapalı; yalnız ilerlemek top kaybı riski taşır.' },
    ],
    explain: 'Karar çerçevesi: önce tara, sonra riski ve kazancı kıyasla. Boşta bir arkadaş varken zorlamaya gerek yok.',
  },
  {
    id: 'q-pres-kavis',
    theme: 'Pres',
    lv: 3,
    pos: ['santrfor', 'kanat'],
    q: 'Rakip stoper C1 topla. Yanında stoper C2 boşta. Siz santrfor S olarak presten sorumlusunuz.',
    scene: S('half', 'C1:b:90:26 C2:b:90:46 S:a:80:38 K:b:101:34', [
      ['Durum: C1 topla, C2 boşta. S pres yapacak.', null, 'C1'],
      ['S kavisli koşuyla C1’e yaklaşırken C2’ye pas yolunu kapatır.', { S: [88, 32] }, 'C1', { z: [{ x: 89, y: 29, w: 4, h: 15, k: 'danger', l: '' }] }],
    ]),
    opts: [
      { t: 'Düz koşuyla doğrudan C1’e gitmek', why: 'C1 kolayca C2’ye verir; baskı boşa çıkar.' },
      { t: 'C2’ye pas yolunu gövdenle kapatacak şekilde kavisli koşmak', ok: true, why: 'Kapatma gölgesi: rakibi tek seçeneğe zorlar ve baskıyı etkili kılar.' },
      { t: 'Geri çekilip izlemek', why: 'Pres yokken rakip oyun kurmaya devam eder.' },
      { t: 'Yürüyerek yaklaşmak', why: 'Tempo düşük: rakip zaman kazanır.' },
    ],
    explain: 'Pres topa değil, pas yollarına yapılır. Kavisli koşu ve kapatma gölgesi rakibin seçeneklerini azaltır.',
  },
  {
    id: 'q-1v1-bek',
    theme: 'Savunma',
    lv: 2,
    pos: ['bek', 'stoper'],
    q: 'Rakip hızlı kanat oyuncusu W kenarda topla size doğru geliyor. Arkanızda stoper C var. Siz beksiniz (A).',
    scene: S('defend', 'A:a:30:10 C:a:24:26 W:b:46:8 B:b:40:30', [
      ['Durum: W topla yaklaşıyor.', null, 'W'],
      ['A mesafeyi korur ve W’yi kenara yönlendirir.', { A: [36, 11], W: [42, 6] }, 'W'],
      ['W kenara sıkıştı; C yardıma hazır.', { C: [28, 20], W: [41, 5] }, 'W'],
    ]),
    opts: [
      { t: 'Hemen topa atılmak', why: 'Sahteyle geçilirsiniz; arkanızda boşluk kalır.' },
      { t: 'Mesafeyi korumak ve W’yi kenara yönlendirmek', ok: true, why: 'Zaman kazanır, yardım gelmesini sağlar.' },
      { t: 'Arkanızı dönüp geri koşmak', why: 'Topa baskı yapmadığınız için rakip rahatça ilerler.' },
      { t: 'Kayarak müdahale denemek', why: 'Çok riskli: kaçırırsanız büyük boşluk oluşur.' },
    ],
    explain: 'Birebirde amaç topu hemen kapmak değil, rakibi yavaşlatıp yönlendirmek ve yardım beklemektir.',
  },
  {
    id: 'q-gecis-ileri',
    theme: 'Geçiş',
    lv: 3,
    pos: ['merkez-orta-saha'],
    q: 'Orta saha oyuncusu M topu kazandı. İleride S1 ve S2 koşuya başladı. Rakip savunma dengesiz, rakip D1 ve D2 geri dönüyor.',
    scene: S('half', 'M:a:60:34 S1:a:76:20 S2:a:76:48 D1:b:72:30 D2:b:72:38', [
      ['Durum: M topu kazandı; S1 ve S2 koşuda.', null, 'M'],
      ['M ilk pası hızlıca boşluktaki S1’e gönderir.', { S1: [84, 18], D1: [76, 28] }, 'S1'],
      ['S1 hızla ilerlerken S2 de destek koşusunda.', { S1: [92, 20], S2: [88, 44] }, 'S1'],
    ]),
    opts: [
      { t: 'Topu geriye vermek', why: 'Geçiş fırsatı kaçar; rakip düzenini kurar.' },
      { t: 'İleri ve hızlı pasla boştaki koşucuya vermek', ok: true, why: 'Rakip dengesizken ilk pas hızlı olmalı.' },
      { t: 'Topu tutup beklemek', why: 'Rakip geri dönüp savunmasını kurar.' },
      { t: 'Hemen uzaktan şut çekmek', why: 'Pozisyon yok; daha iyi seçenekler var.' },
    ],
    explain: 'Hücum geçişinde ilk 3–4 saniye çok değerlidir: hızlı ve dikey ilk pas.',
  },
  {
    id: 'q-zamanlama-kosu',
    theme: 'Topsuz',
    lv: 3,
    pos: ['santrfor', 'kanat'],
    q: 'Orta saha oyuncusu C topu aldı ama başını henüz kaldırmadı. Siz santrfor A olarak ofsayt çizgisinde bekliyorsunuz.',
    scene: S('half', 'C:a:62:34 A:a:81.5:30 D1:b:82:26 D2:b:82:38', [
      ['Durum: C topu aldı, başı aşağıda; A çizgide bekliyor.', null, 'C', { line: 82, txt: [{ x: 60, y: 42, s: 'bekle' }] }],
      ['C başını kaldırıp A’ya bakar: sinyal.', null, 'C', { line: 82, txt: [{ x: 60, y: 42, s: 'şimdi' }] }],
      ['A koşuya başlar; C pası zamanında verir.', { A: [92, 34] }, 'A', { line: 82, txt: [] }],
    ]),
    opts: [
      { t: 'Hemen koşmak', why: 'C henüz hazır değil; ofsayta düşme ya da boş koşu riski var.' },
      { t: 'C başını kaldırıp bakınca koşuya başlamak', ok: true, why: 'Sinyal geldiği an başlayan koşu ofsayta düşmeden savunmayı yakalar.' },
      { t: 'Geriye çekilmek', why: 'Derinlik tehdidi kalkar.' },
      { t: 'Hareket etmeden durmak', why: 'Pas gelirse bile geç kalırsınız.' },
    ],
    explain: 'Koşu zamanlaması pasörün hazır olduğu anla başlar: başın kalkması en güvenilir sinyaldir.',
  },
  {
    id: 'q-1v1-kaleci',
    theme: 'Hücum',
    lv: 2,
    pos: ['santrfor'],
    q: 'Kaleciyle karşı karşıyasınız. Kaleci G kale çizgisinde duruyor ve öne çıkmıyor.',
    scene: S('box', 'A:a:82:34 G:k:104:34', [
      ['Durum: kaleci çizgide; A hızla yaklaşıyor.', null, 'A'],
      ['A yaklaşıp uzak köşeye plase vurur.', { A: [90, 34] }, [105, 31], { shot: true }],
    ]),
    opts: [
      { t: 'Sert şutla kaleciyi geçmeye çalışmak', why: 'Kaleci çizgideyken sert şut çoğu zaman kolay kurtarılır.' },
      { t: 'Sakin kalıp topu uzak köşeye plase etmek', ok: true, why: 'Kaleci çizgideyken yere yakın plase en güvenli çözüm.' },
      { t: 'Kaleciyi çalımla geçmeye çalışmak', why: 'Gereksiz risk: top kaybı ya da faul.' },
      { t: 'Aşırtma vurmak', why: 'Kaleci çizgideyse lob zor; yüksek top üstten gidebilir.' },
    ],
    explain: 'Kaleci çizgideyken plase, kaleci çıkmışsa lob ya da yanından geçiş. Kaleciyi oku, sonra karar ver.',
  },
  {
    id: 'q-stoper-cikis',
    theme: 'Hücum',
    lv: 3,
    pos: ['stoper', 'bek'],
    q: 'Stoper C1 topla, rakip forvet F1 baskıya geliyor. Kaleci K yanında, bek FB açık ama F2 ona yakın değil.',
    scene: S('defend', 'K:k:3:34 C1:a:14:24 FB:a:26:6 F1:b:22:28 F2:b:22:42 C2:a:14:48', [
      ['Durum: C1 topla; F1 yaklaşıyor.', null, 'C1'],
      ['C1, F1 yetişmeden FB’ye güvenli pas verir.', { F1: [18, 26] }, 'FB'],
      ['FB topu alır; iki forvet atlatıldı.', { FB: [30, 8] }, 'FB'],
    ]),
    opts: [
      { t: 'Kaleciye geri pas vermek', why: 'Presi sürdürür; rakip tekrar baskı yapar.' },
      { t: 'Açık bek FB’ye güvenli pas vermek', ok: true, why: 'Baskıyı atlatıp yön veren pas.' },
      { t: 'Çalımla F1’i geçmeye çalışmak', why: 'Kendi bölgenizde çalım: top kaybı gol demek olabilir.' },
      { t: 'Hemen uzun top atmak', why: 'Hedef yok; top kaybı büyük ihtimal.' },
    ],
    explain: 'Kendi bölgenizde güvenli ve baskıyı atlatan pas tercih edin; risk alanı ileridir.',
  },
  {
    id: 'q-on-libero-kayip',
    theme: 'Geçiş',
    lv: 3,
    pos: ['on-libero', 'merkez-orta-saha'],
    q: 'Takım top kaybetti. Rakip B1 topla hızla ilerliyor; savunma hattı henüz yerleşmedi. Siz ön libero P olarak orta alandasınız.',
    scene: S('defend', 'P:a:36:34 B1:b:46:34 B2:b:50:20 B3:b:50:48 C1:a:20:26 C2:a:20:42', [
      ['Durum: rakip karşı atakta; savunma açık.', null, 'B1'],
      ['P hemen topa saldırmaz; mesafeyi korur ve B1’i yavaşlatır.', { P: [40, 34], B1: [43, 34], C1: [22, 28], C2: [22, 40] }, 'B1'],
    ]),
    opts: [
      { t: 'Kayarak müdahale etmek', why: 'Kaçırırsanız arkanızda hiç kimse yok.' },
      { t: 'Rakibi yavaşlatıp yönlendirmek; geri dönenlere zaman kazandırmak', ok: true, why: 'Hattın yerleşmesi için süre kazanırsınız.' },
      { t: 'Durup izlemek', why: 'Baskı yoksa rakip kolay ilerler.' },
      { t: 'Geriye koşup kaleye girmek', why: 'Topa baskı yapmadığınız için rakip rahatça seçenek bulur.' },
    ],
    explain: 'Savunma geçişinde ilk görev yavaşlatmak ve zaman kazanmaktır; müdahale ancak destek geldiğinde.',
  },
  {
    id: 'q-kanat-bindirme',
    theme: 'Hücum',
    lv: 3,
    pos: ['kanat', 'bek'],
    q: 'Kanat oyuncusu W topla. Rakip bek D iç tarafı kapatıyor. Arkanızdaki bek FB dışarıdan koşuya başladı.',
    scene: S('half', 'W:a:80:50 FB:a:70:58 D:b:84:46', [
      ['Durum: D iç tarafı kapatıyor; FB dışta koşuda.', null, 'W'],
      ['W topu FB’nin koşu yoluna verir; D’nin yanından geçtiler.', { FB: [90, 62] }, 'FB'],
    ]),
    opts: [
      { t: 'İçe kesip D’yi geçmeye çalışmak', why: 'D tam o yönü kapatıyor; zorlama top kaybına yol açar.' },
      { t: 'Topu FB’nin koşu yoluna vermek', ok: true, why: 'D iki oyuncuyu birden takip edemez; bindirme açıldı.' },
      { t: 'Geri pas vermek', why: 'Fırsat kaçar; ilerleme yok.' },
      { t: 'Hemen şut atmak', why: 'Açı çok kapalı.' },
    ],
    explain: 'Savunmacı içeriyi kapatıyorsa dışarı boş kalır: bindirme koşusunu kullanın.',
  },
  {
    id: 'q-santrfor-birakma',
    theme: 'Hücum',
    lv: 3,
    pos: ['santrfor', 'on-numara'],
    q: 'Santrfor A sırtı kaleye dönük topu alıyor. Arkasında D marke ediyor. Orta saha oyuncusu M yetişiyor.',
    scene: S('half', 'C:a:62:34 A:a:84:34 D:b:88:34 M:a:72:44', [
      ['Durum: A sırtı dönük; D hemen arkasında; M yetişiyor.', null, 'C'],
      ['C topu A’ya verir; A gövdesiyle korur.', null, 'A'],
      ['A tek dokunuşla M’ye bırakır ve koşuya çıkar.', { M: [78, 40], A: [92, 26] }, 'M'],
    ]),
    opts: [
      { t: 'Dönüp D’yi geçmeye çalışmak', why: 'D’nin sırtınızda olduğu pozisyonda dönmek kolay değil; top kaybı riski.' },
      { t: 'Tek dokunuşla yetişen M’ye bırakmak', ok: true, why: 'Savunmayı döndürür, oyunu ileri taşır.' },
      { t: 'Topu tutup beklemek', why: 'D baskıyı artırır; M’nin desteği boşa gider.' },
      { t: 'Geriye uzun pas vermek', why: 'Oyun geri gider.' },
    ],
    explain: 'Sırtı dönük topu korumak ve destek geldiğinde tek dokunuşla bırakmak santrforun bağlantı görevidir.',
  },
  {
    id: 'q-on-numara-hat',
    theme: 'Karar',
    lv: 4,
    pos: ['on-numara', 'merkez-orta-saha'],
    q: 'Hat arasında topu aldınız. Santrfor S ofsayt çizgisinden koşuya hazır. Önünüzde şut açısı yok, ama S’ye pas yolu açık.',
    scene: S('half', 'C:a:58:34 A:a:78:34 S:a:82:44 M1:b:72:28 M2:b:72:40 D1:b:86:30 D2:b:86:42', [
      ['Durum: A hat arasında topla; S koşuya hazır.', null, 'A', { line: 86 }],
      ['S koşuya başlar; A hat kıran pası gönderir.', { S: [92, 44] }, 'S', { line: 86 }],
    ]),
    opts: [
      { t: 'Hat kıran pasla S’yi koşuya sokmak', ok: true, why: 'Pas yolu açık ve zamanlama uygun; en değerli seçenek.' },
      { t: 'Geri pas vermek', why: 'Fırsat kaçar; ilerleme yok.' },
      { t: 'Çalımla iki savunmacıyı geçmeye çalışmak', why: 'Dar alanda iki rakibe karşı gereksiz risk.' },
      { t: 'Şut çekmek', why: 'Açı ve pozisyon yok.' },
    ],
    explain: 'İleri pas yolu açıksa ve riski makulse hat kıran pas, bir hamlede iki hattı aşmayı sağlar.',
  },
  {
    id: 'q-kaleci-orta',
    theme: 'Kaleci',
    lv: 3,
    pos: ['kaleci'],
    q: 'Kalabalık ceza sahasına yüksek orta geliyor. Topun inişi kale çizgisinden yaklaşık 8 m. Önünüzde iki rakip hücumcu var ve topu yakalamak riskli.',
    scene: S('gk', 'K:k:2:34 C:b:20:8 B:b:13:36 A:a:5:40', [
      ['Durum: yüksek orta geliyor; kalabalık.', null, 'C'],
      ['K çıkar ve topa ulaşır.', { K: [8, 32] }, [10, 32], { air: true }],
      ['K topu yumrukla yukarı ve kenara gönderir.', null, [24, 52], { air: true }],
    ]),
    opts: [
      { t: 'Çizgide beklemek', why: 'Orta kalabalıkta kolay gol olur; kaleci savunmasız kalır.' },
      { t: 'Çıkıp topu yumrukla kenara göndermek', ok: true, why: 'Kalabalıkta yakalamak riskli; yumruk güvenli seçim.' },
      { t: 'Çıkıp tek elle yakalamaya çalışmak', why: 'Temas ve kalabalıkta kontrol kaybı riski yüksek.' },
      { t: 'Geri geri çizgiye çekilmek', why: 'Çıkış kararı bölünür; ne çıkar ne de çizgide etkili olursunuz.' },
    ],
    explain: 'Çıkış kararı kesin olmalı: yakalama olasılığı düşükse yumrukla uzaklaştırın.',
  },
  {
    id: 'q-bek-geri-donus',
    theme: 'Savunma',
    lv: 3,
    pos: ['bek'],
    q: 'Bek A hücumda yüksekteydi. Top kaybedildi ve rakip X kenardan hızla geri hücuma çıkıyor.',
    scene: S('defend', 'A:a:48:58 C1:a:24:24 C2:a:24:42 X:b:50:50', [
      ['Durum: top kaybı; X kenardan ilerliyor.', null, 'X'],
      ['A hemen geri koşar ve X’i yavaşlatır.', { A: [34, 54], X: [40, 48] }, 'X'],
      ['C2 yardıma çıkar; hat tamamlanır.', { C2: [28, 46] }, 'X'],
    ]),
    opts: [
      { t: 'Yürüyerek yerine dönmek', why: 'X zaten hızla ilerliyor; geç kalırsınız.' },
      { t: 'Hızla geri koşup X’i yavaşlatmak ve hatta girmek', ok: true, why: 'Savunma geçişi: hızlı dönüş ve zaman kazanma.' },
      { t: 'Hücumda beklemek', why: 'Takım sayı eksikliğiyle savunur.' },
      { t: 'X’in önüne kayarak girmek', why: 'Önce yavaşlatın; erken kayma risklidir.' },
    ],
    explain: 'Top kaybında önce geri dönüş: yer kapat, rakibi yavaşlat, sonra topa gir.',
  },
  {
    id: 'q-kontra-3v2',
    theme: 'Hücum',
    lv: 3,
    pos: ['kanat', 'on-numara', 'santrfor'],
    q: 'Kontra atakta 3v2: topla C, yanlarda W1 ve W2. Rakip D1 ve D2 savunuyor.',
    scene: S('half', 'C:a:64:34 W1:a:62:12 W2:a:62:56 D1:b:82:28 D2:b:82:40', [
      ['Durum: 3v2; C topla ortada.', null, 'C'],
      ['C merkezde ilerlerken W1 ve W2 sprint atar; D1 ve D2 C’ye yönelir.', { C: [76, 34], W1: [84, 10], W2: [84, 58], D1: [81, 31], D2: [81, 37] }, 'C'],
      ['D’ler C’ye kilitlenince C boştaki W1’e pas verir.', null, 'W1'],
    ]),
    opts: [
      { t: 'Hemen uzaktan şut atmak', why: 'Sayısal üstünlüğü boşa harcarsınız.' },
      { t: 'Savunmacılar C’ye kilitlenince boştaki koşucuya pas vermek', ok: true, why: 'Savunmacılar tek seçeneğe baktığında boşta kalan oyuncu kazanır.' },
      { t: 'Topu yere basıp beklemek', why: 'Savunma toparlanır.' },
      { t: 'Topla ortada çalım denemek', why: '2 rakibe karşı gereksiz risk.' },
    ],
    explain: 'Kontra atakta pas zamanı: savunmacı topa yönelince boştaki arkadaşa vermek.',
  },
  {
    id: 'q-derin-blok',
    theme: 'Hücum',
    lv: 3,
    pos: ['merkez-orta-saha', 'bek'],
    q: 'Rakip derin ve sıkı bir blok kurdu; ara pas yolu yok. Siz topu elde tutuyorsunuz.',
    scene: S('half', 'A:a:66:34 B:a:68:12 C:a:68:56 D1:b:80:14 D2:b:80:28 D3:b:80:40 D4:b:80:54', [
      ['Durum: derin blok; ara pas yok.', null, 'A', { line: 80 }],
      ['A topu B’ye verir; blok topa kayar.', { D1: [80, 10], D2: [80, 22], D3: [80, 34], D4: [80, 46] }, 'B', { line: 80 }],
      ['B hızla C’ye çevirir; zayıf tarafta boşluk açıldı.', null, 'C', { line: 80 }],
    ]),
    opts: [
      { t: 'Hemen savunmaya doğru ara pas denemek', why: 'Yol yok; top kaybı olur.' },
      { t: 'Topu sabırla çevirip alan değiştirmek', ok: true, why: 'Blok topa kayarken zayıf tarafta boşluk açılır.' },
      { t: 'Uzaktan şut çekmek', why: 'Blok kapalıyken şut çoğu zaman engellenir.' },
      { t: 'Çalımla blok içine girmek', why: 'Kalabalıkta top kaybı riski çok yüksek.' },
    ],
    explain: 'Kapalı blokta sabır ve alan değiştirmek: topu hızlıca çevirerek zayıf tarafı bulun.',
  },
  {
    id: 'q-ofsayt-hat',
    theme: 'Savunma',
    lv: 4,
    pos: ['stoper', 'bek'],
    q: 'Rakip forvet F savunma hattınızın hemen arkasında. Rakip orta saha oyuncusu M pas hazırlıyor. Hat lideri sizsiniz (D2).',
    scene: S('defend', 'D1:a:24:24 D2:a:24:44 F:b:19:34 M:b:48:50', [
      ['Durum: F hattın gerisinde; M pas hazırlıyor.', null, 'M', { line: 24 }],
      ['M pas verirken hat birlikte yukarı çıkar; F ofsayta düşer.', { D1: [31, 24], D2: [31, 44] }, 'M', { line: 31 }],
    ]),
    opts: [
      { t: 'Geri çekilmek', why: 'F zaten arkanızda; kaleciye çıkarsınız.' },
      { t: 'Hatla birlikte pas anında yukarı çıkmak', ok: true, why: 'Ofsayt tuzağı: F’yi oyun dışı bırakır.' },
      { t: 'F’yi takip edip arkasından gitmek', why: 'Pas gelirse F tek başına kalır.' },
      { t: 'Yerinizde durmak', why: 'F ofsayttadır ama pas gelirse sorun yaratır; hatla hareket gerekir.' },
    ],
    explain: 'Hat birlikte hareket etmeli; pas anında yukarı çıkış ofsayt tuzağını kurar.',
  },
  {
    id: 'q-karsi-pres-yakin',
    theme: 'Pres',
    lv: 3,
    pos: ['merkez-orta-saha', 'kanat'],
    q: 'A topu kaybetti; rakip B1 topu aldı. Yakında A2 ve A3 var, rakip seçenekleri B2 ve B3 uzakta.',
    scene: S('half', 'A:a:70:34 A2:a:72:44 A3:a:68:24 B1:b:75:34 B2:b:82:20 B3:b:82:48', [
      ['Durum: top kaybı; B1 topla.', null, 'B1'],
      ['A hemen B1’e baskı yapar; A3 ve A2 pas yollarını kapatır.', { A: [73, 34], A3: [74, 28], A2: [77, 41] }, 'B1'],
      ['B1 sıkışır; A2 ikinci topu kazanır.', { A2: [74, 36] }, 'A2'],
    ]),
    opts: [
      { t: 'Hepsi geri çekilmek', why: 'Rakip düzenini kurar; karşı pres fırsatı kaçar.' },
      { t: 'En yakın oyuncu hemen baskı yapar; diğerleri pas yollarını kapatır', ok: true, why: 'Karşı presin temeli.' },
      { t: 'Hepsi topa koşar', why: 'Pas yolları açık kalır; rakip kolayca çıkar.' },
      { t: 'Kimse hareket etmez', why: 'Rakip topu taşıyarak ilerler.' },
    ],
    explain: 'Karşı pres: bir oyuncu topa, diğerleri pas yollarına.',
  },
  {
    id: 'q-pas-acisi',
    theme: 'Topsuz',
    lv: 2,
    pos: ['merkez-orta-saha', 'bek', 'on-libero'],
    q: 'Arkadaşınız C topla. Siz B olarak D’nin hemen arkasındasınız; pas yolu kapalı.',
    scene: S('mid', 'C:a:36:34 B:a:52:34 D:b:44:34', [
      ['Durum: D, C ile B arasında; pas yolu kapalı.', null, 'C', { z: [{ x: 38, y: 31, w: 12, h: 6, k: 'danger', l: 'kapalı' }] }],
      ['B yana açılarak pas çizgisini açar.', { B: [52, 46] }, 'C', { z: [] }],
      ['C pas verir; B hazırdır.', null, 'B'],
    ]),
    opts: [
      { t: 'Aynı yerde beklemek', why: 'Pas yolu kapalı kalır.' },
      { t: 'Yana açılarak pas çizgisi yaratmak', ok: true, why: 'Küçük hareketle pas yolu açılır.' },
      { t: 'Yaklaşmak', why: 'Savunmacıya daha da yaklaşır; yol kapalı kalır.' },
      { t: 'Topa koşup rakibe çarpmak', why: 'Gereksiz; açı yaratmak yeterlidir.' },
    ],
    explain: 'Pas açısı yaratmak: markörün arkasından çıkın, topu taşıyanın görüşüne girin.',
  },
  {
    id: 'q-risk-bolge',
    theme: 'Karar',
    lv: 2,
    pos: ['stoper', 'bek', 'kaleci'],
    q: 'Kendi ceza sahası içinde topla stopersiniz; iki rakip forvet baskıda. Yakın seçenekleriniz kapalı.',
    scene: S('defend', 'K:k:3:34 C:a:12:34 F1:b:18:28 F2:b:18:40', [
      ['Durum: C kendi ceza sahasında; yakın pas yolları kapalı.', null, 'C'],
      ['C topu kenara, tehlike bölgesinden uzağa uzaklaştırır.', null, [40, 62], { air: true }],
    ]),
    opts: [
      { t: 'Çalımla iki forveti geçmeye çalışmak', why: 'Kendi bölgenizde risk çok yüksek.' },
      { t: 'Topu güvenle kenara ve uzağa kurtarmak', ok: true, why: 'Kendi bölgenizde güvenlik önceliklidir.' },
      { t: 'Kısa pasla hemen dar alanda oynamak', why: 'Baskı varken kısa pas riskli.' },
      { t: 'Kaleciye geri pas vermek', why: 'Baskı devam eder ve zor bir pozisyon doğar.' },
    ],
    explain: 'Bölgeye göre risk: kendi alanınızda güvenlik, rakip alanda cesaret.',
  },
  {
    id: 'q-kontrol-baski',
    theme: 'Karar',
    lv: 3,
    pos: ['santrfor', 'on-numara'],
    q: 'Havadan gelen topu alacaksınız; arkanızda D baskıya hazır.',
    scene: S('half', 'C:a:56:34 A:a:76:34 D:b:80:34', [
      ['Durum: top havadan geliyor; D arkanızda.', null, 'C', { z: [] }],
      ['C topu havadan gönderir; A topa doğru hareket eder.', null, 'A', { air: true }],
      ['A göğsüyle topu D’den uzağa yumuşatıp yönlendirir.', { A: [74, 26] }, 'A'],
    ]),
    opts: [
      { t: 'Sert ilk temasla topu uzağa atmak', why: 'Kontrol kaybolur; rakip topu alır.' },
      { t: 'Topa doğru gidip göğüsle yumuşatıp D’den uzağa yönlendirmek', ok: true, why: 'İlk temas hem kontrol hem yön vermek zorunda.' },
      { t: 'Topun yere inmesini beklemek', why: 'D araya girer.' },
      { t: 'Gözleri kapatıp kafa vurmak', why: 'Kontrolsüz ve riskli.' },
    ],
    explain: 'Baskı altında ilk temas baskının tersi yöne olmalı; topa doğru hareket edin.',
  },
  {
    id: 'q-kanat-geri-cekme',
    theme: 'Hücum',
    lv: 2,
    pos: ['kanat'],
    q: 'Kanat oyuncusu A kale çizgisine yakın ve açı çok dar. Penaltı noktasında B koşuyor, kaleci G kısa direği kapatıyor.',
    scene: S('box', 'A:a:99:14 B:a:90:40 D:b:96:22 G:k:102:30', [
      ['Durum: A dar açıda; B penaltı noktası bölgesine koşuyor.', null, 'A'],
      ['A topu geri çeker; B yetişir.', { B: [93, 38] }, 'B'],
      ['B ilk vuruşla bitirir.', null, [105, 35], { shot: true }],
    ]),
    opts: [
      { t: 'Dar açıdan sert şut çekmek', why: 'Kısa direği kaleci kapatıyor; olasılık düşük.' },
      { t: 'Geri çekmeyle B’yi bulmak', ok: true, why: 'Savunma kale yönüne dönükken en tehlikeli seçenek.' },
      { t: 'Çalım yapıp açıyı kapatmak', why: 'Dar açıda fazladan çalım gereksiz.' },
      { t: 'Topu dışarı atmak', why: 'Fırsat kaçar.' },
    ],
    explain: 'Açı kapalıysa şut yerine geri çekme: savunmacılar kale yönündeyken bitirici avantajlıdır.',
  },
  {
    id: 'q-bosluga-giris',
    theme: 'Topsuz',
    lv: 3,
    pos: ['merkez-orta-saha', 'on-numara'],
    q: 'Santrfor A savunmacı D’yi kanada çekti. Siz M olarak ikinci hattasınız.',
    scene: S('half', 'C:a:62:34 A:a:80:34 M:a:70:44 D:b:84:34', [
      ['Durum: A kanada açılıyor; D onu izliyor.', null, 'C'],
      ['D, A’yı takip ederken merkezde boşluk açıldı; M boşluğa girer.', { A: [78, 14], D: [83, 20], M: [84, 36] }, 'C', { z: [{ x: 80, y: 30, w: 10, h: 12, k: 'free', l: 'boşluk' }] }],
      ['C pas verir; M boşlukta topla.', null, 'M', { z: [] }],
    ]),
    opts: [
      { t: 'Aynı yerde durmak', why: 'Boşluk açıldı; kullanmazsanız fırsat kaçar.' },
      { t: 'Boşalan alana koşmak', ok: true, why: 'Arkadaşınızın yarattığı boşluğu kullanmak topsuz hareketin amacıdır.' },
      { t: 'A’nın yanına gitmek', why: 'İkisi aynı bölgede kalır; boşluk kapanır.' },
      { t: 'Geri çekilmek', why: 'Fırsatı kaçırırsınız.' },
    ],
    explain: 'Biri boşluk açar, diğeri kullanır: topsuz hareket takım içinde birlikte çalışır.',
  },
  {
    id: 'q-genislik',
    theme: 'Hücum',
    lv: 2,
    pos: ['kanat', 'bek'],
    q: 'Top sol tarafta; rakip savunma dar ve sıkışık durmuş. Siz sağ kanat oyuncususunuz (W2).',
    scene: S('half', 'C:a:62:20 W2:a:76:44 W1:a:76:12 D1:b:84:22 D2:b:84:34 D3:b:84:46', [
      ['Durum: top solda; savunma dar.', null, 'C'],
      ['W2 kenar çizgisine yakın geniş kalır; D3 onu izlemek için genişler.', { W2: [80, 62], D3: [84, 52] }, 'C', { z: [{ x: 80, y: 34, w: 10, h: 14, k: 'free', l: 'boşluk' }] }],
    ]),
    opts: [
      { t: 'İçeri girip kalabalığa katılmak', why: 'Alan daha da daralır; boşluk yaratılmaz.' },
      { t: 'Geniş kalıp kenar çizgisinde pas seçeneği olmak', ok: true, why: 'Savunma genişlemek zorunda kalır; merkezde boşluk açılır.' },
      { t: 'Geri çekilmek', why: 'Hücum desteği kaybolur.' },
      { t: 'Hareketsiz durmak', why: 'Savunmaya yük bindirmez.' },
    ],
    explain: 'Genişlik savunmayı gerer: kenarda kalan oyuncu merkezde alan açar.',
  },
  {
    id: 'q-kornerde-kisa',
    theme: 'Duran top',
    lv: 3,
    pos: ['stoper', 'bek', 'merkez-orta-saha'],
    q: 'Rakip kısa korner oynuyor: kornerci T topu yakındaki S’ye verdi. Siz ceza sahası köşesindeki A savunmacısınız.',
    scene: S('defend', 'A:a:12:12 D1:a:6:30 D2:a:6:40 T:b:0.5:0.5 S:b:8:8', [
      ['Durum: S topu aldı; A yakın.', null, 'S'],
      ['A hemen S’ye baskı yapar; D’ler yerlerinde kalır.', { A: [9, 10] }, 'S'],
    ]),
    opts: [
      { t: 'Yerinizden kıpırdamamak', why: 'S rahatça orta yapar ya da pas oynar.' },
      { t: 'Yakındaki oyuncuya hemen baskı yapmak', ok: true, why: 'Kısa kornerde hızlı baskı ortayı ve kombinasyonu engeller.' },
      { t: 'Ceza sahasının dışına çıkmak', why: 'Savunma boşluğu doğar.' },
      { t: 'Geriye gidip kaleci yanına durmak', why: 'Ortaya fırsat bırakırsınız.' },
    ],
    explain: 'Kısa kornerde en yakın savunmacı baskı yapar; diğerleri bölgelerini korur.',
  },
  {
    id: 'q-2v1-savunma',
    theme: 'Savunma',
    lv: 3,
    pos: ['stoper', 'bek'],
    q: 'Siz tek savunmacısınız (A); rakipler B1 (topla) ve B2 yanında koşuyor. Yardım henüz yetişmedi.',
    scene: S('defend', 'A:a:26:34 B1:b:44:30 B2:b:44:44 C:a:12:50', [
      ['Durum: 2v1; yardım uzak.', null, 'B1'],
      ['A geri çekilip zaman kazanır ve pas yolunu kapatmaya çalışır.', { A: [28, 36], B1: [38, 32], B2: [38, 44], C: [18, 44] }, 'B1'],
    ]),
    opts: [
      { t: 'Topu taşıyana atılmak', why: 'B1 pası verir ve B2 kolay golü bulur.' },
      { t: 'Yavaşlatıp zaman kazanmak ve pas yolunu kapatmak', ok: true, why: 'Yardım yetişene kadar zaman kazanın.' },
      { t: 'Kayarak müdahale etmek', why: 'Kaçırırsanız arkanız tamamen boş.' },
      { t: 'Geri koşup kaleye girmek', why: 'Topa baskı yok; çok seçenek veriyorsunuz.' },
    ],
    explain: 'Sayısal dezavantajda amaç topu kazanmak değil, zaman kazanmak ve yardım beklemektir.',
  },
  {
    id: 'q-top-kapma',
    theme: 'Savunma',
    lv: 2,
    pos: ['stoper', 'merkez-orta-saha', 'bek'],
    q: 'Rakip X topu ayağından biraz açıp fazla öne itti. Siz A olarak yakındasınız.',
    scene: S('mid', 'A:a:44:34 X:b:56:34', [
      ['Durum: X topu fazla öne itti.', null, [50, 34]],
      ['A hızla topa atılır ve iç yüzüyle müdahale eder.', { A: [49, 34] }, 'A'],
    ]),
    opts: [
      { t: 'Beklemek', why: 'Fırsat kaçar; X topu kontrol eder.' },
      { t: 'Hemen topa atılıp ayağa değil topa müdahale etmek', ok: true, why: 'Doğru an: top ayaktan açıldı.' },
      { t: 'Geri çekilmek', why: 'Pres fırsatını kaçırırsınız.' },
      { t: 'X’in bacağına müdahale etmek', why: 'Faul: topa oynayın, rakibe değil.' },
    ],
    explain: 'Top ayaktan açıldığı an müdahale zamanıdır; her zaman topa oynayın.',
  },
  {
    id: 'q-penalti',
    theme: 'Duran top',
    lv: 2,
    pos: ['santrfor', 'on-numara', 'merkez-orta-saha'],
    q: 'Penaltı atacaksınız. Kaleci G hazır; hakem düdüğü bekleniyor.',
    scene: S('box', 'A:a:89:34 G:k:104:34', [
      ['Durum: penaltı noktası; kaleci hazır.', null, [94, 34]],
      ['A, vuruştan önce seçtiği köşeye yere yakın vurur.', { A: [93, 34] }, [105, 31.5], { shot: true }],
    ]),
    opts: [
      { t: 'Kaleci hareket edene kadar beklemek', why: 'Kalecinin tepkisine göre karar vermek hataya açık; kural ihlali de olabilir.' },
      { t: 'Köşeyi vuruştan önce seçip rutinle yere yakın vurmak', ok: true, why: 'Karar vuruştan önce verilir; tutarlılık sağlar.' },
      { t: 'Çok sert vurup köşeyi umursamamak', why: 'Güç isabetin yerini tutmaz.' },
      { t: 'Son anda yön değiştirmek', why: 'Kararsızlık vuruş kalitesini düşürür.' },
    ],
    explain: 'Penaltıda rutin ve karar vuruştan önce: kalecinin hareketine değil kendi seçiminize güvenin.',
  },
];

export const QUIZ_BY_ID: Record<string, QuizQuestion> = Object.fromEntries(QUIZ.map((q) => [q.id, q]));
export const QUIZ_THEMES: QuizTheme[] = ['Karar', 'Pres', 'Geçiş', 'Savunma', 'Topsuz', 'Hücum', 'Duran top', 'Kaleci'];
