import { BufferAttribute, BufferGeometry } from 'three';

/**
 * Small immediate-mode geometry builder: flat-shaded quads/triangles with a
 * per-vertex colour (albedo multiplier / baked occlusion) and a per-vertex
 * block id, so one merged mesh can still be identified block by block in the
 * mask and picking passes.
 */
export class GeoBuilder {
  private pos: number[] = [];
  private nor: number[] = [];
  private col: number[] = [];
  private uv: number[] = [];
  private bid: number[] = [];
  private idx: number[] = [];
  color: [number, number, number] = [1, 1, 1];
  blockId = 0;
  /** world-scale UVs: metres per texture repeat */
  uvScale = 4;

  get vertexCount(): number {
    return this.pos.length / 3;
  }

  setColor(r: number, g: number, b: number): this {
    this.color = [r, g, b];
    return this;
  }

  setGray(v: number): this {
    this.color = [v, v, v];
    return this;
  }

  private vert(x: number, y: number, z: number, nx: number, ny: number, nz: number, u: number, v: number): number {
    this.pos.push(x, y, z);
    this.nor.push(nx, ny, nz);
    this.col.push(this.color[0], this.color[1], this.color[2]);
    this.uv.push(u, v);
    this.bid.push(this.blockId);
    return this.pos.length / 3 - 1;
  }

  /**
   * Quad a-b-c-d (counter-clockwise seen from the front). The normal is
   * computed from the corners; UVs are planar, picked from the dominant axis.
   */
  quad(a: number[], b: number[], c: number[], d: number[], orient: boolean | number[] = false): this {
    if (orient === true) return this.quad(a, d, c, b);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz);
    if (l < 1e-10) return this;
    // orient by hint: the face must look along the hint direction
    if (Array.isArray(orient) && nx * orient[0] + ny * orient[1] + nz * orient[2] < 0) return this.quad(a, d, c, b);
    nx /= l;
    ny /= l;
    nz /= l;
    const s = 1 / this.uvScale;
    const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
    const uvOf = (p: number[]): [number, number] =>
      ay >= ax && ay >= az ? [p[0] * s, p[2] * s] : ax >= az ? [p[2] * s, p[1] * s] : [p[0] * s, p[1] * s];
    const i0 = this.vert(a[0], a[1], a[2], nx, ny, nz, ...uvOf(a));
    const i1 = this.vert(b[0], b[1], b[2], nx, ny, nz, ...uvOf(b));
    const i2 = this.vert(c[0], c[1], c[2], nx, ny, nz, ...uvOf(c));
    const i3 = this.vert(d[0], d[1], d[2], nx, ny, nz, ...uvOf(d));
    this.idx.push(i0, i1, i2, i0, i2, i3);
    return this;
  }

  tri(a: number[], b: number[], c: number[]): this {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz);
    if (l < 1e-10) return this;
    nx /= l;
    ny /= l;
    nz /= l;
    const s = 1 / this.uvScale;
    const i0 = this.vert(a[0], a[1], a[2], nx, ny, nz, a[0] * s, a[2] * s);
    const i1 = this.vert(b[0], b[1], b[2], nx, ny, nz, b[0] * s, b[2] * s);
    const i2 = this.vert(c[0], c[1], c[2], nx, ny, nz, c[0] * s, c[2] * s);
    this.idx.push(i0, i1, i2);
    return this;
  }

  /** Smooth strip between two polylines (same length), normals averaged per column. */
  strip(top: number[][], bottom: number[][], smoothNormals: number[][] | null = null): this {
    const n = top.length;
    if (n < 2) return this;
    const base = this.vertexCount;
    const s = 1 / this.uvScale;
    let acc = 0;
    for (let i = 0; i < n; i++) {
      if (i > 0) acc += Math.hypot(top[i][0] - top[i - 1][0], top[i][2] - top[i - 1][2]);
      let nx = 0, ny = 1, nz = 0;
      if (smoothNormals) {
        [nx, ny, nz] = smoothNormals[i];
      } else {
        const j = Math.min(i + 1, n - 1), k = Math.max(i - 1, 0);
        const tx = top[j][0] - top[k][0], ty = top[j][1] - top[k][1], tz = top[j][2] - top[k][2];
        const dx = bottom[i][0] - top[i][0], dy = bottom[i][1] - top[i][1], dz = bottom[i][2] - top[i][2];
        nx = ty * dz - tz * dy;
        ny = tz * dx - tx * dz;
        nz = tx * dy - ty * dx;
        const l = Math.hypot(nx, ny, nz) || 1;
        nx /= l; ny /= l; nz /= l;
      }
      const h = Math.hypot(bottom[i][0] - top[i][0], bottom[i][1] - top[i][1], bottom[i][2] - top[i][2]);
      this.vert(top[i][0], top[i][1], top[i][2], nx, ny, nz, acc * s, 0);
      this.vert(bottom[i][0], bottom[i][1], bottom[i][2], nx, ny, nz, acc * s, h * s);
    }
    for (let i = 0; i < n - 1; i++) {
      const a = base + i * 2, b = a + 1, c = a + 2, d = a + 3;
      this.idx.push(a, d, b, a, c, d); // winding matches n = tangent × (bottom - top)
    }
    return this;
  }

  /** Axis-aligned-in-local-frame box given 8 corners order: bottom (4 ccw), top (4 ccw). */
  boxFromCorners(c: number[][]): this {
    const [b0, b1, b2, b3, t0, t1, t2, t3] = c;
    this.quad(t0, t1, t2, t3); // top
    this.quad(b3, b2, b1, b0); // bottom
    this.quad(b0, b1, t1, t0);
    this.quad(b1, b2, t2, t1);
    this.quad(b2, b3, t3, t2);
    this.quad(b3, b0, t0, t3);
    return this;
  }

  build(withBlockId = true): BufferGeometry {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(this.pos), 3));
    g.setAttribute('normal', new BufferAttribute(new Float32Array(this.nor), 3));
    g.setAttribute('color', new BufferAttribute(new Float32Array(this.col), 3));
    g.setAttribute('uv', new BufferAttribute(new Float32Array(this.uv), 2));
    if (withBlockId) g.setAttribute('blockId', new BufferAttribute(new Float32Array(this.bid), 1));
    const n = this.pos.length / 3;
    g.setIndex(n > 65535 ? new BufferAttribute(new Uint32Array(this.idx), 1) : new BufferAttribute(new Uint16Array(this.idx), 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}
