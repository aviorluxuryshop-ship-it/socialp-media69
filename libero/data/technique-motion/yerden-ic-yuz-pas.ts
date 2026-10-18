import { groundY, poseKeys } from '@/lib/motion/author';
import type { TechMotion } from '@/lib/motion/timeline';

// Yerden iç yüz pas (data/techniques/pas.ts, id: yerden-ic-yuz-pas, foot: ['ic']).
//   Hazırlık : topa yürüyüş; basma (sol) ayak topun yanına, topla aynı hizaya, ayak ucu hedefe dönük basılır;
//              vuran (sağ) ayak geriye alınır, ucu dışarı çevrilir, bilek kilitlenir.
//   Temas    : ayağın iç yüzünün geniş kısmı topun ortasına (yükseklik = top merkezi) değer; top yerde kalır.
//   Takip    : ayak hedefe doğru uzanır, sonra yere basılıp oyuncu destek vermek için ilerler.
// Dünya: x ileri (m), y yukarı. Sağ ayaklı oyuncu, kamera oyuncunun sağında. Top temasa kadar yerde durur (merkez y = 0,11).
// Temas anı geometrisi (pelvis x = 1,21; ny = 66°, ayak eğimi +5°) lib/motion/rig.ts zoneContact ile çözüldü:
// vuran bilek (1,36; 0,144), top merkezi (1,52; 0,11; z = −0,011). Basma bilek x = 1,38 (topla aynı hizada).
export const YERDEN_IC_YUZ_PAS: TechMotion = {
  id: 'yerden-ic-yuz-pas',
  label: 'Yerden iç yüz pas: topun ortasına iç yüzle temas ve hedefe takip',
  dur: 3.0,
  tc: 1.5,
  win: [0.12, 0.26],
  legs: ['ik', 'ik'],
  cam: -0.8,
  zones: ['ic'],
  contact: 'ic',
  plan: {},
  caps: [
    'Basma ayağınızı topun yanına, topla aynı hizaya basın; ayak ucu hedefe dönük olsun. Vuran ayağın ucunu dışarı çevirip bileğinizi kilitleyin, gözünüz topta olsun.',
    'İç yüzün geniş kısmıyla topun tam ortasına temas edin; bilek kilitli, vücut topun üstünde. Top yerde, hedefe doğru yuvarlanır.',
    'Vuruştan sonra ayağınızı hedefe doğru uzatın (takip hareketi) ve hemen destek vermek için harekete geçin.',
  ],
  keys: poseKeys([
    // hazır duruş: sağ ayak geride, sol ayak önde, yer düz
    { t: 0, px: 0.5, py: 0.945, tr: 4, hd: -2, as: 4, ae: 14, bs: -4, be: 14, n0: 0.38, n1: 0.099, n2: 0, ny: 8, f0: 0.62, f1: 0.099, f2: 0, fy: 8 },
    { t: 0.1 },
    // sağ ayak adımı: topuk kalkar, ayak savrulur, topuk yere değer (0.1 → 0.72)
    { t: 0.18, px: 0.55, py: 0.94, n0: 0.4, n1: groundY(-25), n2: -25, as: -8, bs: 14 },
    { t: 0.38, px: 0.65, py: 0.936, tr: 6, n0: 0.67, n1: 0.19, n2: -2, as: -16, ae: 18, bs: 20, be: 24 },
    { t: 0.54, px: 0.72, py: 0.932, n0: 0.93, n1: 0.13, n2: 14 },
    { t: 0.62, px: 0.77, py: 0.928, n0: 0.955, n1: groundY(15), n2: 15, as: -12, bs: 14 },
    { t: 0.72, px: 0.83, py: 0.93, n0: 0.98, n1: 0.099, n2: 0 },
    // sol (basma) ayak adımı: topun yanına, topla aynı hizaya yerleşir (0.72 → 1.24)
    { t: 0.76, px: 0.85, f0: 0.625, f1: groundY(-8), f2: -8 },
    { t: 0.8, px: 0.87, f0: 0.64, f1: groundY(-22), f2: -22, as: 8, bs: -8 },
    { t: 0.94, px: 0.97, py: 0.936, f0: 1.04, f1: 0.185, f2: 0, as: 16, ae: 20, bs: -14, be: 14 },
    { t: 1.0, px: 1.015 },
    { t: 1.06, px: 1.06, f0: 1.3, f1: 0.13, f2: 14 },
    // vuran ayak geriye alınır: topuk kalkar, diz bükülür, ayak gövdenin arkasına çekilir (1.08 → 1.28)
    { t: 1.08, px: 1.075, n0: 0.97, n1: groundY(-12), n2: -12 },
    { t: 1.14, px: 1.12, py: 0.92, f0: 1.375, f1: groundY(15), f2: 15 },
    { t: 1.16, px: 1.135, n0: 0.93, n1: 0.2, n2: -28, hd: 20 },
    { t: 1.24, px: 1.19, f0: 1.38, f1: 0.099, f2: 0, tr: 8, hd: 22, as: 6, ae: 22, bs: 4, be: 26 },
    { t: 1.28, px: 1.2, n0: 0.85, n1: 0.33, n2: -30, ny: 20, tr: 9, hd: 24, as: 10, ae: 24, bs: -4, be: 30 },
    // vuran ayak ileri savrulur, dışa döner (ny 20 → 66)
    { t: 1.38, px: 1.205, n0: 1.07, n1: 0.22, n2: -6, ny: 52, tr: 10, hd: 26, as: -8, ae: 20, bs: 16, be: 34 },
    { t: 1.44, px: 1.21, n0: 1.19, n1: 0.17, n2: 3, ny: 62 },
    // temas: iç yüz topun ortasında (ayak eğimi +5°, ny 66°)
    { t: 1.5, px: 1.21, py: 0.915, n0: 1.36, n1: 0.144, n2: 5, ny: 66, tr: 10.5, hd: 28, as: -16, ae: 18, bs: 24, be: 38 },
    // takip: ayak hedefe uzanır, sonra yere basar
    { t: 1.62, px: 1.29, py: 0.92, n0: 1.55, n1: 0.17, n2: -2, ny: 60, tr: 11, hd: 22 },
    { t: 1.76, px: 1.38, n0: 1.72, n1: 0.22, n2: -10, ny: 48, tr: 11, hd: 10, as: -22, bs: 30 },
    { t: 1.82, px: 1.42, f1: groundY(-8), f2: -8 },
    { t: 1.9, px: 1.47, n0: 1.76, n1: 0.14, n2: 4, ny: 30, tr: 8, hd: 2, as: -12, bs: 18, f1: groundY(-22), f2: -22 },
    { t: 2.0, px: 1.54, py: 0.93, n0: 1.76, n1: groundY(15), n2: 15, ny: 14, tr: 6, hd: -2, as: 0, bs: 4, f0: 1.52, f1: 0.2, f2: -18 },
    { t: 2.1, px: 1.61, n0: 1.76, n1: 0.099, n2: 0, ny: 8, as: 12, ae: 18, bs: -10, be: 16 },
    { t: 2.2, px: 1.69, f0: 1.85, f1: 0.22, f2: -6 },
    { t: 2.4, px: 1.84, f0: 2.05, f1: 0.15, f2: 14 },
    { t: 2.46, px: 1.88, f0: 2.07, f1: groundY(15), f2: 15, n1: groundY(-10), n2: -10 },
    { t: 2.52, px: 1.92, f0: 2.08, f1: 0.099, f2: 0, n0: 1.78, n1: groundY(-22), n2: -22, as: -4, bs: 6 },
    { t: 2.7, px: 2.05, n0: 2.0, n1: 0.19, n2: -2, as: -12, bs: 14 },
    { t: 3.0, px: 2.25, n0: 2.4, n1: 0.13, n2: 14, ny: 8 },
  ]),
  ball: [
    // top temasa kadar yerde durur; z = temas yüzeyindeki derinlik
    { t: 0, x: 1.52, y: 0.11, z: -0.011 },
    { t: 1.5, x: 1.52, y: 0.11, z: -0.011 },
    // vuruş: top yerde, ileri yuvarlanır; yavaşlar
    { t: 1.5, x: 1.52, y: 0.11, z: -0.011, vx: 3.6, cut: true },
    { t: 2.2, x: 3.4, y: 0.11, z: -0.011 },
    { t: 3.0, x: 4.0, y: 0.11, z: -0.011 },
  ],
};
