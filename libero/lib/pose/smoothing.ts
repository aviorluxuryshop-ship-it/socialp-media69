/**
 * Düzleştirme ve boşluk doldurma (saf fonksiyonlar).
 *
 * Boru hattı (her eklem koordinatı için): görünürlük eşiği → NaN → sıçrama ayıklama (3'lü medyan)
 * → ≤ 3 karelik boşlukları doğrusal doldur (işaretlenir) → Savitzky–Golay.
 *
 * Savitzky–Golay: pencere içindeki noktalara `order` dereceli polinom en küçük kareler ile uydurulur;
 * düzleştirilmiş değer polinomun değeri, türev ise polinomun türevidir (birim: değer/örnek, ardından ×fps).
 * Zaman gecikmesi yoktur (sıfır faz) → olay zamanları kaymaz. Pencere kenarlarında koşunun içinde kalan
 * asimetrik pencere kullanılır. Koşu (ardışık geçerli örnek) pencereden kısaysa polinom derecesi düşürülür.
 *
 * Bu, 30 kare/sn'de ≈0,2 sn'lik (7 örnek) pencereyle hızlı vuruş zirvesini korurken pikselin ±1–2'lik
 * titreşimini bastırır. 10 kare/sn'de pencere 3 örnektir; zirve hızları o durumda yine de düşük okunur.
 */

/** Küçük doğrusal sistem çözücü (Gauss eleme, kısmi pivot). A: n×n, b: n. */
function solve(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

const wCache = new Map<string, number[]>();

/**
 * `m` noktalık pencerede, `pos` (0 tabanlı) konumundaki polinom değerinin (deriv=0) ya da türevinin
 * (deriv=1, birim: değer/örnek) örneklere göre ağırlıkları. Ağırlıklar toplamı deriv=0 için 1'dir.
 */
export function lsWeights(m: number, order: number, pos: number, deriv: 0 | 1): number[] {
  const ord = Math.min(order, m - 1);
  const key = `${m}|${ord}|${pos}|${deriv}`;
  const hit = wCache.get(key);
  if (hit) return hit;
  // taban: u^k, u = j − pos
  const K = ord + 1;
  const ATA: number[][] = Array.from({ length: K }, () => new Array<number>(K).fill(0));
  for (let j = 0; j < m; j++) {
    const u = j - pos;
    for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) ATA[a][b] += u ** (a + b);
  }
  // satır deriv'in (ATA^-1 A^T): e_deriv çözümü
  const out = new Array<number>(m).fill(0);
  for (let j = 0; j < m; j++) {
    const u = j - pos;
    const rhs = Array.from({ length: K }, (_, a) => u ** a);
    const c = solve(ATA, rhs);
    out[j] = c ? c[deriv] : j === pos ? (deriv === 0 ? 1 : 0) : 0;
  }
  wCache.set(key, out);
  return out;
}

/** Geçerli (NaN olmayan) ardışık koşuları [start,end] (dahil) olarak döndürür. */
export function runs(a: ArrayLike<number>): [number, number][] {
  const out: [number, number][] = [];
  let s = -1;
  for (let i = 0; i < a.length; i++) {
    if (Number.isFinite(a[i])) {
      if (s < 0) s = i;
    } else if (s >= 0) {
      out.push([s, i - 1]);
      s = -1;
    }
  }
  if (s >= 0) out.push([s, a.length - 1]);
  return out;
}

export interface SmoothOpts {
  /** tek sayı pencere (örnek) */
  window: number;
  order: number;
}

/** fps'e göre pencere: ≈0,2 sn, [3, 11] arası tek sayı; 3 örnekte doğrusal. */
export function smoothParams(fps: number): SmoothOpts {
  let w = Math.round(0.2 * fps);
  w = Math.max(3, Math.min(11, w));
  if (w % 2 === 0) w += 1;
  const order = w >= 7 ? 3 : w >= 5 ? 2 : 1;
  return { window: w, order };
}

/**
 * Savitzky–Golay düzleştirme (deriv=0) ya da türev (deriv=1; sonuç değer/SANİYE, `fps` ile çarpılır).
 * NaN koşuları birbirinden bağımsızdır; koşu 3'ten kısaysa değer aynen, türev NaN kalır.
 */
export function savgol(y: ArrayLike<number>, opts: SmoothOpts & { deriv?: 0 | 1; fps?: number }): Float32Array {
  const n = y.length;
  const out = new Float32Array(n).fill(NaN);
  const deriv = opts.deriv ?? 0;
  const fps = opts.fps ?? 1;
  for (const [s, e] of runs(y)) {
    const L = e - s + 1;
    if (L < 3) {
      if (deriv === 0) for (let i = s; i <= e; i++) out[i] = y[i];
      continue;
    }
    let w = Math.min(opts.window, L);
    if (w % 2 === 0) w -= 1;
    const half = (w - 1) / 2;
    for (let i = s; i <= e; i++) {
      let st = i - half;
      if (st < s) st = s;
      if (st + w - 1 > e) st = e - w + 1;
      const pos = i - st;
      const wt = lsWeights(w, opts.order, pos, deriv);
      let acc = 0;
      for (let j = 0; j < w; j++) acc += wt[j] * y[st + j];
      out[i] = deriv === 1 ? acc * fps : acc;
    }
  }
  return out;
}

/**
 * 3'lü medyana göre sıçrama ayıklama: |y[i] − medyan(y[i−1], y[i], y[i+1])| > thr ise örnek NaN yapılır.
 * (Tek karelik yanlış tespit/sol-sağ karışması gibi sıçramalar için.) Yeni dizi döner.
 */
export function despike(y: ArrayLike<number>, thr: number): Float32Array {
  const n = y.length;
  const out = Float32Array.from(y as ArrayLike<number>);
  for (let i = 1; i < n - 1; i++) {
    const a = y[i - 1];
    const b = y[i];
    const c = y[i + 1];
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) continue;
    const med = Math.max(Math.min(a, b), Math.min(Math.max(a, b), c));
    if (Math.abs(b - med) > thr) out[i] = NaN;
  }
  return out;
}

/**
 * ≤ maxGap uzunluğundaki NaN boşluklarını, iki yanı geçerliyse doğrusal doldurur.
 * Doldurulan örnekler `filled` içinde 1 ile işaretlenir; daha uzun boşluklar NaN kalır.
 */
export function fillGaps(y: ArrayLike<number>, maxGap: number): { y: Float32Array; filled: Uint8Array } {
  const n = y.length;
  const out = Float32Array.from(y as ArrayLike<number>);
  const filled = new Uint8Array(n);
  let i = 0;
  while (i < n) {
    if (Number.isFinite(out[i])) {
      i++;
      continue;
    }
    let j = i;
    while (j < n && !Number.isFinite(out[j])) j++;
    const len = j - i;
    if (i > 0 && j < n && len <= maxGap) {
      const a = out[i - 1];
      const b = out[j];
      for (let k = 0; k < len; k++) {
        out[i + k] = a + ((b - a) * (k + 1)) / (len + 1);
        filled[i + k] = 1;
      }
    }
    i = j;
  }
  return { y: out, filled };
}
