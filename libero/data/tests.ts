export interface FieldTest {
  id: string;
  name: string;
  group: 'Sürat ve çeviklik' | 'Güç ve kuvvet' | 'Dayanıklılık' | 'Teknik';
  unit: string;
  /** 'low' = daha düşük değer daha iyi (süre), 'high' = daha yüksek daha iyi */
  better: 'low' | 'high';
  decimals: number;
  min: number;
  max: number;
  /** ölçüm düzeni */
  how: string[];
  /** gerekli ekipman */
  gear: string;
  /** güvenlik / geçerlilik notu */
  note: string;
}

// Yaş-seviye "norm" tabloları bilinçli olarak YOK: güvenilir ve yaşa özgü
// referans değerleri bu sürümde doğrulanmadığı için kişiyi yalnızca kendi
// önceki sonuçlarıyla karşılaştırıyoruz.
export const FIELD_TESTS: FieldTest[] = [
  {
    id: 'sprint10',
    name: '10 m sürat',
    group: 'Sürat ve çeviklik',
    unit: 'sn',
    better: 'low',
    decimals: 2,
    min: 1,
    max: 5,
    how: ['Düz, kaymayan bir zeminde 10 m ölç; başlangıç ve bitişi koniyle işaretle.', 'Çıkışı kendin belirle; bir arkadaş bitiş çizgisinde kronometre tutsun (ya da telefondan kare kare video çek).', 'Üç deneme yap, aralarında 2–3 dk dinlen. En iyi süreyi yaz.'],
    gear: 'Şerit metre ya da adım ölçümü, 2 koni, kronometre',
    note: 'Kronometre insan reaksiyonu nedeniyle ±0,2 sn hata verebilir; her seferinde aynı kişi ölçsün.',
  },
  {
    id: 'sprint30',
    name: '30 m sürat',
    group: 'Sürat ve çeviklik',
    unit: 'sn',
    better: 'low',
    decimals: 2,
    min: 3,
    max: 12,
    how: ['Düz bir pistte ya da sahada 30 m ölç ve işaretle.', 'Isındıktan sonra iki deneme yap, her denemede tam dinlen (3 dk).', 'En iyi süreyi yaz.'],
    gear: 'Şerit metre, 2 koni, kronometre',
    note: 'İyi ısınmadan maksimum koşu yapma; sakatlanma riskini azaltmak için ısınma bölümünü uygula.',
  },
  {
    id: 'agility505',
    name: '5-10-5 çeviklik',
    group: 'Sürat ve çeviklik',
    unit: 'sn',
    better: 'low',
    decimals: 2,
    min: 3,
    max: 10,
    how: ['Üç çizgi çiz: ortadaki çizginin 5 m sağına ve 5 m soluna.', 'Ortada başla, sağa koş, çizgiye dokun; sola 10 m koş, çizgiye dokun; ortaya dön.', 'İki kez dene; en iyisini yaz. İlk yönü her seferinde aynı al.'],
    gear: 'Koni ya da tebeşir, kronometre',
    note: 'Kaygan zeminde yapma. Dönüşlerde dizin içe çökmesin; ayakkabın zemine uygun olsun.',
  },
  {
    id: 'slalom',
    name: 'Koni slalomu (topla)',
    group: 'Teknik',
    unit: 'sn',
    better: 'low',
    decimals: 2,
    min: 3,
    max: 40,
    how: ['6 koniyi 2 m arayla düz sıraya diz.', 'Topla çıkıp slalom yap, sonuncuda dön ve geri gel.', 'Konilere dokunursan 1 sn ekle. Üç deneme yap, en iyisini yaz.'],
    gear: '6 koni, top, kronometre',
    note: 'Kendi yaş ve seviyene göre koni aralığını değiştirebilirsin; her seferinde aynı aralığı kullan.',
  },
  {
    id: 'cmj',
    name: 'Dikey sıçrama',
    group: 'Güç ve kuvvet',
    unit: 'cm',
    better: 'high',
    decimals: 0,
    min: 5,
    max: 100,
    how: ['Duvara yan dur, parmak ucunla en yükseğe uzanıp işaretle (tebeşirli parmak).', 'Hızla çömelip hemen sıçra ve duvara en yüksek noktaya dokun.', 'İki işaret arasındaki farkı ölç. Üç deneme yap, en iyisini yaz.'],
    gear: 'Duvar, tebeşir ya da yapışkan not kâğıdı, cetvel',
    note: 'Yumuşak iniş yap (dizlerini bük). Yorgunken yapma.',
  },
  {
    id: 'plank',
    name: 'Plank süresi',
    group: 'Güç ve kuvvet',
    unit: 'sn',
    better: 'high',
    decimals: 0,
    min: 5,
    max: 900,
    how: ['Dirsekler omuz altında, vücut baştan topuğa düz çizgi.', 'Kalçan düştüğü ya da yükseldiği anda dur ve süreyi yaz.', 'Haftada bir kez ölç.'],
    gear: 'Kronometre, minder',
    note: 'Bel ağrısı hissedersen hemen bırak. Maksimum süre yarışına çevirme; formu bozma.',
  },
  {
    id: 'cooper',
    name: '12 dk koşu (Cooper)',
    group: 'Dayanıklılık',
    unit: 'm',
    better: 'high',
    decimals: 0,
    min: 500,
    max: 4500,
    how: ['400 m’lik pistte ya da işaretli bir turda 12 dk boyunca olabildiğince uzağa koş.', 'Bitince kat ettiğin mesafeyi metre cinsinden yaz.', 'Her 6–8 haftada bir tekrar et.'],
    gear: 'Pist ya da ölçülü rota, kronometre',
    note: 'Sağlık sorunu olanlar ve kalp/akciğer rahatsızlığı olanlar hekime danışmadan yapmasın. Sıcak havada dikkatli ol.',
  },
  {
    id: 'juggle',
    name: 'Top sektirme (üst üste)',
    group: 'Teknik',
    unit: 'dokunuş',
    better: 'high',
    decimals: 0,
    min: 0,
    max: 5000,
    how: ['Topu yere düşürmeden ayak, uyluk ve göğüsle sektir; kaç dokunuş yaptığını say.', 'Üç deneme yap, en yüksek sayıyı yaz.', 'Zayıf ayak için ayrı bir test kaydı aç.'],
    gear: 'Top',
    note: 'Kafa vuruşu sayma: 12 yaş altında yapılmaz (FA 2020 yönergesi).',
  },
  {
    id: 'juggle-weak',
    name: 'Zayıf ayakla sektirme',
    group: 'Teknik',
    unit: 'dokunuş',
    better: 'high',
    decimals: 0,
    min: 0,
    max: 1000,
    how: ['Yalnızca zayıf ayağınla, topu yere düşürmeden sektir.', 'Üç deneme yap, en yüksek sayıyı yaz.'],
    gear: 'Top',
    note: 'Zayıf ayak gelişimi düzenli, kısa çalışmalarla ilerler; her gün 5 dk yeterli olabilir.',
  },
  {
    id: 'pass-acc',
    name: 'Pas isabeti',
    group: 'Teknik',
    unit: '/ 10',
    better: 'high',
    decimals: 0,
    min: 0,
    max: 10,
    how: ['10 m uzaklıkta 1 m genişliğinde bir kapı (iki koni) kur.', 'Yerden iç yüz pasla 10 pas ver; kapıdan geçen pas sayısını yaz.', 'Her iki ayak için ayrı ayrı ya da ortalama olarak kaydedebilirsin.'],
    gear: 'Top, 2 koni',
    note: 'Her seferinde aynı mesafe ve kapı genişliğini kullan; ancak o zaman sonuçlar karşılaştırılabilir.',
  },
  {
    id: 'shot-acc',
    name: 'Şut isabeti',
    group: 'Teknik',
    unit: '/ 10',
    better: 'high',
    decimals: 0,
    min: 0,
    max: 10,
    how: ['Kalenin iki köşesine birer hedef (koni ya da kasa) koy; 11 m’den ya da yaşına uygun mesafeden şut çek.', '10 şuttan hedefe giden sayıyı yaz.', 'Duran top ve hareketli top için ayrı kayıt tutabilirsin.'],
    gear: 'Top, kale ya da işaretli hedef',
    note: 'Hedefler küçüldükçe zorluk artar; ölçümü karşılaştırmak için aynı hedefi kullan.',
  },
];

export const TEST_BY_ID: Record<string, FieldTest> = Object.fromEntries(FIELD_TESTS.map((t) => [t.id, t]));
