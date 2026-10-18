import { groundY, poseKeys } from '@/lib/motion/author';
import { groundYRigid, nearIkToFk } from '@/lib/motion/author-fk';
import { flightKeys } from '@/lib/motion/flight';
import type { TechMotion } from '@/lib/motion/timeline';

// İç yüzle kavisli pas (data/techniques/pas.ts, id: kavisli-pas, foot: ['ic', 'ustIc']): ayağın iç yüzü ve ayak üstünün İÇ bölümüyle verilen dönüşlü pas.
//   Hazırlık : topa hafif yandan yaklaşma, basma (sol) ayak topun yanına, biraz geriye; vuran ayak geriye alınır, ucu aşağı ve DIŞA çevrilir (ny > 0), bilek kilitli.
//   Temas    : ayağın iç bölümü (iç yüz + ayak üstünün iç tarafı) topun dış-alt yarısına sürtünür.
//   Takip    : ayak topa sürterek yukarı ve vücudun çaprazına doğru süpürülür. Top vuran ayağın tersine, oyuncunun SOLUNA kavis çizer.
// Dünya: x ileri (m), y yukarı, z oyuncunun sağı. Sağ ayaklı oyuncu, kamera oyuncunun sağında.
// Sağ ayak iç yüz fiziği: top topun sağ yanından itilir, yukarıdan bakınca saat yönünün TERSİNE döner ve sola kavis çizer (trivela tersi).
// Vuran (yakın) bacak IK terimleriyle yazılır, nearIkToFk ile sert ayaklı FK'ya çevrilir (bkz. trivela-pasi.ts).
// Temas yüzeyi olarak "Üst iç" (ayak üstünün iç bölümü) vurgulanır: yerdeki topa dış-alt yarıdan, parmak ucu yere yakın bir ayakla ancak bu bölge değebilir;
// "İç yüz" bölgesi de tekniğin temas yüzeyi olduğundan sönük çizgiyle işaretlenir.
// Temas anı (t = 1,5): pelvis (1,0; 0,9), ayak eğimi −88°, ny 50°, bilek (0,955; 0,214): lib/motion/rig.ts zoneContact ile çözüldü,
// top merkezi (1,10; 0,11; z = 0,107), ayak parmak ucu yerden ≈ 0 cm.
const GR = (p: number) => groundYRigid(p);

const IK = poseKeys([
  // hazır duruş: sağ ayak geride, sol ayak önde, yer düz
  { t: 0, px: 0.15, py: 0.945, tr: 4, hd: -2, as: 4, ae: 14, bs: -4, be: 14, n0: 0.03, n1: 0.099, n2: 0, ny: 8, f0: 0.27, f1: 0.099, f2: 0, fy: 8 },
  { t: 0.1 },
  // sağ ayak adımı: topuk kalkar, ayak savrulur, topuk yere değer (0.1 → 0.72)
  { t: 0.18, px: 0.2, py: 0.94, n0: 0.05, n1: GR(-25), n2: -25, as: -8, bs: 14 },
  { t: 0.38, px: 0.3, py: 0.936, tr: 6, n0: 0.32, n1: 0.19, n2: -2, as: -16, ae: 18, bs: 20, be: 24 },
  { t: 0.54, px: 0.37, py: 0.932, n0: 0.58, n1: 0.13, n2: 14 },
  { t: 0.62, px: 0.42, py: 0.928, n0: 0.605, n1: GR(15), n2: 15, as: -12, bs: 14 },
  { t: 0.72, px: 0.48, py: 0.93, n0: 0.63, n1: 0.099, n2: 0 },
  // sol (basma) ayak adımı: topun yanına, biraz geriye yerleşir (0.72 → 1.24)
  { t: 0.76, px: 0.5, f0: 0.285, f1: groundY(-8), f2: -8 },
  { t: 0.8, px: 0.52, f0: 0.3, f1: groundY(-22), f2: -22, as: 8, bs: -8 },
  { t: 0.94, px: 0.62, py: 0.936, f0: 0.65, f1: 0.185, f2: 0, as: 16, ae: 20, bs: -14, be: 14 },
  { t: 1.0, px: 0.67 },
  { t: 1.06, px: 0.72, f0: 0.9, f1: 0.13, f2: 14 },
  // vuran ayak geriye alınır: topuk kalkar, diz bükülür; ayak aşağı ve dışa döner (1.08 → 1.46)
  { t: 1.08, px: 0.74, n0: 0.62, n1: GR(-12), n2: -12 },
  { t: 1.14, px: 0.79, py: 0.92, f0: 0.95, f1: groundY(15), f2: 15 },
  { t: 1.16, px: 0.805, n0: 0.55, n1: 0.2, n2: -35, hd: 20 },
  { t: 1.24, px: 0.86, f0: 0.95, f1: 0.099, f2: 0, tr: 8, hd: 22, as: 6, ae: 22, bs: 4, be: 26, n0: 0.45, n1: 0.32, n2: -50, ny: 20 },
  { t: 1.32, px: 0.915, py: 0.91, n0: 0.5, n1: 0.36, n2: -68, ny: 35, tr: 8, hd: 25, as: 10, ae: 24, bs: -4, be: 30 },
  { t: 1.4, px: 0.96, py: 0.905, n0: 0.68, n1: 0.3, n2: -80, ny: 45, tr: 8, hd: 27, as: -8, ae: 20, bs: 16, be: 34 },
  { t: 1.46, px: 0.985, py: 0.9, n0: 0.83, n1: 0.25, n2: -86, ny: 49 },
  // temas: ayak üstünün iç bölümü topun dış-alt yarısına değer
  { t: 1.5, px: 1.0, py: 0.9, n0: 0.955, n1: 0.214, n2: -88, ny: 50, tr: 8, hd: 29, as: -16, ae: 18, bs: 24, be: 38 },
  // takip: ayak topa sürterek yukarı ve vücudun çaprazına süpürülür; sonra yere iner
  { t: 1.56, px: 1.03, py: 0.905, n0: 1.08, n1: 0.27, n2: -80, ny: 46 },
  { t: 1.64, px: 1.07, py: 0.912, n0: 1.22, n1: 0.37, n2: -68, ny: 38, tr: 7, hd: 22 },
  { t: 1.76, px: 1.13, py: 0.925, n0: 1.38, n1: 0.5, n2: -50, ny: 25, tr: 4, hd: 10, as: -22, bs: 32 },
  { t: 1.84, px: 1.17, py: 0.928, f0: 0.96, f1: groundY(-8), f2: -8 },
  { t: 1.94, px: 1.23, py: 0.93, n0: 1.46, n1: 0.5, n2: -35, ny: 15, tr: 4, hd: 2, as: -10, bs: 18, f0: 0.98, f1: groundY(-22), f2: -22 },
  { t: 2.06, px: 1.3, n0: 1.5, n1: 0.36, n2: -15, ny: 8, hd: -2, as: 2, bs: 0, f0: 1.1, f1: 0.2, f2: -22 },
  { t: 2.14, px: 1.35, n0: 1.5, n1: 0.2, n2: -5, as: 10, ae: 18, bs: -8, be: 16, f0: 1.3, f1: 0.2, f2: -14 },
  { t: 2.2, px: 1.38, n0: 1.5, n1: GR(15), n2: 15, f0: 1.45, f1: 0.2, f2: 0 },
  { t: 2.28, px: 1.43, n0: 1.51, n1: 0.099, n2: 0 },
  // sol ayak öne geçer, sağ ayak yeniden adım atar
  { t: 2.4, px: 1.5, f0: 1.7, f1: 0.15, f2: 14 },
  { t: 2.46, px: 1.54, f0: 1.72, f1: groundY(15), f2: 15, n0: 1.52, n1: GR(-10), n2: -10 },
  { t: 2.52, px: 1.58, f0: 1.73, f1: 0.099, f2: 0, n0: 1.55, n1: GR(-22), n2: -22, as: -4, bs: 6 },
  { t: 2.7, px: 1.69, n0: 1.78, n1: 0.19, n2: -2, as: -12, bs: 14 },
  { t: 3.0, px: 1.87, n0: 2.17, n1: 0.13, n2: 14, ny: 8 },
]);

export const KAVISLI_PAS: TechMotion = {
  id: 'kavisli-pas',
  label: 'İç yüzle kavisli pas: ayağın iç bölümüyle topa dönüş verme, top sola kavis çizer',
  dur: 3.0,
  tc: 1.5,
  win: [0.12, 0.26],
  legs: ['fk', 'ik'],
  cam: -0.6,
  top: 2.2,
  zones: ['ic', 'ustIc'],
  contact: 'ustIc',
  curve: 'sol',
  plan: { press: [3.6, 0.107] },
  note: 'Sağ ayakta top oyuncunun soluna döner; iç yüz ve ayak üstünün iç bölümü temas yüzeyidir, gösterimde ayak üstünün iç bölümü parlar.',
  caps: [
    'Topa hafif yandan ve açıyla yaklaşın, basma ayağınızı topun yanına, biraz geriye basın. Vuran ayağın ucunu aşağı ve dışa çevirip bileğinizi kilitleyin; gözünüz topta olsun.',
    'Ayağın iç yüzünü ve ayak üstünün iç bölümünü topun dış-alt yarısına yerleştirip sürtün; top vuran ayağın tersine, sola dönüş kazanır. Tam ortadan vurmayın.',
    'Ayağınızı topa sürterek dıştan içe, vücudunuzun çaprazına doğru süpürün. Başlangıç yönünü rakibin dışına alın; kavis topu arkadaşa getirir.',
  ],
  keys: nearIkToFk(IK),
  ball: [
    // top temasa kadar durur; z = temas yüzeyindeki derinlik
    { t: 0, x: 1.1, y: 0.11, z: 0.107 },
    { t: 1.5, x: 1.1, y: 0.11, z: 0.107 },
    // vuruş: top yukarı-ileri çıkar, hedefin sağından açılıp sola döner (üstten bakışta sağ şişkin yol)
    ...flightKeys({ t0: 1.5, x0: 1.1, y0: 0.11, z0: 0.107, vx: 3.0, vy: 2.0, g: 3.4, bend: 0.9, tEnd: 3.0, spin: 200 }),
  ],
};
