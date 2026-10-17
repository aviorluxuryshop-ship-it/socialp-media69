// Hareket sistemi: saf yumuşak ara değer (interpolasyon) yardımcıları. React yok, DOM yok.
//
// Anahtar kareler arasında "monoton kübik Hermite" (Fritsch–Butland) kullanılır: eğri her anahtar
// değerden geçer, aşım (overshoot) yapmaz ve hız süreklidir; yani eklem açıları anahtar kareler
// arasında robot gibi durup kalkmaz, yumuşak akar. Uç noktalarda hız sıfırdır (durgun başlangıç/bitiş).
// Dış bir animasyon kütüphanesi kullanılmaz.

export interface Spline {
  t: number[];
  v: number[];
  /** her anahtardaki teğet (birim/saniye) */
  m: number[];
}

/**
 * @param ends 'rest' → ilk ve son teğet 0 (duran başlangıç/bitiş); 'free' → uçlarda komşu eğimi kullan.
 * @param tan  isteğe bağlı: belirli anahtarlar için zorunlu teğet (ör. topun çıkış hızı)
 */
export function spline(t: readonly number[], v: readonly number[], ends: 'rest' | 'free' = 'rest', tan?: ReadonlyArray<number | undefined>): Spline {
  const n = t.length;
  const m = new Array<number>(n).fill(0);
  if (n >= 2) {
    const d: number[] = [];
    for (let i = 0; i < n - 1; i++) d.push((v[i + 1] - v[i]) / Math.max(1e-9, t[i + 1] - t[i]));
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) {
        m[i] = 0;
      } else {
        const h0 = t[i] - t[i - 1];
        const h1 = t[i + 1] - t[i];
        const w1 = 2 * h1 + h0;
        const w2 = h1 + 2 * h0;
        m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
      }
    }
    if (ends === 'free') {
      m[0] = d[0];
      m[n - 1] = d[n - 2];
    }
  }
  if (tan) for (let i = 0; i < n; i++) if (tan[i] !== undefined) m[i] = tan[i] as number;
  return { t: [...t], v: [...v], m };
}

/** x anındaki değer; aralık dışında uç değer korunur. */
export function evalSpline(s: Spline, x: number): number {
  const n = s.t.length;
  if (n === 0) return 0;
  if (x <= s.t[0]) return s.v[0];
  if (x >= s.t[n - 1]) return s.v[n - 1];
  let i = 0;
  while (i < n - 2 && x > s.t[i + 1]) i++;
  const h = s.t[i + 1] - s.t[i];
  const u = (x - s.t[i]) / h;
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * s.v[i] + (u3 - 2 * u2 + u) * h * s.m[i] + (-2 * u3 + 3 * u2) * s.v[i + 1] + (u3 - u2) * h * s.m[i + 1];
}

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smoothstep = (a: number, b: number, x: number) => {
  const u = clamp((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
