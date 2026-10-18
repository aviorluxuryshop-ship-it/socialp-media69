// Teknik hareket verisini yazarken kullanılan küçük yardımcılar (React yok, DOM yok).
//
// Anahtar kareler yalnızca DEĞİŞEN kanalları yazar; yazılmayan kanal bir önceki anahtardaki değeri korur
// (ilk anahtarda STAND). Böylece "basma ayağı yerinde durur" gibi bekleme durumları kendiliğinden doğru olur:
// iki anahtar arasında değer değişmiyorsa eğri tam sabit kalır (kayma yok).
//
// Kanal sözlüğü (ayrıntı için lib/motion/rig.ts başına bakın):
//   px, py      pelvis (kalça merkezi) dünya konumu, m (x ileri, y yukarı)
//   tr, hd      gövde eğimi (dikeyden, + öne) ve baş eğimi (gövdeye göre, + öne/aşağı), derece
//   as, ae      YAKIN (sağ) kol: omuzdan sarkma açısı (+ ileri) ve dirsek bükülmesi, derece
//   bs, be      UZAK (sol) kol, aynı anlam
//   n0, n1, n2  YAKIN (sağ, vuran) bacak. IK kipinde: bilek x (m), bilek y (m), ayak eğimi (derece, + parmak yukarı)
//               FK kipinde: kalça açısı, diz bükülmesi, bilek (derece)
//   ny          yakın ayağın dışa dönüşü (derece; 0 düz, ~65–90 iç yüz konumu)
//   f0, f1, f2  UZAK (sol, basma) bacak, n0..n2 ile aynı anlam; fy dışa dönüş
import { CHANNELS, footLowest, solveLegIK, type Pose, type PoseKey } from './rig';

/** Rahat bir hazır duruş (IK bacaklar yerde düz, kollar hafif bükülü). */
export const STAND: Pose = {
  px: 0,
  py: 0.95,
  tr: 4,
  hd: 0,
  as: 6,
  ae: 14,
  bs: -6,
  be: 14,
  n0: -0.1,
  n1: 0.099,
  n2: 0,
  ny: 8,
  f0: 0.1,
  f1: 0.099,
  f2: 0,
  fy: 8,
};

export type KeyDef = { t: number } & Partial<Pose>;

/** Kısmi anahtarları tam PoseKey'e çevirir (eksik kanal = önceki anahtarın değeri). */
export function poseKeys(defs: readonly KeyDef[], base: Pose = STAND): PoseKey[] {
  let cur: Pose = { ...base };
  return defs.map((d) => {
    const next = { ...cur };
    for (const c of CHANNELS) if (d[c] !== undefined) next[c] = d[c] as number;
    cur = next;
    return { t: d.t, p: { ...next } };
  });
}

/**
 * IK bacakta, ayağın en alçak noktası (çivi ucu) tam yere değsin diye gereken bilek yüksekliği (m).
 * pitch: ayak eğimi (derece, + parmak yukarı; − topuk kalkık), yaw: dışa dönüş. Düz ayakta 0.099.
 * Örn. topuk kalkarken { n1: groundY(-24) }, topuk vuruşunda { n1: groundY(15) }.
 */
export function groundY(pitch: number, yaw = 0): number {
  const leg = solveLegIK([0, 1.0], 0, 0.15, pitch, yaw, 1);
  return Math.round((0.15 - footLowest(leg.foot)) * 1000) / 1000;
}
