import type { Exercise } from '@/data/exercises';
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
      'Set ve tekrar düşük tutulur; yorulmadan bırakılır. Maksimum efor ve yarışma tarzı yüklenme yoktur.',
      'Antrenmanda kafa vuruşu çalışılmaz (FA 2020 yönergesi).',
    ],
  },
  '12-14': {
    title: 'Ergen (12–14 yaş)',
    rules: [
      'Teknik öğrenme önceliklidir: vücut ağırlığı ve hafif bantla 1–2 set, 8–12 tekrar.',
      'Yoğun sıçrama (plyometri) ve ağır yük yoktur; iniş tekniği çalışılır.',
      'Antrenör ya da uzman gözetimi önerilir; kafa çalışması sınırlı ve kademelidir (FA 2020).',
      'Haftada en az 3 gün kas-kemik güçlendirici aktivite (WHO).',
    ],
  },
  '15-17': {
    title: 'Genç (15–17 yaş)',
    rules: [
      'Gözetim altında hafif–orta yük ve 2–3 set, 8–12 tekrar. Teknik bozulursa set biter.',
      'Maksimum (1 tekrar) denemeleri, yarışma tarzı halter ve güç kaldırma yoktur (AAP 2008).',
      'Isınma, iniş tekniği ve sakatlık önleme (FIFA 11+) her çalışmanın parçası olur.',
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
  'Bu program genel eğitim amaçlıdır; tıbbi tavsiye değildir. Sağlık sorununuz varsa başlamadan önce hekime danışın.',
  'Ağrı, baş dönmesi, nefes darlığı, hastalık ya da yaralanma durumunda çalışmayı bırakın.',
  'Isınmadan yoğun çalışmaya başlamayın; çalışma sonrası soğuma ve su tüketimini ihmal etmeyin.',
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

/** Çocuk/ergen için uygun mu? */
export function allowedFor(ex: Exercise, age: number): boolean {
  if (age < ex.minAge) return false;
  if (age < 12) {
    const loaded = ex.equip.includes('dambil') || ex.equip.includes('salon') || ex.equip.includes('barfiks') || ex.equip.includes('kutu');
    if (loaded) return false;
    if (ex.cat === 'guc' && ex.id !== 'inis-calismasi') return false;
  }
  if (age < 15 && ex.equip.includes('salon')) return false;
  return true;
}
