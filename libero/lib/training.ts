import type { Exercise } from '@/data/exercises';
import { EQUIP_MIN_AGE } from './environments';
import type { Level } from './types';
import type { AgeBand } from './program-types';

export function ageBand(age: number): AgeBand {
  if (age < 12) return 'u12';
  if (age < 15) return '12-14';
  if (age < 18) return '15-17';
  return '18+';
}

export const BAND_NAME: Record<AgeBand, string> = {
  u12: '11 yaş ve altı',
  '12-14': '12–14 yaş',
  '15-17': '15–17 yaş',
  '18+': '18 yaş ve üstü',
};

export const BAND_RULES: Record<AgeBand, { title: string; rules: string[] }> = {
  u12: {
    title: 'Çocuk (11 yaş ve altı)',
    rules: [
      'Amaç: hareket becerisi, oyun ve eğlence. Ağırlık kullanılmaz; vücut ağırlığı, top ve oyun temelli çalışmalar.',
      'Günlük hedef: gün içinde toplam yaklaşık 60 dakika orta-yüksek şiddette hareket (WHO). Antrenman bunun yalnızca bir parçasıdır.',
      'Set ve tekrar düşük tutulur; yorulmadan bırakılır. Maksimum efor, zamana karşı en çok tekrar ve yarışma tarzı yüklenme yoktur.',
      'Antrenmanda kafa vuruşu çalışılmaz (FA yönergesi: U7–U11 antrenmanda kafa vuruşu tanıtılmaz).',
    ],
  },
  '12-14': {
    title: 'Ergen (12–14 yaş)',
    rules: [
      'Teknik öğrenme önceliklidir: vücut ağırlığı ve hafif bantla 1–2 set, 8–12 tekrar; yorulup teknik bozulduğunda set biter.',
      'Ağır yük, maksimum deneme ve yoğun sıçrama (plyometri) yoktur; iniş tekniği çalışılır.',
      'Antrenör ya da uzman gözetimi önerilir (AAP 2020, NSCA 2009). Gözetim, uygun ekipman ve güvenli ortam yoksa yüklü egzersiz yapılmaz.',
      'Kafa vuruşu çalışması çok düşük önceliklidir: FA yönergesine göre 12–13 yaşta gerekirse haftada en fazla 1 oturum, hafif top, en fazla 5 kafa vuruşu ve rakipsiz.',
      'Haftada en az 3 gün kas-kemik güçlendirici aktivite (WHO); direnç çalışması haftada 2–3 ardışık olmayan günde yapılır.',
    ],
  },
  '15-17': {
    title: 'Genç (15–17 yaş)',
    rules: [
      'Gözetim altında hafif–orta yük ve 2–3 set, 8–12 tekrar. Son 2 tekrar zorlayıcı ama teknik bozulmadan bitecek bir ağırlık seçilir; teknik bozulursa set biter.',
      'Maksimum (1 tekrar) denemeleri ve test edilmesi yoktur. Ağır yüklere yalnızca kanıtlanmış teknik yeterlilikle ve uzman gözetiminde geçilir (BJSM 2014 uzlaşı metni).',
      'Zamana karşı en çok tekrar, tükenene dek devre ve yüksek şiddetli “metabolik” antrenmanlar önerilmez; AAP 2020, bunların çocuk ve ergenlerde güvenliğinin belirsiz olduğunu belirtir.',
      'Isınma, iniş tekniği ve sakatlık önleme (FIFA 11+) her çalışmanın parçası olur.',
      'Kafa vuruşu çalışması: FA yönergesine göre 14–16 yaşta haftada en fazla 1 oturum ve oturum başına en fazla 10 vuruş.',
      'Büyüme dönemindeki ağrılarda çalışmayı durdurun ve hekime danışın.',
    ],
  },
  '18+': {
    title: 'Yetişkin (18 yaş ve üstü)',
    rules: [
      'Standart programlar: kuvvet için 3–4 set, güç ve sürat için yüksek kalite düşük tekrar.',
      'İlerlemeyi kademeli yapın; haftalık yükü bir anda artırmayın.',
      'Isınma, uyku ve toparlanma ihmal edilmez.',
    ],
  },
};

export const GENERAL_SAFETY = [
  'Bu program genel eğitim amaçlıdır; tıbbi tavsiye değildir. Sağlık sorununuz varsa başlamadan önce hekime danışın; kontrolsüz yüksek tansiyon ya da kalp-damar rahatsızlığı gibi durumlarda yüklü çalışmaya hekim onayıyla başlayın (AAP 2020).',
  'Ağrı, baş dönmesi, nefes darlığı, hastalık ya da yaralanma durumunda çalışmayı bırakın.',
  'Isınmadan (5–10 dk dinamik ısınma) yoğun çalışmaya başlamayın; çalışma sonrası soğuma ve su tüketimini ihmal etmeyin.',
  'Çocuk ve gençler yük, sıçrama ve ev ekipmanıyla gözetimsiz çalışmamalıdır: uygun olmayan ekipman ve gözetimsizlik yaralanmanın başlıca nedenidir (NSCA 2009).',
];

export interface Dose {
  sets: number;
  reps: number;
  unit: Exercise['unit'];
  rest: string;
  text: string;
  note?: string;
}

const roundTo = (n: number, step: number) => Math.max(step, Math.round(n / step) * step);

/** Yaş bandı ve seviyeye göre set/tekrar/süre/dinlenme. */
export function doseFor(ex: Exercise, band: AgeBand, level: Level): Dose {
  let sets = ex.sets;
  let reps = ex.reps;
  let rest = ex.rest;
  let note: string | undefined;
  const timeLike = ex.unit === 'sn' || ex.unit === 'dk';

  if (band === 'u12') {
    sets = Math.min(sets, ex.cat === 'dayaniklilik' || ex.cat === 'toparlanma' || ex.cat === 'mobilite' ? sets : 2);
    if (ex.unit === 'tekrar') reps = Math.min(reps, 10);
    if (ex.unit === 'sn') reps = Math.min(reps, 20);
    if (ex.unit === 'dk') reps = Math.min(reps, 15);
    rest = ex.rest === '—' ? '—' : '45–60 sn';
    note = 'Oyunsal ve rahat tempo; yorulmadan bırakın.';
  } else if (band === '12-14') {
    sets = Math.min(sets, 2);
    if (ex.unit === 'tekrar') reps = Math.min(reps, 12);
    if (ex.unit === 'sn') reps = Math.min(reps, 30);
    if (ex.unit === 'dk') reps = Math.min(reps, 20);
    note = 'Teknik önce: son tekrarlar da temiz olmalı.';
  } else if (band === '15-17') {
    sets = Math.min(sets, 3);
    if (ex.unit === 'tekrar') reps = Math.min(reps, 12);
    if (ex.unit === 'sn') reps = Math.min(reps, 45);
    if (ex.unit === 'dk') reps = Math.min(reps, 25);
  }

  // seviye ayarı (yalnızca ek yük/tempo hacmi): 1–2★ bir set eksik, 5★ bir set fazla (bantın üst sınırı içinde)
  if (!timeLike || ex.cat === 'dayaniklilik') {
    if (level <= 2 && sets > 1) sets -= 1;
    else if (level === 5 && band === '18+') sets += 1;
  }
  if (ex.cat === 'dayaniklilik' && ex.unit === 'dk') {
    reps = roundTo(reps * (level <= 2 ? 0.8 : level >= 4 ? 1.2 : 1), 1);
  }

  const per = ex.perSide ? ' (her taraf)' : '';
  let text: string;
  if (ex.unit === 'tekrar') text = sets > 1 ? `${sets} × ${reps} tekrar${per}` : `${reps} tekrar${per}`;
  else if (ex.unit === 'sn') text = `${sets} × ${reps} sn${per}`;
  else if (ex.unit === 'm') text = `${sets} × ${reps} m`;
  else text = `${reps} dk`;
  if (ex.cat === 'hiz' && ex.unit === 'tekrar' && ex.reps === 1) text = `${sets} × ${ex.id.includes('10m') ? '10 m' : ex.id.includes('direncli') ? '10–15 m' : '20–30 m'} sprint`;
  return { sets, reps, unit: ex.unit, rest, text, note };
}

/** Çocuk/ergen için uygun mu? Yaş, egzersizin ve gerektirdiği ekipmanın en erken yaşına bağlıdır. */
export function allowedFor(ex: Exercise, age: number): boolean {
  if (age < ex.minAge) return false;
  for (const q of ex.equip) if (age < EQUIP_MIN_AGE[q]) return false;
  if (age < 12 && ex.cat === 'guc' && ex.id !== 'inis-calismasi') return false;
  return true;
}

/** Bir yaş bandında (bandın en büyük yaşıyla) egzersiz önerilebilir mi? */
export function allowedInBand(ex: Exercise, band: AgeBand): boolean {
  const top: Record<AgeBand, number> = { u12: 11, '12-14': 14, '15-17': 17, '18+': 18 };
  return allowedFor(ex, top[band]);
}
