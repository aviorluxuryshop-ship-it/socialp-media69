import { poseKeys } from '@/lib/motion/author';
import type { TechMotion } from '@/lib/motion/timeline';

// Sert şut (data/techniques/sut.ts, id: sert-sut): ayak üstü (bağcık) ile topun ortasına, yere yakın sert vuruş.
//   Hazırlık : topa koşarak yaklaşma, son adım uzun; sol (basma) ayak topun yanına düz basar; sağ bacak geriye gerilir.
//   Temas    : gövde ve diz topun üzerinde, bilek kilitli, parmaklar aşağıda; bağcık bölgesi topun ortasına değer.
//   Takip    : vuruş bacağı hedefe doğru uzar, oyuncu vuruş ayağının üstüne iner, bakış topun gittiği yöne döner.
// Dünya: x ileri (m), y yukarı. Sağ ayaklı oyuncu, kamera oyuncunun sağında. Yakın (sağ) bacak FK: kalça açısı, diz bükülmesi, bilek.
export const SERT_SUT: TechMotion = {
  id: 'sert-sut',
  label: 'Sert şut: ayak üstüyle (bağcık) topun ortasına vuruş',
  dur: 2.7,
  tc: 1.42,
  win: [0.1, 0.1],
  legs: ['fk', 'ik'],
  cam: -0.7,
  zones: ['ustTam'],
  contact: 'ustTam',
  note: 'Yaklaşma açısı yandan görünümde okunmaz; vuruş anındaki ayak, bilek ve gövde duruşuna bakın.',
  caps: [
    'Topa koşarak yaklaşın, son adımı biraz uzun atın ve basma ayağınızı topun yanına basın. Gözünüz topta, vuruş bacağınız geriye gerilir.',
    'Dizinizi ve gövdenizi topun üzerinde tutun, ayak bileğini kilitleyip parmakları aşağıda tutun; ayak üstüyle (bağcık bölgesi) topun ortasına vurun.',
    'Takip hareketini hedefe doğru uzatın ve vuruş ayağınızın üstüne inin. Bakışınız vuruştan sonra topun gittiği yöne döner.',
  ],
  keys: poseKeys([
    { t: 0, py: 0.935, hd: 22, as: 4, bs: -4, n0: -1.146, n1: 18.052, n2: -19.198, f0: 0.15 },
    { t: 0.12, px: 0.02, hd: 24, n0: -4.159, n1: 14.61, n2: -18.77 },
    { t: 0.16, px: 0.033, tr: 5, n0: 4.467, n1: 34.755, n2: -20.288 },
    { t: 0.18, px: 0.041, n0: 7.331, n1: 42.266, n2: -17.935 },
    { t: 0.2, px: 0.05, tr: 6, as: -6, bs: 8, n0: 8.433, n1: 44.485, n2: -11.052 },
    { t: 0.3, px: 0.17, as: -14, ae: 20, bs: 16, be: 26, n0: 17.742, n1: 58.554, n2: -10.811 },
    { t: 0.4, px: 0.32, py: 0.932, tr: 8, as: -20, bs: 22, n0: 30, n1: 63.128, n2: -21.128, f0: 0.17, f1: 0.141, f2: -20 },
    { t: 0.48, px: 0.433, py: 0.928, n0: 32.94, n1: 39.2, n2: -8.26, f0: 0.2, f1: 0.16, f2: -35 },
    { t: 0.54, px: 0.52, py: 0.925, n0: 24.605, n1: 19.138, n2: -6.533, f1: 0.17, f2: -38 },
    { t: 0.62, px: 0.651, py: 0.92, as: -4, bs: 6, n0: 22.416, n1: 32.398, n2: -9.983, f0: 0.42, f1: 0.2, f2: -40 },
    { t: 0.72, px: 0.809, py: 0.936, as: 14, ae: 28, bs: -16, be: 18, n0: 7.792, n1: 25.026, n2: -17.235, f0: 0.78, f1: 0.22, f2: -25 },
    { t: 0.8, px: 0.918, py: 0.943, as: 22, ae: 34, bs: -22, n0: -9.928, n1: 3.908, n2: -13.836, f0: 1, f2: -18 },
    { t: 0.83, px: 0.958, py: 0.942, n0: -2.031, n1: 26.096, n2: -18.127, f0: 1.06, f2: -15 },
    { t: 0.86, px: 1, py: 0.94, n0: -2.491, n1: 31.648, n2: -12.139, f0: 1.12, f1: 0.2, f2: -12 },
    { t: 0.94, px: 1.12, py: 0.935, tr: 9, as: 20, bs: -20, n0: -0.981, n1: 41.905, n2: -7.886, f0: 1.38, f1: 0.15, f2: 3 },
    { t: 1.04, px: 1.274, py: 0.919, tr: 12, as: 6, ae: 24, bs: 6, be: 30, n0: -6, n1: 78, n2: 22, f0: 1.5, f1: 0.125, f2: 12 },
    { t: 1.1, px: 1.337, py: 0.914, tr: 14, hd: 30, as: -10, bs: 22, be: 40, n0: -11, n1: 92, n2: 24, f0: 1.52, f1: 0.106 },
    { t: 1.18, px: 1.387, py: 0.912, tr: 15, hd: 32, as: -22, ae: 20, bs: 34, be: 50, n0: -14, n1: 100, n2: 26, f1: 0.099, f2: 0 },
    { t: 1.3, px: 1.475, py: 0.913, tr: 17, hd: 34, as: -28, bs: 40, be: 52, n0: 8, n1: 98, n2: 24 },
    { t: 1.36, px: 1.52, py: 0.914, tr: 18, hd: 32, ny: 0, n0: 11.034, n1: 80.389, n2: -24.355 },
    { t: 1.4, px: 1.548, py: 0.915, hd: 31, n0: 20.423, n1: 75.275, n2: 10.148 },
    { t: 1.42, px: 1.56, hd: 30, as: -30, ae: 18, bs: 42, n0: 26.183, n1: 72.843, n2: 29.34 },
    { t: 1.46, px: 1.582, py: 0.917, hd: 28, as: -28, bs: 40, n0: 42.263, n1: 77.968, n2: 36.296 },
    { t: 1.5, px: 1.6, py: 0.922, tr: 17, hd: 22, as: -22, bs: 34, n0: 57.65, n1: 68.857, n2: 52.793 },
    { t: 1.54, px: 1.617, py: 0.927, tr: 16, hd: 18, as: -16, ae: 20, bs: 28, be: 40, n0: 62.342, n1: 48.634, n2: 67.708 },
    { t: 1.6, px: 1.643, py: 0.935, tr: 15, hd: 12, as: -6, bs: 16, be: 30, n0: 66.109, n1: 33.163, n2: 76.946 },
    { t: 1.68, px: 1.686, py: 0.944, tr: 13, hd: 8, as: 6, ae: 22, bs: 4, be: 24, n0: 69.538, n1: 30.495, n2: 75.043, f0: 1.53, f1: 0.129, f2: -14 },
    { t: 1.74, px: 1.737, py: 0.945, tr: 12, hd: 4, as: 14, ae: 26, bs: -4, n0: 67.122, n1: 28.803, n2: 66.319, f0: 1.55, f1: 0.151, f2: -26 },
    { t: 1.82, px: 1.847, py: 0.941, hd: 0, as: 20, ae: 30, bs: -12, be: 18, n0: 56.418, n1: 29.54, n2: 44.878, f0: 1.61, f1: 0.19, f2: -35 },
    { t: 1.92, px: 2.004, py: 0.935, hd: -2, as: 22, bs: -18, n0: 43.337, n1: 32.53, n2: 16.806, f0: 1.95, f1: 0.22, f2: -25 },
    { t: 2, px: 2.1, py: 0.93, tr: 11, as: 14, bs: -8, n0: 21.949, n1: 15.369, n2: -1.42, f0: 2.2, f1: 0.2, f2: -10 },
    { t: 2.08, px: 2.156, py: 0.923, as: 4, ae: 16, bs: 4, be: 16, n0: 23.344, n1: 25.53, n2: -2.187, f0: 2.4, f1: 0.15, f2: 0 },
    { t: 2.2, px: 2.239, py: 0.921, n0: 21.334, n1: 32.752, n2: -11.419, f0: 2.48, f1: 0.14, f2: 2 },
    { t: 2.3, px: 2.325, py: 0.927, tr: 8, hd: 2, n0: 14.58, n1: 31.226, n2: -16.646, f0: 2.56, f1: 0.12, f2: 8 },
    { t: 2.42, px: 2.4, py: 0.935, tr: 6, hd: 4, as: -4, bs: 10, n0: 5.975, n1: 24.24, n2: -18.265, f0: 2.6, f1: 0.105, f2: 10 },
    { t: 2.5, px: 2.426, py: 0.939, tr: 5, n0: 1.883, n1: 19.431, n2: -17.547, f1: 0.099, f2: 0 },
    { t: 2.7, px: 2.46, py: 0.945, tr: 4, hd: 2, as: 4, ae: 14, bs: -4, be: 14, n0: -7.575, n1: 4.959, n2: -12.534 },
  ]),
  ball: [
    { t: 0, x: 1.62, y: 0.11 },
    { t: 1.42, x: 1.62, y: 0.11 },
    // vuruş: top bağcıktan çıkar, yere yakın hızla uzaklaşır (anlatım için yavaşlatılmış hız)
    { t: 1.45, x: 1.9, y: 0.14, vx: 9.5, vy: 1.2, cut: true },
    { t: 1.75, x: 4.5, y: 0.55, vx: 9.5, vy: 1.6 },
    { t: 2.7, x: 12, y: 1.4 },
  ],
};
