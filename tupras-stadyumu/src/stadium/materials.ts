import {
  Color,
  DoubleSide,
  FrontSide,
  BackSide,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Material,
} from 'three';
import { boardTexture, detailTexture, ledRibbonTexture, pitchTexture } from '../core/textures.ts';

/**
 * Shared stadium materials. One instance per material kind keeps the number
 * of shader programs small. `setAtmosphere` drives the parts that depend on
 * time of day (membrane translucency, suite interiors, LED boards).
 */
export class StadiumMaterials {
  readonly concrete: MeshStandardMaterial;
  readonly stone: MeshStandardMaterial;
  /** same stone for primitives without a colour attribute */
  readonly stonePlain: MeshStandardMaterial;
  readonly seat: MeshStandardMaterial;
  readonly seatDetail: MeshStandardMaterial;
  readonly steelWhite: MeshStandardMaterial;
  readonly steelDark: MeshStandardMaterial;
  readonly membraneTop: MeshStandardMaterial;
  readonly membraneUnder: MeshStandardMaterial;
  readonly glass: MeshStandardMaterial;
  readonly suiteInterior: MeshStandardMaterial;
  readonly grass: MeshStandardMaterial;
  readonly runoff: MeshStandardMaterial;
  readonly led: MeshBasicMaterial;
  readonly boards: MeshBasicMaterial;
  readonly floodlight: MeshBasicMaterial;
  readonly netting: MeshStandardMaterial;
  readonly dark: MeshStandardMaterial;
  readonly screen: MeshBasicMaterial;

  constructor() {
    const concreteMap = detailTexture('concrete');
    const stoneMap = detailTexture('stone');
    const membraneMap = detailTexture('membrane');

    this.concrete = new MeshStandardMaterial({
      color: 0xb4b2ac,
      map: concreteMap,
      roughness: 0.92,
      metalness: 0,
      vertexColors: true,
    });
    this.stone = new MeshStandardMaterial({
      color: 0xe2d6bd,
      map: stoneMap,
      roughness: 0.78,
      metalness: 0,
      vertexColors: true,
    });
    this.stonePlain = new MeshStandardMaterial({ color: 0xe2d6bd, map: stoneMap, roughness: 0.78, metalness: 0 });
    this.addUplight(this.stone);
    this.addUplight(this.stonePlain);
    // seats: white base so instanceColor carries the black/white pattern
    this.seat = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0.0 });
    this.seatDetail = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0.0 });
    this.steelWhite = new MeshStandardMaterial({ color: 0xe9e9e6, roughness: 0.45, metalness: 0.35, vertexColors: true });
    this.steelDark = new MeshStandardMaterial({ color: 0x45484c, roughness: 0.5, metalness: 0.55, vertexColors: true });
    this.membraneTop = new MeshStandardMaterial({
      color: 0xf6f5f0,
      map: membraneMap,
      roughness: 0.8,
      metalness: 0,
      side: FrontSide,
      vertexColors: true,
      emissive: new Color(0xe4ebff),
      emissiveIntensity: 0,
    });
    // PTFE lets ~12 % of daylight through: the underside glows softly by day
    this.membraneUnder = new MeshStandardMaterial({
      color: 0xf1f0ea,
      map: membraneMap,
      roughness: 0.9,
      metalness: 0,
      side: BackSide,
      emissive: new Color(0xfff8ec),
      emissiveIntensity: 0.25,
      vertexColors: true,
    });
    this.glass = new MeshStandardMaterial({
      color: 0x1b252c,
      roughness: 0.06,
      metalness: 0.92,
      envMapIntensity: 1.2,
    });
    this.suiteInterior = new MeshStandardMaterial({
      color: 0x3a3532,
      roughness: 0.8,
      emissive: new Color(0xffd9a8),
      emissiveIntensity: 0.0,
      vertexColors: true,
    });
    this.grass = new MeshStandardMaterial({ map: pitchTexture(), roughness: 0.95, metalness: 0 });
    this.runoff = new MeshStandardMaterial({ color: 0x2f3a2c, roughness: 0.95 });
    const led = ledRibbonTexture();
    this.led = new MeshBasicMaterial({ map: led, color: 0xffffff, toneMapped: true });
    this.boards = new MeshBasicMaterial({ map: boardTexture(), color: 0xffffff });
    this.floodlight = new MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    this.netting = new MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: 0.45,
      side: DoubleSide,
      depthWrite: false,
    });
    this.dark = new MeshStandardMaterial({ color: 0x141416, roughness: 0.95, vertexColors: true });
    this.screen = new MeshBasicMaterial({ color: 0x111214 });
  }

  /**
   * @param daylight 0 (night) … 1 (full day)
   * @param lights   0 … 1 stadium lighting on
   */
  private readonly uUplight = { value: 0 };

  /** Night uplighting on the stone: strongest at the base, fading upwards. */
  private addUplight(m: MeshStandardMaterial): void {
    const u = this.uUplight;
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uUplight = u;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vLocalY;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocalY = position.y;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uUplight;\nvarying float vLocalY;')
        .replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uUplight * vec3(1.0, 0.92, 0.8) * diffuseColor.rgb * (0.18 + 0.82 * exp(-max(vLocalY, 0.0) / 10.0));',
        );
    };
    m.customProgramCacheKey = () => 'uplight-' + m.uuid;
  }

  /**
   * Seat-map overview: the PTFE membrane turns see-through (k = 1) so all four
   * stands show from above. It keeps casting its shadow, and as a transparent
   * material the ID pass skips it, so seats under it can be hovered and picked.
   */
  setRoofXray(k: number): void {
    const on = k > 0.002;
    for (const m of [this.membraneTop, this.membraneUnder]) {
      if (m.transparent !== on) {
        m.transparent = on;
        m.depthWrite = !on;
        m.needsUpdate = true;
      }
      m.opacity = 1 - 0.84 * k;
    }
  }

  setAtmosphere(daylight: number, lights: number): void {
    this.uUplight.value = lights * (1 - daylight) * 0.9;
    this.membraneTop.emissiveIntensity = lights * (1 - daylight) * 0.18;
    this.membraneUnder.emissiveIntensity = 0.06 + daylight * 0.28 + lights * 0.12;
    this.suiteInterior.emissiveIntensity = 0.15 + (1 - daylight) * 0.85;
    const ledLevel = 0.75 + (1 - daylight) * 0.6;
    this.led.color.setScalar(ledLevel);
    this.boards.color.setScalar(ledLevel);
    this.floodlight.color.setScalar(0.35 + lights * 9.0);
  }

  all(): Material[] {
    return Object.values(this).filter((m): m is Material => (m as Material)?.isMaterial === true);
  }
}
