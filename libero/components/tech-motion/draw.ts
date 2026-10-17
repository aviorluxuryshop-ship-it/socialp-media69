// Hareket çizimi için saf geometri yardımcıları (SVG yol metni üretir). React yok.
import type { Vec2 } from '@/lib/motion/rig';

/** Görünüm kutusu (piksel) ve ölçek: 1 m = SC px. Zemin çizgisi GY'de. */
export const VW = 640;
export const VH = 400;
export const SC = 130;
export const GY = 342;

export const f1 = (n: number) => (Math.round(n * 10) / 10).toString();
export const f2 = (n: number) => (Math.round(n * 100) / 100).toString();

/** Dünya (m) → piksel. */
export const toPx = (cam: number, p: Vec2): Vec2 => [(p[0] - cam) * SC, GY - p[1] * SC];

/** İki daire arasında konik kapsül (bacak, kol gibi) yol metni. a, b: piksel merkezleri; ra, rb: piksel yarıçapları. */
export function capsule(a: Vec2, ra: number, b: Vec2, rb: number): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy);
  if (d < Math.abs(ra - rb) + 0.01) {
    const r = Math.max(ra, rb);
    const c = ra >= rb ? a : b;
    return `M${f1(c[0] - r)} ${f1(c[1])}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0Z`;
  }
  const th = Math.atan2(dy, dx);
  const ph = Math.asin(Math.max(-1, Math.min(1, (ra - rb) / d)));
  const a1 = th + Math.PI / 2 + ph;
  const a2 = th - Math.PI / 2 - ph;
  const P = (c: Vec2, r: number, an: number) => `${f1(c[0] + r * Math.cos(an))} ${f1(c[1] + r * Math.sin(an))}`;
  const large2 = Math.PI + 2 * ph > Math.PI ? 1 : 0;
  const large1 = Math.PI - 2 * ph > Math.PI ? 1 : 0;
  return `M${P(a, ra, a1)}L${P(b, rb, a1)}A${f1(rb)} ${f1(rb)} 0 ${large2} 0 ${P(b, rb, a2)}L${P(a, ra, a2)}A${f1(ra)} ${f1(ra)} 0 ${large1} 0 ${P(a, ra, a1)}Z`;
}

/** Kapalı Catmull–Rom eğrisini kübik Bézier yol metnine çevirir. */
export function smoothClosed(pts: readonly Vec2[], tension = 0.5): string {
  const n = pts.length;
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const k = tension / 3;
    const c1: Vec2 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: Vec2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + 'Z';
}

/** Çokgen yol metni; tüm alt yolların yönü aynı olsun diye işaretli alana göre ters çevrilir (nonzero birleşim). */
export function poly(pts: readonly Vec2[]): string {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const p = area < 0 ? [...pts].reverse() : pts;
  return 'M' + p.map((q) => `${f1(q[0])} ${f1(q[1])}`).join('L') + 'Z';
}

export const lerp2 = (a: Vec2, b: Vec2, t: number): Vec2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
