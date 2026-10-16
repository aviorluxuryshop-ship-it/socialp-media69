import type { Level } from '@/lib/types';

export type MuscleId =
  | 'quad'
  | 'hamstring'
  | 'glute'
  | 'calf'
  | 'adductor'
  | 'hipflex'
  | 'core'
  | 'back'
  | 'chest'
  | 'shoulder'
  | 'arm'
  | 'neck';

export const MUSCLE_NAME: Record<string, string> = {
  quad: 'Ön bacak (kuadriseps)',
  hamstring: 'Arka bacak (hamstring)',
  glute: 'Kalça (gluteus)',
  calf: 'Baldır',
  adductor: 'İç bacak',
  hipflex: 'Kalça önü (fleksör)',
  core: 'Merkez bölge (karın–bel)',
  back: 'Sırt',
  chest: 'Göğüs',
  shoulder: 'Omuz',
  arm: 'Kol',
  neck: 'Boyun',
};

export type ExCat = 'kuvvet' | 'hiz' | 'ceviklik' | 'guc' | 'denge' | 'dayaniklilik' | 'mobilite' | 'onleme' | 'toparlanma';

export const EXCAT_NAME: Record<ExCat, string> = {
  kuvvet: 'Kuvvet',
  hiz: 'Sürat',
  ceviklik: 'Çeviklik',
  guc: 'Patlayıcı güç',
  denge: 'Denge ve koordinasyon',
  dayaniklilik: 'Dayanıklılık',
  mobilite: 'Hareketlilik ve ısınma',
  onleme: 'Sakatlık önleme',
  toparlanma: 'Toparlanma',
};

export type Equip = 'yok' | 'top' | 'koni' | 'bant' | 'dambil' | 'barfiks' | 'salon' | 'merdiven' | 'kutu';
export type Env = 'ev' | 'salon' | 'saha';

export interface Exercise {
  id: string;
  name: string;
  cat: ExCat;
  muscles: MuscleId[];
  secondary: MuscleId[];
  env: Env[];
  equip: Equip[];
  /** önerilen en erken yaş (kontrollü, yaşa uygun doz ile) */
  minAge: number;
  lv: Level;
  steps: string[];
  cues: string[];
  why: string;
  alt: string[];
  /** 18+ için taban doz: set, tekrar ya da süre */
  sets: number;
  reps: number;
  unit: 'tekrar' | 'sn' | 'm' | 'dk';
  rest: string;
  caution?: string;
  /** tek taraflı (her taraf ayrı) */
  perSide?: boolean;
}

interface In {
  id: string;
  name: string;
  cat: ExCat;
  m: MuscleId[];
  m2?: MuscleId[];
  env: Env[];
  eq?: Equip[];
  age: number;
  lv: Level;
  steps: string[];
  cues: string[];
  why: string;
  alt: string[];
  d: [sets: number, reps: number, unit: Exercise['unit'], rest: string];
  caution?: string;
  side?: boolean;
}

const E = (i: In): Exercise => ({
  id: i.id,
  name: i.name,
  cat: i.cat,
  muscles: i.m,
  secondary: i.m2 ?? [],
  env: i.env,
  equip: i.eq ?? ['yok'],
  minAge: i.age,
  lv: i.lv,
  steps: i.steps,
  cues: i.cues,
  why: i.why,
  alt: i.alt,
  sets: i.d[0],
  reps: i.d[1],
  unit: i.d[2],
  rest: i.d[3],
  caution: i.caution,
  perSide: i.side,
});

const HOME: Env[] = ['ev', 'salon', 'saha'];

export const EXERCISES: Exercise[] = [
  // ── Kuvvet: alt vücut ──────────────────────────────
  E({ id: 'comelme', name: 'Vücut ağırlığıyla çömelme (squat)', cat: 'kuvvet', m: ['quad', 'glute'], m2: ['core', 'hamstring'], env: HOME, age: 8, lv: 1,
    steps: ['Ayaklar omuz genişliğinde, ayak uçları hafif dışa.', 'Kalçayı geriye ve aşağı iterek diz 90°’ye kadar çömelin; göğüs dik.', 'Topuklardan iterek yavaşça kalkın.'],
    cues: ['Dizler ayak uçlarıyla aynı yöne baksın, içe çökmesin.', 'Topuklar yerde kalsın.', 'Sırt düz, bakış ileride.'],
    why: 'Sprint, zıplama ve yön değiştirmede kullanılan temel bacak kuvvetini ve kalça-diz-ayak bileği koordinasyonunu geliştirir.',
    alt: ['goblet-squat', 'sandalyeye-oturma'], d: [3, 12, 'tekrar', '60 sn'] }),
  E({ id: 'sandalyeye-oturma', name: 'Sandalyeye oturup kalkma', cat: 'kuvvet', m: ['quad', 'glute'], env: ['ev'], eq: ['yok'], age: 8, lv: 1,
    steps: ['Sandalyenin önünde ayakta durun.', 'Yavaşça oturur gibi kalçayı geriye indirin; sandalyeye hafifçe dokunun.', 'Hemen ayağa kalkın.'],
    cues: ['Sandalyeye ağırlığınızı vermeyin.', 'Dizler içe çökmesin.'],
    why: 'Çömelme hareketini öğrenmenin güvenli ve kolay yoludur.', alt: ['comelme'], d: [2, 10, 'tekrar', '45 sn'] }),
  E({ id: 'goblet-squat', name: 'Goblet squat (ağırlıkla çömelme)', cat: 'kuvvet', m: ['quad', 'glute'], m2: ['core'], env: ['salon', 'ev'], eq: ['dambil'], age: 14, lv: 2,
    steps: ['Bir dambili göğüs önünde iki elle tutun.', 'Çömelin; dirsekler dizlerin içinden geçsin.', 'Topuklardan iterek kalkın.'],
    cues: ['Göğüs yukarıda, sırt düz.', 'Ağırlık hafif kalsın; temiz teknik önce gelir.'],
    why: 'Ek ağırlıkla bacak ve kalça kuvvetini güvenli biçimde artırır.', alt: ['comelme'], d: [3, 10, 'tekrar', '75 sn'],
    caution: 'Gençlerde yalnızca hafif yükle ve antrenör gözetiminde; maksimum ağırlık denemeyin.' }),
  E({ id: 'geri-hamle', name: 'Geri hamle (reverse lunge)', cat: 'kuvvet', m: ['quad', 'glute'], m2: ['hamstring', 'core'], env: HOME, age: 8, lv: 1,
    steps: ['Ayakta, eller belde ya da önde.', 'Bir ayağınızı geriye atıp arka diz yere yaklaşana kadar inin.', 'Ön ayağın topuğundan iterek başlangıca dönün.'],
    cues: ['Ön diz ayak ucunu geçmesin.', 'Gövde dik.'], why: 'Tek bacak kuvveti ve dengesi: koşu ve şut sırasında tek ayak üstünde dengeyi artırır.',
    alt: ['yuruyus-hamlesi', 'bulgar-split'], d: [3, 8, 'tekrar', '60 sn'], side: true }),
  E({ id: 'yuruyus-hamlesi', name: 'Yürüyüş hamlesi (walking lunge)', cat: 'kuvvet', m: ['quad', 'glute'], m2: ['hamstring', 'core'], env: HOME, age: 12, lv: 2,
    steps: ['Büyük bir adım atıp arka dizi yere yaklaştırın.', 'Öndeki ayakla itip arka ayağı öne getirin; adım adım ilerleyin.'],
    cues: ['Adımlar eşit uzunlukta.', 'Gövde dik ve dengeli.'], why: 'Koşu adımına benzer tek bacak yükü verir; kalça ve bacak kuvveti ve dengeyi geliştirir.',
    alt: ['geri-hamle'], d: [3, 10, 'm', '60 sn'] }),
  E({ id: 'bulgar-split', name: 'Bulgar split squat', cat: 'kuvvet', m: ['quad', 'glute'], m2: ['core', 'hamstring'], env: HOME, eq: ['yok'], age: 14, lv: 3,
    steps: ['Arka ayağınızı yüksek bir yüzeye (sandalye, bank) koyun.', 'Ön bacağın dizi 90° olana dek inin.', 'Ön ayakla iterek kalkın.'],
    cues: ['Ön ayak yeterince uzak.', 'Gövde hafif öne eğik, dengeli.'], why: 'Tek bacak gücünü ve kalça kuvvetini en etkili biçimde geliştirir.',
    alt: ['geri-hamle', 'step-up'], d: [3, 8, 'tekrar', '75 sn'], side: true }),
  E({ id: 'step-up', name: 'Basamağa çıkma (step-up)', cat: 'kuvvet', m: ['quad', 'glute'], m2: ['calf'], env: HOME, eq: ['kutu'], age: 10, lv: 2,
    steps: ['Orta yükseklikte kutuya (diz hizası altı) bir ayağı koyun.', 'Üstteki ayakla iterek çıkın.', 'Kontrollü inip tekrarlayın.'],
    cues: ['İterken yalnızca üstteki ayağı kullanın.', 'İnişte yavaş olun.'], why: 'Tek bacak itiş gücü ve denge: koşu ve sıçrama için temel.',
    alt: ['geri-hamle'], d: [3, 10, 'tekrar', '60 sn'], side: true }),
  E({ id: 'tek-bacak-cokme', name: 'Tek bacak çömelme (kutuya)', cat: 'kuvvet', m: ['quad', 'glute'], m2: ['core', 'calf'], env: HOME, age: 15, lv: 4,
    steps: ['Kutu ya da sandalye önünde tek ayakta durun.', 'Diğer ayak önde havada; yavaşça oturur gibi inin.', 'Tek ayakla kalkın.'],
    cues: ['Diz içe çökmesin.', 'Gerekirse destek için ellerinizi öne uzatın.'], why: 'Tek bacak kuvveti ve diz-kalça kontrolü: yön değiştirme sırasında sakatlık riskini azaltmaya yardımcı olur.',
    alt: ['bulgar-split'], d: [3, 6, 'tekrar', '90 sn'], side: true, caution: 'Önce ilerleme basamaklarıyla (bulgar split) hazırlanın.' }),
  E({ id: 'romen-deadlift', name: 'Romen deadlift (dambil)', cat: 'kuvvet', m: ['hamstring', 'glute'], m2: ['back', 'core'], env: ['salon', 'ev'], eq: ['dambil'], age: 15, lv: 2,
    steps: ['Dambilleri uyluk önünde tutun, dizler hafif bükülü.', 'Kalçayı geriye iterek gövdeyi öne eğin; sırt düz.', 'Kalçayı öne iterek kalkın.'],
    cues: ['Ağırlıklar bacağınıza yakın.', 'Sırtı yuvarlamayın.'], why: 'Hamstring ve kalçayı güçlendirir; sprint hızını ve sakatlık direncini artırır.',
    alt: ['kalca-kopru'], d: [3, 10, 'tekrar', '75 sn'], caution: 'Teknik öğrenilmeden ağırlık artırmayın; gençlerde hafif yük.' }),
  E({ id: 'nordic', name: 'Nordic hamstring (yavaş iniş)', cat: 'onleme', m: ['hamstring'], m2: ['glute', 'core'], env: ['ev', 'saha'], eq: ['yok'], age: 15, lv: 3,
    steps: ['Dizlerinizin üzerinde durun; bir eş ayak bileklerinizi sabit tutsun.', 'Gövdenizi dümdüz öne doğru, hamstringlerinizle frenleyerek yavaşça indirin.', 'Ellerinizle yere inip itişle başlangıca dönün.'],
    cues: ['Kalçanız gövdeyle aynı hizada, bükülmesin.', 'İnişi mümkün olduğunca yavaş yapın.'], why: 'Hamstring güçlendirme ve yaralanma önleme programlarında yer alır; futbolda hamstring yaralanma riskini azaltmaya yardımcı olduğu araştırmalarda bildirilmiştir.',
    alt: ['kalca-kopru'], d: [2, 5, 'tekrar', '90 sn'], caution: 'Çok yoğun bir harekettir: düşük tekrarla ve kademeli artırın; sakatlık geçmişinde antrenöre danışın.' }),
  E({ id: 'kalca-kopru', name: 'Kalça köprüsü (glute bridge)', cat: 'kuvvet', m: ['glute', 'hamstring'], m2: ['core'], env: HOME, age: 8, lv: 1,
    steps: ['Sırtüstü, dizler bükülü, ayaklar yerde.', 'Kalçanızı omuz-diz çizgisi oluşana dek yukarı itin.', 'Yavaşça indirin.'],
    cues: ['Üstte kalça kaslarını sıkın.', 'Bel çok kavislenmesin.'], why: 'Kalça kuvveti: sprint, şut ve zıplama gücünün kaynağı.',
    alt: ['tek-bacak-kalca-kopru'], d: [3, 12, 'tekrar', '45 sn'] }),
  E({ id: 'tek-bacak-kalca-kopru', name: 'Tek bacak kalça köprüsü', cat: 'kuvvet', m: ['glute', 'hamstring'], m2: ['core'], env: HOME, age: 12, lv: 2,
    steps: ['Sırtüstü yatın; bir ayağınız yerde, diğer bacak havada düz.', 'Kalçanızı yukarı itin; kalçalar dengeli.', 'Kontrollü inin.'],
    cues: ['Kalçalar yere paralel kalsın.', 'Hızlı değil kontrollü.'], why: 'Tek bacak kalça kuvveti ve gövde stabilitesi.',
    alt: ['kalca-kopru'], d: [3, 10, 'tekrar', '45 sn'], side: true }),
  E({ id: 'baldir', name: 'Baldır yükseltme', cat: 'kuvvet', m: ['calf'], env: HOME, age: 8, lv: 1,
    steps: ['Ayakta, ayaklar omuz genişliğinde.', 'Topuklarınızı yukarı kaldırıp ayak uçlarına yükselin.', 'Yavaşça inin.'],
    cues: ['Tam hareket genişliği.', 'Ayak bileği dışa-içe kaymasın.'], why: 'Baldır ve aşil bölgesi kuvveti: koşu, sıçrama ve yön değiştirmede itiş gücü.',
    alt: ['tek-ayak-baldir'], d: [3, 15, 'tekrar', '45 sn'] }),
  E({ id: 'tek-ayak-baldir', name: 'Tek ayak baldır yükseltme', cat: 'kuvvet', m: ['calf'], env: HOME, age: 12, lv: 2,
    steps: ['Tek ayak üstünde durun; duvara hafifçe tutunabilirsiniz.', 'Topuğu kaldırıp yavaşça indirin.'], cues: ['Hız yerine kontrol.'], why: 'Tek bacak baldır kuvveti ve ayak bileği stabilitesi.', alt: ['baldir'], d: [3, 12, 'tekrar', '45 sn'], side: true }),
  E({ id: 'yan-hamle', name: 'Yan hamle (lateral lunge)', cat: 'kuvvet', m: ['adductor', 'glute', 'quad'], env: HOME, age: 10, lv: 2,
    steps: ['Ayakta, geniş bir adımı yana atın.', 'Adım attığınız tarafa çömelin; diğer bacak düz.', 'İterek merkeze dönün.'], cues: ['Ayak uçları ileri.', 'Gövde dik.'], why: 'Yan hareket ve yön değiştirmede kullanılan iç bacak ve kalça kaslarını güçlendirir.', alt: ['kopenhag'], d: [3, 8, 'tekrar', '60 sn'], side: true }),
  E({ id: 'kopenhag', name: 'Kopenhag planki (iç bacak)', cat: 'onleme', m: ['adductor', 'core'], env: ['ev', 'saha'], age: 15, lv: 3,
    steps: ['Yan plank pozisyonu alın; üst bacağınız sandalye/eşin bacağında, alt bacak havada.', 'Kalçanızı kaldırın ve pozisyonu koruyun.', 'Kısa süre tutup indirin.'],
    cues: ['Vücut tek çizgi.', 'Önce kısa kaldıraçla (diz üstü) başlayın.'], why: 'Kasık yaralanmalarının önlenmesinde kullanılan iç bacak (adduktor) güçlendirmesi.',
    alt: ['yan-hamle', 'yan-plank'], d: [2, 20, 'sn', '60 sn'], side: true }),
  E({ id: 'halter-squat', name: 'Halter ile çömelme (salon)', cat: 'kuvvet', m: ['quad', 'glute'], m2: ['core', 'back', 'hamstring'], env: ['salon'], eq: ['salon'], age: 17, lv: 4,
    steps: ['Halteri omuz arkasında yerleştirin; ayaklar omuz genişliği.', 'Kontrollü çömelin ve ayağa kalkın.'], cues: ['Sırt düz, bakış ileri.', 'Her zaman gözetmenli.'], why: 'Maksimum kuvvet gelişimi için temel hareket; yetişkin sporcularda.', alt: ['goblet-squat'], d: [4, 6, 'tekrar', '120 sn'],
    caution: 'Gençlerde yalnızca deneyimli antrenör gözetiminde; 1 tekrar maksimum denemeleri yapılmaz.' }),
  E({ id: 'bacak-pres', name: 'Bacak presi (salon aleti)', cat: 'kuvvet', m: ['quad', 'glute'], m2: ['hamstring'], env: ['salon'], eq: ['salon'], age: 16, lv: 3,
    steps: ['Alete oturun, ayakları omuz genişliğinde yerleştirin.', 'Dizleri bükerek platformu yavaşça indirin; sonra itin.'], cues: ['Dizler kilitlenmesin.', 'Bel yastıktan kalkmasın.'], why: 'Güvenli ve kontrollü alt vücut kuvveti.', alt: ['goblet-squat'], d: [3, 10, 'tekrar', '90 sn'] }),

  // ── Merkez bölge ────────────────────────────────────
  E({ id: 'plank', name: 'Ön plank', cat: 'kuvvet', m: ['core'], m2: ['shoulder', 'glute'], env: HOME, age: 8, lv: 1,
    steps: ['Dirsekler omuz altında, ayak uçları yerde.', 'Vücudu baştan topuğa düz bir çizgi tutun.', 'Süreyi koruyun.'], cues: ['Kalçalar düşmesin ve yükselmesin.', 'Nefes almaya devam edin.'], why: 'Gövde stabilitesi: şut, mücadele ve yön değiştirmede güç aktarımını sağlar.', alt: ['yan-plank', 'olu-bocek'], d: [3, 30, 'sn', '45 sn'] }),
  E({ id: 'yan-plank', name: 'Yan plank', cat: 'kuvvet', m: ['core'], m2: ['glute', 'shoulder'], env: HOME, age: 8, lv: 1,
    steps: ['Yan yatın; dirsek omuz altında.', 'Kalçayı kaldırıp vücudu tek çizgi yapın.'], cues: ['Kalçalar öne ya da arkaya kaymasın.'], why: 'Yan gövde (oblik) stabilitesi ve kalça gücü.', alt: ['plank'], d: [3, 25, 'sn', '45 sn'], side: true }),
  E({ id: 'olu-bocek', name: 'Ölü böcek (dead bug)', cat: 'kuvvet', m: ['core'], env: HOME, age: 8, lv: 1,
    steps: ['Sırtüstü; kollar yukarı, dizler 90°.', 'Karşı kol ve bacağı yavaşça uzatın.', 'Başlangıca dönüp diğer tarafı yapın.'], cues: ['Bel yere yapışık kalsın.', 'Yavaş.'], why: 'Merkez bölge kontrolünü öğretir; omurga stabilitesi.', alt: ['kus-kopek'], d: [3, 8, 'tekrar', '45 sn'], side: true }),
  E({ id: 'kus-kopek', name: 'Kuş-köpek (bird dog)', cat: 'kuvvet', m: ['core', 'glute'], m2: ['back'], env: HOME, age: 8, lv: 1,
    steps: ['Dört ayak üstü pozisyon.', 'Karşı kol ve bacağı aynı anda uzatın, 2 sn tutun.', 'Dönüp diğer tarafı yapın.'], cues: ['Kalçalar yatay kalsın.', 'Belde dalgalanma olmasın.'], why: 'Çapraz koordinasyon ve gövde stabilitesi.', alt: ['olu-bocek'], d: [3, 8, 'tekrar', '45 sn'], side: true }),
  E({ id: 'dag-tirmanisi', name: 'Dağ tırmanışı (mountain climber)', cat: 'kuvvet', m: ['core', 'hipflex'], m2: ['shoulder', 'quad'], env: HOME, age: 10, lv: 2,
    steps: ['Şınav pozisyonu; eller omuz altında.', 'Dizleri sırayla göğse doğru sürün.', 'Hızı kontrollü artırın.'], cues: ['Kalçalar sabit.', 'Ellerin omuz altında kalması.'], why: 'Kalça fleksörleri ve merkez bölgeyi dinamik çalıştırır; kondisyon katkısı.', alt: ['plank'], d: [3, 20, 'sn', '45 sn'] }),
  E({ id: 'pallof', name: 'Pallof presi (bantla)', cat: 'kuvvet', m: ['core'], m2: ['shoulder'], env: ['ev', 'salon'], eq: ['bant'], age: 14, lv: 3,
    steps: ['Direnç bandını yan tarafa sabitleyin; bandı göğüs önünde tutun.', 'Kollarınızı öne uzatın; vücudun dönmesine izin vermeyin.', 'Geri getirin.'], cues: ['Gövde sabit.', 'Nefes.'], why: 'Dönmeye karşı direnç: mücadele ve şut sırasında gövde stabilitesi.', alt: ['yan-plank'], d: [3, 10, 'tekrar', '45 sn'], side: true }),
  E({ id: 'bacak-kaldirma', name: 'Asılı bacak kaldırma', cat: 'kuvvet', m: ['core', 'hipflex'], m2: ['arm'], env: ['salon', 'saha'], eq: ['barfiks'], age: 15, lv: 4,
    steps: ['Barfikse asılın; omuzlar aktif.', 'Bacakları düz ya da bükülü kalça hizasına kaldırın.', 'Kontrolle indirin.'], cues: ['Sallanmayın.'], why: 'Alt karın ve kalça fleksörlerini güçlendirir.', alt: ['dag-tirmanisi'], d: [3, 8, 'tekrar', '60 sn'] }),

  // ── Üst vücut ────────────────────────────────────────
  E({ id: 'sinav', name: 'Şınav', cat: 'kuvvet', m: ['chest', 'arm', 'shoulder'], m2: ['core'], env: HOME, age: 10, lv: 2,
    steps: ['Eller omuz genişliğinden biraz geniş; vücut düz çizgi.', 'Göğüs yere yaklaşana dek inin.', 'İterek kalkın.'], cues: ['Kalçalar düşmesin.', 'Dirsekler 45° dışarı.'], why: 'Üst vücut kuvveti: mücadele ve top koruma.', alt: ['diz-ustu-sinav'], d: [3, 10, 'tekrar', '60 sn'] }),
  E({ id: 'diz-ustu-sinav', name: 'Diz üstü şınav', cat: 'kuvvet', m: ['chest', 'arm', 'shoulder'], m2: ['core'], env: HOME, age: 8, lv: 1,
    steps: ['Dizler yerde; eller omuz altından biraz geniş.', 'Göğsü yere yaklaştırıp itin.'], cues: ['Baştan dizlere düz çizgi.'], why: 'Şınava giden basamak.', alt: ['sinav'], d: [3, 8, 'tekrar', '60 sn'] }),
  E({ id: 'masa-alti-kurek', name: 'Masa altı kürek (ters kürek)', cat: 'kuvvet', m: ['back', 'arm'], m2: ['core', 'shoulder'], env: ['ev'], age: 12, lv: 2,
    steps: ['Sağlam bir masanın altına uzanıp kenarı tutun.', 'Vücudu düz tutarak göğsü masaya çekin.', 'Kontrollü inin.'], cues: ['Vücut tek çizgi.', 'Masanın sağlam olduğundan emin olun.'], why: 'Sırt ve omuz dengesi: itme ve çekme kuvveti dengesi.', alt: ['dambil-kurek'], d: [3, 8, 'tekrar', '60 sn'], caution: 'Masanın kayma ve devrilme riskini kontrol edin.' }),
  E({ id: 'dambil-kurek', name: 'Dambil kürek', cat: 'kuvvet', m: ['back', 'arm'], m2: ['core'], env: ['salon', 'ev'], eq: ['dambil'], age: 14, lv: 2,
    steps: ['Bir elinizi sabit yüzeye dayayın; öne eğilin.', 'Diğer elle dambili gövde yanına çekin.', 'Yavaşça indirin.'], cues: ['Sırt düz.', 'Dirsek gövdeye yakın.'], why: 'Sırt kasları: duruş ve üst vücut gücü.', alt: ['masa-alti-kurek'], d: [3, 10, 'tekrar', '60 sn'], side: true }),
  E({ id: 'barfiks', name: 'Barfiks', cat: 'kuvvet', m: ['back', 'arm'], m2: ['core', 'shoulder'], env: ['salon', 'saha'], eq: ['barfiks'], age: 14, lv: 4,
    steps: ['Barı omuz genişliğinden biraz geniş tutun.', 'Çenenizi barın üstüne çekin.', 'Kontrollü inin.'], cues: ['Sallanmayın.'], why: 'Üst vücut çekme kuvveti.', alt: ['masa-alti-kurek'], d: [3, 5, 'tekrar', '90 sn'] }),
  E({ id: 'omuz-press', name: 'Dambil omuz presi', cat: 'kuvvet', m: ['shoulder', 'arm'], m2: ['core'], env: ['salon', 'ev'], eq: ['dambil'], age: 16, lv: 3,
    steps: ['Dambilleri omuz hizasında tutun.', 'Başın üstüne itin.', 'Kontrollü indirin.'], cues: ['Bel kavislenmesin.'], why: 'Omuz gücü: mücadele ve denge.', alt: ['bant-acma'], d: [3, 8, 'tekrar', '75 sn'], caution: 'Hafif yükle başlayın.' }),
  E({ id: 'bant-acma', name: 'Bant açma (band pull-apart)', cat: 'onleme', m: ['back', 'shoulder'], env: ['ev', 'salon'], eq: ['bant'], age: 10, lv: 1,
    steps: ['Bandı kollar öne uzanmış tutun.', 'Kollarınızı yana açıp bandı gerin.', 'Kontrollü bırakın.'], cues: ['Omuz bıçakları birbirine yaklaşsın.'], why: 'Omuz stabilitesi ve duruş.', alt: ['dambil-kurek'], d: [3, 15, 'tekrar', '45 sn'] }),

  // ── Sürat ────────────────────────────────────────────
  E({ id: 'sprint-abc', name: 'Koşu ABC çalışmaları (A-skip, B-skip)', cat: 'hiz', m: ['hipflex', 'calf'], m2: ['quad', 'hamstring'], env: ['saha', 'ev'], age: 8, lv: 1,
    steps: ['A-skip: dizi kalça hizasına kaldırıp ayağı hızla yere indirerek zıplayın.', 'B-skip: A-skip’e bacağı öne uzatma ekleyin.', '15–20 m boyunca ritmi koruyun.'], cues: ['Ayak bileği sert.', 'Dik duruş.'], why: 'Koşu tekniği: adım frekansı ve ayak teması.', alt: ['ivmelenme-10m'], d: [3, 15, 'm', '30 sn'] }),
  E({ id: 'ivmelenme-10m', name: '10 m ivmelenme (akselerasyon)', cat: 'hiz', m: ['quad', 'glute', 'calf'], m2: ['hamstring', 'core'], env: ['saha'], age: 10, lv: 1,
    steps: ['Hafif öne eğik duruşla başlayın.', 'İlk adımlarda gövdeyi öne eğip güçlü itin.', '10 m boyunca hızlanıp yavaşça durun.'], cues: ['İlk 3 adım kısa ve güçlü.', 'Kollar aktif.'], why: 'Futbolda çoğu sprint 10–20 m’dir; ivmelenme, topa ulaşmanın anahtarıdır.', alt: ['sprint-20-30'], d: [6, 1, 'tekrar', '60 sn'] }),
  E({ id: 'sprint-20-30', name: '20–30 m sprint', cat: 'hiz', m: ['hamstring', 'glute', 'quad'], m2: ['calf', 'core'], env: ['saha'], age: 12, lv: 2,
    steps: ['Isındıktan sonra tam hızda 20–30 m koşun.', 'Yavaşça durup yürüyerek geri dönün.'], cues: ['Tam dinlenme: kalitesiz sprint yapmayın.'], why: 'Maksimum hız ve hamstring dayanıklılığı.', alt: ['ivmelenme-10m'], d: [5, 1, 'tekrar', '90 sn'], caution: 'Iyi ısınmadan tam hızda sprint yapmayın.' }),
  E({ id: 'direncli-sprint', name: 'Dirençli sprint (bantla)', cat: 'hiz', m: ['quad', 'glute'], m2: ['hamstring', 'calf', 'core'], env: ['saha'], eq: ['bant'], age: 15, lv: 3,
    steps: ['Bir arkadaşınız ya da sabit nokta bandı bele bağlı tutar.', '10–15 m dirençle ileri sprint atın.'], cues: ['Gövde hafif öne eğik.'], why: 'İvmelenme gücünü artırır.', alt: ['ivmelenme-10m'], d: [4, 1, 'tekrar', '90 sn'] }),
  E({ id: 'duvar-ivme', name: 'Duvar ivmelenme duruşu', cat: 'hiz', m: ['hipflex', 'glute'], m2: ['quad', 'core'], env: ['ev', 'saha'], age: 10, lv: 2,
    steps: ['Duvara öne eğilerek yaslanın; vücut düz çizgi.', 'Dizleri sırayla hızla kaldırıp ayağı geri vurun.', 'Kısa ve hızlı tekrarlar.'], cues: ['Vücut çizgisini koruyun.'], why: 'İvmelenme mekaniğini öğrenmeye yardımcı olur.', alt: ['sprint-abc'], d: [3, 10, 'sn', '45 sn'] }),

  // ── Çeviklik ──────────────────────────────────────────
  E({ id: 'ip-merdiven', name: 'İp merdiven ayak çalışmaları', cat: 'ceviklik', m: ['calf', 'hipflex'], m2: ['quad', 'core'], env: ['saha', 'ev'], eq: ['merdiven'], age: 8, lv: 1,
    steps: ['Merdivenin her karesine sırayla ayak basarak ilerleyin.', 'Farklı desenler deneyin (tek, çift, yan).'], cues: ['Ayak uçlarında hızlı.', 'Başı yukarıda.'], why: 'Ayak hızı ve koordinasyon.', alt: ['zigzag-koni'], d: [4, 1, 'tekrar', '45 sn'] }),
  E({ id: 'zigzag-koni', name: 'Zigzag koni çalışması', cat: 'ceviklik', m: ['quad', 'glute', 'calf'], m2: ['adductor', 'core'], env: ['saha'], eq: ['koni'], age: 8, lv: 1,
    steps: ['5 konuyu 3–4 m arayla zigzag dizin.', 'Konilerin etrafında hızlı yön değiştirerek koşun.'], cues: ['Alçak kalça.', 'Dışa basarak itin.'], why: 'Yön değiştirme ve ayak hızı.', alt: ['ip-merdiven'], d: [5, 1, 'tekrar', '45 sn'] }),
  E({ id: 'tt-testi', name: 'T çeviklik koşusu', cat: 'ceviklik', m: ['quad', 'glute', 'adductor'], m2: ['calf', 'core'], env: ['saha'], eq: ['koni'], age: 12, lv: 2,
    steps: ['T şeklinde 4 koni dizin (10 m ileri, 5 m yana).', 'İleri koş, yana kay, geri koş.'], cues: ['Her koniye dönüşte alçalın.'], why: 'Çok yönlü çeviklik; test ve antrenman olarak kullanılır.', alt: ['zigzag-koni'], d: [4, 1, 'tekrar', '60 sn'] }),
  E({ id: 'mekik-5-10-5', name: '5–10–5 mekik koşusu', cat: 'ceviklik', m: ['quad', 'glute', 'hamstring'], m2: ['adductor', 'calf'], env: ['saha'], eq: ['koni'], age: 14, lv: 3,
    steps: ['Üç koniyi 5 m arayla dizin; ortada başlayın.', 'Sağa 5 m, sola 10 m, tekrar ortaya 5 m koşun.'], cues: ['Dönüşlerde alçak kalça.'], why: 'Hızlı yön değiştirme: futbolun ana hareketlerinden biri.', alt: ['tt-testi'], d: [4, 1, 'tekrar', '75 sn'] }),
  E({ id: 'reaktif-ceviklik', name: 'Sinyalli reaktif çeviklik', cat: 'ceviklik', m: ['quad', 'glute', 'calf'], m2: ['core'], env: ['saha'], eq: ['koni'], age: 12, lv: 3,
    steps: ['Eşiniz renk ya da yön söyler.', 'Duyduğunuz anda o yöne hızlıca hareket edin.'], cues: ['Hazır duruş.', 'Başı yukarıda.'], why: 'Maçtaki gibi sinyale tepki: karar ve hareketin birleşimi.', alt: ['zigzag-koni'], d: [5, 20, 'sn', '45 sn'] }),

  // ── Patlayıcı güç ─────────────────────────────────────
  E({ id: 'squat-jump', name: 'Çömelip sıçrama (squat jump)', cat: 'guc', m: ['quad', 'glute', 'calf'], m2: ['core'], env: HOME, age: 12, lv: 2,
    steps: ['Çömelin ve patlayıcı biçimde yukarı sıçrayın.', 'Yumuşak iniş: dizler bükülü, diz içe çökmeden.', 'Her tekrarda tam dinlenin.'], cues: ['İniş sessiz olsun.', 'Dizler ayak uçlarıyla aynı yönde.'], why: 'Zıplama, kafa vuruşu ve sprint gücü.', alt: ['kutu-sicrama'], d: [3, 6, 'tekrar', '60 sn'], caution: 'Yumuşak ve düz zeminde; kalite düşünce durun.' }),
  E({ id: 'kutu-sicrama', name: 'Kutuya sıçrama', cat: 'guc', m: ['quad', 'glute', 'calf'], m2: ['core'], env: ['salon', 'saha'], eq: ['kutu'], age: 14, lv: 3,
    steps: ['Alçak ve sağlam bir kutu önünde durun.', 'Kolları sallayıp kutuya iki ayakla sıçrayın.', 'Kutudan yürüyerek inin.'], cues: ['Kutu yüksekliği düşük başlasın.'], why: 'Dikey güç.', alt: ['squat-jump'], d: [3, 5, 'tekrar', '75 sn'], caution: 'Kutudan aşağı atlamayın; yürüyerek inin.' }),
  E({ id: 'yan-sicrama', name: 'Yan sıçrama (skater jump)', cat: 'guc', m: ['glute', 'quad', 'adductor'], m2: ['calf', 'core'], env: HOME, age: 12, lv: 2,
    steps: ['Bir ayak üstünde yana doğru sıçrayıp diğer ayakla inin.', 'Tek ayak üstünde dengeyi bir an tutun.'], cues: ['Yumuşak iniş.', 'Diz ayak ucuyla aynı yönde.'], why: 'Yanal güç ve yön değiştirme.', alt: ['yan-hamle'], d: [3, 8, 'tekrar', '60 sn'], side: true }),
  E({ id: 'tek-ayak-hop', name: 'Tek ayak sıçrama (hop)', cat: 'guc', m: ['calf', 'quad', 'glute'], m2: ['core'], env: HOME, age: 12, lv: 2,
    steps: ['Tek ayak üstünde ileri doğru kısa sıçramalar yapın.', 'Her inişte dengeyi koruyun.'], cues: ['Ayak bileği ve diz kontrollü.'], why: 'Tek bacak güç ve denge.', alt: ['squat-jump'], d: [3, 6, 'tekrar', '60 sn'], side: true }),
  E({ id: 'inis-calismasi', name: 'İniş tekniği (drop landing)', cat: 'onleme', m: ['quad', 'glute', 'calf'], m2: ['core'], env: HOME, age: 10, lv: 1,
    steps: ['Alçak bir basamaktan yürüyerek aşağı inip iki ayakla yumuşak yere basın.', 'Dizler bükülü, kalça geride, sırt düz.', 'Sessizce durup dengeyi tutun.'], cues: ['Dizler içe çökmesin.', 'Yumuşak ve sessiz iniş.'], why: 'Sakatlık önlemenin temeli: güvenli iniş mekaniği.', alt: ['squat-jump'], d: [3, 5, 'tekrar', '45 sn'] }),

  // ── Denge ve koordinasyon ──────────────────────────────
  E({ id: 'tek-ayak-denge', name: 'Tek ayak denge', cat: 'denge', m: ['core', 'calf'], m2: ['glute'], env: HOME, age: 6, lv: 1,
    steps: ['Tek ayak üstünde durun; diğer ayak havada.', '20–30 sn dengeyi koruyun.', 'Gözler açık, bakış sabit.'], cues: ['Kalça yatay.', 'Diz hafif bükülü.'], why: 'Ayak bileği ve kalça stabilitesi: sakatlık önlemede önemli.', alt: ['denge-top'], d: [3, 30, 'sn', '30 sn'], side: true }),
  E({ id: 'denge-top', name: 'Tek ayak denge + top atış', cat: 'denge', m: ['core', 'calf'], m2: ['glute', 'shoulder'], env: ['saha', 'ev'], eq: ['top'], age: 8, lv: 2,
    steps: ['Tek ayak üstünde durup eşinizle top atıp tutun.', 'Dengeyi koruyun.'], cues: ['Bakışı topta tutun.'], why: 'Dengeyi dikkat ve el-göz koordinasyonuyla birleştirir.', alt: ['tek-ayak-denge'], d: [3, 30, 'sn', '30 sn'], side: true }),
  E({ id: 'cok-yonlu-ziplama', name: 'Çok yönlü ip atlama', cat: 'denge', m: ['calf', 'core'], m2: ['quad'], env: HOME, age: 8, lv: 1,
    steps: ['Düşük sıçramalarla ip atlama taklidi yapın.', 'İleri, yana, geri yönlerinde deneyin.'], cues: ['Ayak uçlarında.', 'Dirsekler gövdeye yakın.'], why: 'Ayak bileği, baldır ve koordinasyon.', alt: ['ip-merdiven'], d: [3, 30, 'sn', '30 sn'] }),

  // ── Dayanıklılık ────────────────────────────────────────
  E({ id: 'surekli-kosu', name: 'Sürekli koşu (aerobik)', cat: 'dayaniklilik', m: ['quad', 'hamstring', 'calf'], m2: ['glute', 'core'], env: ['saha', 'ev'], age: 8, lv: 1,
    steps: ['Konuşabileceğiniz tempoda koşun.', 'Süreyi kademeli artırın.'], cues: ['Rahat ritim.'], why: 'Aerobik temel: maç boyunca tekrarlı sprint kapasitesinin zemini.', alt: ['aralikli-kosu'], d: [1, 20, 'dk', '—'] }),
  E({ id: 'aralikli-kosu', name: 'Aralıklı koşu (15 sn koş / 15 sn dinlen)', cat: 'dayaniklilik', m: ['quad', 'hamstring', 'calf'], m2: ['glute', 'core'], env: ['saha'], age: 12, lv: 2,
    steps: ['15 sn yüksek tempolu koşu, 15 sn yürüyüş.', 'Serileri tamamlayın.'], cues: ['Tempoyu tüm serilerde koruyun.'], why: 'Maçtaki dur-kalk yapısına uygun dayanıklılık.', alt: ['surekli-kosu'], d: [3, 8, 'tekrar', '2 dk'] }),
  E({ id: 'tekrarli-sprint', name: 'Tekrarlı sprint (6 × 30 m)', cat: 'dayaniklilik', m: ['hamstring', 'glute', 'quad'], m2: ['calf', 'core'], env: ['saha'], age: 15, lv: 3,
    steps: ['30 m sprint, 20–30 sn yürüyerek dinlenin.', 'Altı tekrar.'], cues: ['Her sprint kaliteli.'], why: 'Tekrarlı sprint kapasitesi: futbolda belirleyici özellik.', alt: ['aralikli-kosu'], d: [2, 6, 'tekrar', '3 dk'], caution: 'Ileri düzey; iyi ısınma gerekir.' }),
  E({ id: 'mekik-kosusu', name: '20 m mekik koşusu', cat: 'dayaniklilik', m: ['quad', 'hamstring', 'calf'], m2: ['glute', 'core'], env: ['saha'], eq: ['koni'], age: 10, lv: 2,
    steps: ['İki koni arası 20 m; tempolu gidip geri koşun.', 'Süreyi artırın.'], cues: ['Dönüşü kısa tutun.'], why: 'Dayanıklılık ve yön değiştirme.', alt: ['aralikli-kosu'], d: [4, 1, 'dk', '90 sn'] }),

  // ── Hareketlilik ve ısınma ──────────────────────────────
  E({ id: 'dinamik-isinma', name: 'Dinamik ısınma (10 dk)', cat: 'mobilite', m: ['quad', 'hamstring', 'glute'], m2: ['calf', 'core', 'hipflex'], env: ['saha', 'ev'], age: 6, lv: 1,
    steps: ['Hafif koşu 3 dk.', 'Bacak sallama, topuk-kalça, yürüyüş hamlesi, yan adımlar.', 'Kısa ivmelenmelerle bitirin.'], cues: ['Soğuk kasla tam hız yok.'], why: 'Kasları hazırlar, sakatlık riskini azaltmaya yardımcı olur.', alt: ['fifa11'], d: [1, 10, 'dk', '—'] }),
  E({ id: 'bacak-sallama', name: 'Bacak sallama (leg swing)', cat: 'mobilite', m: ['hamstring', 'hipflex'], m2: ['glute', 'adductor'], env: HOME, age: 6, lv: 1,
    steps: ['Duvara tutunun; bacağı ileri-geri sallayın.', 'Yan yana (içe-dışa) sallayın.'], cues: ['Dengeli.', 'Sallama aralığını kademeli artırın.'], why: 'Kalça hareketliliği; sprint öncesi.', alt: ['dinamik-isinma'], d: [2, 10, 'tekrar', '15 sn'], side: true }),
  E({ id: 'dunyanin-en-iyi', name: 'Dünyanın en iyi esneme hareketi', cat: 'mobilite', m: ['hipflex', 'glute', 'hamstring'], m2: ['back', 'adductor'], env: HOME, age: 8, lv: 1,
    steps: ['Derin hamle pozisyonuna geçin.', 'İç taraftaki dirseği yere yaklaştırıp gövdeyi açın.', 'Diğer tarafa dönün.'], cues: ['Yavaş ve kontrollü.'], why: 'Kalça, sırt ve bacak hareketliliği.', alt: ['dinamik-isinma'], d: [2, 5, 'tekrar', '15 sn'], side: true }),
  E({ id: 'derin-comelme-durus', name: 'Derin çömelme duruşu', cat: 'mobilite', m: ['hipflex', 'adductor'], m2: ['quad', 'glute'], env: HOME, age: 6, lv: 1,
    steps: ['Derin çömelme pozisyonunda 20–30 sn bekleyin.', 'Dirseklerle dizleri hafifçe iterek kalçayı açın.'], cues: ['Topuklar yerde.'], why: 'Kalça ve ayak bileği hareketliliği.', alt: ['comelme'], d: [3, 20, 'sn', '20 sn'] }),

  // ── Önleme (FIFA 11+ benzeri) ────────────────────────────
  E({ id: 'fifa11', name: 'FIFA 11+ ısınma programı', cat: 'onleme', m: ['core', 'hamstring', 'adductor'], m2: ['quad', 'calf', 'glute'], env: ['saha'], age: 14, lv: 2,
    steps: ['Koşu egzersizleri (kısa koşu, kalça açma, geçişler).', 'Kuvvet, plyometrik ve denge egzersizleri (plank, Nordic, tek ayak denge, sıçramalar).', 'Hızlı koşu ve kesme hareketleriyle bitirin.'],
    cues: ['Haftada en az 2–3 kez uygulanır; resmî kılavuzu inceleyin.'], why: 'FIFA’nın tıp merkezinin (F-MARC) geliştirdiği, takımlarla tamamlanması yaklaşık 20 dakika süren ve araştırmalarda yaralanmaları azaltmayla ilişkilendirilen ısınma programıdır.', alt: ['dinamik-isinma'], d: [1, 20, 'dk', '—'],
    caution: 'Resmî programın ayrıntıları için FIFA kaynaklarına başvurun; burada özet olarak sunulmuştur.' }),

  // ── Toparlanma ────────────────────────────────────────────
  E({ id: 'soguma-yuruyus', name: 'Soğuma yürüyüşü ve hafif koşu', cat: 'toparlanma', m: ['quad', 'calf'], m2: ['hamstring'], env: ['saha', 'ev'], age: 6, lv: 1,
    steps: ['Antrenmandan sonra 5–10 dk hafif tempoyla yürüyün/koşun.', 'Kalp atışını kademeli düşürün.'], cues: ['Rahat nefes.'], why: 'Kalp atışını sakinleştirir; toparlanmanın ilk adımı.', alt: ['statik-esneme'], d: [1, 8, 'dk', '—'] }),
  E({ id: 'statik-esneme', name: 'Statik esneme (antrenman sonrası)', cat: 'toparlanma', m: ['hamstring', 'quad', 'hipflex'], m2: ['calf', 'adductor', 'glute'], env: HOME, age: 8, lv: 1,
    steps: ['Hamstring, kuadriseps, kalça önü ve baldırı 20–30 sn tutarak esnetin.', 'Ağrı değil hafif gerilme hissedin.'], cues: ['Nefes verin.', 'Sallanmayın.'], why: 'Antrenman sonrası gevşeme ve hareket açıklığı.', alt: ['soguma-yuruyus'], d: [2, 25, 'sn', '15 sn'], side: true }),
  E({ id: 'kopuk-silindir', name: 'Köpük silindir (foam roller) masajı', cat: 'toparlanma', m: ['quad', 'hamstring', 'calf'], m2: ['glute', 'back'], env: ['ev', 'salon'], eq: ['salon'], age: 12, lv: 1,
    steps: ['Silindiri kas altına yerleştirin; yavaşça ileri-geri yuvarlayın.', 'Hassas noktada 20–30 sn durun.'], cues: ['Eklem ya da kemik üzerinde yuvarlamayın.', 'Ağrı değil rahatlama hedefleyin.'], why: 'Kas gevşemesine ve toparlanma hissine yardımcı olabilir.', alt: ['statik-esneme'], d: [1, 60, 'sn', '—'], caution: 'Şiddetli ağrı varsa durun, gerekirse hekime danışın.' }),
  E({ id: 'nefes-gevseme', name: 'Derin nefes ve gevşeme', cat: 'toparlanma', m: ['core'], env: ['ev'], age: 6, lv: 1,
    steps: ['Sırtüstü yatıp 4 sn nefes alıp 6 sn verin.', '2–3 dakika boyunca tekrarlayın.'], cues: ['Karından nefes.'], why: 'Sinir sistemini dinlendirir; uyku ve toparlanmaya yardımcı.', alt: ['statik-esneme'], d: [1, 3, 'dk', '—'] }),
];

export const EX_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export function validateExercises(): string[] {
  const out: string[] = [];
  for (const e of EXERCISES) for (const a of e.alt) if (!EX_BY_ID[a]) out.push(`${e.id}: bilinmeyen alternatif ${a}`);
  return out;
}
