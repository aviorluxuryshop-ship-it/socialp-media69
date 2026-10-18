import { groundY, poseKeys } from '@/lib/motion/author';
import type { TechMotion } from '@/lib/motion/timeline';

// İlk temas (data/techniques/kontrol.ts, id: ilk-temas): yerden gelen top, sağ ayağın iç yüzüyle karşılanır.
//   Hazırlık : topa doğru yürüyüş, sol (basma) ayak yerleşir, sağ ayak dışa dönerek topun hattına uzanır.
//   Temas    : top iç yüze değer, ayak geri çekilir (amorti), top yüzeye yapışır.
//   Takip    : ayak topu baskıdan uzağa (oyuncunun soluna, öne) bırakır; baş kalkar, oyuncu topun arkasından ilerler.
// Dünya: x ileri (m), y yukarı. Sağ ayaklı oyuncu, kamera oyuncunun sağında. Top temas boyunca yerde (merkez y = 0,11).
export const ILK_TEMAS: TechMotion = {
  id: 'ilk-temas',
  label: 'İlk temas: iç yüzle karşılama ve topu önüne alma',
  dur: 3.4,
  tc: 1.5,
  win: [0.12, 0.3],
  legs: ['ik', 'ik'],
  cam: -0.8,
  zones: ['ic', 'dis', 'ustTam'],
  contact: 'ic',
  carry: [1.5, 1.8],
  plan: { press: [2.3, 0.95] },
  note: 'Temas yüzeyi duruma göre iç yüz, dış yüz ya da ayak üstü olabilir; gösterimde iç yüz kullanılır.',
  caps: [
    'Topa doğru hareket edin; baskıyı ve boş alanı görün, temas yüzeyini (burada iç yüz) önceden seçin. Ayak dışa döner, iç yüz topa bakar.',
    'Top iç yüze değdiği anda ayağı gevşetip hafifçe geri çekin (amorti); top ayağa yapışır.',
    'İlk temas topu baskıdan uzağa, 1–2 adım önünüze alır. Başınız yukarıda: sıradaki karar için çevreyi izleyin.',
  ],
  keys: poseKeys([
    // hazır duruş: sağ ayak geride, sol ayak önde, yer düz
    { t: 0, px: 0, py: 0.945, tr: 4, hd: -2, as: 4, ae: 14, bs: -4, be: 14, n0: -0.12, n1: 0.099, n2: 0, ny: 8, f0: 0.12, f1: 0.099, f2: 0, fy: 8 },
    { t: 0.1 },
    // sağ ayak adımı: topuk kalkar, ayak savrulur, topuk yere değer (0.1 → 0.72)
    { t: 0.18, px: 0.05, py: 0.94, n0: -0.1, n1: groundY(-25), n2: -25, as: -8, bs: 14 },
    { t: 0.38, px: 0.15, py: 0.936, tr: 6, n0: 0.17, n1: 0.19, n2: -2, as: -16, ae: 18, bs: 20, be: 24 },
    { t: 0.54, px: 0.22, py: 0.932, n0: 0.43, n1: 0.13, n2: 14 },
    { t: 0.62, px: 0.27, py: 0.928, n0: 0.455, n1: groundY(15), n2: 15, as: -12, bs: 14 },
    { t: 0.72, px: 0.33, py: 0.93, n0: 0.48, n1: 0.099, n2: 0 },
    // sol (basma) ayak adımı: topun hattının yanına yerleşir (0.72 → 1.24)
    { t: 0.76, px: 0.35, f0: 0.125, f1: groundY(-8), f2: -8 },
    { t: 0.8, px: 0.37, f0: 0.14, f1: groundY(-22), f2: -22, as: 8, bs: -8 },
    { t: 0.94, px: 0.47, py: 0.936, f0: 0.5, f1: 0.185, f2: 0, as: 16, ae: 20, bs: -14, be: 14 },
    { t: 1.06, px: 0.56, f0: 0.77, f1: 0.13, f2: 14 },
    { t: 1.14, px: 0.62, py: 0.926, f0: 0.795, f1: groundY(15), f2: 15 },
    { t: 1.24, px: 0.69, py: 0.92, f0: 0.8, f1: 0.099, f2: 0, tr: 8, hd: 14, as: 6, ae: 22, bs: 4, be: 26 },
    // sağ ayak dışa dönerek topun hattına uzanır (1.24 → 1.44)
    { t: 1.28, px: 0.72, n0: 0.52, n1: groundY(-28), n2: -28, ny: 10 },
    { t: 1.38, px: 0.8, py: 0.915, n0: 0.9, n1: 0.2, n2: -5, ny: 36, tr: 10, hd: 20, as: -14, ae: 18, bs: 22, be: 34 },
    // temas: ayak topun hattında en öne uzanmış (1.44), top değer değmez ayak geri çekilir (amorti).
    // n1 değerleri topun merkezini temas boyunca yerde (0,11 m) tutacak biçimde çözüldü.
    { t: 1.44, px: 0.85, n0: 1.08, n1: 0.128, n2: 4, ny: 58, tr: 10.5, hd: 24 },
    { t: 1.5, px: 0.87, py: 0.912, n0: 1.07, n1: 0.133, n2: 4, ny: 60, tr: 11, hd: 26, as: -18, ae: 16, bs: 26, be: 38 },
    { t: 1.57, px: 0.89, n0: 1.03, n1: 0.148, n2: 4, ny: 60 },
    { t: 1.64, px: 0.91, n0: 0.99, n1: 0.162, n2: 4, ny: 60, hd: 20, tr: 10 },
    { t: 1.72, px: 0.94, n0: 1.0, n1: 0.164, n2: 5, ny: 58 },
    { t: 1.8, px: 0.97, n0: 1.07, n1: 0.153, n2: 6, ny: 54, hd: 10, tr: 9, as: -8, bs: 14 },
    // takip: sağ ayak topun gerisine iner, sol ayak öne geçer, sağ ayak yeniden adım atar. Top her an ayakların ilerisindedir.
    { t: 1.9, px: 1.01, py: 0.93, n0: 1.08, n1: 0.13, n2: 8, ny: 35, hd: -2, tr: 8, as: 2, bs: 0 },
    { t: 1.96, px: 1.04, f0: 0.815, f1: groundY(-6), f2: -6 },
    { t: 2.0, px: 1.07, n0: 1.12, n1: groundY(15), n2: 15, ny: 18, hd: -4, as: 10, ae: 18, bs: -8, be: 16 },
    { t: 2.1, px: 1.13, n0: 1.14, n1: 0.099, n2: 0, ny: 10, f0: 0.84, f1: groundY(-16), f2: -16 },
    { t: 2.16, px: 1.17, f0: 0.86, f1: groundY(-24), f2: -24 },
    { t: 2.4, px: 1.29, f0: 1.25, f1: 0.19, f2: 0, as: 12, bs: -10 },
    { t: 2.52, px: 1.35, f0: 1.5, f1: 0.13, f2: 14 },
    { t: 2.6, px: 1.39, f0: 1.53, f1: groundY(15), f2: 15, n0: 1.16, n1: groundY(-10), n2: -10 },
    { t: 2.7, px: 1.45, f0: 1.55, f1: 0.099, f2: 0, n0: 1.22, n1: groundY(-22), n2: -22, as: -4, bs: 6 },
    { t: 2.84, px: 1.53, n0: 1.4, n1: 0.17, n2: -20, as: -12, bs: 14 },
    { t: 3.02, px: 1.63, n0: 1.62, n1: 0.19, n2: -2, as: -14, ae: 16, bs: 16, be: 22 },
    { t: 3.14, px: 1.69, n0: 1.9, n1: 0.13, n2: 14, ny: 8 },
    { t: 3.22, px: 1.74, n0: 1.95, n1: groundY(15), n2: 15 },
    { t: 3.26, px: 1.75, f0: 1.58, f1: groundY(-10), f2: -10 },
    { t: 3.4, px: 1.8, n0: 1.97, n1: 0.099, n2: 0, f0: 1.64, f1: groundY(-22), f2: -22, as: -6, bs: 8 },
  ]),
  ball: [
    // top yerde, yavaşlayarak gelir (≈ 2,6 → 2,0 m/s)
    { t: 0, x: 4.68, y: 0.11, vx: -2.6 },
    { t: 0.75, x: 2.84, y: 0.11 },
    { t: 1.5, x: 1.23, y: 0.11, z: -0.028, vx: -2.0 },
    // 1.5 → 1.8 arası top ayağın iç yüzüne yapışık (carry); 1.8'de oyuncunun soluna, öne bırakılır
    { t: 1.8, x: 1.222, y: 0.11, z: -0.045, vx: 1.4, cut: true },
    { t: 2.5, x: 2.08, y: 0.11, z: -0.6 },
    { t: 3.4, x: 2.82, y: 0.11, z: -1.07 },
  ],
};
