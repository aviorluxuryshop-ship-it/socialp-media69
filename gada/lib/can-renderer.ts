import { CAN_META } from './can-meta'

/**
 * Kutuyu dört gerçek fotoğraftan çizen küçük bir WebGL çizicisi.
 *
 * Etiket bir silindirin üzerinde kayar, ışık ise ekrana sabittir: her görünümün
 * sütun sütun ölçülmüş ışığı (`isik.png`) bölünüp çıkarılır, etiket döndürülür,
 * sonra aynı stüdyo ışığı yeniden uygulanır. Kutuya en yakın bakan fotoğraf
 * önceliklidir; bu yüzden kutu bir görünümde dururken çıktı fotoğrafın aynısıdır.
 * Ambalaj yeniden çizilmez.
 */

export type Frame = {
  /** Kutu merkezi, CSS pikseli */
  cx: number
  cy: number
  /** Kutu yüksekliği, CSS pikseli */
  h: number
  phi: number
  /** 0 şeftali, 1 limon */
  mix: number
  opacity: number
  /** Ortam rengi 0..1 */
  env: [number, number, number]
  /** İmleç, -1..1 */
  mx: number
  my: number
  /** Işıma ve gölgenin görünürlüğü (açılışta yavaşça gelir) */
  ambient: number
}

const VERT = `
attribute vec2 a_pos;
uniform vec4 u_rect;      // x, y, w, h (CSS px, sol üst köşe)
uniform vec2 u_view;      // görüntü alanı (CSS px)
varying vec2 v_uv;
void main() {
  v_uv = a_pos;
  vec2 p = u_rect.xy + a_pos * u_rect.zw;
  gl_Position = vec4(p.x / u_view.x * 2.0 - 1.0, 1.0 - p.y / u_view.y * 2.0, 0.0, 1.0);
}
`

const CAN_FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_atlas0;
uniform sampler2D u_atlas1;
uniform sampler2D u_light;
uniform float u_phi;
uniform float u_mix;
uniform float u_alpha;
uniform vec3 u_env;
uniform vec2 u_mouse;
uniform float u_half;

float sstep(float a, float b, float x) {
  float t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

vec2 lightAt(float row, float x) {
  vec4 t = texture2D(u_light, vec2(x, (row + 0.5) / 8.0));
  return vec2(t.r * 1.5, t.g * (100.0 / 255.0));
}

vec4 cell(sampler2D atlas, float slot, vec2 uv) {
  return texture2D(atlas, vec2((slot + clamp(uv.x, 0.003, 0.997)) * 0.25, uv.y));
}

vec3 product(sampler2D atlas, float prow, vec2 uv, float rw, float lam, float k) {
  // ekrana sabit stüdyo ışığı: kameraya yakın görünümlerin ışığının karışımı
  vec2 lref = vec2(0.0);
  float lw = 0.0;
  for (int i = -1; i <= 1; i++) {
    float sl = k + float(i);
    float c = max(0.0, 1.0 - abs(u_phi - 90.0 * sl) / 90.0);
    c = c * c * (3.0 - 2.0 * c);
    lref += c * lightAt(prow + mod(sl, 4.0), uv.x);
    lw += c;
  }
  lref /= max(lw, 1e-4);

  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for (int i = -1; i <= 1; i++) {
    float sl = k + float(i);
    float cw = max(0.0, 1.0 - abs(u_phi - 90.0 * sl) / 100.0);
    cw = cw * cw * cw;
    float thk = lam - 90.0 * sl;
    float w = cw * sstep(89.0, 72.0, abs(thk)) + cw * 1e-4;
    if (w <= 0.0) continue;
    float slot = mod(sl, 4.0);
    float xs = 0.5 + u_half * sin(radians(clamp(thk, -89.0, 89.0)));
    xs = mix(uv.x, xs, rw);
    vec3 c = cell(atlas, slot, vec2(xs, uv.y)).rgb;
    vec2 ls = lightAt(prow + slot, xs);
    vec3 albedo = (c - ls.y) / max(ls.x, 0.2);
    vec3 lit = albedo * lref.x + lref.y;
    acc += w * mix(c, lit, rw);
    wsum += w;
  }
  return acc / max(wsum, 1e-5);
}

void main() {
  vec2 uv = v_uv;
  float rw = sstep(0.030, 0.060, uv.y) * sstep(0.955, 0.943, uv.y);
  float s = clamp((uv.x - 0.5) / u_half, -0.9999, 0.9999);
  float lam = degrees(asin(s)) + u_phi * rw;
  float k = floor(u_phi / 90.0 + 0.5);

  vec3 col;
  float a = cell(u_atlas0, mod(k, 4.0), uv).a;
  if (u_mix < 0.001) {
    col = product(u_atlas0, 0.0, uv, rw, lam, k);
  } else if (u_mix > 0.999) {
    col = product(u_atlas1, 4.0, uv, rw, lam, k);
  } else {
    col = mix(product(u_atlas0, 0.0, uv, rw, lam, k), product(u_atlas1, 4.0, uv, rw, lam, k), u_mix);
  }

  // imlece hafifçe eşlik eden ikinci bir yumuşak parlama
  float hx = 0.29 + u_mouse.x * 0.035;
  float sheen = exp(-pow((uv.x - hx) / 0.045, 2.0)) * (0.045 + 0.02 * u_mouse.y) * rw;
  col += vec3(sheen);
  // kenarlarda ortamın rengini çok az yansıt
  float edge = sstep(0.8, 1.0, abs(s));
  col = mix(col, u_env, edge * 0.14);

  a *= u_alpha;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0) * a, a);
}
`

const SHADOW_FRAG = `
precision mediump float;
varying vec2 v_uv;
uniform float u_alpha;
uniform vec3 u_tint;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 p = (v_uv - 0.5) * 2.0;
  float contact = exp(-(pow(p.x / 0.36, 2.0) + pow(p.y / 0.11, 2.0)) * 1.4) * 0.34;
  float soft = exp(-(pow(p.x / 0.85, 2.0) + pow(p.y / 0.42, 2.0)) * 2.2) * 0.14;
  float a = (contact + soft) * u_alpha;
  a = max(0.0, a + (hash(gl_FragCoord.xy) - 0.5) / 255.0);
  vec3 c = mix(vec3(0.16, 0.10, 0.06), u_tint * 0.45, 0.35);
  gl_FragColor = vec4(c * a, a);
}
`

const GLOW_FRAG = `
precision mediump float;
varying vec2 v_uv;
uniform float u_alpha;
uniform vec3 u_tint;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 p = (v_uv - 0.5) * 2.0;
  float r = length(p);
  float a = exp(-r * r * 2.6) * smoothstep(1.0, 0.45, r) * 0.15 * u_alpha;
  // 8 bitlik yumuşak geçişlerde halka oluşmasın diye hafif titreşim
  a = max(0.0, a + (hash(gl_FragCoord.xy) - 0.5) / 255.0);
  gl_FragColor = vec4(u_tint * a, a);
}
`

const PEACH: [number, number, number] = [0.93, 0.44, 0.06]
const LEMON: [number, number, number] = [0.95, 0.8, 0.05]

type Program = { prog: WebGLProgram; loc: Record<string, WebGLUniformLocation | null> }

function compile(gl: WebGLRenderingContext, vs: string, fs: string, uniforms: string[]): Program {
  const make = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader')
    return sh
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, make(gl.VERTEX_SHADER, vs))
  gl.attachShader(prog, make(gl.FRAGMENT_SHADER, fs))
  gl.bindAttribLocation(prog, 0, 'a_pos')
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link')
  const loc: Program['loc'] = {}
  for (const u of ['u_rect', 'u_view', ...uniforms]) loc[u] = gl.getUniformLocation(prog, u)
  return { prog, loc }
}

async function loadImage(src: string): Promise<TexImageSource> {
  const res = await fetch(src)
  if (!res.ok) throw new Error(src)
  const blob = await res.blob()
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' })
    } catch {
      /* eski Safari: aşağıdaki yola düş */
    }
  }
  const img = new Image()
  img.src = URL.createObjectURL(blob)
  await img.decode()
  return img
}

export class CanRenderer {
  private gl: WebGLRenderingContext
  private isGL2: boolean
  private can: Program
  private shadow: Program
  private glow: Program
  private tex: (WebGLTexture | null)[] = [null, null, null]
  private w = 0
  private h = 0
  private dpr = 1
  readonly quality: 'hd' | 'sd'

  static create(canvas: HTMLCanvasElement, quality: 'hd' | 'sd'): CanRenderer | null {
    const opts: WebGLContextAttributes = {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    }
    const gl2 = canvas.getContext('webgl2', opts) as WebGL2RenderingContext | null
    const gl = gl2 ?? (canvas.getContext('webgl', opts) as WebGLRenderingContext | null)
    if (!gl) return null
    try {
      return new CanRenderer(gl, !!gl2, quality)
    } catch (err) {
      console.warn('[GADA] WebGL başlatılamadı', err)
      return null
    }
  }

  private constructor(gl: WebGLRenderingContext, isGL2: boolean, quality: 'hd' | 'sd') {
    this.gl = gl
    this.isGL2 = isGL2
    this.quality = quality
    this.can = compile(gl, VERT, CAN_FRAG, [
      'u_atlas0', 'u_atlas1', 'u_light', 'u_phi', 'u_mix', 'u_alpha', 'u_env', 'u_mouse', 'u_half',
    ])
    this.shadow = compile(gl, VERT, SHADOW_FRAG, ['u_alpha', 'u_tint'])
    this.glow = compile(gl, VERT, GLOW_FRAG, ['u_alpha', 'u_tint'])
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
  }

  private upload(i: number, img: TexImageSource, mip: boolean) {
    const gl = this.gl
    const t = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    // WebGL1'de kare olmayan dokularda mipmap yok; doğrusal süzme yeterli
    if (mip && this.isGL2) {
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    }
    this.tex[i] = t
  }

  /** Önce şeftali ve ışık, ardından limon yüklenir. */
  async load(onFirst?: () => void) {
    const q = this.quality
    const [light, peach] = await Promise.all([loadImage('/can/isik.png'), loadImage(`/can/seftali-${q}.webp`)])
    this.upload(2, light, false)
    this.upload(0, peach, true)
    onFirst?.()
    const lemon = await loadImage(`/can/limon-${q}.webp`)
    this.upload(1, lemon, true)
  }

  get ready() {
    return !!this.tex[0] && !!this.tex[2]
  }

  get lemonReady() {
    return !!this.tex[1]
  }

  resize(w: number, h: number, dpr: number) {
    const canvas = this.gl.canvas as HTMLCanvasElement
    this.w = w
    this.h = h
    this.dpr = dpr
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
  }

  private quad(p: Program, x: number, y: number, w: number, h: number) {
    const gl = this.gl
    gl.uniform4f(p.loc.u_rect, x, y, w, h)
    gl.uniform2f(p.loc.u_view, this.w, this.h)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  render(f: Frame) {
    const gl = this.gl
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    if (!this.ready || f.opacity < 0.002) return

    const mix = this.lemonReady ? f.mix : 0
    const tint: [number, number, number] = [
      PEACH[0] + (LEMON[0] - PEACH[0]) * mix,
      PEACH[1] + (LEMON[1] - PEACH[1]) * mix,
      PEACH[2] + (LEMON[2] - PEACH[2]) * mix,
    ]
    const cw = f.h * CAN_META.aspect
    const top = f.cy - f.h / 2
    const left = f.cx - cw / 2

    // 1. arka ışıma
    gl.useProgram(this.glow.prog)
    gl.uniform1f(this.glow.loc.u_alpha, f.opacity * f.ambient)
    gl.uniform3fv(this.glow.loc.u_tint, tint)
    this.quad(this.glow, f.cx - f.h * 0.75, f.cy - f.h * 0.72, f.h * 1.5, f.h * 1.44)

    // 2. temas gölgesi
    gl.useProgram(this.shadow.prog)
    gl.uniform1f(this.shadow.loc.u_alpha, f.opacity * f.ambient)
    gl.uniform3fv(this.shadow.loc.u_tint, tint)
    const sw = cw * 2.3
    const sh = cw * 0.42
    this.quad(this.shadow, f.cx - sw / 2, top + f.h * 0.992 - sh / 2, sw, sh)

    // 3. kutu
    const p = this.can
    gl.useProgram(p.prog)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.tex[0])
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.tex[1] ?? this.tex[0])
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.tex[2])
    gl.uniform1i(p.loc.u_atlas0, 0)
    gl.uniform1i(p.loc.u_atlas1, 1)
    gl.uniform1i(p.loc.u_light, 2)
    gl.uniform1f(p.loc.u_phi, f.phi)
    gl.uniform1f(p.loc.u_mix, mix)
    gl.uniform1f(p.loc.u_alpha, f.opacity)
    gl.uniform3fv(p.loc.u_env, f.env)
    gl.uniform2f(p.loc.u_mouse, f.mx, f.my)
    gl.uniform1f(p.loc.u_half, CAN_META.bodyHalfUV)
    this.quad(p, left, top, cw, f.h)
  }

  dispose() {
    const gl = this.gl
    this.tex.forEach((t) => t && gl.deleteTexture(t))
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}
