import { CanvasTexture, ClampToEdgeWrapping, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import { PITCH } from '../stadium/config.ts';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tileable value noise, several octaves, as 0..1 grayscale array. */
function tileNoise(size: number, seed: number, octaves = 5): Float32Array {
  const out = new Float32Array(size * size);
  const rand = rng(seed);
  let amp = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const cells = 4 << o;
    const grid = new Float32Array(cells * cells);
    for (let i = 0; i < grid.length; i++) grid[i] = rand();
    for (let y = 0; y < size; y++) {
      const gy = (y / size) * cells;
      const y0 = Math.floor(gy) % cells, y1 = (y0 + 1) % cells;
      let fy = gy - Math.floor(gy);
      fy = fy * fy * (3 - 2 * fy);
      for (let x = 0; x < size; x++) {
        const gx = (x / size) * cells;
        const x0 = Math.floor(gx) % cells, x1 = (x0 + 1) % cells;
        let fx = gx - Math.floor(gx);
        fx = fx * fx * (3 - 2 * fx);
        const a = grid[y0 * cells + x0], b = grid[y0 * cells + x1], c = grid[y1 * cells + x0], d = grid[y1 * cells + x1];
        out[y * size + x] += amp * (a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy);
      }
    }
    total += amp;
    amp *= 0.55;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

const cache = new Map<string, Texture>();

/** Grayscale detail texture used as `map` (multiplied with material/vertex colour). */
export function detailTexture(kind: 'concrete' | 'stone' | 'membrane' | 'asphalt', size = 256): Texture {
  const key = kind + size;
  if (cache.has(key)) return cache.get(key)!;
  const [c, g] = canvas(size, size);
  const img = g.createImageData(size, size);
  const n = tileNoise(size, kind.length * 977 + size, 6);
  const rand = rng(kind.length * 31);
  const params = {
    concrete: { base: 0.86, amp: 0.22, grain: 0.06 },
    stone: { base: 0.88, amp: 0.16, grain: 0.05 },
    membrane: { base: 0.96, amp: 0.06, grain: 0.015 },
    asphalt: { base: 0.8, amp: 0.25, grain: 0.14 },
  }[kind];
  for (let i = 0; i < size * size; i++) {
    let v = params.base + (n[i] - 0.5) * params.amp + (rand() - 0.5) * params.grain;
    if (kind === 'stone') {
      // ashlar courses: subtle horizontal joints every 1/8 of the tile
      const y = Math.floor(i / size);
      const x = i % size;
      const course = Math.floor((y / size) * 8);
      if (y % (size / 8) < 1) v *= 0.82;
      const offset = course % 2 ? size / 6 : 0;
      if ((x + offset) % (size / 3) < 1) v *= 0.86;
    }
    const b = Math.max(0, Math.min(255, v * 255));
    img.data[i * 4] = b;
    img.data[i * 4 + 1] = b;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  t.minFilter = LinearMipmapLinearFilter;
  cache.set(key, t);
  return t;
}

/**
 * Pitch: mowing stripes across the long axis, FIFA markings, subtle wear.
 * Canvas covers the grass rectangle 2·grassHalfX × 2·grassHalfZ.
 */
export function pitchTexture(): Texture {
  if (cache.has('pitch')) return cache.get('pitch')!;
  const W = 2 * PITCH.grassHalfX;
  const H = 2 * PITCH.grassHalfZ;
  const ppm = 18; // pixels per metre
  const [c, g] = canvas(Math.round(W * ppm), Math.round(H * ppm));
  const X = (m: number) => (m + PITCH.grassHalfX) * ppm;
  const Z = (m: number) => (m + PITCH.grassHalfZ) * ppm;
  // stripes: 18 bands across the field of play, perpendicular to the long axis
  const bands = 18;
  const bw = PITCH.length / bands;
  for (let x = -PITCH.grassHalfX; x < PITCH.grassHalfX; x += 0.25) {
    const k = Math.floor((x + PITCH.length / 2) / bw);
    const light = k % 2 === 0;
    g.fillStyle = light ? '#4f8a35' : '#3f7a2b';
    g.fillRect(X(x), 0, 0.25 * ppm + 1, c.height);
  }
  // grass noise
  const img = g.getImageData(0, 0, c.width, c.height);
  const rand = rng(12);
  const coarse = tileNoise(256, 5, 5);
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      const n = coarse[((y >> 2) % 256) * 256 + ((x >> 2) % 256)];
      const f = 0.9 + (n - 0.5) * 0.16 + (rand() - 0.5) * 0.1;
      img.data[i] *= f;
      img.data[i + 1] *= f;
      img.data[i + 2] *= f;
    }
  }
  g.putImageData(img, 0, 0);
  // markings
  g.strokeStyle = 'rgba(245,245,240,0.95)';
  g.fillStyle = 'rgba(245,245,240,0.95)';
  g.lineWidth = 0.12 * ppm;
  const L = PITCH.length / 2;
  const Wd = PITCH.width / 2;
  const line = (x1: number, z1: number, x2: number, z2: number) => {
    g.beginPath();
    g.moveTo(X(x1), Z(z1));
    g.lineTo(X(x2), Z(z2));
    g.stroke();
  };
  g.strokeRect(X(-L), Z(-Wd), PITCH.length * ppm, PITCH.width * ppm);
  line(0, -Wd, 0, Wd);
  g.beginPath();
  g.arc(X(0), Z(0), 9.15 * ppm, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(X(0), Z(0), 0.22 * ppm, 0, Math.PI * 2);
  g.fill();
  for (const s of [-1, 1]) {
    const gx = s * L;
    // penalty area 16.5 × 40.32, goal area 5.5 × 18.32
    g.strokeRect(Math.min(X(gx), X(gx - s * 16.5)), Z(-20.16), 16.5 * ppm, 40.32 * ppm);
    g.strokeRect(Math.min(X(gx), X(gx - s * 5.5)), Z(-9.16), 5.5 * ppm, 18.32 * ppm);
    g.beginPath();
    g.arc(X(gx - s * 11), Z(0), 0.22 * ppm, 0, Math.PI * 2);
    g.fill();
    // penalty arc outside the area
    const a = Math.acos(5.5 / 9.15);
    g.beginPath();
    if (s > 0) g.arc(X(gx - 11), Z(0), 9.15 * ppm, Math.PI - a, Math.PI + a);
    else g.arc(X(gx + 11), Z(0), 9.15 * ppm, -a, a);
    g.stroke();
    for (const t of [-1, 1]) {
      g.beginPath();
      if (s > 0 && t < 0) g.arc(X(L), Z(-Wd), 1 * ppm, Math.PI / 2, Math.PI);
      if (s > 0 && t > 0) g.arc(X(L), Z(Wd), 1 * ppm, Math.PI, Math.PI * 1.5);
      if (s < 0 && t < 0) g.arc(X(-L), Z(-Wd), 1 * ppm, 0, Math.PI / 2);
      if (s < 0 && t > 0) g.arc(X(-L), Z(Wd), 1 * ppm, Math.PI * 1.5, Math.PI * 2);
      g.stroke();
    }
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = ClampToEdgeWrapping;
  cache.set('pitch', t);
  return t;
}

/** LED ribbon on the upper-tier fascia: club wordmark repeating. */
export function ledRibbonTexture(): Texture {
  if (cache.has('led')) return cache.get('led')!;
  const [c, g] = canvas(2048, 64);
  g.fillStyle = '#050506';
  g.fillRect(0, 0, c.width, c.height);
  const segments = ['BEŞİKTAŞ JK', '•', 'TÜPRAŞ STADYUMU', '•', '1903', '•'];
  g.font = '700 40px "Barlow Condensed", "Arial Narrow", sans-serif';
  g.textBaseline = 'middle';
  let x = 30;
  let i = 0;
  while (x < c.width) {
    const s = segments[i % segments.length];
    g.fillStyle = s === '•' ? '#9a9a9a' : '#ffffff';
    g.fillText(s, x, 34);
    x += g.measureText(s).width + 34;
    i++;
  }
  // LED pixel grid
  g.fillStyle = 'rgba(0,0,0,0.35)';
  for (let y = 0; y < c.height; y += 4) g.fillRect(0, y, c.width, 1);
  for (let xx = 0; xx < c.width; xx += 4) g.fillRect(xx, 0, 1, c.height);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = RepeatWrapping;
  t.anisotropy = 4;
  cache.set('led', t);
  return t;
}

/** Perimeter advertising boards around the pitch. */
export function boardTexture(): Texture {
  if (cache.has('board')) return cache.get('board')!;
  const [c, g] = canvas(1024, 64);
  g.fillStyle = '#060607';
  g.fillRect(0, 0, c.width, c.height);
  g.font = '700 42px "Barlow Condensed", "Arial Narrow", sans-serif';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.fillText('BEŞİKTAŞ JK', 40, 34);
  g.fillStyle = '#d7d7d7';
  g.fillText('TÜPRAŞ STADYUMU', 560, 34);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = RepeatWrapping;
  cache.set('board', t);
  return t;
}
