import { groundY, poseKeys } from '@/lib/motion/author';
import { groundYRigid, nearIkToFk } from '@/lib/motion/author-fk';
import type { TechMotion } from '@/lib/motion/timeline';

// Yerden iç yüz pas (data/techniques/pas.ts, id: yerden-ic-yuz-pas, foot: ['ic']).
//   Hazırlık : topa yürüyüş; basma (sol) ayak topun yanına, topla aynı hizaya, ayak ucu hedefe dönük basılır;
//              vuran (sağ) ayak geriye alınır, ucu dışarı çevrilir, bilek kilitlenir.
//   Temas    : ayağın iç yüzünün geniş kısmı topun ortasına (yükseklik = top merkezi) değer; top yerde kalır.
//   Takip    : ayak hedefe doğru uzanır, sonra yere basılıp oyuncu destek vermek için ilerler.
// Dünya: x ileri (m), y yukarı. Sağ ayaklı oyuncu, kamera oyuncunun sağında. Top temasa kadar yerde durur (merkez y = 0,11).
// Temas anı geometrisi (pelvis x = 0,79; ny = 66°, ayak eğimi +5°) lib/motion/rig.ts zoneContact ile çözüldü:
// vuran bilek (0,94; 0,144), top merkezi (1,10; 0,11; z = −0,011). Basma bilek x = 0,96 (topla aynı hizada).
const GR = (p: number) => groundYRigid(p);

export const YERDEN_IC_YUZ_PAS: TechMotion = {
  id: 'yerden-ic-yuz-pas',
  label: 'Yerden iç yüz pas: topun ortasına iç yüzle temas ve hedefe takip',
  dur: 3.0,
  tc: 1.5,
  win: [0.12, 0.26],
  legs: ['fk', 'ik'],
  cam: -0.6,
  zones: ['ic'],
  contact: 'ic',
  plan: {},
  caps: [
    'Basma ayağınızı topun yanına, topla aynı hizaya basın; ayak ucu hedefe dönük olsun. Vuran ayağın ucunu dışarı çevirip bileğinizi kilitleyin, gözünüz topta olsun.',
    'İç yüzün geniş kısmıyla topun tam ortasına temas edin; bilek kilitli, vücut topun üstünde. Top yerde, hedefe doğru yuvarlanır.',
    'Vuruştan sonra ayağınızı hedefe doğru uzatın (takip hareketi) ve hemen destek vermek için harekete geçin.',
  ],
  keys: nearIkToFk(poseKeys([
    // hazır duruş: sağ ayak geride, sol ayak önde, yer düz
    { t: 0, px: 0.08, py: 0.945, tr: 4, hd: -2, as: 4, ae: 14, bs: -4, be: 14, n0: -0.04, n1: 0.099, n2: 0, ny: 8, f0: 0.2, f1: 0.099, f2: 0, fy: 8 },
    { t: 0.1 },
    // sağ ayak adımı: topuk kalkar, ayak savrulur, topuk yere değer (0.1 → 0.72)
    { t: 0.18, px: 0.13, py: 0.94, n0: -0.02, n1: GR(-25), n2: -25, as: -8, bs: 14 },
    { t: 0.38, px: 0.23, py: 0.936, tr: 6, n0: 0.25, n1: 0.19, n2: -2, as: -16, ae: 18, bs: 20, be: 24 },
    { t: 0.54, px: 0.3, py: 0.932, n0: 0.51, n1: 0.13, n2: 14 },
    { t: 0.62, px: 0.35, py: 0.928, n0: 0.535, n1: GR(15), n2: 15, as: -12, bs: 14 },
    { t: 0.72, px: 0.41, py: 0.93, n0: 0.56, n1: 0.099, n2: 0 },
    // sol (basma) ayak adımı: topun yanına, topla aynı hizaya yerleşir (0.72 → 1.24)
    { t: 0.76, px: 0.43, f0: 0.205, f1: groundY(-8), f2: -8 },
    { t: 0.8, px: 0.45, f0: 0.22, f1: groundY(-22), f2: -22, as: 8, bs: -8 },
    { t: 0.94, px: 0.55, py: 0.936, f0: 0.6, f1: 0.185, f2: 0, as: 16, ae: 20, bs: -14, be: 14 },
    { t: 1.0, px: 0.595 },
    // vuran ayak geriye alınır: topuk kalkar, diz bükülür, ayak gövdenin arkasına çekilir (1.06 → 1.22)
    { t: 1.06, px: 0.64, f0: 0.8, f1: 0.13, f2: 14, n0: 0.555, n1: GR(-12), n2: -12 },
    { t: 1.1, px: 0.67, n0: 0.545, n1: GR(-24), n2: -24 },
    { t: 1.14, px: 0.7, py: 0.92, f0: 0.855, f1: groundY(15), f2: 15 },
    { t: 1.17, px: 0.72, n0: 0.5, n1: 0.21, n2: -36, hd: 20 },
    // geri salınım yumuşakça yükselir (1.16 → 1.22), sonra ayak ileri hızlanır: hız temasta en yüksek (1.22 → 1.5)
    { t: 1.22, px: 0.76, f0: 0.86, f1: 0.099, f2: 0, n0: 0.45, n1: 0.31, n2: -50, ny: 20, tr: 8, hd: 22, as: 6, ae: 22, bs: 4, be: 26 },
    { t: 1.3, px: 0.775, n0: 0.5, n1: 0.3, n2: -46, ny: 24, tr: 9, hd: 24, as: 10, ae: 24, bs: -4, be: 30 },
    { t: 1.38, px: 0.785, n0: 0.61, n1: 0.25, n2: -34, ny: 38, tr: 10, hd: 26, as: -8, ae: 20, bs: 16, be: 34 },
    { t: 1.44, px: 0.79, n0: 0.74, n1: 0.2, n2: -18, ny: 54 },
    // temas: iç yüz topun ortasında (ayak eğimi +5°, ny 66°)
    { t: 1.5, px: 0.79, py: 0.915, n0: 0.94, n1: 0.144, n2: 5, ny: 66, tr: 10.5, hd: 28, as: -16, ae: 18, bs: 24, be: 38 },
    // takip: ayak hedefe uzanır, sonra yere basar
    { t: 1.56, px: 0.83, py: 0.918, n0: 1.14, n1: 0.15, n2: 2, ny: 62, tr: 11, hd: 24 },
    { t: 1.64, px: 0.92, py: 0.92, n0: 1.3, n1: 0.17, n2: -4, ny: 58, hd: 18 },
    { t: 1.76, px: 0.98, n0: 1.4, n1: 0.22, n2: -10, ny: 48, tr: 11, hd: 10, as: -22, bs: 30 },
    { t: 1.82, px: 1.03, f1: groundY(-8), f2: -8 },
    { t: 1.9, px: 1.1, n0: 1.42, n1: 0.14, n2: 4, ny: 30, tr: 8, hd: 2, as: -12, bs: 18, f1: groundY(-22), f2: -22 },
    { t: 2.0, px: 1.17, py: 0.93, n0: 1.42, n1: GR(15), n2: 15, ny: 14, tr: 6, hd: -2, as: 0, bs: 4, f0: 1.1, f1: 0.2, f2: -18 },
    { t: 2.1, px: 1.23, n0: 1.42, n1: 0.099, n2: 0, ny: 8, as: 12, ae: 18, bs: -10, be: 16 },
    { t: 2.2, px: 1.29, f0: 1.43, f1: 0.22, f2: -6 },
    { t: 2.4, px: 1.42, f0: 1.63, f1: 0.15, f2: 14 },
    { t: 2.46, px: 1.46, f0: 1.65, f1: groundY(15), f2: 15, n1: GR(-10), n2: -10 },
    { t: 2.52, px: 1.5, f0: 1.66, f1: 0.099, f2: 0, n0: 1.45, n1: GR(-22), n2: -22, as: -4, bs: 6 },
    { t: 2.7, px: 1.63, n0: 1.58, n1: 0.19, n2: -2, as: -12, bs: 14 },
    { t: 3.0, px: 1.83, n0: 1.98, n1: 0.13, n2: 14, ny: 8 },
  ])),
  ball: [
    // top temasa kadar yerde durur; z = temas yüzeyindeki derinlik
    { t: 0, x: 1.1, y: 0.11, z: -0.011 },
    { t: 1.5, x: 1.1, y: 0.11, z: -0.011 },
    // vuruş: top yerde, ileri yuvarlanır; yavaşlar
    { t: 1.5, x: 1.1, y: 0.11, z: -0.011, vx: 4.4, cut: true },
    { t: 1.8, x: 2.35, y: 0.11, z: -0.011 },
    { t: 2.2, x: 3.45, y: 0.11, z: -0.011 },
    { t: 3.0, x: 4.5, y: 0.11, z: -0.011 },
  ],
};
