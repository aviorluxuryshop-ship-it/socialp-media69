import type { PlayerDeep } from '../player-types';
import { cv, wiki } from './_src';

/** Derinleştirilmiş bölümler: savunmacılar, bekler ve kaleci */
export const DEEP_DEF: Record<string, PlayerDeep> = {
  'virgil-van-dijk': {
    kind: 'defans',
    positioning: [
      'Çoğunlukla sol stoper olarak oynar, sağ stoperde de görev yapabilir.',
      'Konum duygusu çok iyidir; savunma hattını yönetir, arkadaşlarını yerleştirir.',
    ],
    passing: [
      'Topla ölçülü ve sakindir; ayağında topu rahat tutar ve temiz paslar verir.',
      'Uzun, diyagonal paslarla savunmadan hücuma geçişi hızlandırır.',
    ],
    control: [
      'Baskı altında topu rahatça korur; sağ ayağıyla temiz bir dokunuşu vardır.',
      'Duran toplarda da etkilidir: serbest vuruş ve hava topu.',
    ],
    decisions: [
      'Birebirde acele etmez; müdahale etmek ya da beklemek için doğru anı seçer.',
      'Rakibi iyi ayağından uzaklaştırır; geri çekilerek zaman kazanır, sonra dengesini koruyarak müdahale eder.',
    ],
    strengths: ['Hava topu ve fizik gücü.', 'Hız ve geniş adım; birebirde çeviklik.', 'Sakinlik, liderlik ve oyun kurma.'],
    limits: [
      'Bir gözlemci, maç rahatken dikkatinin düşebildiğini söylemiştir; sürekli konsantrasyon bu rolün en zor yanıdır.',
      'Taklit ederken dikkat: sakinlik, kondisyon ve zamanlama ister; önce temel savunma duruşunu ve yan yan geri kaymayı çalış.',
    ],
    similar: ['paolo-maldini', 'philipp-lahm', 'manuel-neuer'],
    sources: [wiki('Virgil van Dijk', 'Virgil_van_Dijk', 'Oyuncu özelliği: oyun kurabilen stoper, hava topu, birebirde zamanlama, duran top, liderlik.', 'oyuncu profili bölümü')],
    videos: ['cZWRifUZLmc', 'tLHYYrACx3s', 'aadebgx5nz4', 'Dqlar8R3j8M', 'seiqevv2JuU'],
    videoLooks: {
      savunma: 'Van Dijk birebirde acele etmez: bacak ve gövde duruşuna, müdahaleye girmeden önce ne kadar beklediğine bak. Videodaki birebir savunma ilkelerini onunla eşleştir.',
      kafa: 'Van Dijk hava toplarında zıplamayı rakibin hareketine göre zamanlar. Videodaki savunma kafasını bu zamanlamayla karşılaştır.',
      pas: 'Van Dijk’in uzun diyagonal pasında ayak yüzeyine ve topun yüksekliğine bak; videodaki uzun pas tekniğiyle eşleştir.',
    },
  },

  'philipp-lahm': {
    kind: 'defans',
    positioning: [
      'İki kanatta da bek oynayabilir; hücumda içeri keser ve orta sahaya girer.',
      'Guardiola döneminde bazen merkezde ya da defansif orta sahada pivot olarak da oynamıştır; oyunu yönetip atakları başlatabilirdi.',
    ],
    passing: [
      'Basit ve doğru paslar verir; orta sahadan oyun kurarken atakları başlatır.',
      'Hücumda hızlı bindirmeden çok, orta sahada oyuna katılmayı tercih eder.',
    ],
    control: [
      'Hız, teknik ve dayanıklılıkla tanınır; sağ ayaklı olmasına rağmen iki kanatta da rahat oynar.',
      'Topu içeri keserek şut ya da pas seçeneğine getirir.',
    ],
    decisions: [
      'Konum ve taktik zekâsıyla fark yaratır; teknik direktör Guardiola onu çalıştırdığı en zeki oyunculardan biri olarak anmıştır.',
      'Müdahaleyi son çare olarak görür: önce konumuyla alanı kapatır.',
    ],
    strengths: ['Taktik zekâ ve konum.', 'Çok yönlülük: iki kanat, pivot.', 'Müdahalede isabet ve tutarlılık.'],
    limits: [
      'Küçük yapılıdır; bu yüzden fiziksel avantaj yerine konum, zamanlama ve müdahale kalitesiyle oynar.',
      'Taklit ederken dikkat: içeri kayarken arkada kalan alanı kapatmak için takım arkadaşlarıyla düzen şarttır.',
    ],
    similar: ['trent-alexander-arnold', 'paolo-maldini', 'sergio-busquets'],
    sources: [wiki('Philipp Lahm', 'Philipp_Lahm', 'Oyun tarzı: iki kanatta bek, içeri kayma, pivot rolü, taktik zekâ ve müdahale.')],
    videos: ['hgrStIbFls0', 'tLHYYrACx3s', 'FmVQniDnqCg', 'PagCekTH7XI'],
    videoLooks: {
      savunma: 'Lahm’da rakip kanat geldiğinde ayakların ve gövdenin duruşuna, müdahaleyi ne zaman seçtiğine bak; videodaki savunma ilkeleriyle karşılaştır.',
      taktik: 'Videodaki oyun kurma fikrini Lahm’ın içeri kaymasıyla ilişkilendir: takım topa sahipken nerede duruyor?',
      hucum: 'Lahm bindirme yerine içeri kayarak oyuna katılır; videodaki orta türlerini onun hücum katkılarıyla karşılaştır.',
    },
  },

  'manuel-neuer': {
    kind: 'kaleci',
    positioning: [
      'Savunma hattının arkasındaki boşluğu korumak için ceza alanının dışına çıkar; hat arkasına atılan toplara öne çıkarak müdahale eder.',
      'Çıkıp çıkmayacağına yakınındaki oyunculara ve yolun açık olup olmadığına bakarak karar verir; topa ulaşamayacaksa kalede kalır.',
    ],
    passing: [
      'Ayakla ve elle dağıtır: iki ayakla kısa ve uzun pas, ayrıca uzun atış.',
      'Takım topa sahip olduğunda oyun kurmaya çok katılır; topu boşuna uzaklaştırmak yerine oyuna sokar.',
    ],
    control: [
      'Ayağıyla topu iyi kontrol eder; gençken sahada oynayan oyuncularla çalışarak zayıf ayağını geliştirmiştir.',
      'Baskı altında sakin kalır ve dağıtımı bozmaz.',
    ],
    decisions: [
      'Yüksek bir savunma hattının arkasındaki alanı kapatır; kendisi bu yaklaşımı “biraz riskli” bulur, ama takım arkadaşlarına güven verdiğini söyler.',
      'Yüksek ortalarda rakibin ulaşamayacağı toplara çıkar; yakında forvet olan alçak toplarda kalede kalır.',
    ],
    strengths: ['Çıkış ve alan kapama; hat arkasına süpürücü gibi müdahale.', 'Ayakla oyun kurma ve dağıtım.', 'Refleks, atılma ve birebir.'],
    limits: [
      'Kaleden uzakta bir koşunun zamanlaması bozulursa gol yer; bu yaklaşımın riski budur.',
      'Taklit ederken dikkat: libero kalecilik ileri bir aşamadır. Önce temel duruş, atlama ve ellerle tutuşu, sonra ayakla oyun kurmayı çalış.',
    ],
    similar: ['virgil-van-dijk', 'philipp-lahm'],
    sources: [
      wiki('Manuel Neuer', 'Manuel_Neuer', 'Oyun tarzı: modern/libero kaleci, ayakla dağıtım, çıkış ve alan kapama, ellerle ve ayakla dağıtım.'),
      cv(
        'Sports Illustrated — The methods behind Manuel Neuer’s sweeper-keeper madness (Grant Wahl, 7 Haziran 2016)',
        'https://www.si.com/soccer/2016/06/07/manuel-neuer-germany-bayern-munich-sweeper-keeper',
        'Ceza alanı dışında konum, çıkıp çıkmamaya karar verme, ayakla dağıtım, gençlikte zayıf ayak çalışması, “biraz riskli” yaklaşım.',
      ),
    ],
    videos: ['_mgdr3QLOcA', 'Hy10XUls8xs', 'FmVQniDnqCg', 'k1i6kWXi2Ls', 'MRKgjlRiLok'],
    videoLooks: {
      kalecilik: 'Neuer’de rakip hücumdayken kalecinin konumuna ve kaleden uzaklaştığında geri dönüş hızına bak. Videodaki duruş ve birebirde çıkış anlatımlarıyla eşleştir.',
      taktik: 'Neuer takım topa sahipken oyun kurmaya katılır. Videodaki geriden oyun kurma anlatımında kalecinin rolünü onunla karşılaştır.',
    },
  },

  'trent-alexander-arnold': {
    kind: 'defans',
    positioning: [
      'Sağ bek olarak başlar; hücumda içeri kayıp orta sahada oyuna katılabilir ve takım topa sahipken orta saha oyuncusu gibi kullanılabilir.',
      'Bekin yaratıcılık sorumluluğu taşıdığı bir takım sisteminde yetişmiş, bindirme koşuları, oyun çevirme ve ortalarla bunu yerine getirmiştir.',
    ],
    passing: [
      'Pas menzili, ortalar ve asistleriyle tanınır; gençlik akademisinde orta saha olarak gelişmiştir.',
      'Orta alanda topla buluşup bir kanattan diğerine uzun pasla oyunu açar; ortalarını hızlı ve kavisli gönderir.',
    ],
    control: [
      'Duran toplarda sabit bir hazırlık rutini vardır: aynı adımlar, aynı yaklaşma.',
      'Duran topta çevresine dikkat eder; rakipler hazır olmadan hızlı oynayıp avantaj sağladığı örnekler anlatılır.',
    ],
    decisions: [
      'Hücumda ne zaman içeri kayacağını seçer; kayınca arkasında kalan alanı kimin koruyacağı takım kararıdır.',
      'Hızlı kullanılan bir korner gibi küçük, akıllıca seçimlerle takıma avantaj sağlayabilir.',
    ],
    strengths: ['Pas menzili ve uzun diyagonal paslar.', 'Orta ve duran top kalitesi.', 'Bindirme koşuları ve takıma yaratıcılık katma.'],
    limits: [
      'Savunma yönü bazı yorumcular ve taraftarlar tarafından eleştirilmiştir.',
      'Bek içeri kaydığında kenar alan boş kalabilir; bu rol, takım arkadaşlarının kademesi ve geri dönüşüyle birlikte çalışır.',
    ],
    similar: ['philipp-lahm', 'kevin-de-bruyne', 'toni-kroos'],
    sources: [wiki('Trent Alexander-Arnold', 'Trent_Alexander-Arnold', 'Oyun tarzı: pas menzili, ortalar, duran toplar, bekin içeri kayması, savunma yönü eleştirisi.', 'oyuncu profili bölümü')],
    videos: ['nvajn6BYJog', 'PagCekTH7XI', 'seiqevv2JuU', 'efdxdNxqBQI', 'FmVQniDnqCg'],
    videoLooks: {
      hucum: 'Alexander-Arnold’da ortanın hızına ve kavisine bak; videodaki orta türlerinden hangisine benziyor?',
      pas: 'Uzun diyagonal pasta ayak yüzeyi ve topun yüksekliği önemlidir. Videodaki uzun pas tekniğini onun paslarında ara.',
      duran: 'Alexander-Arnold duran toplarda hazırlık rutinini ve hızlı kullanma kararını birlikte gösterir. Videodaki kornerde topun ne zaman ve nereye gittiğine bak.',
      taktik: 'Videodaki geriden oyun kurma fikrini Alexander-Arnold’un içeri kaymasıyla ilişkilendir: takım topa sahipken nerede duruyor?',
    },
  },

  'paolo-maldini': {
    kind: 'defans',
    positioning: [
      'Kariyerine sağ bek olarak başladı, sonra sol bekte oynadı; son yıllarında hızı azaldıkça stoper olarak devam etti.',
      'Tehlikeyi önceden tahmin eder ve konumunu ona göre ayarlar; rakibin hücum oyununu konum ve markajla kısıtlar.',
    ],
    passing: [
      'Pasları temiz ve isabetlidir; bu yüzden gerektiğinde libero (süpürücü) rolünde de oynayabilirdi.',
      'Hücuma çıkıp gol ve asist de üretebilen bir bekti.',
    ],
    control: [
      'Okuduğumuz kaynak ilk dokunuşuna dair ayrıntı vermiyor; bu yüzden yorum eklemiyoruz. Pasları temiz olarak anılır.',
      'Savunmacının top kontrolü, kendi kalesine yakın baskı altında temiz oynamak demektir; bu da basit paslarla çözülür.',
    ],
    decisions: [
      'Her mücadeleye girmez: gereksiz bulduğu müdahaleden kaçınır, konumla rakibi sınırlar.',
      'Müdahale gerektiğinde kayarak müdahale, hava topu ve hızını kullanır.',
    ],
    strengths: ['Taktik zekâ ve tehlikeyi önceden okuma.', 'Hava topu, kayarak müdahale, hız ve dayanıklılık.', 'Hem bek hem stoper olarak oynayabilme.'],
    limits: [
      'Yaşla hızı azalınca bekten stopere kaydı; tecrübeye, hava topuna ve müdahale zamanlamasına dayanmaya başladı.',
      'Taklit ederken dikkat: bek ve stoper rolleri farklıdır; konumla savunma, çok tekrar ve deneyim ister.',
    ],
    similar: ['virgil-van-dijk', 'philipp-lahm', 'ngolo-kante'],
    sources: [wiki('Paolo Maldini', 'Paolo_Maldini', 'Oyun tarzı: bek ve stoper rolleri, tahmin, konum ve markajla savunma, kayarak müdahale, temiz paslar.', 'oyun tarzı bölümü')],
    videos: ['cZWRifUZLmc', 'aadebgx5nz4', 'mQbkDn20fOg', 'eqY-BdErllw', 'LtyS7DZ14N4', 'Dqlar8R3j8M'],
    videoLooks: {
      savunma: 'Maldini her müdahaleye girmez; konumla alanı kapatır. Videodaki savunma duruşu ve kayarak müdahale anlatımını, müdahale etmeme tercihiyle birlikte izle.',
      kafa: 'Maldini hava toplarında da güçlüdür. Videodaki savunma kafasında zıplama zamanını ve alın yüzeyini düşün.',
    },
  },
};
