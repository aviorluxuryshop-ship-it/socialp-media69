/**
 * Terrain: streamed near chunks (with skirts so LOD seams never open) and one
 * static far mesh for the Bosphorus basin out to ~8 km.
 */
import { BufferAttribute, BufferGeometry, Color, Mesh, MeshStandardMaterial, type IUniform } from 'three';
import type { World } from './data.ts';
import type { GroundCoverage } from './ground.ts';
import { detailTexture } from '../core/textures.ts';

export function chunkTerrainGeometry(world: World, x0: number, z0: number, size: number, step: number, cover: GroundCoverage): BufferGeometry | null {
  const n = Math.round(size / step);
  const verts = n + 1;
  const H = new Float32Array((verts + 2) * (verts + 2));
  let anyLand = false;
  for (let j = -1; j <= verts; j++) {
    for (let i = -1; i <= verts; i++) {
      const h = world.heightAt(x0 + i * step, z0 + j * step);
      H[(j + 1) * (verts + 2) + (i + 1)] = h;
      if (h > -0.3) anyLand = true;
    }
  }
  if (!anyLand) return null;
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const hAt = (i: number, j: number) => H[(j + 1) * (verts + 2) + (i + 1)];
  const U = (x: number) => (x - cover.x0) / cover.size;
  const V = (z: number) => 1 - (z - cover.z0) / cover.size;
  for (let j = 0; j < verts; j++) {
    for (let i = 0; i < verts; i++) {
      const x = x0 + i * step;
      const z = z0 + j * step;
      pos.push(x, hAt(i, j), z);
      const dx = hAt(i + 1, j) - hAt(i - 1, j);
      const dz = hAt(i, j + 1) - hAt(i, j - 1);
      const nx = -dx, ny = 2 * step, nz = -dz;
      const l = Math.hypot(nx, ny, nz);
      nor.push(nx / l, ny / l, nz / l);
      uv.push(U(x), V(z));
    }
  }
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const a = j * verts + i;
      const b = a + 1;
      const c = a + verts;
      const d = c + 1;
      // +Y facing with x right / z down
      idx.push(a, c, b, b, c, d);
    }
  }
  // skirts along the four edges
  const skirt = (ids: number[], outward: boolean) => {
    const start = pos.length / 3;
    for (const id of ids) {
      pos.push(pos[id * 3], pos[id * 3 + 1] - 6, pos[id * 3 + 2]);
      nor.push(nor[id * 3], nor[id * 3 + 1], nor[id * 3 + 2]);
      uv.push(uv[id * 2], uv[id * 2 + 1]);
    }
    for (let k = 0; k < ids.length - 1; k++) {
      const a = ids[k], b = ids[k + 1], c = start + k, d = start + k + 1;
      if (outward) idx.push(a, c, b, b, c, d);
      else idx.push(a, b, c, b, d, c);
    }
  };
  const top: number[] = [], bottom: number[] = [], left: number[] = [], right: number[] = [];
  for (let i = 0; i < verts; i++) {
    top.push(i);
    bottom.push(n * verts + i);
    left.push(i * verts);
    right.push(i * verts + n);
  }
  // outward-facing skirts (top = −Z edge, left = −X edge)
  skirt(top, false);
  skirt(bottom, true);
  skirt(left, true);
  skirt(right, false);
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

export interface TerrainUniforms {
  uNight: IUniform<number>;
}

export function groundMaterial(cover: GroundCoverage, u: TerrainUniforms): MeshStandardMaterial {
  const m = new MeshStandardMaterial({
    map: cover.day,
    emissiveMap: cover.night,
    emissive: new Color(0xffffff),
    emissiveIntensity: 0,
    roughness: 0.95,
    metalness: 0,
  });
  m.userData.night = u.uNight;
  // fine world-space detail so the painted ground does not look blurry up close
  const detail = detailTexture('asphalt');
  m.onBeforeCompile = (shader) => {
    shader.uniforms.tDetail = { value: detail };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vGW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvGW = (modelMatrix * vec4(transformed, 1.0)).xz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D tDetail;\nvarying vec2 vGW;')
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float dA = texture2D(tDetail, vGW / 7.0).r;
        float dB = texture2D(tDetail, vGW / 53.0 + 0.37).r;
        diffuseColor.rgb *= 0.78 + 0.32 * (dA * 0.55 + dB * 0.45);`,
      );
  };
  m.customProgramCacheKey = () => 'ground-detail-v1';
  return m;
}

/**
 * Far terrain: ENU grid (100 m) rotated into the stadium frame. Land is
 * coloured by height with an urban tint; inside the streamed region it sits
 * 1.5 m lower (plus a depth offset) so loaded chunks always win.
 */
export function buildFarTerrain(world: World, nearHalf: number, pinnedRadius: number): Mesh {
  const g = world.json.terrain.far;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const city = new Color('#9d9384');
  const green = new Color('#6f7d55');
  const sand = new Color('#bcb39f');
  const water = new Color('#1d3440');
  const c = new Color();
  for (let j = 0; j < g.ny; j++) {
    for (let i = 0; i < g.nx; i++) {
      const e = g.e0 + i * g.step;
      const n = g.n0 + j * g.step;
      const [x, z] = world.fromENU(e, n);
      let h = world.demHeight(x, z);
      const inside = Math.abs(x) < nearHalf && Math.abs(z) < nearHalf;
      // sit under the streamed chunks: deep where chunks are always loaded
      // (around the stadium), a few metres elsewhere in the streamed region
      const r = Math.hypot(x, z);
      if (r < pinnedRadius - 150) h -= 60;
      else if (inside && h > 0) h = Math.max(0.3, h - 4);
      const coast = world.coastDistance(x, z);
      if (coast !== null && coast < 0) h = Math.min(h, -8);
      pos.push(x, h, z);
      if (h < 0) c.copy(water);
      else {
        // dense city on the slopes, parks on the ridges, sandy shore
        const hash = Math.abs(Math.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1;
        c.copy(city).lerp(green, Math.min(0.55, Math.max(0, (h - 60) / 220) + (hash > 0.82 ? 0.35 : 0)));
        if (h < 4) c.lerp(sand, 0.4);
        c.multiplyScalar(0.92 + hash * 0.14);
      }
      col.push(c.r, c.g, c.b);
    }
  }
  for (let j = 0; j < g.ny - 1; j++) {
    for (let i = 0; i < g.nx - 1; i++) {
      const a = j * g.nx + i;
      const b = a + 1;
      const cc = a + g.nx;
      const d = cc + 1;
      idx.push(a, b, cc, b, d, cc);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('color', new BufferAttribute(new Float32Array(col), 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  // the ENU→frame map is a reflection: make sure normals point up
  const nrm = geo.getAttribute('normal');
  let up = 0;
  for (let k = 0; k < nrm.count; k += 101) up += nrm.getY(k);
  if (up < 0) {
    for (let k = 0; k < idx.length; k += 3) [idx[k + 1], idx[k + 2]] = [idx[k + 2], idx[k + 1]];
    geo.setIndex(idx);
    geo.computeVertexNormals();
  }
  geo.computeBoundingSphere();
  const mesh = new Mesh(
    geo,
    new MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 }),
  );
  mesh.name = 'far-terrain';
  mesh.receiveShadow = false;
  return mesh;
}
