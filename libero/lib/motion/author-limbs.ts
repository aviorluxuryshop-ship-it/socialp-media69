// Teknik hareket verisini uzuv (grup) başına ayrı anahtar listeleriyle yazmak için yardımcı (React yok, DOM yok).
//
// `poseKeys` (author.ts) tek bir zaman çizelgesinde tüm kanalları taşır: bir uzuv hareket ederken başka bir uzvun anahtarı
// araya girerse, hareket eden uzvun değeri o anahtarda "beklemek" zorunda kalır. Koşu ve vuruş gibi uzuvların farklı
// zamanlarda hareket ettiği hareketlerde bu, eğrileri bozar. `limbKeys` her grubun kendi anahtarlarını kendi zamanında
// yazdırır; her kanalın kendi yumuşak eğrisi (interp.ts) birleşik zaman kümesinde örneklenip tam `PoseKey` listesi üretilir.
// Böylece "iki anahtar arasında değer aynı" → eğri tam sabit (basma ayağı kaymaz) kuralı grup içinde aynen geçerlidir.
//
// Gruplar ve kanalları:
//   body : px, py, tr, hd        (pelvis konumu, gövde ve baş eğimi)
//   armN : as, ae                (yakın/sağ kol)
//   armF : bs, be                (uzak/sol kol)
//   near : n0, n1, n2, ny        (yakın/sağ bacak)
//   far  : f0, f1, f2, fy        (uzak/sol bacak)
// Bir grubun anahtarında yazılmayan kanal, aynı grubun önceki anahtarındaki değeri korur (ilk anahtarda STAND).
import { CHANNELS, type Chan, type Pose, type PoseKey } from './rig';
import { evalSpline, spline } from './interp';
import { STAND, type KeyDef } from './author';

export type LimbGroup = 'body' | 'armN' | 'armF' | 'near' | 'far';

export const LIMB_CHANNELS: Record<LimbGroup, readonly Chan[]> = {
  body: ['px', 'py', 'tr', 'hd'],
  armN: ['as', 'ae'],
  armF: ['bs', 'be'],
  near: ['n0', 'n1', 'n2', 'ny'],
  far: ['f0', 'f1', 'f2', 'fy'],
};

const r4 = (x: number) => Math.round(x * 10000) / 10000;

/**
 * @param groups  her grubun anahtarları (zamanı artan); hiçbir grup yazılmazsa o grubun kanalları STAND değerinde kalır
 * @param dur     hareketin süresi: son anahtar mutlaka bu zamanda üretilir (doğrulayıcı t=0 ve t=dur ister)
 */
export function limbKeys(groups: Partial<Record<LimbGroup, readonly KeyDef[]>>, dur: number, base: Pose = STAND): PoseKey[] {
  const times = new Set<number>([0, dur]);
  const tracks = {} as Record<Chan, { t: number[]; v: number[] }>;
  for (const c of CHANNELS) tracks[c] = { t: [0], v: [base[c]] };
  for (const g of Object.keys(LIMB_CHANNELS) as LimbGroup[]) {
    const defs = groups[g];
    if (!defs) continue;
    const cur: Partial<Pose> = {};
    for (const c of LIMB_CHANNELS[g]) cur[c] = base[c];
    for (const d of defs) {
      times.add(d.t);
      for (const c of LIMB_CHANNELS[g]) {
        if (d[c] !== undefined) cur[c] = d[c] as number;
        const tr = tracks[c];
        if (d.t === tr.t[tr.t.length - 1]) tr.v[tr.v.length - 1] = cur[c] as number; // aynı zamanda ikinci yazım: sonuncusu geçerli
        else {
          tr.t.push(d.t);
          tr.v.push(cur[c] as number);
        }
      }
    }
  }
  const sp = {} as Record<Chan, ReturnType<typeof spline>>;
  for (const c of CHANNELS) {
    const tr = tracks[c];
    if (tr.t[tr.t.length - 1] < dur) {
      tr.t.push(dur);
      tr.v.push(tr.v[tr.v.length - 1]);
    }
    sp[c] = spline(tr.t, tr.v, 'rest');
  }
  return [...times]
    .sort((a, b) => a - b)
    .map((t) => {
      const p = {} as Pose;
      for (const c of CHANNELS) p[c] = r4(evalSpline(sp[c], t));
      return { t, p };
    });
}
