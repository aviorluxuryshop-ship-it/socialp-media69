/**
 * The roof graphics as seen from the air: the club crest and BEŞİKTAŞ over
 * the north (Maçka) end, the naming sponsor's mark and wordmark along both
 * long sides and the black eagle over the Eski Açık end.
 *
 * They are painted in plan (top-down) coordinates, so from above they read
 * exactly like the aerial photographs — the membrane's own UVs follow the
 * ring and would squeeze every letter towards the inner edge. All lettering
 * runs clockwise round the ring (seen from above) with its top towards the
 * outside, as on the real roof.
 *
 * The sponsor mark is a simplified red ring drawn for the presentation, not
 * the company's artwork; swap `drawSponsorMark` for the supplied logo.
 */
import { CanvasTexture, SRGBColorSpace, Vector4, type MeshStandardMaterial } from 'three';
import { Superellipse } from './shape.ts';

/** Plan rectangle the texture covers (stadium frame, metres). */
export const ROOF_DECAL_RECT = { x0: -108, z0: -82, w: 216, h: 164 };
const RES = 2048; // px across x
const PX = RES / ROOF_DECAL_RECT.w;
/** Middle line of the membrane ring (between the inner edge and the outer ring). */
const MID = new Superellipse(82.6, 59.1, 3.1);

const INK = '#16181c';
const RED = '#e2241b';

type Ctx = CanvasRenderingContext2D;

function toPx(x: number, z: number): [number, number] {
  return [(x - ROOF_DECAL_RECT.x0) * PX, (z - ROOF_DECAL_RECT.z0) * PX];
}

/**
 * Run a drawing in the local frame of the ring at arc position s (metres
 * along MID): +x along the ring (clockwise from above), −y outwards, 1 unit = 1 m.
 */
function at(ctx: Ctx, s: number, draw: (ctx: Ctx) => void): void {
  const t = MID.tAt(s);
  const p = MID.point(t);
  const q = MID.point(MID.tAt(s + 0.5));
  const [px, py] = toPx(p.x, p.z);
  const ang = Math.atan2(q.z - p.z, q.x - p.x);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(ang);
  ctx.scale(PX, PX);
  draw(ctx);
  ctx.restore();
}

interface RunItem {
  /** width along the ring, metres */
  w: number;
  draw: (ctx: Ctx) => void;
}

/** Lay items one after another along the ring, centred on polar angle t. */
function layRun(ctx: Ctx, t: number, items: RunItem[]): void {
  const total = items.reduce((a, it) => a + it.w, 0);
  let s = MID.arcAt(t) - total / 2;
  for (const it of items) {
    at(ctx, s + it.w / 2, it.draw);
    s += it.w;
  }
}

/** Letters as run items (each glyph turns with the ring). */
function letters(ctx: Ctx, text: string, size: number, font: string, color: string, tracking: number): RunItem[] {
  ctx.font = `${font} ${size}px ${'Inter, Helvetica, Arial, sans-serif'}`;
  return [...text].map((ch) => {
    const w = ctx.measureText(ch).width + size * tracking;
    return {
      w,
      draw: (c) => {
        c.font = `${font} ${size}px Inter, Helvetica, Arial, sans-serif`;
        c.fillStyle = color;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(ch, 0, size * 0.04);
        // the roof lettering is a heavy geometric sans: thicken the 600 cut
        c.strokeStyle = color;
        c.lineWidth = size * 0.055;
        c.lineJoin = 'round';
        c.strokeText(ch, 0, size * 0.04);
      },
    };
  });
}

function gap(w: number): RunItem {
  return { w, draw: () => {} };
}

/** A rounded red ring open at the top: the sponsor mark, simplified. */
function drawSponsorMark(c: Ctx, size: number): void {
  const r = size * 0.5;
  c.save();
  c.strokeStyle = RED;
  c.lineWidth = size * 0.16;
  c.lineCap = 'round';
  c.beginPath();
  // a soft heart / drop: two shoulders and a rounded point towards the inside
  c.moveTo(-r * 0.12, -r * 0.62);
  c.bezierCurveTo(-r * 0.55, -r * 1.02, -r * 1.12, -r * 0.55, -r * 0.82, r * 0.02);
  c.bezierCurveTo(-r * 0.6, r * 0.45, -r * 0.22, r * 0.72, 0, r * 0.86);
  c.bezierCurveTo(r * 0.22, r * 0.72, r * 0.6, r * 0.45, r * 0.82, r * 0.02);
  c.bezierCurveTo(r * 1.12, -r * 0.55, r * 0.55, -r * 1.02, r * 0.12, -r * 0.62);
  c.stroke();
  c.restore();
}

/** The black eagle, wings spread; head towards +y (the pitch), tail towards −y (outside). */
function drawEagle(c: Ctx, span: number): void {
  const k = span / 2;
  c.save();
  c.scale(k, k);
  c.fillStyle = INK;
  // wings: leading edge from the shoulders out to the tips, primaries as fingers,
  // trailing edge back to the body
  for (const side of [-1, 1]) {
    c.save();
    c.scale(side, 1);
    c.beginPath();
    c.moveTo(0.06, 0.12);
    c.bezierCurveTo(0.3, 0.2, 0.62, 0.1, 0.86, -0.1);
    // primaries: five fingers fanning outwards
    const tips = [
      [1.0, -0.22],
      [0.98, -0.36],
      [0.92, -0.48],
      [0.82, -0.58],
      [0.7, -0.64],
    ];
    let prev: number[] = [0.86, -0.1];
    for (const [tx, tz] of tips) {
      c.lineTo(tx, tz);
      const back = [prev[0] * 0.15 + tx * 0.85 - 0.08, prev[1] * 0.15 + tz * 0.85 + 0.02];
      c.lineTo(back[0], back[1]);
      prev = [tx, tz];
    }
    // trailing edge with secondary feathers
    const sec = 6;
    for (let i = 1; i <= sec; i++) {
      const f = i / sec;
      const x = 0.62 * (1 - f) + 0.1 * f;
      const z = -0.58 * (1 - f) - 0.2 * f;
      c.lineTo(x + 0.03, z - 0.07);
      c.lineTo(x, z);
    }
    c.lineTo(0.06, -0.12);
    c.closePath();
    c.fill();
    c.restore();
  }
  // body
  c.beginPath();
  c.ellipse(0, -0.02, 0.13, 0.32, 0, 0, Math.PI * 2);
  c.fill();
  // tail fan towards the outside
  c.beginPath();
  c.moveTo(-0.07, -0.26);
  c.lineTo(-0.16, -0.62);
  c.lineTo(-0.05, -0.56);
  c.lineTo(0, -0.66);
  c.lineTo(0.05, -0.56);
  c.lineTo(0.16, -0.62);
  c.lineTo(0.07, -0.26);
  c.closePath();
  c.fill();
  // white head and a yellow beak towards the pitch
  c.fillStyle = '#f2f1ec';
  c.beginPath();
  c.ellipse(0, 0.34, 0.1, 0.13, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#e8b21c';
  c.beginPath();
  c.moveTo(-0.04, 0.44);
  c.quadraticCurveTo(0, 0.58, 0.06, 0.48);
  c.lineTo(0.035, 0.43);
  c.closePath();
  c.fill();
  c.restore();
}

/** The cushions' ring seams: the membrane is made of panels in rows round the ring. */
function drawSeams(ctx: Ctx): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(118, 124, 136, 0.42)';
  ctx.lineWidth = 0.32 * PX;
  for (const f of [0.3, 0.6]) {
    const ring = new Superellipse(59.2 + (106.1 - 59.2) * f, 38.6 + (79.6 - 38.6) * f, 3.4 + (2.85 - 3.4) * f, 1024);
    ctx.beginPath();
    for (let i = 0; i <= 720; i++) {
      const p = ring.point((i / 720) * Math.PI * 2);
      const [x, y] = toPx(p.x, p.z);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function paint(canvas: HTMLCanvasElement, crest: HTMLImageElement | null): void {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSeams(ctx);

  // north end (−X, Maçka side): crest + BEŞİKTAŞ
  const crestItem: RunItem = {
    w: 14,
    draw: (c) => {
      if (!crest) return;
      const h = 18;
      const w = h * (crest.naturalWidth / crest.naturalHeight || 0.6);
      c.drawImage(crest, -w / 2, -h / 2, w, h);
    },
  };
  layRun(ctx, Math.PI, [crestItem, gap(4), ...letters(ctx, 'BEŞİKTAŞ', 16.5, '600', INK, 0.07)]);

  // long sides: the sponsor mark, then the wordmark
  const markItem: RunItem = { w: 16, draw: (c) => drawSponsorMark(c, 14.5) };
  for (const t of [Math.PI / 2, (3 * Math.PI) / 2]) {
    layRun(ctx, t, [markItem, gap(5), ...letters(ctx, 'Tüpraş', 20, '600', INK, 0.03)]);
  }

  // south end (+X, Eski Açık): the eagle, head towards the pitch
  layRun(ctx, 0, [{ w: 54, draw: (c) => drawEagle(c, 54) }]);
}

/** Texture with the roof graphics; repainted once the web font and the crest have loaded. */
export function createRoofDecal(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = RES;
  canvas.height = Math.round(ROOF_DECAL_RECT.h * PX);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.flipY = false;
  tex.anisotropy = 4;
  let crest: HTMLImageElement | null = null;
  const repaint = () => {
    paint(canvas, crest);
    tex.needsUpdate = true;
  };
  repaint();
  const img = new Image();
  img.onload = () => {
    crest = img;
    repaint();
  };
  img.src = './brand/bjk-logo.svg';
  document.fonts?.load('600 100px Inter').then(repaint, () => {});
  return tex;
}

/** Print the decal onto the membrane's top surface (and keep it dark at night). */
export function applyRoofDecal(mat: MeshStandardMaterial, tex: CanvasTexture): void {
  const r = ROOF_DECAL_RECT;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uDecal = { value: tex };
    sh.uniforms.uDecalRect = { value: new Vector4(r.x0, r.z0, 1 / r.w, 1 / r.h) };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform vec4 uDecalRect;\nvarying vec2 vDecalUv;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvDecalUv = ((modelMatrix * vec4(transformed, 1.0)).xz - uDecalRect.xy) * uDecalRect.zw;',
      );
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uDecal;\nvarying vec2 vDecalUv;')
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\nvec4 roofDecal = texture2D(uDecal, vDecalUv);\ndiffuseColor.rgb = mix(diffuseColor.rgb, roofDecal.rgb, roofDecal.a);',
      )
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= 1.0 - 0.85 * roofDecal.a;');
  };
  mat.customProgramCacheKey = () => 'roof-decal';
}
