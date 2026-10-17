// Teknik hareket animasyonları: zaman çizelgesi (faz, örnekleme, kare üretimi). React yok, DOM yok.
import type { FootZone } from '@/data/types';
import {
  DEG,
  SEG,
  ballAt,
  compileBall,
  compilePose,
  foreheadContact,
  poseAt,
  solve,
  zoneContact,
  type BallKey,
  type BallState,
  type BallTrack,
  type LegMode,
  type PoseKey,
  type PoseTrack,
  type Skeleton,
} from './rig';
import { clamp, smoothstep } from './interp';

export type PhaseId = 'hazirlik' | 'temas' | 'takip';
export const PHASES: readonly PhaseId[] = ['hazirlik', 'temas', 'takip'];
export const PHASE_LABEL: Record<PhaseId, string> = { hazirlik: 'Hazırlık', temas: 'Temas', takip: 'Takip' };

export interface TechMotion {
  /** teknik kimliği (data/techniques/*.ts ile aynı) */
  id: string;
  /** toplam süre (sn, 1×) */
  dur: number;
  /** temas anı (sn) */
  tc: number;
  /** temas penceresi: temastan [önce, sonra] saniye (faz çubuğundaki "Temas" bölümü) */
  win?: readonly [number, number];
  /** [yakın (vuran sağ) bacak, uzak (basma) bacak] çözüm kipi */
  legs: readonly [LegMode, LegMode]
  /** kamera: görünümün sol kenarının dünya x'i (m) */
  cam: number;
  /** sahnenin üst sınırı, zeminden m (varsayılan 2,2); sıçrama ve kafa vuruşlarında yükseltin */
  top?: number;
  keys: readonly PoseKey[];
  ball: readonly BallKey[];
  /** top temas yüzeyine yapışık kalır (ör. ilk temas amortisi): [başla, bitir] sn */
  carry?: readonly [number, number];
  /** vurgulanan temas bölgeleri (BootMap ile aynı adlar) ya da alın */
  zones: readonly FootZone[] | 'alin';
  /** topun değdiği asıl bölge */
  contact: FootZone | 'alin';
  /** faz başına kısa Türkçe açıklama [Hazırlık, Temas, Takip] */
  caps: readonly [string, string, string];
  /** hareketin kısa adı (erişilebilir ad) */
  label: string;
  /**
   * Topun kavis yönü (vuran ayak sağ ayak). Verilirse "Üstten bakış" kutusu açılır; top anahtarlarında `z` yoksa
   * yol bu yöne göre şematik olarak üretilir: 'sol' = oyuncunun soluna (saat yönünün tersi, sağ ayağın iç yüzü),
   * 'sag' = oyuncunun sağına (saat yönü, sağ ayağın dış yüzü / trivela).
   */
  curve?: 'sol' | 'sag';
  /** üstten bakış kutusu için ek işaretler (isteğe bağlı); kutu `curve`, `plan` ya da top anahtarlarında `z` varsa açılır */
  plan?: PlanSpec;
  /** true: oyuncu temas sırasında havada (sıçrama, kafa vuruşu); basma ayağının yerde ve sabit olması beklenmez */
  airborne?: boolean;
  /** oynatıcıda faz açıklamasının altında gösterilen kısa not (isteğe bağlı, örn. "Gösterimde iç yüz kullanılır") */
  note?: string;
}

/** Üstten bakış kutusu işaretleri. x: ileri (m), z: oyuncunun sağı (m, − sol). */
export interface PlanSpec {
  /** baskı yapan rakibin konumu (şematik) */
  press?: readonly [x: number, z: number];
}

export interface Compiled {
  pose: PoseTrack;
  ball: BallTrack;
}
const cache = new WeakMap<TechMotion, Compiled>();
export function compileMotion(m: TechMotion): Compiled {
  let c = cache.get(m);
  if (!c) {
    c = { pose: compilePose(m.keys), ball: compileBall(withSpin(withCurveZ(m))) };
    cache.set(m, c);
  }
  return c;
}

/**
 * Hiçbir top anahtarında `r` (dönüş) verilmemişse, topun yerde yuvarlanır gibi dönmesi yatay yer değiştirmeden türetilir
 * (ileri giden top saat yönünde döner). `cut` anahtarlarında (vuruş/bırakış) dönüş korunur.
 */
function withSpin(keys: readonly BallKey[]): readonly BallKey[] {
  if (keys.some((k) => k.r !== undefined)) return keys;
  let r = 0;
  return keys.map((k, i) => {
    if (i > 0 && !k.cut) r -= (k.x - keys[i - 1].x) / SEG.ball / DEG;
    return { ...k, r };
  });
}

/** Top anahtarlarının bir kısmında `z` verilmiş mi (yazar derinliği kendisi belirlemiş)? */
export const hasBallZ = (m: TechMotion) => m.ball.some((k) => k.z !== undefined);
/** "Üstten bakış" kutusu gösterilecek mi? */
export const hasPlan = (m: TechMotion) => !!(m.curve || m.plan || hasBallZ(m));

/**
 * `curve` verilmiş ve yazar `z` girmemişse, temastan sonraki top anahtarlarına şematik bir kavis ekler:
 * önce kavisin ters tarafına açılıp (sağ ayak iç yüz için sağa) sonra kavis yönüne (sola) döner ve hedef çizgisine biter.
 */
function withCurveZ(m: TechMotion): readonly BallKey[] {
  if (!m.curve || hasBallZ(m)) return m.ball;
  const xc = ballAt(compileBall(m.ball), m.tc).x;
  const xEnd = Math.max(...m.ball.map((k) => k.x));
  const D = xEnd - xc;
  if (!(D > 0.5)) return m.ball;
  const side = m.curve === 'sol' ? 1 : -1; // sol kavis: önce sağa açılır
  const zp = clamp(0.12 * D, 0.25, 1.4);
  return m.ball.map((k) => {
    if (k.t < m.tc) return k;
    const u = clamp((k.x - xc) / D);
    return { ...k, z: side * zp * 4 * u * (1 - u) };
  });
}

export const DEFAULT_WIN: readonly [number, number] = [0.14, 0.14];
export function windowOf(m: TechMotion): readonly [number, number] {
  return m.win ?? DEFAULT_WIN;
}

/** Faz sınırları (sn): [hazırlık başı, temas başı, takip başı, son]. */
export function phaseBounds(m: TechMotion): [number, number, number, number] {
  const [a, b] = windowOf(m);
  return [0, Math.max(0.05, m.tc - a), Math.min(m.dur - 0.05, m.tc + b), m.dur];
}
export function phaseAt(m: TechMotion, t: number): PhaseId {
  const [, p1, p2] = phaseBounds(m);
  return t < p1 ? 'hazirlik' : t < p2 ? 'temas' : 'takip';
}

export interface Frame {
  t: number;
  sk: Skeleton;
  ball: BallState;
  /** temas vurgusunun yoğunluğu (0–1) */
  glow: number;
  phase: PhaseId;
}

/** Vurgunun yoğunluğu: temastan hemen önce açılır, temas penceresinin sonunda söner. */
export function glowAt(m: TechMotion, t: number): number {
  const [a, b] = windowOf(m);
  const up = smoothstep(m.tc - a, m.tc - 0.02, t);
  const down = 1 - smoothstep(m.tc + b * 0.55, m.tc + b + 0.12, t);
  return clamp(up * down);
}

export function frameAt(m: TechMotion, t: number, c: Compiled = compileMotion(m)): Frame {
  const tt = clamp(t, 0, m.dur);
  const sk = solve(poseAt(c.pose, tt), m.legs);
  let ball = ballAt(c.ball, tt);
  if (m.carry && tt >= m.carry[0] && tt <= m.carry[1]) {
    const k = m.contact === 'alin' ? foreheadContact(sk) : zoneContact(sk.near.foot, m.contact);
    ball = { x: k.ball[0], y: k.ball[1], z: k.bz, r: ball.r };
  }
  return { t: tt, sk, ball, glow: glowAt(m, tt), phase: phaseAt(m, tt) };
}

/**
 * Hareketi azalt tercihinde gösterilen üç sabit karenin zamanları: Hazırlık başı, temas anı (Temas fazının anahtar karesi:
 * top yüzeye değer, vurgu yanar), Takip başı.
 */
export function stripTimes(m: TechMotion): [number, number, number] {
  const [, , p2] = phaseBounds(m);
  return [0, m.tc, p2];
}

/** Topun son konumları (en eskiden yeniye): hızlı hareketi okunur kılan soluk iz. Top neredeyse duruyorsa boş döner. */
export function trailAt(m: TechMotion, t: number, c: Compiled = compileMotion(m), n = 8, dt = 0.045): BallState[] {
  const now = frameAt(m, t, c).ball;
  const pts: BallState[] = [];
  let far = 0;
  for (let k = n; k >= 1; k--) {
    const tt = t - k * dt;
    if (tt < 0) continue;
    const b = frameAt(m, tt, c).ball;
    far = Math.max(far, Math.hypot(b.x - now.x, b.y - now.y));
    pts.push(b);
  }
  return far < 0.1 ? [] : pts;
}

/** Temas anındaki yüzeyin topa göre konumu (test ve yakın çekim için). */
export function contactAt(m: TechMotion, sk: Skeleton) {
  return m.contact === 'alin' ? foreheadContact(sk) : zoneContact(sk.near.foot, m.contact);
}
