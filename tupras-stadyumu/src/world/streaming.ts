/**
 * Chunk streamer — the "endless runner" pattern applied to the city.
 *
 * The world is cut into 200 m chunks. Around the camera:
 *   · chunks within `detailRadius` are built at LOD 0 (10 m terrain, trees,
 *     street lights), within `loadRadius` at LOD 1 (25 m terrain, buildings);
 *   · chunks beyond `loadRadius × 1.12` are released back to an object pool
 *     and their GPU buffers disposed;
 *   · building happens in a job queue with a per-frame time budget, nearest
 *     and in-view chunks first, so motion never stalls the frame;
 *   · the radius is direction-agnostic: turning the camera never reveals an
 *     empty area — only priority follows the view direction.
 * The stadium itself and the seat data are not managed here: they are
 * permanent.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Frustum,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Points,
  ShaderMaterial,
  Sphere,
  Vector3,
  type Camera,
  type Material,
} from 'three';
import type { QualitySettings } from '../core/quality.ts';
import type { World } from './data.ts';
import { buildBuildingsGeometry } from './buildings.ts';
import { chunkTerrainGeometry } from './terrain.ts';
import type { GroundCoverage } from './ground.ts';
import { buildingBoxes, buildTreesGeometry, indexAreas, type AreaIndex } from './trees.ts';

interface ChunkObj {
  group: Group;
  terrain: Mesh;
  buildings: Mesh;
  trees: Mesh;
  lights: Points;
}

interface ChunkState {
  key: string;
  ix: number;
  iz: number;
  centre: Vector3;
  lod: number; // −1 = not loaded
  obj: ChunkObj | null;
  queued: number | null; // LOD waiting in the queue
  /** last time (ms) the chunk was inside the view cone */
  seenAt: number;
}

export interface StreamerMaterials {
  groundDetail: Material;
  groundWide: Material;
  buildings: Material;
  trees: Material;
}

const EMPTY = new BufferGeometry();

function glowTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,240,215,1)');
  grd.addColorStop(0.25, 'rgba(255,200,130,0.55)');
  grd.addColorStop(1, 'rgba(255,170,90,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

export class ChunkStreamer {
  readonly group = new Group();
  private readonly world: World;
  private readonly mats: StreamerMaterials;
  private readonly detailCover: GroundCoverage;
  private readonly wideCover: GroundCoverage;
  private readonly chunks = new Map<string, ChunkState>();
  private readonly pool: ChunkObj[] = [];
  private readonly areas: AreaIndex[];
  private readonly lightsByChunk = new Map<string, number[]>();
  readonly lightMaterial: ShaderMaterial;
  private queue: ChunkState[] = [];
  private q: QualitySettings;
  private readonly frustum = new Frustum();
  private readonly projScreen = new Matrix4();
  private readonly sphere = new Sphere();
  stats = { loaded: 0, lod0: 0, pooled: 0, queued: 0, builtThisFrame: 0, created: 0, released: 0, inView: 0, droppedBehind: 0 };
  /** chunks closer than this stay loaded whatever the view direction */
  keepRadius = 450;
  /** seconds a chunk may stay outside the view cone before it is released */
  behindGrace = 2.5;
  private readonly fwd = new Vector3();

  constructor(world: World, mats: StreamerMaterials, detail: GroundCoverage, wide: GroundCoverage, q: QualitySettings) {
    this.world = world;
    this.mats = mats;
    this.detailCover = detail;
    this.wideCover = wide;
    this.q = q;
    this.group.name = 'city-chunks';
    this.areas = indexAreas(world);
    this.lightMaterial = new ShaderMaterial({
      uniforms: { map: { value: glowTexture() }, opacity: { value: 0 }, scale: { value: 900 } },
      vertexShader: `
        uniform float scale; varying float vFade;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float d = -mv.z;
          gl_PointSize = clamp(6.0 * scale / max(d, 1.0), 1.5, 10.0);
          vFade = smoothstep(25.0, 90.0, d);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D map; uniform float opacity; varying float vFade;
        void main(){
          vec4 t = texture2D(map, gl_PointCoord);
          gl_FragColor = vec4(t.rgb * 2.2, t.a * opacity * vFade);
        }`,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    // street lamps every ~32 m along lit roads, bucketed per chunk
    const C = world.chunkSize;
    for (const [cls, w, lit, , p] of world.json.roads) {
      if (!lit || cls > 3) continue;
      let carry = 0;
      for (let i = 0; i < p.length - 2; i += 2) {
        const x1 = p[i], z1 = p[i + 1], x2 = p[i + 2], z2 = p[i + 3];
        const L = Math.hypot(x2 - x1, z2 - z1);
        let s = carry;
        while (s < L) {
          const t = s / L;
          const nx = -(z2 - z1) / L, nz = (x2 - x1) / L;
          const side = Math.floor(s / 32) % 2 ? 1 : -1;
          const x = x1 + (x2 - x1) * t + nx * side * (w * 0.5 + 0.5);
          const z = z1 + (z2 - z1) * t + nz * side * (w * 0.5 + 0.5);
          const key = `${Math.floor(x / C)},${Math.floor(z / C)}`;
          let arr = this.lightsByChunk.get(key);
          if (!arr) this.lightsByChunk.set(key, (arr = []));
          arr.push(x, z);
          s += 32;
        }
        carry = s - L;
      }
    }
    // register every chunk of the grid (bounds of the building data, plus a ring)
    const [minX, minZ] = world.chunkMin;
    const [maxX, maxZ] = world.chunkMax;
    for (let ix = minX - 1; ix <= maxX + 1; ix++) {
      for (let iz = minZ - 1; iz <= maxZ + 1; iz++) {
        const key = `${ix},${iz}`;
        const cx = (ix + 0.5) * C;
        const cz = (iz + 0.5) * C;
        this.chunks.set(key, { key, ix, iz, centre: new Vector3(cx, world.heightAt(cx, cz), cz), lod: -1, obj: null, queued: null, seenAt: -Infinity });
      }
    }
  }

  setQuality(q: QualitySettings): void {
    this.q = q;
  }

  get halfExtent(): number {
    const C = this.world.chunkSize;
    return Math.max(
      Math.abs(this.world.chunkMin[0] - 1) * C,
      Math.abs(this.world.chunkMin[1] - 1) * C,
      (this.world.chunkMax[0] + 2) * C,
      (this.world.chunkMax[1] + 2) * C,
    );
  }

  private acquire(): ChunkObj {
    const o = this.pool.pop();
    if (o) return o;
    this.stats.created++;
    const terrain = new Mesh(EMPTY, this.mats.groundWide);
    terrain.receiveShadow = true;
    const buildings = new Mesh(EMPTY, this.mats.buildings);
    buildings.castShadow = true;
    buildings.receiveShadow = true;
    const trees = new Mesh(EMPTY, this.mats.trees);
    trees.castShadow = true;
    trees.receiveShadow = true;
    const lights = new Points(EMPTY, this.lightMaterial);
    lights.frustumCulled = true;
    const group = new Group();
    group.add(terrain, buildings, trees, lights);
    return { group, terrain, buildings, trees, lights };
  }

  private releaseObj(o: ChunkObj): void {
    for (const m of [o.terrain, o.buildings, o.trees, o.lights]) {
      if (m.geometry !== EMPTY) m.geometry.dispose();
      m.geometry = EMPTY;
      m.visible = false;
    }
    o.group.removeFromParent();
    this.pool.push(o);
    this.stats.released++;
  }

  private build(st: ChunkState, lod: number): void {
    const C = this.world.chunkSize;
    const x0 = st.ix * C;
    const z0 = st.iz * C;
    const fresh = this.acquire();
    const inDetail =
      x0 >= this.detailCover.x0 && z0 >= this.detailCover.z0 && x0 + C <= this.detailCover.x0 + this.detailCover.size && z0 + C <= this.detailCover.z0 + this.detailCover.size;
    const cover = inDetail ? this.detailCover : this.wideCover;
    const tg = chunkTerrainGeometry(this.world, x0, z0, C, lod === 0 ? 10 : 25, cover);
    fresh.terrain.geometry = tg ?? EMPTY;
    fresh.terrain.material = inDetail ? this.mats.groundDetail : this.mats.groundWide;
    fresh.terrain.visible = !!tg;
    const recs = this.world.json.buildings[st.key];
    const bg = recs ? buildBuildingsGeometry(this.world, recs) : null;
    fresh.buildings.geometry = bg ?? EMPTY;
    fresh.buildings.visible = !!bg;
    let trg: BufferGeometry | null = null;
    if (lod === 0 && this.q.trees) trg = buildTreesGeometry(this.world, this.areas, this.world.json.trees[st.key], x0, z0, C, buildingBoxes(this.world, st.ix, st.iz));
    fresh.trees.geometry = trg ?? EMPTY;
    fresh.trees.visible = !!trg;
    const lamps = this.lightsByChunk.get(st.key);
    if (lamps && lamps.length) {
      const pos = new Float32Array((lamps.length / 2) * 3);
      for (let i = 0, k = 0; i < lamps.length; i += 2, k += 3) {
        pos[k] = lamps[i];
        pos[k + 1] = this.world.heightAt(lamps[i], lamps[i + 1]) + 7;
        pos[k + 2] = lamps[i + 1];
      }
      const lg = new BufferGeometry();
      lg.setAttribute('position', new BufferAttribute(pos, 3));
      lg.computeBoundingSphere();
      fresh.lights.geometry = lg;
      fresh.lights.visible = true;
    }
    // swap atomically: the old object stays visible until the new one is ready
    if (st.obj) this.releaseObj(st.obj);
    st.obj = fresh;
    st.lod = lod;
    this.group.add(fresh.group);
  }

  /** chunks within this radius of the stadium are never released */
  static readonly PINNED_RADIUS = 1150;

  private desiredLod(st: ChunkState, cam: Vector3): number {
    const d = Math.hypot(st.centre.x - cam.x, st.centre.z - cam.z) - this.world.chunkSize * 0.7;
    const pinned = Math.hypot(st.centre.x, st.centre.z) < ChunkStreamer.PINNED_RADIUS;
    const det = this.q.cityDetailRadius;
    const load = this.q.cityLoadRadius;
    // hysteresis keeps chunks from flickering between LODs at the boundary
    const floor = pinned ? 1 : -1;
    if (st.lod === 0) return d < det * 1.08 ? 0 : d < load * 1.12 ? 1 : floor;
    if (st.lod === 1) return d < det * 0.94 ? 0 : d < load * 1.12 ? 1 : floor;
    return d < det ? 0 : d < load ? 1 : floor;
  }

  /** Build everything needed for the current view right away (loading screen). */
  primeAll(camera: Camera): void {
    this.update(camera, Infinity);
  }

  /**
   * View cone in the ground plane: the horizontal field of view plus a
   * margin, so chunks start loading before they enter the picture.
   */
  private coneTest(camera: Camera): (st: ChunkState) => boolean {
    const cam = camera.position;
    camera.getWorldDirection(this.fwd);
    const pc = camera as Camera & { fov?: number; aspect?: number };
    const vfov = ((pc.fov ?? 60) * Math.PI) / 180;
    const hfov = Math.atan(Math.tan(vfov / 2) * (pc.aspect ?? 1.6));
    const half = Math.min(Math.PI, hfov + 0.6);
    const fx = this.fwd.x;
    const fz = this.fwd.z;
    const fl = Math.hypot(fx, fz);
    // looking (almost) straight down: everything around is on screen
    const allAround = fl < 0.35;
    const C = this.world.chunkSize;
    return (st) => {
      const dx = st.centre.x - cam.x;
      const dz = st.centre.z - cam.z;
      const d = Math.hypot(dx, dz);
      if (allAround || d < this.keepRadius) return true;
      const cos = (dx * fx + dz * fz) / (d * fl);
      const ang = Math.acos(Math.max(-1, Math.min(1, cos)));
      return ang < half + Math.atan((C * 0.8) / d);
    };
  }

  update(camera: Camera, budgetMs = this.q.streamBudgetMs): void {
    const cam = camera.position;
    this.projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreen);
    const now = performance.now();
    const inCone = this.coneTest(camera);
    let inView = 0;
    let dropped = 0;
    const want: ChunkState[] = [];
    for (const st of this.chunks.values()) {
      let lod = this.desiredLod(st, cam);
      const visible = inCone(st);
      if (visible) {
        st.seenAt = now;
        inView++;
      } else if (lod !== -1) {
        // behind the camera: no trees/lamps; after the grace period release it
        // (around the stadium keep the cheap LOD so the ground never opens)
        const pinned = Math.hypot(st.centre.x, st.centre.z) < ChunkStreamer.PINNED_RADIUS;
        if (now - st.seenAt > this.behindGrace * 1000) {
          lod = pinned ? 1 : -1;
          if (!pinned) dropped++;
        } else if (lod === 0 && st.lod !== 0) lod = st.lod === -1 ? 1 : st.lod;
      }
      if (lod === -1) {
        if (st.obj) {
          this.releaseObj(st.obj);
          st.obj = null;
          st.lod = -1;
        }
        st.queued = null;
        continue;
      }
      if (lod !== st.lod && st.queued !== lod) {
        st.queued = lod;
        want.push(st);
      }
    }
    if (want.length) this.queue.push(...want);
    // priority: visible first, then nearest
    const C = this.world.chunkSize;
    this.queue = this.queue.filter((s) => s.queued !== null);
    this.queue.sort((a, b) => this.priority(a, cam, C) - this.priority(b, cam, C));
    const t0 = performance.now();
    let built = 0;
    while (this.queue.length) {
      if (performance.now() - t0 > budgetMs && built > 0) break;
      const st = this.queue.shift()!;
      if (st.queued === null) continue;
      const lod = st.queued;
      st.queued = null;
      this.build(st, lod);
      built++;
    }
    let loaded = 0, lod0 = 0;
    for (const st of this.chunks.values()) {
      if (st.obj) {
        loaded++;
        if (st.lod === 0) lod0++;
      }
    }
    this.stats.loaded = loaded;
    this.stats.lod0 = lod0;
    this.stats.pooled = this.pool.length;
    this.stats.queued = this.queue.length;
    this.stats.builtThisFrame = built;
    this.stats.inView = inView;
    this.stats.droppedBehind = dropped;
  }

  private priority(st: ChunkState, cam: Vector3, C: number): number {
    this.sphere.center.copy(st.centre);
    this.sphere.radius = C * 0.75 + 60;
    const vis = this.frustum.intersectsSphere(this.sphere);
    const d = Math.hypot(st.centre.x - cam.x, st.centre.z - cam.z);
    return d + (vis ? 0 : 1500) + (st.queued === 0 && st.lod === -1 ? 0 : 200);
  }

  /** Night factor drives street-light sprites. */
  setNight(n: number): void {
    this.lightMaterial.uniforms.opacity.value = Math.min(1, n * 1.2);
    this.lightMaterial.visible = n > 0.02;
  }
}

export function treeMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, flatShading: false });
}
