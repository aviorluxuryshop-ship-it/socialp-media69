/**
 * Distant city fabric beyond the OSM extract (Asian shore, Şişli, Beyoğlu …):
 * one instanced draw call of simple blocks placed on land from the far DEM.
 * Windows and night lights come from world-space shader math.
 */
import { BoxGeometry, Color, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3, type IUniform } from 'three';
import type { World } from './data.ts';

export function buildFarCity(world: World, uNight: IUniform<number>, spacing: number, innerHalf: number): InstancedMesh {
  const g = world.json.terrain.far;
  // cream and stone façades, with the terracotta and grey roofs that dominate Istanbul from afar
  const palette = ['#d9cfbd', '#cbbfa8', '#e2dbcd', '#c4bcb0', '#d6c6a6', '#b9b0a3', '#ddd0bb', '#b8735a', '#a8624b', '#9d978e', '#c9a58d'].map((c) => new Color(c));
  const items: { x: number; z: number; y: number; w: number; d: number; h: number; rot: number; c: Color }[] = [];
  const hash = (a: number, b: number, s: number) => {
    const v = Math.sin(a * 12.9898 + b * 78.233 + s * 37.719) * 43758.5453;
    return v - Math.floor(v);
  };
  const maxR = Math.min(g.nx, g.ny) * g.step * 0.5 - 300;
  for (let x = -maxR; x <= maxR; x += spacing) {
    for (let z = -maxR; z <= maxR; z += spacing) {
      const jx = x + (hash(x, z, 1) - 0.5) * spacing * 0.7;
      const jz = z + (hash(x, z, 2) - 0.5) * spacing * 0.7;
      const r = Math.hypot(jx, jz);
      if (r > maxR) continue;
      // inside the OSM extract the real buildings stream in instead
      if (world.coastDistance(jx, jz) !== null) continue;
      if (Math.abs(jx) < innerHalf && Math.abs(jz) < innerHalf) continue;
      const h = world.demHeight(jx, jz);
      if (h < 3) continue;
      // fewer buildings on the highest ridges (parks, groves)
      const keep = h > 180 ? 0.25 : h > 120 ? 0.55 : 0.82;
      if (hash(jx, jz, 3) > keep) continue;
      // a neighbourhood-scale street-grid orientation
      const rot = Math.floor(hash(Math.floor(jx / 400), Math.floor(jz / 400), 4) * 4) * 0.4 + hash(Math.floor(jx / 400), Math.floor(jz / 400), 5) * 0.3;
      items.push({
        x: jx,
        z: jz,
        y: h - 2,
        w: spacing * (0.45 + hash(jx, jz, 6) * 0.35),
        d: spacing * (0.4 + hash(jx, jz, 7) * 0.35),
        h: 9 + hash(jx, jz, 8) * (h < 60 ? 16 : 24) + (hash(jx, jz, 9) > 0.97 ? 40 : 0),
        rot,
        c: palette[Math.floor(hash(jx, jz, 10) * palette.length)],
      });
    }
  }
  const geo = new BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  const mat = new MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = uNight;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vW;\nvarying vec3 vWN;')
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
vec4 wp4 = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
vW = wp4.xyz;
vWN = normalize(mat3(modelMatrix * instanceMatrix) * objectNormal);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uNight;\nvarying vec3 vW;\nvarying vec3 vWN;\nfloat fh(vec3 p){ p=fract(p*0.3183+vec3(0.1,0.2,0.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
float fw = 0.0; float flit = 0.0;
if (abs(vWN.y) < 0.5) {
  vec2 t = normalize(vec2(-vWN.z, vWN.x));
  vec2 cell = vec2(dot(vW.xz, t) / 3.2, vW.y / 3.2);
  vec2 f = fract(cell);
  fw = step(0.25, f.x) * step(f.x, 0.75) * step(0.3, f.y) * step(f.y, 0.8);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.08), fw * 0.8);
  flit = fw * step(0.55, fh(vec3(floor(cell), floor(vW.x * 0.05))));
}`,
      )
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.75, 0.45) * flit * uNight * 1.8;');
  };
  mat.customProgramCacheKey = () => 'tupras-farcity-v1';
  const mesh = new InstancedMesh(geo, mat, items.length);
  const m = new Matrix4();
  const q = new Quaternion();
  const s = new Vector3();
  const p = new Vector3();
  const up = new Vector3(0, 1, 0);
  items.forEach((it, i) => {
    q.setFromAxisAngle(up, it.rot);
    s.set(it.w, it.h, it.d);
    p.set(it.x, it.y, it.z);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, it.c);
  });
  mesh.computeBoundingSphere();
  mesh.name = 'far-city';
  return mesh;
}
