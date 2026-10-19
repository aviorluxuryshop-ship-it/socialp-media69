// Krampon çizimlerinin bölge geometrisi (SVG yolları). Saf veri: React yok.
// Koordinatlar her görünümün "yerel" uzayındadır; çizim grubu (ox, oy) kadar kaydırılır ve
// sol ayak için yatayda çevrilir. Etiketler (lx, ly) ve ibreler (px, py) aynı yerel uzayda verilir.
import type { FootZone } from '@/data/types';
import type { BootView } from './boot';

export interface ZoneShape {
  /** vurgulanan bölgenin yolu (kramponun dış hattına kırpılır) */
  d: string;
  /** ibre noktası: bölgenin üzerinde */
  px: number;
  py: number;
  /** etiket yeri ve hizası */
  lx: number;
  ly: number;
  anchor: 'start' | 'end' | 'middle';
  /** ibre çizgisi araya bir dirsek noktasından geçsin (yerel uzay) */
  via?: [number, number];
  /** top: merkez ve yarıçap (yerel uzay); air = havada duran top (yer gölgesi çizilmez) */
  ball: { x: number; y: number; r: number; air?: boolean };
}

export interface ViewGeo {
  /** viewBox genişliği/yüksekliği */
  W: number;
  H: number;
  /** çizimin kaydırması */
  ox: number;
  oy: number;
  /** sağ ayak çiziminin yatay aynalama gerektirip gerektirmediği (alttan görünümde ayak ters görünür) */
  flipsRight: boolean;
  zones: Partial<Record<FootZone, ZoneShape>>;
}


// ── Yardımcılar: kontrol noktalarından yumuşak kapalı yol ─────────────
type Pt = [number, number];
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Catmull–Rom → kübik Bézier: noktalardan geçen yumuşak kapalı yol. */
export function smoothClosed(pts: Pt[], k = 1): string {
  const n = pts.length;
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) / 6) * k, p1[1] + ((p2[1] - p0[1]) / 6) * k];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) / 6) * k, p2[1] - ((p3[1] - p1[1]) / 6) * k];
    d += `C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d + 'Z';
}

/** Orta çizgi boyunca değişken genişlikli şerit (uçları yuvarlak). widths: her noktada tam genişlik. */
export function ribbon(center: Pt[], widths: number[]): string {
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < center.length; i++) {
    const a = center[Math.max(0, i - 1)];
    const b = center[Math.min(center.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l;
    const ny = dx / l;
    const h = widths[i] / 2;
    left.push([center[i][0] + nx * h, center[i][1] + ny * h]);
    right.push([center[i][0] - nx * h, center[i][1] - ny * h]);
  }
  const first = center[0];
  const last = center[center.length - 1];
  const capA: Pt = [first[0] - (center[1][0] - first[0]) * 0.25, first[1] - (center[1][1] - first[1]) * 0.25];
  const capB: Pt = [last[0] + (last[0] - center[center.length - 2][0]) * 0.25, last[1] + (last[1] - center[center.length - 2][1]) * 0.25];
  return smoothClosed([capA, ...left, capB, ...right.reverse()]);
}

/** Kübik Bézier üzerinde n+1 nokta. */
export function cubicPts(p0: Pt, c1: Pt, c2: Pt, p3: Pt, n = 6): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const m = 1 - t;
    out.push([
      m * m * m * p0[0] + 3 * m * m * t * c1[0] + 3 * m * t * t * c2[0] + t * t * t * p3[0],
      m * m * m * p0[1] + 3 * m * m * t * c1[1] + 3 * m * t * t * c2[1] + t * t * t * p3[1],
    ]);
  }
  return out;
}

/** Çokgen; her köşeye isteğe bağlı yuvarlama yarıçapı [x, y, r]. */
export function roundPoly(pts: [number, number, number?][]): string {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const [x, y, r = 0] = pts[i];
    const [px, py] = pts[(i - 1 + n) % n];
    const [qx, qy] = pts[(i + 1) % n];
    if (r <= 0) {
      d += `${i === 0 ? 'M' : 'L'}${r1(x)} ${r1(y)}`;
      continue;
    }
    const l1 = Math.hypot(px - x, py - y) || 1;
    const l2 = Math.hypot(qx - x, qy - y) || 1;
    const t1 = Math.min(r, l1 / 2);
    const t2 = Math.min(r, l2 / 2);
    const ax = x + ((px - x) / l1) * t1;
    const ay = y + ((py - y) / l1) * t1;
    const bx = x + ((qx - x) / l2) * t2;
    const by = y + ((qy - y) / l2) * t2;
    d += `${i === 0 ? 'M' : 'L'}${r1(ax)} ${r1(ay)}Q${r1(x)} ${r1(y)} ${r1(bx)} ${r1(by)}`;
  }
  return d + 'Z';
}

// ── Üstten görünüm ───────────────────────────────────────────────
// Sağ krampon taban hattı (burun yukarıda, iç yan solda). Alttan görünümde aynı hat sol kramponun tabanıdır.
export const BOOT_OUT =
  'M286 22C340 18 396 70 404 150C410 195 408 240 400 275C392 315 385 345 382 372C379 410 384 450 380 488C376 528 346 548 304 548C260 548 232 526 230 486C228 446 232 404 224 364C218 328 206 292 202 244C198 188 212 126 240 76C255 50 268 24 286 22Z';

// Burun kapağı dikişi (sağ ayak, burun yukarıda; sağ taraf = dış). Üç parça: iç / orta / dış.
export const TOP_SEAM_1 = 'C195 134 235 150 263 160.5';
export const TOP_SEAM_2 = 'C278 166 288 167 302 167 C316 167 323 165.2 337 160.5';
export const TOP_SEAM_3 = 'C359 151.5 410 134 454 128';
export const TOP_SEAM = `M150 128 ${TOP_SEAM_1} ${TOP_SEAM_2} ${TOP_SEAM_3}`;

const S1 = cubicPts([150, 128], [195, 134], [235, 150], [263, 160.5], 6);
const S2 = [...cubicPts([263, 160.5], [278, 166], [288, 167], [302, 167], 3), ...cubicPts([302, 167], [316, 167], [323, 165.2], [337, 160.5], 3).slice(1)];
const S3 = cubicPts([337, 160.5], [359, 151.5], [410, 134], [454, 128], 8);
const withR = (pts: Pt[], first?: number, last?: number): [number, number, number?][] =>
  pts.map((p, i) => [p[0], p[1], i === 0 ? first : i === pts.length - 1 ? last : 0] as [number, number, number?]);
const BOTTOM_IC = cubicPts([263, 372], [230, 380], [190, 388], [150, 396], 4);
const BOTTOM_DIS = cubicPts([454, 396], [410, 388], [370, 380], [337, 372], 4);
const BOTTOM_TAM = cubicPts([337, 372], [318, 367], [282, 367], [263, 372], 4);

const TOP: ViewGeo = {
  W: 600,
  H: 700,
  ox: 0,
  oy: 62,
  flipsRight: false,
  zones: {
    uc: {
      d: `M150 128 ${TOP_SEAM_1} ${TOP_SEAM_2} ${TOP_SEAM_3} L480 128 L480 -40 L120 -40 Z`,
      px: 292, py: 84, lx: 428, ly: 70, anchor: 'start',
      ball: { x: 292, y: -16, r: 38 },
    },
    ustIc: {
      d: roundPoly([...withR(S1, 0, 13), ...withR(BOTTOM_IC, 13, 0).slice(0)]),
      px: 233, py: 256, lx: 176, ly: 168, anchor: 'end',
      ball: { x: 176, y: 262, r: 38 },
    },
    ustTam: {
      d: roundPoly([...withR(S2, 13, 13), ...withR(BOTTOM_TAM, 13, 13)]),
      px: 300, py: 318, lx: 176, ly: 330, anchor: 'end',
      ball: { x: 296, y: -6, r: 38 },
    },
    ustDis: {
      d: roundPoly([...withR(S3, 13, 0), ...withR(BOTTOM_DIS, 0, 13)]),
      px: 372, py: 252, lx: 428, ly: 168, anchor: 'start',
      ball: { x: 432, y: 264, r: 38 },
    },
  },
};


// ── Yan görünüm (burun solda, 720×420; çizim 24 birim sağa kaydırılır) ─────────────────────────────
// Üst gövde silüeti (taban plakasına oturur) ve taban plakası.
export const SIDE_UPPER =
  'M44 299C34 288 32 266 46 250C58 236 82 228 112 224C154 214 200 192 244 168C296 144 342 116 374 92C384 76 400 70 416 74C430 78 436 90 432 104C446 132 462 154 486 166C514 178 542 152 566 130C580 120 594 124 600 138C610 170 616 232 612 272L610 299Z';
export const SIDE_SOLE =
  'M42 296L612 296C613 306 609 316 597 320C560 326 520 324 470 324L190 324C140 324 100 326 70 322C50 318 40 308 42 296Z';

// iç/dış ayak üstü: bağcık çizgisinin hemen altında, yan yüzeye paralel şerit
const INSTEP_BAND = ribbon(
  [[186, 252], [244, 227], [300, 196], [352, 164], [386, 143]],
  [16, 26, 28, 26, 16],
);

// topuk: topuk koruyucusu (arka); top, topuğun arkasında yerde durur
const SIDE_HEEL: ZoneShape = {
  d: 'M606 301L611 160C602 146 580 150 560 164C528 186 500 214 494 252C490 276 494 292 500 301Z',
  px: 566, py: 236, lx: 566, ly: 46, anchor: 'middle',
  ball: { x: 652, y: 314, r: 38 },
};

const SIDE_IC: Partial<Record<FootZone, ZoneShape>> = {
  ustIc: {
    d: INSTEP_BAND,
    px: 214, py: 240, lx: 214, ly: 46, anchor: 'middle',
    ball: { x: 170, y: 224, r: 30, air: true },
  },
  ic: {
    d: smoothClosed([
      [124, 294], [132, 284], [162, 280], [212, 264], [264, 240], [322, 210], [376, 180], [418, 184], [440, 208], [444, 250], [436, 290],
      [420, 304], [330, 306], [220, 306], [140, 306],
    ]),
    px: 213, py: 278, lx: 213, ly: 396, anchor: 'middle',
    ball: { x: 136, y: 314, r: 38 },
  },
  topuk: SIDE_HEEL,
};

const SIDE_DIS: Partial<Record<FootZone, ZoneShape>> = {
  ustDis: {
    d: INSTEP_BAND,
    px: 214, py: 240, lx: 214, ly: 46, anchor: 'middle',
    ball: { x: 170, y: 224, r: 30, air: true },
  },
  dis: {
    d: smoothClosed([
      [128, 300], [134, 280], [166, 262], [214, 254], [270, 252], [322, 258], [356, 276], [366, 298],
      [352, 306], [260, 306], [160, 306], [132, 306],
    ]),
    px: 251, py: 282, lx: 251, ly: 396, anchor: 'middle',
    ball: { x: 136, y: 314, r: 38 },
  },
  topuk: SIDE_HEEL,
};

// ── Alttan görünüm (taban + çiviler) ──────────────────────────────
// Çizim, sol kramponun tabanıdır (iç yan solda); sağ ayak için BootMap yatayda çevirir.
export const SOLE_STUDS: { x: number; y: number; r: number }[] = [
  { x: 300, y: 80, r: 17 },
  { x: 252, y: 140, r: 17 },
  { x: 350, y: 136, r: 17 },
  { x: 238, y: 212, r: 18 },
  { x: 306, y: 206, r: 18 },
  { x: 374, y: 210, r: 18 },
  { x: 268, y: 456, r: 18 },
  { x: 346, y: 454, r: 18 },
  { x: 284, y: 512, r: 17 },
  { x: 332, y: 510, r: 17 },
];

const SOLE: ViewGeo = {
  W: 600,
  H: 700,
  ox: 0,
  oy: 62,
  flipsRight: true,
  zones: {
    taban: {
      d: smoothClosed([
        [196, -10], [304, -16], [418, -10], [424, 150], [424, 300], [418, 398], [364, 408], [300, 410], [236, 408], [186, 398], [180, 300], [180, 150],
      ]),
      px: 236, py: 262, lx: 176, ly: 252, anchor: 'end',
      ball: { x: 300, y: -10, r: 38 },
    },
    topuk: {
      d: smoothClosed([
        [180, 428], [236, 422], [300, 428], [364, 422], [424, 428], [424, 520], [424, 580], [300, 590], [180, 580], [180, 520],
      ]),
      px: 300, py: 480, lx: 428, ly: 520, anchor: 'start', via: [412, 520],
      ball: { x: 300, y: 584, r: 38 },
    },
  },
};

export const GEO: Record<BootView, ViewGeo> = {
  ust: TOP,
  ic: { W: 720, H: 420, ox: 24, oy: 0, flipsRight: false, zones: SIDE_IC },
  dis: { W: 720, H: 420, ox: 24, oy: 0, flipsRight: true, zones: SIDE_DIS },
  taban: SOLE,
};
