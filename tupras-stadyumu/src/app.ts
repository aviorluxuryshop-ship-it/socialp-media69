/**
 * Application root: builds the world, the stadium and the atmosphere, owns
 * the camera director and the frame loop.
 */
import { MeshNormalMaterial, NoToneMapping, Timer, Vector3, type MeshStandardMaterial } from 'three';
import { detectQuality, type QualitySettings } from './core/quality.ts';
import { Engine } from './core/engine.ts';
import { PostPipeline } from './core/post.ts';
import { loadWorld, type World } from './world/data.ts';
import { buildStadium, type Stadium } from './stadium/index.ts';
import { CATEGORIES, PITCH_ELEVATION } from './stadium/config.ts';
import type { Block } from './stadium/layout.ts';
import { paintGround } from './world/ground.ts';
import { groundMaterial, buildFarTerrain } from './world/terrain.ts';
import { createBuildingMaterial } from './world/buildings.ts';
import { ChunkStreamer, treeMaterial } from './world/streaming.ts';
import { buildWater, type WaterHandle } from './world/water.ts';
import { buildLandmarks, type LandmarksHandle } from './world/landmarks.ts';
import { buildFarCity } from './world/farCity.ts';
import { SunClock, type TimeSource } from './lighting/sun.ts';
import { Atmosphere } from './lighting/atmosphere.ts';
import { CameraDirector } from './camera/director.ts';
import { buildViews, type LockedView, type ViewId } from './camera/views.ts';
import { planToFrame, planToSeat, seatFrame, type KeyFrame, type PlanContext } from './camera/clips.ts';
import { Selection } from './selection/selection.ts';

export interface FrameHook {
  (dt: number, elapsed: number): void;
}

export class App {
  readonly params = new URLSearchParams(location.search);
  quality!: QualitySettings;
  engine!: Engine;
  post!: PostPipeline;
  world!: World;
  stadium!: Stadium;
  streamer!: ChunkStreamer;
  water!: WaterHandle;
  landmarks!: LandmarksHandle;
  atmosphere!: Atmosphere;
  clock = new SunClock();
  director!: CameraDirector;
  views: LockedView[] = [];
  selection!: Selection;
  time!: TimeSource;
  private groundMats: MeshStandardMaterial[] = [];
  /** ?pass=normal: geometry only, no lighting — used to prove views are identical */
  geometryPass = false;
  private readonly hooks: FrameHook[] = [];
  private readonly timer = new Timer();
  private elapsed = 0;
  private fps = 0;
  private frames = 0;
  private fpsAcc = 0;
  /** frame-time samples (ms) for the performance governor and the debug HUD */
  readonly frameTimes: number[] = [];

  async init(container: HTMLElement, step: (txt: string, p: number) => Promise<unknown>): Promise<void> {
    this.quality = detectQuality();
    const engine = (this.engine = new Engine(container, this.quality));
    const { scene, camera, renderer } = engine;

    await step('Şehir verisi yükleniyor', 0.1);
    const world = (this.world = await loadWorld());
    engine.setWorld(world);

    await step('Tüpraş Stadyumu kuruluyor', 0.3);
    this.stadium = buildStadium(world.json.eskiAcik);
    scene.add(this.stadium.group);
    this.views = buildViews(this.stadium.layout);

    await step('Boğaz ve çevre hazırlanıyor', 0.55);
    const q = this.quality;
    const detailCover = paintGround(world, 0, 0, 1600, 2048);
    const wideSize = Math.max(4000, world.chunkSize * 2 * Math.max(...world.chunkMax.map(Math.abs), ...world.chunkMin.map(Math.abs)) + 800);
    const wideCover = paintGround(world, 0, 0, wideSize, q.tier === 'high' ? 4096 : 2048);
    const groundDetail = groundMaterial(detailCover, { uNight: engine.uNight });
    const groundWide = groundMaterial(wideCover, { uNight: engine.uNight });
    this.groundMats = [groundDetail, groundWide];
    const buildingsMat = createBuildingMaterial({ uNight: engine.uNight });
    this.streamer = new ChunkStreamer(world, { groundDetail, groundWide, buildings: buildingsMat, trees: treeMaterial() }, detailCover, wideCover, q);
    scene.add(this.streamer.group);
    scene.add(buildFarTerrain(world, this.streamer.halfExtent, ChunkStreamer.PINNED_RADIUS));
    scene.add(buildFarCity(world, engine.uNight, q.tier === 'low' ? 120 : 80, 0));
    this.water = buildWater();
    scene.add(this.water.mesh);
    this.landmarks = buildLandmarks(world);
    scene.add(this.landmarks.group);

    await step('Işık ve atmosfer', 0.75);
    const tParam = this.params.get('t');
    if (tParam) {
      const [h, m] = tParam.split(':').map(Number);
      this.clock.setOverride(h * 60 + (m || 0));
    }
    this.atmosphere = new Atmosphere(world, scene, renderer, q, PITCH_ELEVATION);
    this.post = new PostPipeline(renderer, scene, camera, q);
    // glass and water keep their reflections while the diffuse ambient stays low
    const mats = this.stadium.materials;
    this.atmosphere.registerReflective(mats.glass, 1.4);
    this.atmosphere.registerReflective(this.water.material, 0.8);
    scene.traverse((o) => {
      const m = (o as { material?: MeshStandardMaterial }).material;
      if (m && (m as MeshStandardMaterial).isMeshStandardMaterial && m.metalness > 0.8 && m.roughness < 0.15 && m !== mats.glass) this.atmosphere.registerReflective(m, 1.3);
    });
    // STEP 04: mask + highlight compositing before tone mapping
    this.selection = new Selection(renderer, scene, camera, this.stadium);
    this.post.insertBeforeOutput(this.selection.pass);
    engine.onResize((w, h) => {
      this.post.setSize(w, h);
      const pr = renderer.getPixelRatio();
      this.selection.setSize(Math.round(w * pr), Math.round(h * pr));
    });
    const blockParam = this.params.get('block');
    if (blockParam) {
      const b = this.stadium.layout.blocks.find((x) => x.code === blockParam);
      if (b) this.selection.selectBlock(b.index);
    }
    if (this.params.has('mask')) this.selection.setMask(true);
    if (this.params.has('sold')) this.selection.setAvailability(true);

    // camera
    this.director = new CameraDirector(camera, renderer.domElement, world);
    if (this.params.has('fast')) this.director.speed = 5; // automated tests only
    const viewParam = this.params.get('view') as ViewId | null;
    const v = this.views.find((x) => x.id === viewParam) ?? null;
    if (v) this.director.lock(v);
    else {
      this.director.applyPose({
        position: new Vector3(-260, PITCH_ELEVATION + 210, 330),
        target: new Vector3(0, PITCH_ELEVATION + 8, 0),
        fov: 50,
      });
      const camP = this.params.get('cam');
      const lookP = this.params.get('look');
      if (camP || lookP) {
        this.director.applyPose({
          position: camP ? new Vector3().fromArray(camP.split(',').map(Number)) : camera.position.clone(),
          target: lookP ? new Vector3().fromArray(lookP.split(',').map(Number)) : this.director.target.clone(),
          fov: Number(this.params.get('fov') ?? 50),
        });
      }
    }

    // geometry-only render (STEP 02 test): same camera, no lighting/materials
    if (this.params.get('pass') === 'normal') {
      this.geometryPass = true;
      scene.overrideMaterial = new MeshNormalMaterial();
      this.atmosphere.sky.visible = false;
      renderer.toneMapping = NoToneMapping;
    }

    await step('Görünür alan yükleniyor', 0.9);
    camera.updateMatrixWorld();
    this.streamer.primeAll(camera);
    this.time = this.clock.now();
    this.atmosphere.update(this.time.sun, camera.position, 0, true);
    renderer.info.autoReset = false;
  }

  /** Planner context: the layout plus a safe-height function (terrain, Süzer Plaza). */
  planContext(): PlanContext {
    const w = this.world;
    const suzer = w.json.landmarks.suzerPlaza.p as number[];
    return {
      layout: this.stadium.layout,
      minHeight: (x, z) => {
        let h = Math.max(w.heightAt(x, z), 0) + 18;
        if (Math.hypot(x - suzer[0], z - suzer[1]) < 60) h = Math.max(h, w.heightAt(suzer[0], suzer[1]) + 175);
        return h;
      },
    };
  }

  /** Cinematic flight to a locked view (STEP 03). */
  flyToView(v: LockedView, onDone?: () => void): void {
    const from = this.director.pose();
    const frames: KeyFrame[] =
      v.seat !== undefined
        ? planToSeat(this.planContext(), from, v.seat)
        : planToFrame(this.planContext(), from, { position: v.position.clone(), target: v.target.clone(), fov: v.fov, label: v.label }, null);
    // land exactly on the locked pose
    const last = frames[frames.length - 1];
    last.position.copy(v.position);
    last.target.copy(v.target);
    last.fov = v.fov;
    this.director.fly(frames, v, onDone);
  }

  /** Cinematic flight to a stand or block frame (STEP 05). */
  flyToFrame(dest: KeyFrame, via: Block, onDone?: () => void): void {
    const frames = planToFrame(this.planContext(), this.director.pose(), { ...dest, position: dest.position.clone(), target: dest.target.clone() }, via);
    const v: LockedView = { id: 'seat' as ViewId, label: dest.label, caption: '', position: dest.position, target: dest.target, fov: dest.fov };
    this.director.fly(frames, v, onDone);
  }

  /** Cinematic flight to a seat (STEP 05 uses this). */
  flyToSeat(seat: number, onDone?: () => void): void {
    const frames = planToSeat(this.planContext(), this.director.pose(), seat);
    const s = seatFrame(this.stadium.layout, seat);
    const v: LockedView = { id: 'uzun', label: 'Koltuk', caption: '', position: s.position, target: s.target, fov: s.fov, seat };
    this.director.fly(frames, { ...v, id: 'seat' as ViewId }, onDone);
  }

  seatPrice(seat: number): number {
    return CATEGORIES[this.stadium.layout.seats.category[seat]]?.price ?? 0;
  }

  /** Render the current view right now (no time advance). */
  renderNow(): void {
    this.selection.prepare(this.elapsed);
    this.post.render(0);
  }

  /**
   * Capture the current view without any highlight — the ticket image.
   * Read back in the same task as the render (the drawing buffer is not preserved).
   */
  captureView(): string {
    const st = { ...this.selection.state };
    const hov = this.selection.hoverEnabled;
    Object.assign(this.selection.state, { block: -1, row: -1, seat: -1, hoverSeat: -1, hoverBlock: -1, mask: false });
    this.selection.hoverEnabled = false;
    this.selection.setHoverSet([]);
    this.renderNow();
    const url = this.engine.canvas.toDataURL('image/jpeg', 0.88);
    Object.assign(this.selection.state, st);
    this.selection.hoverEnabled = hov;
    this.renderNow();
    return url;
  }

  onFrame(fn: FrameHook): void {
    this.hooks.push(fn);
  }

  start(): void {
    const loop = (t: number) => {
      this.frame(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private frame(t: number): void {
    const t0 = performance.now();
    this.timer.update(t);
    const dt = Math.min(0.1, this.timer.getDelta());
    this.elapsed += dt;
    const { engine, director, atmosphere, stadium, streamer, water, landmarks } = this;
    const camera = engine.camera;

    director.update(dt);
    for (const h of this.hooks) h(dt, this.elapsed);

    this.time = this.clock.now();
    atmosphere.setShadowFocus(camera.position, director.target);
    atmosphere.update(this.time.sun, camera.position, dt);
    const f = atmosphere.factors;
    engine.uNight.value = f.night * 0.9 + f.lights * 0.1;
    for (const m of this.groundMats) m.emissiveIntensity = f.night * 0.5;
    stadium.materials.setAtmosphere(f.day, f.lights);
    streamer.setNight(f.night);
    water.update(this.elapsed);
    water.setNight(f.night);
    landmarks.update(this.elapsed, f.night);
    streamer.update(camera);
    stadium.seats.update(camera);
    engine.updateClipPlanes();
    this.post.setBloom(f.night * 0.5);
    if (this.geometryPass) {
      engine.renderer.toneMappingExposure = 1;
      this.post.setBloom(0);
      atmosphere.stars.visible = false;
      atmosphere.sky.visible = false;
      streamer.lightMaterial.visible = false;
    }
    engine.renderer.info.reset();
    this.selection.prepare(this.elapsed);
    if (this.params.has('nopost')) engine.renderer.render(engine.scene, camera);
    else this.post.render(dt);

    const ms = performance.now() - t0;
    this.frameTimes.push(ms);
    if (this.frameTimes.length > 120) this.frameTimes.shift();
    this.frames++;
    this.fpsAcc += dt;
    if (this.fpsAcc > 0.5) {
      this.fps = this.frames / this.fpsAcc;
      this.frames = 0;
      this.fpsAcc = 0;
    }
  }

  get stats() {
    const info = this.engine.renderer.info;
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    return {
      fps: this.fps,
      cpuMs: sorted[Math.floor(sorted.length / 2)] ?? 0,
      cpuP95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      calls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      streamer: this.streamer.stats,
    };
  }
}
