// Ortama özgü egzersizler: gerçek salon makineleri/ağırlıkları, evde yapılabilen hareketler,
// sahada tek başına yapılabilen top çalışmaları. Her egzersiz hangi ortamda ve hangi
// ekipmanla yapılabildiğini açıkça belirtir (bkz. lib/environments.ts); yükler gençlerde
// hafif tutulur ve gözetim şartı yazılıdır. Genel antrenörlük uygulamasıdır.

import { E, HOME, type Exercise } from './exercise-types';

export const EXTRA_EXERCISES: Exercise[] = [
  // ── Spor salonu: makineler ve serbest ağırlıklar ───────────────
  E({ id: 'bacak-curl-makine', name: 'Bacak curl (makine)', cat: 'kuvvet', m: ['hamstring'], m2: ['calf'], env: ['salon'], eq: ['makine'], age: 15, lv: 2,
    steps: [
      'Makineyi boyunuza göre ayarlayın: dizinizin dönme ekseni makinenin eksenine denk gelsin, ped baldırınızın alt kısmına otursun.',
      'Dizlerinizi bükerek pedi kalçanıza doğru çekin; kalçanız yastıkta kalsın.',
      'Yavaşça, 2–3 saniyede başlangıç konumuna dönün.',
    ],
    cues: ['Hareket kontrollü ve yavaş olsun.', 'Kalça yastıktan kalkmasın.'],
    err: ['Yükü sallayarak (ivmeyle) çekmek.', 'Kalçanın yastıktan kalkması.', 'İnişi kontrolsüz bırakmak.'],
    why: 'Arka bacak (hamstring) kuvveti: sprint ve yavaşlama sırasında diz ve kalçayı korumaya yardımcı olur.',
    alt: ['romen-deadlift', 'kalca-kopru'], d: [3, 10, 'tekrar', '75 sn'],
    caution: 'Hafif yükle başlayın; yük artışı yalnızca antrenör ya da salon uzmanı gözetiminde yapılır.' }),

  E({ id: 'lat-cekis', name: 'Lat çekiş (kablo istasyonu)', cat: 'kuvvet', m: ['back'], m2: ['arm', 'shoulder'], env: ['salon'], eq: ['kablo'], age: 15, lv: 2,
    steps: [
      'Uyluk pedini uyluğunuzu sabitleyecek şekilde ayarlayın; barı omuz genişliğinden biraz geniş tutun.',
      'Göğsünüzü hafif öne açıp omuz bıçaklarınızı aşağı ve geriye çekerek barı köprücük kemiğinize doğru indirin.',
      'Barı kontrolle yukarı bırakın; kollar tam uzasın.',
    ],
    cues: ['Önce sırt, sonra kollar çeker.', 'Gövdeyi sallamadan çekin.'],
    err: ['Barı ensenin arkasına indirmek.', 'Gövdeyi geriye atarak sallamak.', 'Omuzları kulağa çıkarmak.'],
    why: 'Çekiş kuvveti ve omuz-sırt dengesi: itiş hareketlerinin (şınav, press) karşıtıdır.',
    alt: ['dambil-kurek', 'bant-kurek'], d: [3, 10, 'tekrar', '75 sn'],
    caution: 'Hafif yük ve doğru teknik; ağırlık artışı gözetimle yapılır.' }),

  E({ id: 'oturarak-kurek', name: 'Oturarak kablo kürek', cat: 'kuvvet', m: ['back'], m2: ['arm', 'shoulder', 'core'], env: ['salon'], eq: ['kablo'], age: 15, lv: 2,
    steps: [
      'Ayaklarınız platformda, dizler hafif bükülü ve sırtınız düz oturun.',
      'Tutamağı göbeğinize doğru çekin; dirsekler gövdeye yakın, omuz bıçakları birbirine yaklaşsın.',
      'Kontrollü şekilde uzatın; sırtınız yuvarlanmasın.',
    ],
    cues: ['Gövde sabit, sadece kollar ve omuz bıçakları çalışsın.', 'Omuzlar kulaklardan uzak.'],
    err: ['Gövdeyi ileri-geri sallamak.', 'Omuzları kulağa çıkarmak.', 'Sırtı yuvarlamak.'],
    why: 'Sırt ve omuz arkası kuvveti; duruş ve omuz sağlığı için itiş çalışmalarıyla dengelenir.',
    alt: ['dambil-kurek', 'bant-kurek'], d: [3, 10, 'tekrar', '75 sn'] }),

  E({ id: 'gogus-press-makine', name: 'Göğüs presi (makine)', cat: 'kuvvet', m: ['chest'], m2: ['shoulder', 'arm'], env: ['salon'], eq: ['makine'], age: 15, lv: 2,
    steps: [
      'Koltuk yüksekliğini tutamaklar göğüs hizasında olacak şekilde ayarlayın; sırtınız yastığa yaslı olsun.',
      'Tutamakları öne doğru itin; dirsekleri tam kilitlemeden durun.',
      'Kontrolle başlangıç konumuna dönün.',
    ],
    cues: ['Omuz bıçakları geride ve aşağıda.', 'İtişte nefes verin.'],
    err: ['Omuzları öne yuvarlamak.', 'Dirsekleri tamamen kilitlemek.', 'Kalçayı ve beli yastıktan kaldırmak.'],
    why: 'Göğüs, ön omuz ve kol arkası kuvveti; mücadele ve top koruma sırasında üst vücut dayanıklılığına katkı verir.',
    alt: ['sinav', 'diz-ustu-sinav'], d: [3, 10, 'tekrar', '75 sn'],
    caution: 'Hafif yükle başlayın; yük artışı gözetimle yapılır.' }),

  E({ id: 'dambil-bench-press', name: 'Dambıl bench press', cat: 'kuvvet', m: ['chest'], m2: ['shoulder', 'arm'], env: ['salon'], eq: ['dambil', 'bench'], age: 16, lv: 3,
    steps: [
      'Bench’e sırtüstü uzanın; ayaklar yerde, omuz bıçakları geride. Dambilleri gözetmenin yardımıyla başlangıç konumuna alın.',
      'Dambilleri göğüs hizasından yukarı doğru itin.',
      'Kontrolle göğüs hizasına indirin; dirsekler gövdeden yaklaşık 45° açıda olsun.',
    ],
    cues: ['Bilekler dik, dambiller dengede.', 'Her tekrarda kontrol: acele etmeyin.'],
    err: ['Yükü gözetmensiz almak ya da bırakmak.', 'Omuzları öne yuvarlamak.', 'Belin aşırı kavislenmesi.'],
    why: 'Göğüs ve omuz kuvveti; iki dambil, iki tarafın eşit çalışmasını ister.',
    alt: ['gogus-press-makine', 'sinav'], d: [3, 10, 'tekrar', '90 sn'],
    caution: 'Mutlaka gözetmen eşliğinde ve hafif dambillerle yapılır; maksimum yük denenmez.' }),

  E({ id: 'hip-thrust', name: 'Kalça itişi (hip thrust)', cat: 'kuvvet', m: ['glute'], m2: ['hamstring', 'core'], env: ['salon'], eq: ['bench', 'dambil'], age: 16, lv: 3,
    steps: [
      'Üst sırtınızı bench’in kenarına yaslayın; ayaklar yerde, dizler bükülü. Hafif bir dambili kalça kemiklerinizin üzerinde dengede tutun.',
      'Kalçanızı yukarı itin; üstte omuz-kalça-diz aynı çizgide olsun.',
      'Kontrollü şekilde indirin.',
    ],
    cues: ['Çene hafif içeride, bakış ileri.', 'Üstte kalça kaslarını sıkın.'],
    err: ['Belin aşırı kavislenmesi.', 'Dambilin kaymasına izin vermek.', 'Üstte kalçayı sıkmadan hareketi bitirmek.'],
    why: 'Kalça (gluteus) kuvveti: sprint ve sıçrama gücünün ana kaynaklarından biridir.',
    alt: ['kalca-kopru', 'tek-bacak-kalca-kopru'], d: [3, 10, 'tekrar', '75 sn'],
    caution: 'Hafif yükle ve gözetimde yapın; dambilin kaymaması için havlu ya da ped kullanın.' }),

  E({ id: 'kablo-odun-kesme', name: 'Kablo odun kesme (gövde rotasyonu)', cat: 'kuvvet', m: ['core'], m2: ['shoulder', 'glute'], env: ['salon'], eq: ['kablo'], age: 15, lv: 2,
    steps: [
      'Kabloyu yan tarafta, omuz hizasına ayarlayın; makaraya yan durun.',
      'Tutamağı iki elle tutup gövdeyi ve kalçayı birlikte çevirerek çaprazdan karşı kalça hizasına doğru indirin.',
      'Kontrolle başlangıca dönün; sonra diğer tarafı yapın.',
    ],
    cues: ['Dönüş kalçadan ve gövdeden gelsin.', 'Kollar yalnızca tutamağı yönlendirir.'],
    err: ['Yalnızca kollarla çekip gövdeyi çevirmemek.', 'Beli aşırı bükmek.', 'Gereğinden ağır yük seçmek.'],
    why: 'Gövde rotasyon kuvveti: şut ve yön değiştirme sırasında kalça-gövde zincirini destekler.',
    alt: ['pallof', 'plank'], d: [3, 10, 'tekrar', '60 sn'], side: true }),

  E({ id: 'kablo-yuz-cekis', name: 'Kablo yüz çekişi (face pull)', cat: 'onleme', m: ['shoulder', 'back'], m2: ['arm'], env: ['salon'], eq: ['kablo'], age: 15, lv: 2,
    steps: [
      'Makarayı yüz hizasına ayarlayın; ip tutamağı iki elle tutup bir adım geri çekilin.',
      'Dirsekleri yana açarak tutamağı yüzünüze doğru çekin; omuz bıçaklarını birbirine yaklaştırın.',
      'Kontrollü şekilde uzatın.',
    ],
    cues: ['Dirsekler omuz hizasında ya da hafif üstünde.', 'Hafif yük, temiz hareket.'],
    err: ['Ağır yükle gövdeyi geriye atmak.', 'Dirsekleri düşük tutmak.', 'Omuzları kulağa çıkarmak.'],
    why: 'Omuz arkası ve kürek kemiği çevresi kasları: omuz sağlığı ve duruş.',
    alt: ['bant-acma', 'bant-kurek'], d: [3, 12, 'tekrar', '60 sn'] }),

  E({ id: 'dambil-yuruyus-hamle', name: 'Dambıllı yürüyüş hamlesi', cat: 'kuvvet', m: ['quad', 'glute'], m2: ['hamstring', 'core'], env: ['salon', 'ev'], eq: ['dambil'], age: 15, lv: 3,
    steps: [
      'Her elinizde hafif bir dambil, gövde dik olarak büyük bir adım atın.',
      'Arka dizi yere yaklaştırın; ön diz ayak ucuyla aynı yönü göstersin.',
      'Öndeki ayakla itip arka ayağı öne getirin ve diğer adıma geçin.',
    ],
    cues: ['Gövde dik, bakış ileride.', 'Adımlar eşit uzunlukta.'],
    err: ['Gövdenin öne eğilmesi.', 'Ön dizin içe çökmesi.', 'Çok ağır dambil seçmek.'],
    why: 'Tek bacak kuvveti ve denge: koşu ve yön değiştirme mekaniğine yakın bir hareket.',
    alt: ['yuruyus-hamlesi', 'geri-hamle'], d: [3, 8, 'tekrar', '75 sn'], side: true,
    caution: 'Hafif yük; yük artışı yalnızca teknik bozulmadan ve gözetimde yapılır.' }),

  E({ id: 'kardiyo-aralikli', name: 'Salon kardiyo aralıkları (koşu bandı / bisiklet / kürek)', cat: 'dayaniklilik', m: ['quad', 'hamstring', 'calf'], m2: ['glute', 'core'], env: ['salon'], eq: ['kardiyo'], age: 12, lv: 2,
    steps: [
      '5 dakika hafif tempoyla ısının.',
      '30 saniye tempolu (konuşmanın zorlaştığı ama kontrol edebildiğiniz tempo), 30 saniye hafif tempo yapın.',
      'Belirtilen sayıda tekrarlayın; hafif tempoyla soğuyun.',
    ],
    cues: ['Tempo her tekrarda aynı kalsın.', 'Koşu bandında güvenlik anahtarı takılı olsun.'],
    err: ['İlk tekrarlarda çok hızlı başlamak.', 'Koşu bandında tutamaklara asılmak.', 'Isınmadan yüksek tempoya geçmek.'],
    why: 'Maçtaki dur-kalk yapısına benzeyen aralıklı çalışma; hava ve saha koşullarından bağımsız dayanıklılık.',
    alt: ['aralikli-kosu', 'kardiyo-surekli'], d: [3, 6, 'tekrar', '2 dk'],
    caution: 'Aleti ilk kullanışınızda ayarlarını salon görevlisinden öğrenin.' }),

  E({ id: 'kardiyo-surekli', name: 'Salon sürekli kardiyo (rahat tempo)', cat: 'dayaniklilik', m: ['quad', 'hamstring', 'calf'], m2: ['glute', 'core'], env: ['salon'], eq: ['kardiyo'], age: 12, lv: 1,
    steps: [
      'Konuşabileceğiniz rahat bir tempo seçin.',
      'Süreyi kademeli artırın (haftada yaklaşık 2–3 dakika).',
      'Son 3 dakikada tempoyu düşürerek bitirin.',
    ],
    cues: ['Nefes rahat, konuşabilmelisiniz.', 'Duruşu koruyun, tutamaklara yaslanmayın.'],
    err: ['Çok hızlı başlamak.', 'Süreyi aniden artırmak.', 'Koşu bandında tutamaklara asılmak.'],
    why: 'Aerobik taban: maç boyunca tekrarlı sprint kapasitesinin temeli.',
    alt: ['kardiyo-aralikli', 'surekli-kosu'], d: [1, 20, 'dk', '—'] }),

  // ── Ev: vücut ağırlığı ve hafif ekipman ───────────────────────
  E({ id: 'bant-kurek', name: 'Bantla oturarak kürek', cat: 'kuvvet', m: ['back'], m2: ['arm', 'shoulder'], env: ['ev', 'salon', 'saha'], eq: ['bant'], age: 10, lv: 1,
    steps: [
      'Yerde bacaklar önde, dizler hafif bükülü oturun; bandı ayak tabanlarınıza dolayın, uçlarını ellerinizde tutun.',
      'Dirsekleri geriye çekerek elleri karnınıza yaklaştırın; omuz bıçakları birbirine yaklaşsın.',
      'Kontrolle bırakın.',
    ],
    cues: ['Sırt dik, omuzlar aşağıda.', 'Bırakırken bandı kontrol edin.'],
    err: ['Sırtı yuvarlamak.', 'Omuzları kulağa çıkarmak.', 'Bandı hızla bırakmak.'],
    why: 'Çekiş hareketi: omuz ve üst sırt dengesi; itiş çalışmalarını tamamlar.',
    alt: ['bant-acma', 'masa-alti-kurek'], d: [3, 12, 'tekrar', '45 sn'],
    caution: 'Yırtık ya da aşınmış band kullanmayın; bırakırken kontrollü olun.' }),

  E({ id: 'bant-yan-yuruyus', name: 'Bantla yan yürüyüş', cat: 'onleme', m: ['glute'], m2: ['adductor', 'quad'], env: HOME, eq: ['bant'], age: 10, lv: 2,
    steps: [
      'Bandı dizlerin üstüne ya da ayak bileklerinin üstüne yerleştirin; hafif çömelik, ayaklar omuz genişliğinde durun.',
      'Bandı gergin tutarak yana küçük adımlar atın; ayak uçları ileri baksın.',
      'Bir yöne adımları bitirince diğer yöne dönün.',
    ],
    cues: ['Dizler içe çökmesin.', 'Gövde dik, kalça yatay kalsın.'],
    err: ['Dizlerin içe çökmesi.', 'Bandı gevşetecek kadar küçük adımlar atmak.', 'Gövdeyi yana yatırmak.'],
    why: 'Kalça yan kasları: yön değiştirme ve tek ayak dengesinde diz-kalça hizasını korumaya yardımcı olur.',
    alt: ['yan-hamle', 'tek-ayak-denge'], d: [3, 10, 'tekrar', '45 sn'], side: true }),

  E({ id: 'ip-atlama', name: 'Atlama ipi', cat: 'dayaniklilik', m: ['calf'], m2: ['quad', 'core', 'shoulder'], env: ['ev', 'saha'], eq: ['ip'], age: 8, lv: 1,
    steps: [
      'İpi bel hizasında tutun; dirsekler gövdeye yakın, ipi bileklerle çevirin.',
      'Ayak uçlarında, küçük ve ritmik sıçramalarla ipi atlayın.',
      'Ritim bozulursa durup yeniden başlayın.',
    ],
    cues: ['Yumuşak iniş, ayak uçlarında.', 'Kolları geniş sallamayın.'],
    err: ['Gereğinden yüksek sıçramak.', 'Topuklarla inmek.', 'Kolları geniş sallamak.'],
    why: 'Ayak bileği ve baldır dayanıklılığı, ritim ve koordinasyon; ısınma ya da dayanıklılık için.',
    alt: ['cok-yonlu-ziplama', 'yerinde-yuksek-diz'], d: [3, 45, 'sn', '45 sn'],
    caution: 'Düz, kaymayan zeminde; ipin tavana ya da eşyaya çarpmayacağı bir alanda yapın.' }),

  E({ id: 'yerinde-yuksek-diz', name: 'Yerinde yüksek diz koşusu', cat: 'dayaniklilik', m: ['hipflex', 'quad'], m2: ['calf', 'core'], env: ['ev'], age: 8, lv: 1,
    steps: [
      'Dik durun; yerinde koşar gibi dizleri kalça hizasına doğru kaldırın.',
      'Kollar koşu hareketi gibi çalışsın; ayak uçlarında hafif basın.',
      'Süre boyunca ritmi koruyun.',
    ],
    cues: ['Dik duruş, bakış ileride.', 'Hafif ve yumuşak basış.'],
    err: ['Gövdeyi geriye yaslamak.', 'Topuklarla basmak.', 'Ritmi bozacak kadar hızlı gitmek.'],
    why: 'Ev ortamında koşu ritmi, kalça fleksörleri ve genel dayanıklılık için pratik bir seçenek.',
    alt: ['ip-atlama', 'merdiven-cikma'], d: [3, 30, 'sn', '30 sn'],
    caution: 'Kaymayan zeminde, çevrede eşya olmadan yapın.' }),

  E({ id: 'merdiven-cikma', name: 'Basamak çıkma (tempolu yürüyüş)', cat: 'dayaniklilik', m: ['quad', 'glute', 'calf'], m2: ['core'], env: ['ev'], age: 10, lv: 2,
    steps: [
      'Sağlam, aydınlık ve kaymayan bir merdivenin alt katlarında başlayın.',
      'Tempolu yürüyerek çıkın; her basamağa ayağınızın tamamıyla basın.',
      'İnişte yürüyün ve korkuluğa yakın kalın; koşmayın.',
    ],
    cues: ['Dik duruş, korkuluk elinizin altında.', 'Basamağa tam basın.'],
    err: ['Koşarak ya da basamak atlayarak çıkmak.', 'Ayağı basamağın kenarına koymak.', 'Korkuluktan uzak olmak.'],
    why: 'Ekipmansız dayanıklılık ve bacak kuvveti; evde ya da apartmanda yapılabilir.',
    alt: ['yerinde-yuksek-diz', 'step-up'], d: [3, 45, 'sn', '60 sn'],
    caution: 'Ortak kullanım merdivenlerinde başkalarını engellemeyin; düşme riskine karşı koşmayın ve inişte yürüyün.' }),

  // ── Saha: tek başına top çalışması ────────────────────────────
  E({ id: 'top-slalom', name: 'Koni arası top sürme', cat: 'top', m: ['quad', 'calf'], m2: ['core', 'hipflex'], env: ['saha'], eq: ['top', 'koni'], age: 6, lv: 1,
    steps: [
      '6–8 koniyi 1,5–2 m arayla dizin; topu ayağınızın önünde tutun.',
      'Koniler arasında iç ve dış yüzle kısa dokunuşlarla topu sürerek ilerleyin.',
      'Sona gelince dönüp geri gelin; başınızı mümkün olduğunca kaldırın.',
    ],
    cues: ['Topu ayağa yakın tutun.', 'Başı kaldırın.'],
    err: ['Topu çok uzağa itmek.', 'Gözleri sürekli topa dikmek.', 'Hızı kontrolsüzce artırmak.'],
    why: 'Ayak-göz koordinasyonu ve dar alanda top hâkimiyeti; çeviklik ve topla hareketi birleştirir.',
    alt: ['top-yon-degistirme', 'zigzag-koni'], d: [4, 30, 'sn', '45 sn'] }),

  E({ id: 'top-sektirme', name: 'Top sektirme (ayak ve uyluk)', cat: 'top', m: ['quad', 'calf'], m2: ['core'], env: ['saha'], eq: ['top'], age: 6, lv: 1,
    steps: [
      'Topu elinizle bırakıp yere değmeden ayağınızın üstüyle hafifçe yukarı vurun.',
      'Önce tek ayakla, sonra iki ayakla dönüşümlü sektirin; uyluğu da kullanabilirsiniz.',
      'Topun yüksekliğini göğüs hizasını geçirmeyin.',
    ],
    cues: ['Kısa ve yumuşak dokunuşlar.', 'Ayak bileği kilitli, ayak üstü düz.'],
    err: ['Topa çok sert vurmak.', 'Gözleri ayağa dikmek.', 'Ayak bileğini gevşek bırakmak.'],
    why: 'Hassas dokunuş, denge ve top hissi.',
    alt: ['top-slalom', 'denge-top'], d: [3, 60, 'sn', '45 sn'],
    caution: 'Kafa kullanılmaz; yalnızca ayak ve uyluk.' }),

  E({ id: 'top-yon-degistirme', name: 'Topla yön değiştirme (iç yüz – dış yüz)', cat: 'top', m: ['quad', 'glute', 'calf'], m2: ['adductor', 'core'], env: ['saha'], eq: ['top', 'koni'], age: 8, lv: 2,
    steps: [
      'İki koniyi 5 m arayla yerleştirin.',
      'Topu sürerken konide iç yüzle ya da dış yüzle topu yeni yöne çekin; aynı anda gövdeyi çevirin.',
      'Yeni yönde hızlanıp diğer koniye gidin; her turda yüzeyi (iç ya da dış) ve ayağı değiştirin.',
    ],
    cues: ['Dönüşte kalçayı alçaltın.', 'Zayıf ayağı da kullanın.'],
    err: ['Dönüşte topu ayaktan uzaklaştırmak.', 'Dik duruşla dönmek.', 'Hep aynı ayağı kullanmak.'],
    why: 'Topla yön değiştirme: çeviklik, top kontrolü ve zayıf ayak gelişimi.',
    alt: ['top-slalom', 'zigzag-koni'], d: [4, 6, 'tekrar', '45 sn'] }),

  E({ id: 'topla-sprint', name: 'Topla tempo koşusu (20 m)', cat: 'top', m: ['quad', 'hamstring', 'calf'], m2: ['glute', 'core'], env: ['saha'], eq: ['top', 'koni'], age: 10, lv: 2,
    steps: [
      'İki koniyi 20 m arayla dizin.',
      'Topu sürerek tempolu (tam hız değil) koşun; topu ayağınızdan çok uzağa itmeyin.',
      'Sonda topu durdurun, yürüyerek başlangıca dönün ve dinlenin.',
    ],
    cues: ['Dokunuşlar kısa, tempo kontrollü.', 'Başı kaldırın.'],
    err: ['Topu çok uzağa itmek.', 'Tam hız denemesiyle kontrolü kaybetmek.', 'Yeterince dinlenmeden art arda yapmak.'],
    why: 'Top sürerek tempo: koşu mekaniği ile top kontrolünü birleştirir.',
    alt: ['top-slalom', 'ivmelenme-10m'], d: [4, 20, 'm', '60 sn'] }),
];
