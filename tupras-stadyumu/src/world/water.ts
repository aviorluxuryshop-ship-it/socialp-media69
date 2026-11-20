/**
 * Bosphorus surface: physically based (Fresnel from the standard BRDF), sky
 * reflections from the environment map, two scrolling normal-map layers.
 */
import {
  CanvasTexture,
  Color,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  Vector2,
  type IUniform,
} from 'three';

function normalTexture(size = 256): CanvasTexture {
  // tileable height field from a sum of periodic waves → normals
  const h = new Float32Array(size * size);
  const waves: [number, number, number, number][] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 28; i++) {
    const kx = Math.round((rnd() - 0.5) * 16) || 1;
    const ky = Math.round((rnd() - 0.5) * 16) || 1;
    waves.push([kx, ky, rnd() * Math.PI * 2, 1 / Math.hypot(kx, ky)]);
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      for (const [kx, ky, ph, a] of waves) v += a * Math.sin(((kx * x + ky * y) / size) * Math.PI * 2 + ph);
      h[y * size + x] = v;
    }
  }
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const img = g.createImageData(size, size);
  const s = 2.2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = h[y * size + ((x + 1) % size)] - h[y * size + ((x - 1 + size) % size)];
      const dy = h[((y + 1) % size) * size + x] - h[((y - 1 + size) % size) * size + x];
      let nx = -dx * s, ny = -dy * s;
      const nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l;
      ny /= l;
      const i = (y * size + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz / l * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

export interface WaterHandle {
  mesh: Mesh;
  update(time: number): void;
  setNight(n: number): void;
}

export function buildWater(): WaterHandle {
  const nt = normalTexture();
  nt.repeat.set(1, 1);
  const uTime: IUniform<number> = { value: 0 };
  const mat = new MeshStandardMaterial({
    color: new Color('#0b2833'),
    roughness: 0.16,
    metalness: 0.0,
    normalMap: nt,
    normalScale: new Vector2(0.32, 0.32),
    envMapIntensity: 0.85,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec3 vWPos;')
      .replace(
        '#include <normal_fragment_maps>',
        `
        vec2 wuv = vWPos.xz;
        vec3 n1 = texture2D( normalMap, wuv / 61.0 + vec2( uTime * 0.011, uTime * 0.006 ) ).xyz * 2.0 - 1.0;
        vec3 n2 = texture2D( normalMap, wuv / 23.0 + vec2( -uTime * 0.017, uTime * 0.013 ) ).xyz * 2.0 - 1.0;
        vec3 n3 = texture2D( normalMap, wuv / 410.0 + vec2( uTime * 0.002, -uTime * 0.003 ) ).xyz * 2.0 - 1.0;
        // the plane is horizontal: build the normal in world space directly
        // (UV derivatives over a 60 km plane are too small for a stable TBN)
        vec2 slope = ( n1.xy + n2.xy * 0.6 + n3.xy * 0.9 ) * normalScale;
        vec3 worldN = normalize( vec3( slope.x, 1.0, slope.y ) );
        normal = normalize( mat3( viewMatrix ) * worldN );
        `,
      );
  };
  mat.customProgramCacheKey = () => 'tupras-water-v1';
  const geo = new PlaneGeometry(60000, 60000, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const mesh = new Mesh(geo, mat);
  mesh.name = 'bosphorus';
  mesh.position.y = 0;
  mesh.receiveShadow = true;
  mesh.renderOrder = -1;
  return {
    mesh,
    update(time: number) {
      uTime.value = time;
    },
    setNight(n: number) {
      mat.color.set('#0b2833').lerp(new Color('#040e14'), n);
      mat.roughness = 0.16 + n * 0.04;
    },
  };
}
