import { groundY, poseKeys } from '@/lib/motion/author';
import { groundYRigid, nearIkToFk } from '@/lib/motion/author-fk';
import { flightKeys } from '@/lib/motion/flight';
import type { TechMotion } from '@/lib/motion/timeline';

// Trivela pası (data/techniques/pas.ts, id: trivela-pasi, foot: ['ustDis']): ayak üstünün DIŞ bölümüyle verilen dönüşlü pas.
//   Hazırlık : topa yaklaşma, basma (sol) ayak topun yanına; vuran ayağın ucu AŞAĞI ve İÇE çevrilir (ny < 0), bilek kilitli.
//   Temas    : ayak üstünün dış bölümü (küçük parmağa yakın üst yüzey) topun yan-alt kısmına sürtünür; hareket kısa ve kontrollü.
//   Takip    : kısa takip; ayak yere iner. Top vuran ayağın tarafına, oyuncunun SAĞINA doğru kavis çizer (üstten bakış kutusu).
// Dünya: x ileri (m), y yukarı, z oyuncunun sağı. Sağ ayaklı oyuncu, kamera oyuncunun sağında.
// Vuran (yakın) bacak IK terimleriyle (n0/n1 = bilek x/y, n2 = ayak eğimi) yazılır ve nearIkToFk ile SERT ayaklı FK'ya çevrilir:
// parmak ucu aşağı bakan ayak gerçek bir ayak gibi bükülmeden çizilir (legs: ['fk', 'ik']).
// Temas anı (t = 1,5): pelvis (0,85; 0,90), ayak eğimi −85°, ny −10°, bilek (0,936; 0,243): lib/motion/rig.ts zoneContact ile çözüldü,
// top merkezi (1,10; 0,11; z ≈ 0), ayak parmak ucu yerden ≈ 1 cm yukarıda.
const GR = (p: number) => groundYRigid(p);

const IK = poseKeys([
  // hazır duruş: sağ ayak geride, sol ayak önde, yer düz
  { t: 0, px: 0.08, py: 0.945, tr: 4, hd: -2, as: 4, ae: 14, bs: -4, be: 14, n0: -0.04, n1: 0.099, n2: 0, ny: 8, f0: 0.2, f1: 0.099, f2: 0, fy: 8 },
  { t: 0.1 },
  // sağ ayak adımı: topuk kalkar, ayak savrulur, topuk yere değer (0.1 → 0.72)
  { t: 0.18, px: 0.13, py: 0.94, n0: -0.02, n1: GR(-25), n2: -25, as: -8, bs: 14 },
  { t: 0.38, px: 0.23, py: 0.936, tr: 6, n0: 0.25, n1: 0.19, n2: -2, as: -16, ae: 18, bs: 20, be: 24 },
  { t: 0.54, px: 0.3, py: 0.932, n0: 0.51, n1: 0.13, n2: 14 },
  { t: 0.62, px: 0.35, py: 0.928, n0: 0.535, n1: GR(15), n2: 15, as: -12, bs: 14 },
  { t: 0.72, px: 0.41, py: 0.93, n0: 0.56, n1: 0.099, n2: 0 },
  // sol (basma) ayak adımı: topun yanına yerleşir (0.72 → 1.24)
  { t: 0.76, px: 0.43, f0: 0.205, f1: groundY(-8), f2: -8 },
  { t: 0.8, px: 0.45, f0: 0.22, f1: groundY(-22), f2: -22, as: 8, bs: -8 },
  { t: 0.94, px: 0.55, py: 0.936, f0: 0.62, f1: 0.185, f2: 0, as: 16, ae: 20, bs: -14, be: 14 },
  { t: 1.0, px: 0.595 },
  { t: 1.06, px: 0.64, f0: 0.88, f1: 0.13, f2: 14 },
  // vuran ayak geriye alınır: topuk kalkar, ayak ucu aşağı ve içe döner (1.08 → 1.32)
  { t: 1.08, px: 0.655, n0: 0.55, n1: GR(-12), n2: -12 },
  { t: 1.14, px: 0.7, py: 0.92, f0: 0.955, f1: groundY(15), f2: 15 },
  { t: 1.16, px: 0.715, n0: 0.5, n1: 0.2, n2: -35, hd: 20 },
  { t: 1.24, px: 0.77, f0: 0.96, f1: 0.099, f2: 0, tr: 8, hd: 22, as: 6, ae: 22, bs: 4, be: 26, n0: 0.43, n1: 0.31, n2: -50, ny: 0 },
  { t: 1.32, px: 0.8, py: 0.91, n0: 0.5, n1: 0.33, n2: -65, ny: -6, tr: 9, hd: 25, as: 10, ae: 24, bs: -4, be: 30 },
  // vuruş: bilek kilitli, ayak aşağıda ve içe dönük; dış ayak üstü topa iner
  { t: 1.4, px: 0.83, n0: 0.68, n1: 0.29, n2: -78, ny: -9, tr: 10, hd: 27, as: -8, ae: 20, bs: 16, be: 34 },
  { t: 1.46, px: 0.845, py: 0.9, n0: 0.82, n1: 0.26, n2: -83, ny: -10 },
  // temas
  { t: 1.5, px: 0.85, py: 0.9, n0: 0.936, n1: 0.243, n2: -85, ny: -10, tr: 11, hd: 29, as: -16, ae: 18, bs: 24, be: 38 },
  // takip: kısa ve kontrollü; ayak topun yönünde kalkar, sonra yere iner
  { t: 1.56, px: 0.885, py: 0.905, n0: 1.05, n1: 0.285, n2: -76, ny: -9 },
  { t: 1.64, px: 0.925, py: 0.91, n0: 1.18, n1: 0.35, n2: -64, ny: -5, tr: 11, hd: 24 },
  { t: 1.76, px: 0.99, py: 0.92, n0: 1.3, n1: 0.4, n2: -48, ny: 0, tr: 10, hd: 12, as: -18, bs: 28 },
  { t: 1.9, px: 1.07, py: 0.928, n0: 1.38, n1: 0.33, n2: -26, ny: 5, tr: 8, hd: 2, as: -8, bs: 14 },
  { t: 2.02, px: 1.14, py: 0.93, n0: 1.4, n1: 0.2, n2: -6, ny: 8, hd: -2, as: 2, bs: 0, f1: groundY(-8), f2: -8 },
  { t: 2.12, px: 1.2, n0: 1.41, n1: GR(15), n2: 15, as: 10, ae: 18, bs: -8, be: 16, f0: 0.965, f1: groundY(-18), f2: -18 },
  { t: 2.18, px: 1.24, n0: 1.42, n1: 0.099, n2: 0, f0: 1.05, f1: 0.2, f2: -22 },
  // sol ayak öne geçer (2.12 → 2.52), sağ ayak yeniden adım atar
  { t: 2.4, px: 1.4, f0: 1.64, f1: 0.15, f2: 14 },
  { t: 2.46, px: 1.44, f0: 1.66, f1: groundY(15), f2: 15, n0: 1.43, n1: GR(-10), n2: -10 },
  { t: 2.52, px: 1.48, f0: 1.67, f1: 0.099, f2: 0, n0: 1.46, n1: GR(-22), n2: -22, as: -4, bs: 6 },
  { t: 2.7, px: 1.6, n0: 1.7, n1: 0.19, n2: -2, as: -12, bs: 14 },
  { t: 3.0, px: 1.8, n0: 2.1, n1: 0.13, n2: 14, ny: 8 },
]);

export const TRIVELA_PASI: TechMotion = {
  id: 'trivela-pasi',
  label: 'Trivela pası: ayak üstünün dış bölümüyle topa dönüş verme, top sağa kavis çizer',
  dur: 3.0,
  tc: 1.5,
  win: [0.12, 0.26],
  legs: ['fk', 'ik'],
  cam: -0.6,
  top: 2.2,
  zones: ['ustDis'],
  contact: 'ustDis',
  curve: 'sag',
  plan: { press: [3.6, 0.033] },
  note: 'Sağ ayakta top oyuncunun sağına döner; temas ayağın yan kenarında değil, ayak üstünün dış bölümündedir.',
  caps: [
    'Topa hafif yandan yaklaşın, basma ayağınızı topun yanına basın. Vuran ayağın ucunu aşağı ve içe çevirip bileğinizi kilitleyin; gözünüz topta, gövdeniz dengede.',
    'Ayak üstünün dış bölümüyle (küçük parmağa yakın üst yüzey) topun yan-alt kısmına sürtün; hareket kısa ve kontrollü olsun. Dönüşü temas verir, güç değil.',
    'Takip hareketi kısa kalır; ayağınızı yere indirip dengenizi koruyun. Top vuran ayağın tarafına, sağa doğru kavis çizer: başlangıç yönünü hedefin solundan alın.',
  ],
  keys: nearIkToFk(IK),
  ball: [
    // top temasa kadar durur; z = temas yüzeyindeki derinlik
    { t: 0, x: 1.1, y: 0.11, z: 0.033 },
    { t: 1.5, x: 1.1, y: 0.11, z: 0.033 },
    // vuruş: top yukarı-ileri çıkar, hedefin solundan açılıp sağa döner (üstten bakışta sol şişkin yol)
    ...flightKeys({ t0: 1.5, x0: 1.1, y0: 0.11, z0: 0.033, vx: 3.0, vy: 2.0, g: 3.4, bend: -0.9, tEnd: 3.0, spin: 200 }),
  ],
};
