import { groundY, poseKeys } from '@/lib/motion/author';
import type { TechMotion } from '@/lib/motion/timeline';

// Alından kafa vuruşu (data/techniques/kafa.ts, id: alin-kafa): havadan gelen top, alnın ortasıyla yönlendirilir.
//   Hazırlık : topun inişine doğru küçük adımlarla girilir; ayaklar yerde, biri hafif önde, dizler hafif bükülü; gövde yay gibi geriye gerilir.
//   Temas    : boyun sert, gövde ve kalça öne atılır; top alnın düz bölgesine (kaşların üstü) değer; gözler topta.
//   Takip    : top hedefe gider, ayaklar yerde kalır, denge korunur, bakış topun gittiği yöne döner.
// Dünya: x ileri (m), y yukarı. Sağ ayaklı oyuncu, kamera oyuncunun sağında; top oyuncunun önünden gelir ve yine öne yönlendirilir.
// Ayaklar yerdedir (sıçrama yok): temas sırasında sol (basma) ayak sabit kalır. Hızlar anlatım için yavaşlatılmıştır.
export const ALIN_KAFA: TechMotion = {
  id: 'alin-kafa',
  label: 'Alından kafa vuruşu: gövdeyi öne atıp topa alnın ortasıyla temas',
  dur: 2.8,
  tc: 1.6,
  win: [0.12, 0.22],
  legs: ['ik', 'ik'],
  cam: -0.95,
  top: 2.8,
  zones: 'alin',
  contact: 'alin',
  airborne: false,
  note: 'Kafa vuruşunda çocuk ve ergenler için sınırlama vardır; bu sayfadaki Güvenlik notunu okuyun.',
  caps: [
    'Topun yönüne dönüp küçük adımlarla iniş çizgisine girin; ayaklar omuz genişliğinde, biri hafif önde, dizler hafif bükülü. Gözleriniz topta, ağzınız kapalı; gövdenizi geriye gerin.',
    'Boynunuzu sert tutup gövdenizi ve kalçanızı öne atın; topa alnınızın ortasıyla (kaşların üstü) temas edin. Gözleriniz açık kalsın.',
    'Topu hedefe yönlendirin ve ayaklarınızı yerde tutarak dengenizi koruyun; bakışınız topun gittiği yöne döner.',
  ],
  keys: poseKeys([
    // hazır duruş: sol ayak önde, sağ ayak arkada; bakış yukarıdaki topta
    { t: 0, px: 0.21, py: 0.935, tr: 2, hd: -10, as: 10, ae: 22, bs: -8, be: 22, n0: 0.12, n1: 0.099, n2: 0, ny: 8, f0: 0.3, f1: 0.099, f2: 0, fy: 8 },
    { t: 0.22 },
    // 1. küçük adım: sol ayak öne (topuk kalkar, ayak savrulur, topuk yere değer, düzleşir)
    { t: 0.28, px: 0.22, py: 0.93, f0: 0.31, f1: groundY(-22), f2: -22, bs: 2, as: 4 },
    { t: 0.4, px: 0.26, py: 0.925, f0: 0.43, f1: 0.16, f2: -4, hd: -12 },
    { t: 0.52, px: 0.31, py: 0.915, f0: 0.53, f1: groundY(12), f2: 12 },
    { t: 0.58, px: 0.33, py: 0.915, f0: 0.55, f1: 0.099, f2: 0 },
    // 2. küçük adım: sağ ayak öne
    { t: 0.62, px: 0.34, py: 0.92, n0: 0.13, n1: groundY(-22), n2: -22, as: -2, bs: 8 },
    { t: 0.76, px: 0.38, py: 0.925, n0: 0.22, n1: 0.16, n2: -4 },
    { t: 0.88, px: 0.42, py: 0.918, n0: 0.31, n1: groundY(12), n2: 12 },
    { t: 0.94, px: 0.43, py: 0.918, n0: 0.31, n1: 0.099, n2: 0 },
    // yüklenme: dizler biraz daha bükülür, gövde yay gibi geriye gerilir, kollar açılır
    { t: 1.1, px: 0.44, py: 0.912, tr: -5, hd: -8, as: 4, ae: 36, bs: 6, be: 38 },
    { t: 1.3, px: 0.47, py: 0.898, tr: -12, hd: -6, as: -12, ae: 44, bs: -8, be: 48 },
    { t: 1.4, px: 0.48, py: 0.9, tr: -9, hd: -5, as: -6, ae: 42, bs: -2, be: 46 },
    // vuruş: kalça ve gövde öne atılır, bacaklar uzar, arka topuk kalkar; çene hafif içe, alın topa bakar
    { t: 1.52, px: 0.53, py: 0.915, tr: 1, hd: 0, as: 10, ae: 38, bs: 12, be: 42, n1: groundY(-12), n2: -12 },
    { t: 1.6, px: 0.57, py: 0.926, tr: 10, hd: 4, as: 22, ae: 34, bs: 24, be: 38, n1: groundY(-20), n2: -20 },
    // takip: gövde öne devam eder, sonra toparlanır; arka topuk yere iner
    { t: 1.74, px: 0.6, py: 0.93, tr: 17, hd: -4, as: 20, ae: 36, bs: 22, be: 40 },
    { t: 2.1, px: 0.56, py: 0.925, tr: 8, hd: -8, as: 6, ae: 24, bs: 2, be: 26, n1: groundY(-10), n2: -10 },
    { t: 2.8, px: 0.47, py: 0.935, tr: 3, hd: -4, as: 8, ae: 20, bs: -4, be: 20, n1: 0.099, n2: 0 },
  ]),
  ball: [
    // yay çizerek gelen top (anlatım için yavaşlatılmış yerçekimi): yükselir, tepeyi geçer, alnın hizasına iner
    { t: 0, x: 3.464, y: 1.358, vx: -1.6, vy: 2.14, r: 0 },
    { t: 0.4, x: 2.824, y: 2.022, vx: -1.6, vy: 1.18, r: 20 },
    { t: 0.89, x: 2.04, y: 2.312, vx: -1.6, vy: 0, r: 45 },
    { t: 1.25, x: 1.464, y: 2.158, vx: -1.6, vy: -0.86, r: 63 },
    { t: 1.6, x: 0.904, y: 1.71, vx: -1.6, vy: -1.7, r: 80 },
    // temas: alnın düz bölgesinden öne ve hafif yukarı yönlendirilir
    { t: 1.6, x: 0.904, y: 1.71, vx: 4.3, vy: 0.83, r: 80, cut: true },
    { t: 1.8, x: 1.764, y: 1.827, vx: 4.3, vy: 0.35, r: 60 },
    { t: 2.1, x: 3.054, y: 1.823, vx: 4.3, vy: -0.37, r: 30 },
    { t: 2.5, x: 4.773, y: 1.483, vx: 4.3, vy: -1.33, r: -10 },
    { t: 2.8, x: 6.063, y: 0.975, vx: 4.3, vy: -2.05, r: -40 },
  ],
};
