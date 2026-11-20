/**
 * Atmosphere driven by the real sun: sky, sun/moon light with shadows,
 * hemisphere fill, fog, environment reflections, stadium floodlights and the
 * night sky. All parameters are functions of the solar altitude and change
 * smoothly while the page stays open.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  FogExp2,
  Group,
  HemisphereLight,
  Object3D,
  PMREMGenerator,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  SpotLight,
  Vector3,
  type WebGLRenderer,
  type WebGLRenderTarget,
  type MeshStandardMaterial,
} from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import type { World } from '../world/data.ts';
import type { SunState } from './sun.ts';
import type { QualitySettings } from '../core/quality.ts';

export interface AtmosphereFactors {
  day: number; // 0..1
  golden: number; // 0..1 (low sun)
  night: number; // 0..1
  lights: number; // floodlights 0..1
  altitude: number;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function factorsFor(alt: number): AtmosphereFactors {
  const day = smooth(-4, 14, alt);
  const night = 1 - smooth(-13, -3, alt);
  const golden = Math.max(0, 1 - Math.abs(alt - 3) / 11) * (1 - night);
  const lights = 1 - smooth(1, 9, alt);
  return { day, golden, night, lights, altitude: alt };
}

export class Atmosphere {
  readonly sun = new DirectionalLight(0xffffff, 3);
  readonly hemi = new HemisphereLight(0xbcd6ff, 0x8a7f6c, 0.9);
  readonly sky = new Sky();
  readonly stars: Points;
  readonly floods: SpotLight[] = [];
  readonly bowlFill: PointLight;
  readonly group = new Group();
  factors: AtmosphereFactors = factorsFor(30);
  private readonly world: World;
  private readonly scene: Scene;
  private readonly renderer: WebGLRenderer;
  private readonly pmrem: PMREMGenerator;
  private envRT: WebGLRenderTarget | null = null;
  private readonly envScene = new Scene();
  private readonly envSky = new Sky();
  private lastEnvAlt = 999;
  private lastEnvTime = 0;
  private readonly fog: FogExp2;
  private readonly sunDir = new Vector3();
  private readonly target = new Object3D();
  /** smoothed solar altitude/azimuth so live updates and slider jumps glide */
  private curAlt = NaN;
  private curAz = NaN;

  constructor(world: World, scene: Scene, renderer: WebGLRenderer, q: QualitySettings, pitchElevation: number) {
    this.world = world;
    this.scene = scene;
    this.renderer = renderer;
    this.pmrem = new PMREMGenerator(renderer);
    this.pitchElevation = pitchElevation;
    this.group.name = 'atmosphere';

    // sky dome (scaled far, rendered behind everything)
    this.sky.scale.setScalar(45000);
    this.sky.material.uniforms.turbidity.value = 4.5;
    this.sky.material.uniforms.rayleigh.value = 1.6;
    this.sky.material.uniforms.mieCoefficient.value = 0.004;
    this.sky.material.uniforms.mieDirectionalG.value = 0.82;
    this.sky.material.uniforms.cloudCoverage.value = 0.32;
    this.sky.material.uniforms.cloudDensity.value = 0.35;
    this.sky.frustumCulled = false;
    patchSky(this.sky);
    this.group.add(this.sky);

    this.stars = makeStars(43000);
    this.group.add(this.stars);

    // environment scene for reflections
    this.envSky.scale.setScalar(1000);
    this.envSky.material.uniforms.showSunDisc.value = 0;
    patchSky(this.envSky);
    this.envScene.add(this.envSky);

    // sun / moon light with a shadow box framing the stadium
    this.sun.castShadow = q.shadows;
    this.sun.shadow.mapSize.set(q.shadowMapSize, q.shadowMapSize);
    const sc = this.sun.shadow.camera;
    sc.left = -175;
    sc.right = 175;
    sc.top = 175;
    sc.bottom = -175;
    sc.near = 10;
    sc.far = 900;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.6;
    this.sun.shadow.radius = 2;
    this.target.position.set(0, pitchElevation, 0);
    this.sun.target = this.target;
    this.group.add(this.sun, this.target, this.hemi);

    // floodlights: six wide spots from the roof edge + a bowl fill that stops at the facade
    const spots: [number, number][] = [
      [0, 0.0],
      [0, Math.PI],
      [1, Math.PI / 2],
      [1, -Math.PI / 2],
      [2, Math.PI * 0.25],
      [2, -Math.PI * 0.75],
    ];
    for (const [, a] of spots) {
      const s = new SpotLight(0xf3f6ff, 0, 260, Math.PI / 3.2, 0.7, 0);
      const r = 62;
      s.position.set(Math.cos(a) * r * 1.2, pitchElevation + 34, Math.sin(a) * r * 0.75);
      s.target.position.set(-Math.cos(a) * 18, pitchElevation, -Math.sin(a) * 12);
      this.floods.push(s);
      this.group.add(s, s.target);
    }
    this.bowlFill = new PointLight(0xe9eeff, 0, 175, 0);
    this.bowlFill.position.set(0, pitchElevation + 26, 0);
    this.group.add(this.bowlFill);

    this.fog = new FogExp2(0xc9d6e3, 0.00011);
    scene.fog = this.fog;
    scene.add(this.group);
  }

  /** materials that keep strong reflections even though the diffuse ambient is low */
  private readonly reflective: { m: MeshStandardMaterial; k: number }[] = [];

  registerReflective(m: MeshStandardMaterial, intensity: number): void {
    this.reflective.push({ m, k: intensity });
    if (this.envRT) {
      m.envMap = this.envRT.texture;
      m.envMapIntensity = intensity;
      m.needsUpdate = true;
    }
  }

  private readonly shadowFocus = new Vector3();
  private readonly pitchElevation: number;
  private shadowExtent = 175;

  /**
   * Centre the sun's shadow box on what the camera is looking at: tight around
   * the stadium for seat and stand views, wider for aerials.
   */
  setShadowFocus(cameraPos: Vector3, target: Vector3): void {
    const ground = this.world.heightAt(cameraPos.x, cameraPos.z);
    const height = Math.max(0, cameraPos.y - Math.max(ground, 0));
    const dir = new Vector3().subVectors(target, cameraPos);
    const dist = dir.length();
    dir.normalize();
    const reach = Math.min(dist, 120 + height * 1.2);
    const p = cameraPos.clone().addScaledVector(dir, reach);
    p.y = Math.max(0, this.world.heightAt(p.x, p.z));
    // stadium views stay centred on the stadium so the roof shadow is always complete
    if (Math.hypot(cameraPos.x, cameraPos.z) < 220 && height < 160) p.set(0, this.pitchElevation, 0);
    this.shadowFocus.copy(p);
    this.shadowExtent = Math.min(650, Math.max(175, height * 1.4 + dist * 0.15));
  }

  /** Change the shadow map resolution at runtime (frame governor). */
  setShadowMapSize(n: number): void {
    if (this.sun.shadow.mapSize.x === n) return;
    this.sun.shadow.mapSize.set(n, n);
    this.sun.shadow.map?.dispose();
    this.sun.shadow.map = null;
  }

  /** Called every frame. `dt` in seconds; `instant` skips smoothing. */
  update(sun: SunState, cameraPos: Vector3, dt: number, instant = false): void {
    if (Number.isNaN(this.curAlt) || instant) {
      this.curAlt = sun.altitude;
      this.curAz = sun.azimuth;
    } else {
      // glide towards the target sun over ~1.5 s (slider jumps) — live drift is tiny anyway
      const k = 1 - Math.exp(-dt * 2.2);
      this.curAlt += (sun.altitude - this.curAlt) * k;
      let dAz = sun.azimuth - this.curAz;
      if (dAz > 180) dAz -= 360;
      if (dAz < -180) dAz += 360;
      this.curAz = (this.curAz + dAz * k + 360) % 360;
    }
    const alt = this.curAlt;
    const f = factorsFor(alt);
    this.factors = f;

    // sun direction in the stadium frame
    const [vx, vz] = this.world.bearingVector(this.curAz);
    const ca = Math.cos((alt * Math.PI) / 180);
    this.sunDir.set(vx * ca, Math.sin((alt * Math.PI) / 180), vz * ca).normalize();
    this.sky.material.uniforms.sunPosition.value.copy(this.sunDir);
    this.envSky.material.uniforms.sunPosition.value.copy(this.sunDir);
    this.sky.material.uniforms.turbidity.value = 3.5 + f.golden * 5;
    this.sky.material.uniforms.rayleigh.value = 1.2 + f.golden * 1.6 + (1 - f.day) * 0.6;
    this.envSky.material.uniforms.turbidity.value = this.sky.material.uniforms.turbidity.value;
    this.envSky.material.uniforms.rayleigh.value = this.sky.material.uniforms.rayleigh.value;
    this.sky.material.uniforms.time.value += dt;

    // key light: sun by day, a cool moon by night (fixed high bearing)
    const sunUp = smooth(-3, 6, alt);
    const moonDir = new Vector3(-0.35, 0.82, 0.45).normalize();
    const dir = new Vector3().copy(this.sunDir);
    if (dir.y < 0.08) dir.y = 0.08;
    dir.normalize().lerp(moonDir, 1 - sunUp).normalize();
    // shadow box: follow the focus, snapped to whole texels to avoid shimmering
    const ext = this.shadowExtent;
    const sc = this.sun.shadow.camera;
    if (sc.right !== ext) {
      sc.left = -ext;
      sc.right = ext;
      sc.top = ext;
      sc.bottom = -ext;
      sc.far = 900 + ext;
      sc.updateProjectionMatrix();
    }
    // snap the focus to whole shadow texels in light space
    const texel = (2 * ext) / this.sun.shadow.mapSize.x;
    const fwd = dir.clone();
    const right = new Vector3(0, 1, 0).cross(fwd);
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    right.normalize();
    const upv = new Vector3().crossVectors(fwd, right).normalize();
    const a = Math.round(this.shadowFocus.dot(right) / texel) * texel;
    const b = Math.round(this.shadowFocus.dot(upv) / texel) * texel;
    const c = this.shadowFocus.dot(fwd);
    this.target.position.copy(right.multiplyScalar(a)).addScaledVector(upv, b).addScaledVector(fwd, c);
    this.sun.position.copy(this.target.position).addScaledVector(dir, 420 + ext * 0.5);
    const warm = new Color(0xffa45c);
    const white = new Color(0xfff4e6);
    const moon = new Color(0x9db4ff);
    const sunCol = warm.clone().lerp(white, smooth(4, 30, alt));
    this.sun.color.copy(moon).lerp(sunCol, sunUp);
    this.sun.intensity = 0.22 * (1 - sunUp) + sunUp * (1.0 + 4.0 * smooth(0, 35, alt));
    this.sun.shadow.intensity = 0.35 + 0.65 * sunUp;

    // sky fill
    const skyDay = new Color(0xc3d2e4), skyGold = new Color(0xf0b88e), skyNight = new Color(0x1d2742);
    const gDay = new Color(0x9a8a70), gNight = new Color(0x0d0d12);
    this.hemi.color.copy(skyNight).lerp(skyDay, f.day).lerp(skyGold, f.golden * 0.55);
    this.hemi.groundColor.copy(gNight).lerp(gDay, f.day);
    this.hemi.intensity = 0.16 + 0.2 * f.day;

    // fog / haze tint follows the horizon
    const fogDay = new Color(0xc6d2df), fogGold = new Color(0xdcae8e), fogNight = new Color(0x161a26);
    this.fog.color.copy(fogNight).lerp(fogDay, f.day).lerp(fogGold, f.golden * 0.6);
    this.fog.density = 0.000085 + f.golden * 0.00005 + f.night * 0.00007;

    // night sky
    this.sky.material.uniforms.uNight.value = f.night;
    this.envSky.material.uniforms.uNight.value = f.night;
    (this.stars.material as PointsMaterial).opacity = Math.max(0, f.night - 0.25) * 1.2;
    this.stars.visible = f.night > 0.25;
    // keep the domes centred on the camera so they never clip
    this.sky.position.copy(cameraPos);
    this.stars.position.copy(cameraPos);

    // floodlights
    for (const s of this.floods) s.intensity = f.lights * 1.55;
    this.bowlFill.intensity = f.lights * 0.5;

    // exposure: open up at dusk and night outside; inside the lit bowl the eye
    // adapts to the floodlights, so close down again (like a camera would)
    const horiz = Math.hypot(cameraPos.x, cameraPos.z);
    const inside = (1 - smooth(95, 150, horiz)) * (1 - smooth(this.pitchElevation + 45, this.pitchElevation + 90, cameraPos.y));
    // darkness rises as soon as the sun is down, not only at full night: with
    // `night` alone civil twilight (sun 0…−6°) came out darker than midnight
    const dark = Math.max(f.night, 1 - smooth(-4, 4, alt));
    const nightOpen = dark * 0.3 * (1 - inside * f.lights) - inside * f.lights * 0.12;
    this.renderer.toneMappingExposure = 0.92 + f.golden * 0.12 * (1 - inside) + nightOpen;

    // environment map: regenerate when the sky changed enough (throttled)
    const now = performance.now();
    if ((Math.abs(alt - this.lastEnvAlt) > 0.8 && now - this.lastEnvTime > 1500) || this.envRT === null) {
      this.lastEnvAlt = alt;
      this.lastEnvTime = now;
      const rt = this.pmrem.fromScene(this.envScene, 0, 0.1, 2000);
      if (this.envRT) this.envRT.dispose();
      this.envRT = rt;
      this.scene.environment = rt.texture;
      // diffuse sky light stays well below the sun (clear-sky ratio ≈ 1:4)
      this.scene.environmentIntensity = 0.12 + 0.16 * f.day + f.lights * 0.08;
      for (const { m, k } of this.reflective) {
        const fresh = m.envMap === null;
        m.envMap = rt.texture;
        m.envMapIntensity = k * (0.45 + 0.55 * f.day);
        if (fresh) m.needsUpdate = true;
      }
    }
  }

  get sunDirection(): Vector3 {
    return this.sunDir;
  }
}

/**
 * Make three's Sky usable with a reversed depth buffer (it pins z to the far
 * plane, which is the *near* value in reversed-Z) and blend in the night sky
 * (Istanbul's orange light dome at the horizon) inside the same shader.
 */
function patchSky(sky: Sky): void {
  const m = sky.material;
  m.uniforms.uNight = { value: 0 };
  m.vertexShader = m.vertexShader.replace('gl_Position.z = gl_Position.w; // set z to camera.far', '');
  m.fragmentShader = m.fragmentShader
    .replace('uniform float time;', 'uniform float time;\nuniform float uNight;')
    .replace(
      'gl_FragColor = vec4( texColor, 1.0 );',
      `{
        vec3 nd = normalize( vWorldPosition - cameraPosition );
        float hh = clamp( nd.y, -0.2, 1.0 );
        vec3 nz = vec3( 0.010, 0.015, 0.035 );
        vec3 nh = vec3( 0.085, 0.095, 0.15 );
        vec3 glow = vec3( 0.13, 0.085, 0.06 ) * exp( -max( hh, 0.0 ) * 14.0 );
        vec3 nightC = mix( nh, nz, pow( max( hh, 0.0 ), 0.55 ) ) + glow;
        texColor = mix( texColor, nightC, uNight );
      }
      gl_FragColor = vec4( texColor, 1.0 );`,
    );
  m.depthTest = false;
  m.depthWrite = false;
  m.needsUpdate = true;
  sky.renderOrder = -10;
}

function makeStars(radius: number): Points {
  const n = 2200;
  const pos = new Float32Array(n * 3);
  let s = 99;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1;
    const th = r() * Math.PI * 2;
    const y = Math.abs(u) * 0.95 + 0.05;
    const rr = Math.sqrt(1 - y * y);
    pos[i * 3] = Math.cos(th) * rr * radius;
    pos[i * 3 + 1] = y * radius;
    pos[i * 3 + 2] = Math.sin(th) * rr * radius;
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  const m = new PointsMaterial({ color: 0xdfe6ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, fog: false });
  const p = new Points(g, m);
  p.frustumCulled = false;
  p.renderOrder = -1;
  return p;
}
