// Teknik hareket animasyonları: saf ileri kinematik (FK) iskeleti. React yok, DOM yok.
//
// Dünya: metre. x = oyuncunun baktığı yön (ekranda sağa), y = yukarı, z = kameraya doğru (oyuncunun sağı).
// Oyuncu SAĞ AYAKLIDIR; kamera oyuncunun sağında olduğundan yakın bacak (near) vuran sağ bacaktır,
// uzak bacak (far) basma (destek) bacağıdır.
//
// İskelet: pelvis, gövde (omurga), boyun/baş, omuzlar, dirsekler, kalçalar, dizler, bilekler, ayak parmakları.
// Eklem açıları derecedir. Eksenler:
//   tr  : gövde eğimi, dikeyden; + öne eğik
//   hd  : baş eğimi, gövdeye göre; + öne/aşağı
//   as/bs : kolun omuzdan sarkma açısı (dikeyden, + ileri); ae/be : dirsek bükülmesi (+ kol ileri-yukarı katlanır)
//   FK bacak [n0,n1,n2] = [kalça (uyluk açısı, dikeyden, + ileri), diz bükülmesi (≥0), bilek (taban eğme, + parmak aşağı)]
//   IK bacak [n0,n1,n2] = [bilek x, bilek y (m), ayak eğimi (parmak yönü yataydan, + parmak yukarı)]
//   ny/fy : ayağın dışa dönüşü (derece; 0 = düz, 90 = tam dışa dönük iç yüz pozisyonu)
// IK bacak, bileği dünyada sabit bir noktaya bastırır: basma ayağı kaymaz ve yerden kopmaz.
import type { FootZone } from '@/data/types';
import { spline, evalSpline, type Spline } from './interp';

export const DEG = Math.PI / 180;
export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];

/** Segment uzunlukları (m), yaklaşık 1,75 m boyunda bir oyuncu için (Winter antropometrisi oranları). */
export const SEG = {
  thigh: 0.43,
  shank: 0.43,
  trunk: 0.5,
  neck: 0.21,
  upper: 0.31,
  fore: 0.25,
  hand: 0.08,
  headR: 0.105,
  ball: 0.11,
} as const;

export type LegMode = 'fk' | 'ik';

export const CHANNELS = ['px', 'py', 'tr', 'hd', 'as', 'ae', 'bs', 'be', 'n0', 'n1', 'n2', 'ny', 'f0', 'f1', 'f2', 'fy'] as const;
export type Chan = (typeof CHANNELS)[number];
export type Pose = Record<Chan, number>;

// ── Vektör yardımcıları ───────────────────────────────────────
const sc3 = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot3 = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** Rodrigues: v vektörünü birim k ekseni etrafında ang (rad) döndürür (sağ el kuralı). */
function rot3(v: Vec3, k: Vec3, ang: number): Vec3 {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const kv = cross3(k, v);
  const kd = dot3(k, v) * (1 - c);
  return [v[0] * c + kv[0] * s + k[0] * kd, v[1] * c + kv[1] * s + k[1] * kd, v[2] * c + kv[2] * s + k[2] * kd];
}
const norm3 = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

// ── Krampon (yan profil + genişlik) ──────────────────────────
/** Kramponun yerel ekseni: u = ayak ekseni boyunca ileri, v = yukarı (tabana dik), w = ayağın dışı (sağ ayakta +z). Bilek = (0,0). */
export type BootPt = readonly [u: number, v: number, hw: number];
/** Saat yönünde profil çizgisi: topuk altı → taban → burun → bağcık → kolluk → topuk. hw = o noktadaki yarım genişlik. */
export const BOOT: readonly BootPt[] = [
  [-0.072, -0.085, 0.03],
  [0.0, -0.085, 0.036],
  [0.08, -0.085, 0.046],
  [0.15, -0.085, 0.052],
  [0.205, -0.08, 0.04],
  [0.228, -0.06, 0.026],
  [0.234, -0.03, 0.02],
  [0.222, 0.0, 0.026],
  [0.19, 0.018, 0.038],
  [0.14, 0.036, 0.046],
  [0.095, 0.054, 0.046],
  [0.06, 0.075, 0.04],
  [0.04, 0.11, 0.034],
  [0.02, 0.13, 0.032],
  [-0.03, 0.12, 0.034],
  [-0.062, 0.092, 0.034],
  [-0.082, 0.04, 0.032],
  [-0.088, -0.02, 0.03],
  [-0.08, -0.065, 0.03],
];
/** Taban (dış taban) şeridi, yerel (u,v) çokgeni. */
export const SOLE: ReadonlyArray<readonly [number, number]> = [
  [-0.073, -0.085],
  [0.205, -0.085],
  [0.222, -0.072],
  [0.229, -0.054],
  [0.208, -0.052],
  [0.05, -0.058],
  [-0.078, -0.058],
];
/** Pençe (krampon çivisi) konumları: u. */
export const STUDS: readonly number[] = [-0.045, 0.01, 0.1, 0.17];
export const STUD_H = 0.014;
/** Ayak parmak eklemi (MTP) ekseni: bunun ilerisi `toe` kadar yukarı bükülür. */
export const MTP = { u: 0.14, v: -0.075 } as const;
/** Ayak yerdeyken (düz) bilek yüksekliği: taban + çivi. */
export const ANKLE_H = 0.085 + STUD_H;

/** Üst yüzey (burun → kolluk), ayak üstü bölgelerinin oturduğu çizgi. */
const TOP: ReadonlyArray<readonly [number, number]> = [
  [0.222, 0.0],
  [0.19, 0.018],
  [0.14, 0.036],
  [0.095, 0.054],
  [0.06, 0.075],
];
export function vampV(u: number): number {
  if (u >= TOP[0][0]) return TOP[0][1];
  if (u <= TOP[TOP.length - 1][0]) return TOP[TOP.length - 1][1];
  for (let i = 0; i < TOP.length - 1; i++) {
    const [u0, v0] = TOP[i];
    const [u1, v1] = TOP[i + 1];
    if (u <= u0 && u >= u1) return v1 + ((v0 - v1) * (u - u1)) / (u0 - u1);
  }
  return 0;
}
/** Yan genişlik (yarım) u'ya göre. */
export function halfWidth(u: number): number {
  const pts: ReadonlyArray<readonly [number, number]> = [
    [-0.09, 0.03],
    [0.0, 0.036],
    [0.15, 0.05],
    [0.234, 0.02],
  ];
  if (u <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    if (u <= pts[i + 1][0]) return pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * (u - pts[i][0])) / (pts[i + 1][0] - pts[i][0]);
  }
  return pts[pts.length - 1][1];
}

export interface ZoneGeom {
  /** bölge yaması: yerel (u,v,w) köşeleri */
  pts: ReadonlyArray<Vec3>;
  /** temas noktası (yerel) */
  c: Vec3;
  /** dış yüzey normali (yerel, birim) */
  n: Vec3;
}

function topQuad(u0: number, u1: number, w0: number, w1: number, drop = 0, lift = 0.003): Vec3[] {
  const d = (w: number) => drop * (Math.abs(w) / 0.04) ** 2;
  return [
    [u0, vampV(u0) + lift - d(w0), w0],
    [u1, vampV(u1) + lift - d(w0), w0],
    [u1, vampV(u1) + lift - d(w1), w1],
    [u0, vampV(u0) + lift - d(w1), w1],
  ];
}
function slopeNormal(u0: number, u1: number, tilt: number): Vec3 {
  const du = u1 - u0;
  const dv = vampV(u1) - vampV(u0);
  // üst yüzeyin dışa normali: eğim burna doğru aşağı indiği için yukarı-ileri bakar
  const l = Math.hypot(du, dv);
  return norm3([-dv / l, du / l, tilt]);
}

/** Her temas bölgesinin kramponun üzerindeki yeri (BootMap bölge adlarıyla aynı). */
export const ZONE_GEOM: Record<FootZone, ZoneGeom> = {
  ustTam: { pts: topQuad(0.065, 0.17, -0.022, 0.022), c: [0.115, vampV(0.115) + 0.003, 0], n: slopeNormal(0.065, 0.17, 0) },
  ustIc: { pts: topQuad(0.04, 0.135, -0.042, -0.004, 0.014), c: [0.085, vampV(0.085) + 0.001, -0.022], n: slopeNormal(0.04, 0.135, -0.45) },
  ustDis: { pts: topQuad(0.04, 0.17, 0.004, 0.042, 0.014), c: [0.105, vampV(0.105) + 0.001, 0.024], n: slopeNormal(0.04, 0.17, 0.45) },
  ic: {
    pts: [
      [-0.02, -0.06, -0.034],
      [0.13, -0.06, -0.049],
      [0.13, 0.03, -0.049],
      [-0.02, 0.03, -0.036],
    ],
    c: [0.055, -0.015, -0.044],
    n: [0, 0, -1],
  },
  dis: {
    pts: [
      [0.0, -0.06, 0.036],
      [0.16, -0.06, 0.05],
      [0.16, 0.02, 0.05],
      [0.0, 0.02, 0.036],
    ],
    c: [0.08, -0.02, 0.046],
    n: [0, 0, 1],
  },
  uc: {
    pts: [
      [0.206, -0.05, -0.022],
      [0.236, -0.05, 0.0],
      [0.236, 0.0, 0.0],
      [0.206, 0.0, 0.022],
    ],
    c: [0.234, -0.026, 0],
    n: [1, 0, 0],
  },
  topuk: {
    pts: [
      [-0.09, -0.06, -0.02],
      [-0.09, -0.06, 0.02],
      [-0.09, 0.05, 0.02],
      [-0.09, 0.05, -0.02],
    ],
    c: [-0.089, -0.01, 0],
    n: [-1, 0, 0],
  },
  taban: {
    pts: [
      [-0.06, -0.088, -0.03],
      [0.2, -0.088, -0.03],
      [0.2, -0.088, 0.03],
      [-0.06, -0.088, 0.03],
    ],
    c: [0.06, -0.088, 0],
    n: [0, -1, 0],
  },
};

// ── Ayak çerçevesi ───────────────────────────────────────────
export interface Foot {
  ankle: Vec2;
  /** ayağın yerel eksenleri dünyada: U ileri, V yukarı, W dış (yan) */
  U: Vec3;
  V: Vec3;
  W: Vec3;
  side: 1 | -1;
  /** ön ayağın (MTP'den sonrası) yukarı bükülmesi, derece */
  toe: number;
  /** parmak yönünün yataydan açısı (derece, + parmak yukarı) */
  pitch: number;
}

function makeFoot(ankle: Vec2, shankDeg: number, plantar: number, yawDeg: number, side: 1 | -1, toe: number): Foot {
  const s = shankDeg * DEG;
  const sd: Vec3 = [Math.sin(s), -Math.cos(s), 0]; // baldır ekseni (aşağı)
  let u: Vec3 = [Math.cos(s), Math.sin(s), 0];
  let v: Vec3 = [-Math.sin(s), Math.cos(s), 0];
  let wz: Vec3 = [0, 0, 1];
  const yaw = side * yawDeg * DEG;
  // bacağın uzun ekseni etrafında dışa dönüş (kalçadan gelir), sonra bilekte taban eğme
  u = rot3(u, sd, yaw);
  wz = rot3(wz, sd, yaw);
  const a = plantar * DEG;
  u = rot3(u, wz, -a);
  v = rot3(v, wz, -a);
  return { ankle, U: u, V: v, W: side === 1 ? wz : sc3(wz, -1), side, toe, pitch: shankDeg - plantar };
}

/** Ayağın yerel noktasını dünyaya taşır (ön ayak bükülmesi dahil). z = kameraya doğru derinlik. */
export function footPoint(f: Foot, u: number, v: number, w: number): Vec3 {
  if (f.toe && u > MTP.u) {
    const th = f.toe * DEG;
    const du = u - MTP.u;
    const dv = v - MTP.v;
    u = MTP.u + du * Math.cos(th) - dv * Math.sin(th);
    v = MTP.v + du * Math.sin(th) + dv * Math.cos(th);
  }
  return [f.ankle[0] + u * f.U[0] + v * f.V[0] + w * f.W[0], f.ankle[1] + u * f.U[1] + v * f.V[1] + w * f.W[1], u * f.U[2] + v * f.V[2] + w * f.W[2]];
}
/** Yerel yönü dünyaya çevirir (normal için; ön ayak bükülmesi yok sayılır). */
export function footDir(f: Foot, n: Vec3): Vec3 {
  return norm3([n[0] * f.U[0] + n[1] * f.V[0] + n[2] * f.W[0], n[0] * f.U[1] + n[1] * f.V[1] + n[2] * f.W[1], n[0] * f.U[2] + n[1] * f.V[2] + n[2] * f.W[2]]);
}

// ── Bacak ve kol çözümü ──────────────────────────────────────
export interface Leg {
  hip: Vec2;
  knee: Vec2;
  ankle: Vec2;
  /** uyluk / baldır açısı (dikeyden, + ileri), derece */
  thigh: number;
  shank: number;
  /** diz bükülmesi (derece) */
  flex: number;
  /** IK hedefi uzağa düştüyse aşan miktar (m); FK için 0 */
  over: number;
  foot: Foot;
}

const ang = (dx: number, dy: number) => Math.atan2(dx, -dy) / DEG; // dikey aşağıdan, + ileri

export function solveLegFK(hip: Vec2, hipDeg: number, kneeDeg: number, ankleDeg: number, yaw: number, side: 1 | -1): Leg {
  const th = hipDeg * DEG;
  const sh = (hipDeg - kneeDeg) * DEG;
  const knee: Vec2 = [hip[0] + SEG.thigh * Math.sin(th), hip[1] - SEG.thigh * Math.cos(th)];
  const ankle: Vec2 = [knee[0] + SEG.shank * Math.sin(sh), knee[1] - SEG.shank * Math.cos(sh)];
  return { hip, knee, ankle, thigh: hipDeg, shank: hipDeg - kneeDeg, flex: kneeDeg, over: 0, foot: makeFoot(ankle, hipDeg - kneeDeg, ankleDeg, yaw, side, 0) };
}

export function solveLegIK(hip: Vec2, ax: number, ay: number, pitch: number, yaw: number, side: 1 | -1): Leg {
  const L = SEG.thigh; // uyluk = baldır uzunluğu
  let dx = ax - hip[0];
  let dy = ay - hip[1];
  let d = Math.hypot(dx, dy);
  const dmax = SEG.thigh + SEG.shank - 0.0005;
  let over = 0;
  if (d > dmax) {
    over = d - dmax;
    dx *= dmax / d;
    dy *= dmax / d;
    d = dmax;
  }
  if (d < 0.08) {
    d = 0.08;
    dx = dx === 0 && dy === 0 ? 0 : dx;
  }
  const ux = dx / d;
  const uy = dy / d;
  const al = Math.acos(Math.min(1, d / (2 * L)));
  const cand = (sg: number): Vec2 => {
    const c = Math.cos(sg * al);
    const s = Math.sin(sg * al);
    return [hip[0] + L * (ux * c - uy * s), hip[1] + L * (ux * s + uy * c)];
  };
  const k1 = cand(1);
  const k2 = cand(-1);
  const knee = k1[0] >= k2[0] ? k1 : k2; // diz öne bakar
  const ankle: Vec2 = [hip[0] + dx, hip[1] + dy];
  const thigh = ang(knee[0] - hip[0], knee[1] - hip[1]);
  const shank = ang(ankle[0] - knee[0], ankle[1] - knee[1]);
  const plantar = shank - pitch;
  return { hip, knee, ankle, thigh, shank, flex: thigh - shank, over, foot: makeFoot(ankle, shank, plantar, yaw, side, Math.max(0, -pitch)) };
}

export interface Arm {
  shoulder: Vec2;
  elbow: Vec2;
  wrist: Vec2;
  hand: Vec2;
}
function solveArm(sh: Vec2, a: number, e: number): Arm {
  const a1 = a * DEG;
  const a2 = (a + e) * DEG;
  const elbow: Vec2 = [sh[0] + SEG.upper * Math.sin(a1), sh[1] - SEG.upper * Math.cos(a1)];
  const wrist: Vec2 = [elbow[0] + SEG.fore * Math.sin(a2), elbow[1] - SEG.fore * Math.cos(a2)];
  const hand: Vec2 = [wrist[0] + SEG.hand * Math.sin(a2), wrist[1] - SEG.hand * Math.cos(a2)];
  return { shoulder: sh, elbow, wrist, hand };
}

export interface Skeleton {
  pelvis: Vec2;
  shoulder: Vec2;
  /** baş merkezi */
  head: Vec2;
  /** gövde ve baş açıları (derece, dikeyden + ileri) */
  trunkDeg: number;
  headDeg: number;
  near: Leg;
  far: Leg;
  armN: Arm;
  armF: Arm;
}

export function solve(p: Pose, modes: readonly [LegMode, LegMode]): Skeleton {
  const pelvis: Vec2 = [p.px, p.py];
  const tr = p.tr * DEG;
  const shoulder: Vec2 = [p.px + SEG.trunk * Math.sin(tr), p.py + SEG.trunk * Math.cos(tr)];
  const headDeg = p.tr + p.hd;
  const ha = headDeg * DEG;
  const head: Vec2 = [shoulder[0] + SEG.neck * Math.sin(ha), shoulder[1] + SEG.neck * Math.cos(ha)];
  const near = modes[0] === 'fk' ? solveLegFK(pelvis, p.n0, p.n1, p.n2, p.ny, 1) : solveLegIK(pelvis, p.n0, p.n1, p.n2, p.ny, 1);
  const far = modes[1] === 'fk' ? solveLegFK(pelvis, p.f0, p.f1, p.f2, p.fy, -1) : solveLegIK(pelvis, p.f0, p.f1, p.f2, p.fy, -1);
  return { pelvis, shoulder, head, trunkDeg: p.tr, headDeg, near, far, armN: solveArm(shoulder, p.as, p.ae), armF: solveArm(shoulder, p.bs, p.be) };
}

// ── Krampon geometrisi (izdüşüm) ─────────────────────────────
export interface BootShape {
  /** profil çizgisinin iki yüzü (w = +hw ve −hw) ekrana izdüşümü */
  plus: Vec2[];
  minus: Vec2[];
  sole: Vec2[];
  soleMinus: Vec2[];
  studs: Vec2[][];
}

const xy = (p: Vec3): Vec2 => [p[0], p[1]];

export function bootShape(f: Foot): BootShape {
  const plus = BOOT.map(([u, v, hw]) => xy(footPoint(f, u, v, hw)));
  const minus = BOOT.map(([u, v, hw]) => xy(footPoint(f, u, v, -hw)));
  const sole = SOLE.map(([u, v]) => xy(footPoint(f, u, v, halfWidth(u) * 0.96)));
  const soleMinus = SOLE.map(([u, v]) => xy(footPoint(f, u, v, -halfWidth(u) * 0.96)));
  const studs = STUDS.map((u) => {
    const hw = halfWidth(u) * 0.5;
    return [xy(footPoint(f, u - 0.012, -0.085, hw)), xy(footPoint(f, u + 0.012, -0.085, hw)), xy(footPoint(f, u + 0.008, -0.085 - STUD_H, hw)), xy(footPoint(f, u - 0.008, -0.085 - STUD_H, hw))] as Vec2[];
  });
  return { plus, minus, sole, soleMinus, studs };
}

/** Ayağın en alçak noktası (çivi uçları dahil), metre. */
export function footLowest(f: Foot): number {
  let lo = Infinity;
  for (const [u, v, hw] of BOOT) {
    lo = Math.min(lo, footPoint(f, u, v, hw)[1], footPoint(f, u, v, -hw)[1]);
  }
  for (const u of STUDS) lo = Math.min(lo, footPoint(f, u, -0.085 - STUD_H, 0)[1]);
  return lo;
}

export interface ZonePatch {
  poly: Vec2[];
  /** yüzey normalinin kameraya bakan bileşeni (−1…1): > 0.15 görünür, < −0.15 arka tarafta */
  facing: number;
}
export function zonePatch(f: Foot, zone: FootZone): ZonePatch {
  const g = ZONE_GEOM[zone];
  const n = footDir(f, g.n);
  return { poly: g.pts.map(([u, v, w]) => xy(footPoint(f, u, v, w))), facing: n[2] };
}

export interface Contact {
  /** yüzeyin dünyadaki temas noktası */
  p: Vec2;
  /** dışa birim normal (x,y) ve kameraya doğru bileşen */
  n: Vec2;
  /** topun merkezi (temas anında), ekrana izdüşüm */
  ball: Vec2;
  /** topun merkezinin derinliği (m, + oyuncunun sağı / kameraya doğru) */
  bz: number;
  /** yüzey normalinin kameraya bakan bileşeni (−1…1): < 0 ise yüzey kameradan uzağa bakar, top yüzeyin arkasında kalır */
  facing: number;
}
export function zoneContact(f: Foot, zone: FootZone): Contact {
  const g = ZONE_GEOM[zone];
  const p = footPoint(f, g.c[0], g.c[1], g.c[2]);
  const n = footDir(f, g.n);
  const l = Math.hypot(n[0], n[1]) || 1;
  // top yüzeye teğet olacak şekilde: merkez = temas noktası + yarıçap × normal (3B), ekrana izdüşüm
  return { p: xy(p), n: [n[0] / l, n[1] / l], ball: [p[0] + n[0] * SEG.ball, p[1] + n[1] * SEG.ball], bz: p[2] + n[2] * SEG.ball, facing: n[2] };
}

/** Alın bölgesi: baş merkezinden alına doğru. */
export function foreheadContact(sk: Skeleton): Contact {
  const a = sk.headDeg * DEG;
  const up: Vec2 = [Math.sin(a), Math.cos(a)];
  const fw: Vec2 = [Math.cos(a), -Math.sin(a)];
  const k = 38 * DEG;
  const n: Vec2 = [Math.cos(k) * fw[0] + Math.sin(k) * up[0], Math.cos(k) * fw[1] + Math.sin(k) * up[1]];
  const R = SEG.headR;
  const p: Vec2 = [sk.head[0] + n[0] * R, sk.head[1] + n[1] * R];
  return { p, n, ball: [p[0] + n[0] * SEG.ball, p[1] + n[1] * SEG.ball], bz: 0, facing: 0 };
}

// ── Anahtar kare izleri ──────────────────────────────────────
export interface PoseKey {
  t: number;
  p: Pose;
}
export type PoseTrack = Record<Chan, Spline>;

export function compilePose(keys: readonly PoseKey[]): PoseTrack {
  const t = keys.map((k) => k.t);
  const out = {} as PoseTrack;
  for (const c of CHANNELS) out[c] = spline(t, keys.map((k) => k.p[c]), 'rest');
  return out;
}
export function poseAt(tr: PoseTrack, t: number): Pose {
  const p = {} as Pose;
  for (const c of CHANNELS) p[c] = evalSpline(tr[c], t);
  return p;
}

export interface BallKey {
  t: number;
  x: number;
  y: number;
  /** derinlik (m): + oyuncunun sağı (kameraya doğru), − oyuncunun solu. Verilmezse 0 (oyuncunun orta düzlemi) */
  z?: number;
  /** birikimli dönüş (derece) */
  r?: number;
  /** bu anahtardaki hız (m/sn); verilmezse yumuşak (aşımsız) hesaplanır */
  vx?: number;
  vy?: number;
  /** true: önceki anahtarla süreklilik yok; yeni bir parça başlar (vuruş anı gibi ani hız değişimi) */
  cut?: boolean;
}
interface BallSeg {
  t0: number;
  x: Spline;
  y: Spline;
  z: Spline;
  r: Spline;
}
export type BallTrack = BallSeg[];

export function compileBall(keys: readonly BallKey[]): BallTrack {
  const segs: BallKey[][] = [];
  keys.forEach((k, i) => {
    if (i === 0 || k.cut) segs.push([k]);
    else segs[segs.length - 1].push(k);
  });
  return segs.map((ks) => {
    const t = ks.map((k) => k.t);
    return {
      t0: ks[0].t,
      x: spline(t, ks.map((k) => k.x), 'free', ks.map((k) => k.vx)),
      y: spline(t, ks.map((k) => k.y), 'free', ks.map((k) => k.vy)),
      z: spline(t, ks.map((k) => k.z ?? 0), 'free'),
      r: spline(t, ks.map((k) => k.r ?? 0), 'free'),
    };
  });
}
export interface BallState {
  x: number;
  y: number;
  /** derinlik (m), bkz. BallKey.z */
  z: number;
  r: number;
}
export function ballAt(tr: BallTrack, t: number): BallState {
  let seg = tr[0];
  for (const s of tr) if (s.t0 <= t) seg = s;
  return { x: evalSpline(seg.x, t), y: evalSpline(seg.y, t), z: evalSpline(seg.z, t), r: evalSpline(seg.r, t) };
}
