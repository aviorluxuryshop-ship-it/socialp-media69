/**
 * Highlight compositing (STEP 04) — the choice is made in post.
 *
 * Inputs: the rendered image (linear HDR, before tone mapping) and the ID
 * mask of the same frame. For pixels of the selected block's seats the
 * shading is recovered by dividing the pixel by that seat's own albedo and
 * re-multiplied by the orange albedo, so lighting, shadows and occlusion stay
 * exactly as rendered; reflections are kept on top. Everything else is left
 * untouched (black and white). Sold seats stay grey.
 *
 * Mode 1 shows the mask itself: the selected block in red.
 */
import { Color, Vector2, Vector3, type Texture } from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SEAT_COLORS } from '../stadium/config.ts';
import { ID_BLOCK, ID_STRUCTURE } from './idpass.ts';

const lin = (hex: number) => {
  const c = new Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
};

export function createHighlightPass(idTex: Texture, info: Texture): ShaderPass {
  const orange = new Color(0xff7a1a);
  const pass = new ShaderPass({
    name: 'HighlightPass',
    uniforms: {
      tDiffuse: { value: null },
      tId: { value: idTex },
      tInfo: { value: info },
      uRes: { value: new Vector2(1, 1) },
      uBlock: { value: -1 },
      uHoverSeat: { value: -1 },
      uSelSeat: { value: -1 },
      uHoverBlock: { value: -1 },
      uMode: { value: 0 },
      uTime: { value: 0 },
      uOrange: { value: new Vector3(orange.r, orange.g, orange.b) },
      uAlbedo: { value: new Vector3(lin(SEAT_COLORS.white), lin(SEAT_COLORS.black), lin(SEAT_COLORS.vip)) },
      uSoldLum: { value: lin(SEAT_COLORS.sold) },
      uAvailability: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform sampler2D tId;
      uniform sampler2D tInfo;
      uniform vec2 uRes;
      uniform float uBlock, uHoverSeat, uSelSeat, uHoverBlock, uMode, uTime, uSoldLum, uAvailability;
      uniform vec3 uOrange, uAlbedo;
      varying vec2 vUv;

      float decodeId(vec4 c) {
        vec3 b = floor(c.rgb * 255.0 + 0.5);
        return b.r + b.g * 256.0 + b.b * 65536.0;
      }
      // returns (kind, seat, block): kind 0 world, 1 seat, 2 terrace, 3 structure
      vec3 classify(float id, out vec2 meta) {
        meta = vec2(0.0);
        if (id >= ${ID_BLOCK.toFixed(1)}) return vec3(2.0, -1.0, id - ${ID_BLOCK.toFixed(1)});
        if (id >= ${ID_STRUCTURE.toFixed(1)}) return vec3(3.0, -1.0, -1.0);
        if (id >= 1.0) {
          float seat = id - 1.0;
          ivec2 tc = ivec2(int(mod(seat, 256.0)), int(floor(seat / 256.0)));
          vec4 inf = texelFetch(tInfo, tc, 0);
          meta = vec2(floor(inf.r * 255.0 + 0.5), floor(inf.g * 255.0 + 0.5));
          float block = floor(inf.b * 255.0 + 0.5) + floor(inf.a * 255.0 + 0.5) * 256.0;
          return vec3(1.0, seat, block);
        }
        return vec3(0.0, -1.0, -1.0);
      }
      float blockAt(vec2 uv) {
        vec2 m;
        vec3 k = classify(decodeId(texture2D(tId, uv)), m);
        return k.z;
      }
      float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

      void main() {
        vec4 beauty = texture2D(tDiffuse, vUv);
        vec2 meta;
        vec3 k = classify(decodeId(texture2D(tId, vUv)), meta);
        float kind = k.x, seat = k.y, block = k.z;

        if (uMode > 0.5) {
          // ---- mask view: what the compositor sees
          vec3 c = vec3(0.0);
          if (kind > 2.5) c = vec3(0.10);
          else if (kind > 1.5) c = vec3(0.16 + 0.12 * fract(block * 0.618));
          else if (kind > 0.5) c = vec3(0.34 + 0.22 * fract(block * 0.618));
          if (block == uBlock && kind > 0.5 && kind < 2.5) c = kind > 1.5 ? vec3(0.45, 0.0, 0.02) : vec3(0.89, 0.04, 0.09);
          if (seat == uSelSeat && seat >= 0.0) c = vec3(1.0);
          gl_FragColor = vec4(c, 1.0);
          return;
        }

        vec3 col = beauty.rgb;
        bool inSel = block == uBlock && uBlock >= 0.0;
        if (kind > 0.5 && kind < 1.5) {
          float shade = meta.x;
          bool sold = meta.y > 0.5 && uAvailability > 0.5;
          float alb = shade < 0.5 ? uAlbedo.x : (shade < 1.5 ? uAlbedo.y : uAlbedo.z);
          if (sold) alb = uSoldLum;
          float L = lum(col);
          // recover the light that reached this seat, then re-light it in orange
          float shading = min(L / max(alb, 0.004), 5.0);
          // keep a part of the original highlights (specular reflections)
          vec3 spec = max(col - vec3(alb * shading), vec3(0.0));
          // slightly below the original brightness keeps the orange saturated after tone mapping;
          // a faint constant glow keeps a far block readable
          if (inSel && !sold) col = mix(col, uOrange * (shading * 0.82 + 0.1) + spec * 0.5, 0.96);
          if (block == uHoverBlock && !inSel && uHoverBlock >= 0.0 && !sold) col = mix(col, uOrange * shading, 0.35);
          if (seat == uHoverSeat && seat >= 0.0) col = mix(col, vec3(1.0, 0.86, 0.6) * max(shading, 0.6) * 1.4, 0.85);
          if (seat == uSelSeat && seat >= 0.0) {
            float pulse = 0.75 + 0.25 * sin(uTime * 5.0);
            col = vec3(1.0, 0.45, 0.08) * max(shading, 0.8) * (1.6 + pulse);
          }
        }
        // thin outline around the selected block (seats + terraces)
        if (uBlock >= 0.0 && (kind > 0.5 && kind < 2.5)) {
          vec2 px = 1.0 / uRes;
          float here = inSel ? 1.0 : 0.0;
          float n = 0.0;
          n += blockAt(vUv + vec2(px.x, 0.0)) == uBlock ? 1.0 : 0.0;
          n += blockAt(vUv - vec2(px.x, 0.0)) == uBlock ? 1.0 : 0.0;
          n += blockAt(vUv + vec2(0.0, px.y)) == uBlock ? 1.0 : 0.0;
          n += blockAt(vUv - vec2(0.0, px.y)) == uBlock ? 1.0 : 0.0;
          if (here > 0.5 && n < 3.5) col = mix(col, uOrange * max(lum(beauty.rgb) * 2.0, 0.6), 0.85);
        }
        gl_FragColor = vec4(col, beauty.a);
      }`,
  });
  // ShaderPass clones its uniforms: render-target textures become null and data
  // textures become copies, so bind the live textures after construction
  pass.uniforms.tId.value = idTex;
  pass.uniforms.tInfo.value = info;
  return pass;
}
