// Top çizimi için saf geometri: kesik ikosahedron (klasik futbol topu) desenini küreye yerleştirip
// birim daireye dik izdüşümle çevirir. Dışarıdan veri/ağ yok; çıktı SVG yol metnidir (yarıçap = 1).
type V3 = [number, number, number];

const PHI = (1 + Math.sqrt(5)) / 2;
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const ICO: V3[] = (
  [
    [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
    [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
    [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
  ] as V3[]
).map(norm);

function rotate(v: V3, ax: number, ay: number, az: number): V3 {
  let [x, y, z] = v;
  // x ekseni
  let c = Math.cos(ax), s = Math.sin(ax);
  [y, z] = [y * c - z * s, y * s + z * c];
  // y ekseni
  c = Math.cos(ay); s = Math.sin(ay);
  [x, z] = [x * c + z * s, -x * s + z * c];
  // z ekseni
  c = Math.cos(az); s = Math.sin(az);
  [x, y] = [x * c - y * s, x * s + y * c];
  return [x, y, z];
}

/** Çokgeni z >= 0 yarım uzayına kırpar (Sutherland–Hodgman); kesişimler küreye oturtulur. */
function clipFront(poly: V3[]): V3[] {
  const out: V3[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ain = a[2] >= 0;
    const bin = b[2] >= 0;
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (0 - a[2]) / (b[2] - a[2]);
      const p = lerp(a, b, t);
      out.push(norm([p[0], p[1], 0.0]));
    }
  }
  return out;
}

const f = (n: number) => (Math.round(n * 1000) / 1000).toString();
const pt = (v: V3) => `${f(v[0])} ${f(-v[1])}`;

export interface BallGeometry {
  /** koyu beşgen yamalar (kapalı yollar) */
  patches: string[];
  /** altıgen birleşim dikişleri */
  seams: string;
  /** görünen yama sayısı */
  count: number;
}

/** @param rot [x, y, z] dönüş açıları (radyan) */
export function ballGeometry(rot: [number, number, number] = [0.42, -0.5, 0.2]): BallGeometry {
  // komşuluklar
  const nbr: number[][] = ICO.map((u, i) =>
    ICO.map((w, j) => (i !== j && dot(u, w) > 0.4 && dot(u, w) < 0.5 ? j : -1)).filter((j) => j >= 0),
  );
  // her köşe etrafında komşuları açıya göre sırala
  const sorted = ICO.map((u, i) => {
    const ref: V3 = Math.abs(u[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    const e1 = norm(cross(u, ref));
    const e2 = cross(u, e1);
    return [...nbr[i]].sort((a, b) => Math.atan2(dot(ICO[a], e2), dot(ICO[a], e1)) - Math.atan2(dot(ICO[b], e2), dot(ICO[b], e1)));
  });
  const P = (u: number, w: number): V3 => norm([(2 * ICO[u][0] + ICO[w][0]) / 3, (2 * ICO[u][1] + ICO[w][1]) / 3, (2 * ICO[u][2] + ICO[w][2]) / 3]);
  const R = (v: V3) => rotate(v, rot[0], rot[1], rot[2]);

  const patches: string[] = [];
  const SUB = 5;
  for (let u = 0; u < ICO.length; u++) {
    const ring: V3[] = sorted[u].map((w) => R(P(u, w)));
    const dense: V3[] = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      for (let k = 0; k < SUB; k++) dense.push(norm(lerp(a, b, k / SUB)));
    }
    const clipped = clipFront(dense);
    if (clipped.length >= 3) patches.push('M' + clipped.map(pt).join('L') + 'Z');
  }
  let seams = '';
  for (let u = 0; u < ICO.length; u++) {
    for (const w of nbr[u]) {
      if (w < u) continue;
      const a = R(P(u, w));
      const b = R(P(w, u));
      const pts: V3[] = [];
      for (let k = 0; k <= 4; k++) pts.push(norm(lerp(a, b, k / 4)));
      // z >= 0 olan ardışık parçaları çiz
      let run: V3[] = [];
      for (let k = 0; k < pts.length; k++) {
        if (pts[k][2] >= 0) run.push(pts[k]);
        else {
          if (run.length > 1) seams += 'M' + run.map(pt).join('L');
          run = [];
        }
      }
      if (run.length > 1) seams += 'M' + run.map(pt).join('L');
    }
  }
  return { patches, seams, count: patches.length };
}
