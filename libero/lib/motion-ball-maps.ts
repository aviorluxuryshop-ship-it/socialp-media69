/* ───────────────────────────────────────────────────────────
   Futbol topu için prosedürel dokular: renk, normal ve pürüzlülük haritaları.
   Harici dosya yok; her piksel kesik ikosahedron geometrisinden hesaplanır.

   Saf hesap (DOM yok): bir Web Worker içinde ya da ana iş parçacığında
   küçük dilimler hâlinde (`step`) çalıştırılabilir. Çıktı RGBA bayt dizileridir;
   çağıran taraf bunları canvas → CanvasTexture olarak sarar.

   Eşleme, three.js SphereGeometry ile aynıdır (bkz. dirFromUV):
     u = ix / genişlik (boylam), v üstten aşağı kutuptan uzaklık oranı.
   ─────────────────────────────────────────────────────────── */
import { panelTable, type PanelTable } from './motion-ball-geometry';

export interface BallMaps {
  w: number;
  h: number;
  /** sRGB renk, RGBA (w×h) */
  color: Uint8ClampedArray;
  /** teğet uzayı normal haritası, RGBA (w×h) */
  normal: Uint8ClampedArray;
  /** pürüzlülük (G kanalı), RGBA (w/2 × h/2) */
  rough: Uint8ClampedArray;
  rw: number;
  rh: number;
}

export interface MapJob {
  /** en fazla `rows` satırlık iş yapar; bittiyse true döner */
  step(rows: number): boolean;
  readonly done: boolean;
  /** 0..1 */
  progress(): number;
  result(): BallMaps;
}

/* Yüzey profili (birim kürede radyan cinsinden uzaklıklar) */
export const SEAM = {
  /** dikiş oluğunun derinliği ve genişliği */
  grooveDepth: 0.012,
  grooveWidth: 0.011,
  /** panel kabarması (dikişten uzaklaştıkça yumuşakça yükselir) */
  puff: 0.01,
  puffWidth: 0.085,
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Dikişe a radyan uzaklıktaki yükseklik. */
export function seamHeight(a: number): number {
  const g = a / SEAM.grooveWidth;
  return SEAM.puff * smoothstep(0, SEAM.puffWidth, a) - SEAM.grooveDepth * Math.exp(-g * g);
}

// renkler (sRGB 0–255): fildişi altıgenler, koyu grafit beşgenler, pirinç ince çizgi
const HEX: [number, number, number] = [238, 233, 218];
const PENT: [number, number, number] = [26, 23, 19];
const BRASS: [number, number, number] = [201, 165, 91];
const SEAM_TINT: [number, number, number] = [92, 86, 72];

/** Ucuz, kararlı beyaz gürültü (bant oluşumunu kırar). */
const hash = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return (((h ^ (h >>> 16)) >>> 0) % 1000) / 1000;
};

export function createBallMapJob(w: number, h: number, table: PanelTable = panelTable()): MapJob {
  const rw = w >> 1;
  const rh = h >> 1;
  const A = new Float32Array(w * h); // dikişe uzaklık
  const H = new Float32Array(w * h); // yükseklik
  const K = new Uint8Array(w * h); // 1 = beşgen
  const color = new Uint8ClampedArray(w * h * 4);
  const normal = new Uint8ClampedArray(w * h * 4);
  const rough = new Uint8ClampedArray(rw * rh * 4);

  const cosP = new Float32Array(w);
  const sinP = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    const phi = ((x + 0.5) / w) * 2 * Math.PI;
    cosP[x] = Math.cos(phi);
    sinP[x] = Math.sin(phi);
  }
  const { n, nx, ny, nz, invD, pent } = table;

  let phase = 0; // 0: alan, 1: boyama + normal
  let row = 0;

  function fieldRow(y: number) {
    const theta = ((y + 0.5) / h) * Math.PI;
    const st = Math.sin(theta);
    const ct = Math.cos(theta);
    for (let x = 0; x < w; x++) {
      const px = -cosP[x] * st;
      const py = ct;
      const pz = sinP[x] * st;
      let b = -1e9;
      let s = -1e9;
      let bi = 0;
      let si = 0;
      for (let f = 0; f < n; f++) {
        const r = (px * nx[f] + py * ny[f] + pz * nz[f]) * invD[f];
        if (r > b) {
          s = b;
          si = bi;
          b = r;
          bi = f;
        } else if (r > s) {
          s = r;
          si = f;
        }
      }
      const wx = nx[bi] * invD[bi] - nx[si] * invD[si];
      const wy = ny[bi] * invD[bi] - ny[si] * invD[si];
      const wz = nz[bi] * invD[bi] - nz[si] * invD[si];
      const wp = wx * px + wy * py + wz * pz;
      const tx = wx - wp * px;
      const ty = wy - wp * py;
      const tz = wz - wp * pz;
      const g = Math.hypot(tx, ty, tz) || 1e-6;
      const a = (b - s) / g;
      const i = y * w + x;
      A[i] = a;
      H[i] = seamHeight(a);
      K[i] = pent[bi];
    }
  }

  function shadeRow(y: number) {
    const theta = ((y + 0.5) / h) * Math.PI;
    const st = Math.sin(theta);
    // piksel başına yay uzunluğu (birim küre): doğuya / kuzeye
    const dsE = ((2 * Math.PI) / w) * st;
    const dsN = Math.PI / h;
    const ym = y > 0 ? y - 1 : 0;
    const yp = y < h - 1 ? y + 1 : h - 1;
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const xm = x > 0 ? x - 1 : w - 1;
      const xp = x < w - 1 ? x + 1 : 0;
      // eğim: doğu = +x, kuzey = −satır
      let sx = st > 0.04 ? (H[y * w + xp] - H[y * w + xm]) / (2 * dsE) : 0;
      let sy = -(H[yp * w + x] - H[ym * w + x]) / ((yp - ym || 1) * dsN);
      const m = Math.hypot(sx, sy);
      if (m > 3) {
        sx = (sx / m) * 3;
        sy = (sy / m) * 3;
      }
      const nl = 1 / Math.hypot(sx, sy, 1);
      const o = i * 4;
      normal[o] = (-sx * nl * 0.5 + 0.5) * 255;
      normal[o + 1] = (-sy * nl * 0.5 + 0.5) * 255;
      normal[o + 2] = (nl * 0.5 + 0.5) * 255;
      normal[o + 3] = 255;

      // renk
      const a = A[i];
      const isP = K[i] === 1;
      const base = isP ? PENT : HEX;
      const ao = 1 - (isP ? 0.2 : 0.3) * Math.exp(-((a / 0.055) * (a / 0.055)));
      const gr = Math.exp(-((a / 0.0085) * (a / 0.0085))); // oluk
      let r = base[0] * ao;
      let g = base[1] * ao;
      let b = base[2] * ao;
      // oluk: dikiş rengine doğru koyulaşma
      const sk = 0.62 * gr;
      r += (SEAM_TINT[0] * 0.55 - r) * sk;
      g += (SEAM_TINT[1] * 0.55 - g) * sk;
      b += (SEAM_TINT[2] * 0.55 - b) * sk;
      if (isP) {
        // beşgenin içinde ince pirinç çerçeve
        const d = (a - 0.043) / 0.0042;
        const line = Math.exp(-d * d) * 0.62;
        r += (BRASS[0] - r) * line;
        g += (BRASS[1] - g) * line;
        b += (BRASS[2] - b) * line;
      }
      const nz2 = (hash(x, y) - 0.5) * 3.2; // bant kırıcı
      color[o] = r + nz2;
      color[o + 1] = g + nz2;
      color[o + 2] = b + nz2;
      color[o + 3] = 255;

      // pürüzlülük: yarı çözünürlükte
      if ((x & 1) === 0 && (y & 1) === 0 && (x >> 1) < rw && (y >> 1) < rh) {
        const ro = ((y >> 1) * rw + (x >> 1)) * 4;
        const gg = Math.exp(-((a / 0.016) * (a / 0.016)));
        const base2 = isP ? 0.36 : 0.46;
        const rv = Math.min(1, base2 + 0.42 * gg + (hash(x + 17, y + 5) - 0.5) * 0.05) * 255;
        rough[ro] = rv;
        rough[ro + 1] = rv;
        rough[ro + 2] = rv;
        rough[ro + 3] = 255;
      }
    }
  }

  const job: MapJob = {
    get done() {
      return phase === 2;
    },
    progress() {
      return phase === 2 ? 1 : (phase * h + row) / (2 * h);
    },
    step(rows: number) {
      let left = rows;
      while (left > 0 && phase < 2) {
        if (phase === 0) fieldRow(row);
        else shadeRow(row);
        row++;
        left--;
        if (row >= h) {
          row = 0;
          phase++;
        }
      }
      return phase === 2;
    },
    result() {
      return { w, h, color, normal, rough, rw, rh };
    },
  };
  return job;
}

/** Hepsini tek seferde üretir (test ve Worker için). */
export function generateBallMaps(w: number, h: number): BallMaps {
  const job = createBallMapJob(w, h);
  while (!job.step(64)) {
    /* sürdür */
  }
  return job.result();
}
