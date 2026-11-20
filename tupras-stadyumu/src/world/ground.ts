/**
 * Ground textures painted from OSM features: day albedo + night emissive
 * (lit streets). Two coverages: a sharp one around the stadium and a wide one
 * over the whole streamed area.
 */
import { CanvasTexture, LinearMipmapLinearFilter, SRGBColorSpace, type Texture } from 'three';
import type { World } from './data.ts';

export interface GroundCoverage {
  x0: number;
  z0: number;
  size: number;
  day: Texture;
  night: Texture;
}

const AREA_FILL: Record<number, string> = {
  1: '#6f8d4f',
  2: '#4e6d3e',
  3: '#7e8966',
  4: '#5d8c48',
  5: '#4c9cc0',
  6: '#d2cabb',
  7: '#9d9c97',
};

const ROAD_FILL: Record<number, string> = {
  0: '#3d3e41',
  1: '#45464a',
  2: '#4b4c50',
  3: '#55565a',
  4: '#66666a',
  5: '#cfc7b6',
  6: '#bfb6a5',
};

export function paintGround(world: World, cx: number, cz: number, size: number, px: number): GroundCoverage {
  const x0 = cx - size / 2;
  const z0 = cz - size / 2;
  const k = px / size;
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = c.height = px;
    return [c, c.getContext('2d')!] as const;
  };
  const [dc, d] = mk();
  const [nc, n] = mk();
  const X = (x: number) => (x - x0) * k;
  const Z = (z: number) => (z - z0) * k;
  const path = (g: CanvasRenderingContext2D, pts: number[], close: boolean) => {
    g.beginPath();
    g.moveTo(X(pts[0]), Z(pts[1]));
    for (let i = 2; i < pts.length; i += 2) g.lineTo(X(pts[i]), Z(pts[i + 1]));
    if (close) g.closePath();
  };
  const inView = (pts: number[], margin: number) => {
    for (let i = 0; i < pts.length; i += 2) {
      if (pts[i] > x0 - margin && pts[i] < x0 + size + margin && pts[i + 1] > z0 - margin && pts[i + 1] < z0 + size + margin) return true;
    }
    return false;
  };

  // base: urban ground; noise gives the fabric some life
  d.fillStyle = '#9c968a';
  d.fillRect(0, 0, px, px);
  n.fillStyle = '#000000';
  n.fillRect(0, 0, px, px);
  const img = d.getImageData(0, 0, px, px);
  let seed = 1234567;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < img.data.length; i += 4) {
    const f = 0.92 + rand() * 0.12;
    img.data[i] *= f;
    img.data[i + 1] *= f;
    img.data[i + 2] *= f;
  }
  d.putImageData(img, 0, 0);

  // stadium plaza
  d.fillStyle = '#cdc4b3';
  path(d, world.json.site, true);
  d.fill();

  // areas, largest first (already sorted that way)
  for (const [cls, ring] of world.json.areas) {
    if (!inView(ring, 50)) continue;
    d.fillStyle = AREA_FILL[cls] ?? '#999';
    path(d, ring, true);
    d.fill();
    if (cls === 1 || cls === 2) {
      // darker tree-canopy mottling inside green areas
      d.save();
      d.clip();
      d.globalAlpha = 0.18;
      d.fillStyle = '#2f4a26';
      for (let i = 0; i < 40; i++) {
        const bx = ring[(Math.floor(rand() * ring.length) >> 1) << 1];
        const bz = ring[((Math.floor(rand() * ring.length) >> 1) << 1) + 1];
        d.beginPath();
        d.arc(X(bx + (rand() - 0.5) * 60), Z(bz + (rand() - 0.5) * 60), (6 + rand() * 14) * k, 0, Math.PI * 2);
        d.fill();
      }
      d.restore();
    }
  }

  // roads: minor first so major roads draw on top
  const roads = [...world.json.roads].sort((a, b) => b[0] - a[0]);
  d.lineCap = 'round';
  d.lineJoin = 'round';
  n.lineCap = 'round';
  n.lineJoin = 'round';
  for (const [cls, w, lit, , pts] of roads) {
    if (!inView(pts, 30)) continue;
    d.strokeStyle = ROAD_FILL[cls] ?? '#555';
    d.lineWidth = Math.max(1, w * k);
    path(d, pts, false);
    d.stroke();
    if (cls <= 2 && w * k > 3) {
      // lane markings on major roads
      d.strokeStyle = 'rgba(235,235,225,0.55)';
      d.lineWidth = Math.max(0.6, 0.15 * k);
      d.setLineDash([3 * k, 6 * k]);
      path(d, pts, false);
      d.stroke();
      d.setLineDash([]);
    }
    if (lit && cls <= 4) {
      // night: sodium/LED wash along lit streets
      n.strokeStyle = cls <= 1 ? 'rgba(255,196,120,0.95)' : cls <= 2 ? 'rgba(255,205,140,0.8)' : 'rgba(255,214,160,0.55)';
      n.lineWidth = Math.max(1, w * k * 0.62);
      path(n, pts, false);
      n.stroke();
    } else if (cls <= 5) {
      n.strokeStyle = 'rgba(255,210,150,0.28)';
      n.lineWidth = Math.max(1, w * k * 0.7);
      path(n, pts, false);
      n.stroke();
    }
  }
  // stadium plaza is floodlit at night
  n.fillStyle = 'rgba(235,238,255,0.55)';
  path(n, world.json.site, true);
  n.fill();

  const tex = (c: HTMLCanvasElement) => {
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    t.minFilter = LinearMipmapLinearFilter;
    return t;
  };
  return { x0, z0, size, day: tex(dc), night: tex(nc) };
}
