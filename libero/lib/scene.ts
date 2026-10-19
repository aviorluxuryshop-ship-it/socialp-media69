import type { Actor, ActorType, ArrowKind, BallState, Frame, FrameOpts, Pt, Scene, ViewId, Zone } from './types';

/* ───────────────────────────────────────────────────────────
   Sahne motoru — saf (UI'sız) kısım
   • Koordinatlar metre cinsinden: x 0–105 (hücum → sağ), y 0–68.
   • Her adım yalnızca DEĞİŞENİ yazar; oklar (pas / koşu / çalım / şut)
     konum ve top değişimlerinden OTOMATİK türetilir.
   ─────────────────────────────────────────────────────────── */

export const PITCH_L = 105;
export const PITCH_W = 68;

export interface ViewDef {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  pad: number;
  /** oyuncu yarıçapı (metre) */
  unit: number;
  vertical: boolean;
}

const BASE: Record<Exclude<ViewId, 'grid'>, Omit<ViewDef, 'vertical'> & { v: boolean }> = {
  full: { x0: 0, x1: 105, y0: 0, y1: 68, pad: 3.2, unit: 1.75, v: false },
  half: { x0: 49, x1: 105, y0: 0, y1: 68, pad: 3.2, unit: 1.7, v: true },
  box: { x0: 63, x1: 105, y0: 6, y1: 62, pad: 2.6, unit: 1.5, v: true },
  mid: { x0: 28, x1: 77, y0: 0, y1: 68, pad: 3.2, unit: 1.7, v: true },
  defend: { x0: 0, x1: 56, y0: 0, y1: 68, pad: 3.2, unit: 1.7, v: true },
  gk: { x0: 0, x1: 34, y0: 6, y1: 62, pad: 2.4, unit: 1.45, v: true },
};

export function viewOf(scene: Pick<Scene, 'v' | 'w' | 'h' | 'hz'>, forceVertical?: boolean): ViewDef {
  if (scene.v === 'grid') {
    const w = scene.w ?? 20;
    const h = scene.h ?? 20;
    const unit = Math.max(0.5, Math.min(1.1, Math.min(w, h) / 22));
    return { x0: 0, x1: w, y0: 0, y1: h, pad: Math.max(1, unit * 1.6), unit, vertical: false };
  }
  const b = BASE[scene.v];
  let vertical = b.v;
  if (scene.hz) vertical = false;
  if (forceVertical !== undefined) vertical = forceVertical;
  return { x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, pad: b.pad, unit: b.unit, vertical };
}

/** İçeriğe göre otomatik kırpılmış görünüm: oyuncular büyük, gereksiz saha küçük kalır. */
export function fitView(scene: Scene, tl: FrameState[], forceVertical?: boolean): ViewDef {
  if (scene.v === 'grid') return viewOf(scene, forceVertical);
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  const add = (x: number, y?: number) => {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y !== undefined) {
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  };
  for (const f of tl) {
    for (const a of scene.a) {
      const p = f.pos[a.id];
      if (p) add(p[0], p[1]);
    }
    if (f.ball) add(f.ball.pt[0], f.ball.pt[1]);
    for (const a of f.arrows) {
      add(a.from[0], a.from[1]);
      add(a.to[0], a.to[1]);
    }
    for (const z of f.zones) {
      add(z.x, z.y);
      add(z.x + z.w, z.y + z.h);
    }
    for (const t of f.txt) add(t.x, t.y);
    if (f.line !== null) add(f.line);
  }
  if (!isFinite(x0) || !isFinite(y0)) return viewOf(scene, forceVertical);

  const vertical = forceVertical ?? (scene.v !== 'full' && !scene.hz);
  const M = 8;
  x0 -= M;
  x1 += M;
  y0 -= M;
  y1 += M;
  // kale çizgisine ulaşan sahnelerde kaleyi tam göster
  if (x1 >= 104) x1 = Math.max(x1, 108);
  if (x0 <= 1) x0 = Math.min(x0, -3);

  // en az 30 m; en-boy oranını makul tut
  const MIN = 30;
  const grow = (a: number, b: number, need: number): [number, number] => {
    const c = (a + b) / 2;
    return [c - need / 2, c + need / 2];
  };
  if (x1 - x0 < MIN) [x0, x1] = grow(x0, x1, MIN);
  if (y1 - y0 < MIN) [y0, y1] = grow(y0, y1, MIN);

  // ekranda genişlik/yükseklik (dikeyde x yükseklik, y genişlik olur)
  const sw = () => (vertical ? y1 - y0 : x1 - x0);
  const sh = () => (vertical ? x1 - x0 : y1 - y0);
  const growW = (need: number) => {
    if (vertical) [y0, y1] = grow(y0, y1, need);
    else [x0, x1] = grow(x0, x1, need);
  };
  const growH = (need: number) => {
    if (vertical) [x0, x1] = grow(x0, x1, need);
    else [y0, y1] = grow(y0, y1, need);
  };
  if (sw() / sh() < 0.82) growW(sh() * 0.82);
  else if (sw() / sh() > 1.75) growH(sw() / 1.75);

  // saha sınırları: kaydırarak sığdır, gerekirse kırp
  const LIM_X: [number, number] = [-3.5, 108.5];
  const LIM_Y: [number, number] = [-3.5, 71.5];
  const shift = (a: number, b: number, lim: [number, number]): [number, number] => {
    let lo = a;
    let hi = b;
    if (hi - lo > lim[1] - lim[0]) return [lim[0], lim[1]];
    if (lo < lim[0]) [lo, hi] = [lim[0], lim[0] + (b - a)];
    if (hi > lim[1]) [lo, hi] = [lim[1] - (b - a), lim[1]];
    return [lo, hi];
  };
  [x0, x1] = shift(x0, x1, LIM_X);
  [y0, y1] = shift(y0, y1, LIM_Y);

  const span = Math.max(x1 - x0, y1 - y0);
  const unit = Math.max(1.15, Math.min(2.25, span / 30));
  return { x0, x1, y0, y1, pad: 0, unit, vertical };
}

export interface Projector {
  w: number;
  h: number;
  p: (x: number, y: number) => Pt;
  q: (sx: number, sy: number) => Pt;
  /** saha çizgileri için grup dönüşümü */
  matrix: string;
}

export function projector(v: ViewDef): Projector {
  const { x0, x1, y0, y1, pad, vertical } = v;
  if (!vertical) {
    return {
      w: x1 - x0 + pad * 2,
      h: y1 - y0 + pad * 2,
      p: (x, y) => [x - x0 + pad, y - y0 + pad],
      q: (sx, sy) => [sx - pad + x0, sy - pad + y0],
      matrix: `matrix(1 0 0 1 ${pad - x0} ${pad - y0})`,
    };
  }
  return {
    w: y1 - y0 + pad * 2,
    h: x1 - x0 + pad * 2,
    p: (x, y) => [y - y0 + pad, x1 - x + pad],
    q: (sx, sy) => [x1 - (sy - pad), sx - pad + y0],
    matrix: `matrix(0 -1 1 0 ${pad - y0} ${x1 + pad})`,
  };
}

// ── Zaman çizelgesi ───────────────────────────────────────

export interface Arrow {
  k: ArrowKind;
  from: Pt;
  to: Pt;
  curve: number;
  /** oku üreten oyuncu (koşu/çalım) */
  by?: string;
  /** rakip hareketi mi? (renk) */
  opp?: boolean;
  /** uçlardaki aktör — ok ucunu kısaltmak için */
  fromActor?: string | null;
  toActor?: string | null;
}

export interface BallPos {
  pt: Pt;
  holder: string | null;
}

export interface FrameState {
  note: string;
  pos: Record<string, Pt>;
  ball: BallPos | null;
  arrows: Arrow[];
  zones: Zone[];
  line: number | null;
  txt: { x: number; y: number; s: string }[];
}

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function timeline(scene: Scene): FrameState[] {
  const actors = scene.a;
  const byId = new Map(actors.map((a) => [a.id, a]));
  const out: FrameState[] = [];

  let pos: Record<string, Pt> = Object.fromEntries(actors.map((a) => [a.id, [a.x, a.y] as Pt]));
  let ballState: BallState | undefined;
  let zones: Zone[] = [];
  let line: number | null = null;
  let txt: { x: number; y: number; s: string }[] = [];
  let prevBall: BallPos | null = null;

  scene.f.forEach((fr, k) => {
    const prevPos = pos;
    pos = { ...pos };
    if (fr.m) for (const [id, pt] of Object.entries(fr.m)) if (byId.has(id)) pos[id] = pt;

    if (fr.b !== undefined) ballState = fr.b;
    let ball: BallPos | null = null;
    if (ballState !== undefined) {
      if (typeof ballState === 'string' && pos[ballState]) ball = { pt: pos[ballState], holder: ballState };
      else if (Array.isArray(ballState)) ball = { pt: ballState, holder: null };
    }

    const o: FrameOpts = fr.o ?? {};
    if (o.z) zones = o.z;
    if (o.line !== undefined) line = o.line;
    if (o.txt) txt = o.txt;

    const arrows: Arrow[] = [];
    if (k > 0) {
      const quiet = new Set(o.quiet ?? []);
      const carried = prevBall?.holder && ball?.holder === prevBall.holder ? prevBall.holder : null;

      // oyuncu hareketleri
      for (const a of actors) {
        if (a.t === 'c' || a.t === 'm') continue;
        const p0 = prevPos[a.id];
        const p1 = pos[a.id];
        if (!p0 || !p1 || dist(p0, p1) < 0.8 || quiet.has(a.id)) continue;
        arrows.push({
          k: carried === a.id ? 'dribble' : 'run',
          from: p0,
          to: p1,
          curve: 0,
          by: a.id,
          opp: a.t === 'b',
        });
      }

      // top hareketi (pas / şut)
      if (prevBall && ball && !carried && dist(prevBall.pt, ball.pt) > 0.8) {
        const kind: ArrowKind = o.shot ? 'shot' : o.air ? 'air' : 'pass';
        arrows.push({
          k: kind,
          from: prevBall.pt,
          to: ball.pt,
          curve: o.curve ?? 0,
          fromActor: prevBall.holder,
          toActor: ball.holder,
        });
      }

      if (o.arr) for (const m of o.arr) arrows.push({ k: m.k, from: m.from, to: m.to, curve: m.curve ?? 0 });
    } else if (o.arr) {
      for (const m of o.arr) arrows.push({ k: m.k, from: m.from, to: m.to, curve: m.curve ?? 0 });
    }

    out.push({ note: fr.n, pos, ball, arrows, zones, line, txt });
    prevBall = ball;
  });

  return out;
}

// ── Yazım kısayolları ─────────────────────────────────────

/** "A:a:55:34 B:a:78:18 D:b:68:28 G:k:104:34" → Actor[] ; beşinci parça etiket */
export function P(spec: string): Actor[] {
  return spec
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const [id, t, x, y, l] = tok.split(':');
      return { id, t: t as ActorType, x: Number(x), y: Number(y), ...(l ? { l } : {}) };
    });
}

export type FrameTuple = [n: string, m?: Record<string, Pt> | null, b?: BallState | null, o?: FrameOpts];

export function S(v: ViewId, actors: string, frames: FrameTuple[], extra?: Partial<Pick<Scene, 'w' | 'h' | 'hz'>>): Scene {
  return {
    v,
    a: P(actors),
    f: frames.map(([n, m, b, o]): Frame => {
      const fr: Frame = { n };
      if (m) fr.m = m;
      if (b !== undefined && b !== null) fr.b = b;
      if (o) fr.o = o;
      return fr;
    }),
    ...extra,
  };
}

/** Sahnede gerçekten kullanılan ok türleri (gösterge için) */
export function usedKinds(tl: FrameState[]): Set<ArrowKind> {
  const s = new Set<ArrowKind>();
  for (const f of tl) for (const a of f.arrows) s.add(a.k);
  return s;
}

export const ARROW_LABEL: Record<ArrowKind, string> = {
  pass: 'Pas',
  run: 'Topsuz koşu',
  dribble: 'Top sürme',
  shot: 'Şut',
  press: 'Baskı',
  air: 'Havadan pas',
};
