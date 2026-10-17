// Teknik hareket animasyonları: zaman çizelgesi (faz, örnekleme, kare üretimi). React yok, DOM yok.
import type { FootZone } from '@/data/types';
import {
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
  /** üstten görünüm kutusu: topun kavis yönü (vuran ayak sağ ayak) */
  curve?: 'sol' | 'sag';
  /** yakın çekim penceresi için ek not (isteğe bağlı) */
  note?: string;
}

export interface Compiled {
  pose: PoseTrack;
  ball: BallTrack;
}
const cache = new WeakMap<TechMotion, Compiled>();
export function compileMotion(m: TechMotion): Compiled {
  let c = cache.get(m);
  if (!c) {
    c = { pose: compilePose(m.keys), ball: compileBall(m.ball) };
    cache.set(m, c);
  }
  return c;
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
    ball = { x: k.ball[0], y: k.ball[1], r: ball.r };
  }
  return { t: tt, sk, ball, glow: glowAt(m, tt), phase: phaseAt(m, tt) };
}

/** Temas anındaki yüzeyin topa göre konumu (test ve yakın çekim için). */
export function contactAt(m: TechMotion, sk: Skeleton) {
  return m.contact === 'alin' ? foreheadContact(sk) : zoneContact(sk.near.foot, m.contact);
}
