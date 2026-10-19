/**
 * Poz motoru — tarayıcı (DOM) tarafı. Saf mantık lib/pose/*.ts içindedir; burada yalnızca MediaPipe ve <video> var.
 *
 * GİZLİLİK: Video hiçbir yere gönderilmez. MediaPipe wasm dosyaları (public/mediapipe/wasm) ve modeller
 * (public/models) aynı sunucudan yüklenir; CDN yoktur. Çıkarım tarayıcıda, CPU (varsayılan) ya da isteğe bağlı GPU ile
 * yapılır.
 *
 * ÇALIŞMA ŞEKLİ
 *  • <video> deterministik adımlarla gezilir: her örnek için currentTime ayarlanır, 'seeked' beklenir, kare
 *    detectForVideo ile işlenir. Zaman damgaları (ms) tüm oturum boyunca tekdüze artar (MediaPipe şartı).
 *  • Her karede TÜM kişiler (numPoses ≤ 5) saklanır; oyuncu seçimi/izleme sonradan, saf modüllerde yapılır
 *    (seçim değişirse video yeniden işlenmez).
 *  • Her kare arasında arayüze nefes aldırılır (setTimeout 0). Tek bir kare çıkarımı CPU'da ~150–500 ms sürer ve o sırada
 *    ana iş parçacığı meşguldür; iptal kareler arasında denetlenir. Sekme gizlenirse tarayıcı zamanlayıcıları kısıtlar:
 *    analiz sürerken sekmeyi açık tutun.
 *  • Büyük videolar (uzun kenar > maxSide) küçültülmüş bir tuvale çizilip işlenir; normalize koordinatlar aynıdır.
 */
import type { PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { candidatesFromFrame } from './tracking';
import type { Candidate, Dims, RawFrame, RawPose } from './types';
import { NUM_LM } from './types';

export type Quality = 'lite' | 'full';
export type Delegate = 'CPU' | 'GPU';

export const MODEL_PATH: Record<Quality, string> = {
  lite: '/models/pose_landmarker_lite.task',
  full: '/models/pose_landmarker_full.task',
};
export const WASM_PATH = '/mediapipe/wasm';
export const MAX_POSES = 5;
export const DETECTION_CONFIDENCE = 0.3;
/** bu boyutun üstündeki dosyalar için uyarı gösterilir (bayt) */
export const LARGE_FILE_BYTES = 500 * 1024 * 1024;

export class AnalysisAborted extends Error {
  constructor() {
    super('Analiz iptal edildi.');
    this.name = 'AbortError';
  }
}

// ── MediaPipe günlük gürültüsü ────────────────────────────────
// MediaPipe'ın wasm çekirdeği "INFO: Created TensorFlow Lite XNNPACK delegate…" gibi bilgi satırlarını console.error'a
// yazar. Bunlar hata değildir; yalnızca "INFO:" önekli satırlar console.info'ya yönlendirilir, gerisi aynen kalır.
let consolePatched = false;
function quietMediapipeInfo() {
  if (consolePatched || typeof console === 'undefined') return;
  consolePatched = true;
  const orig = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === 'string' && /^INFO:\s/.test(first)) console.info(...args);
    else orig(...args);
  };
}

// ── Yükleyici (tekil) ─────────────────────────────────────────

interface Handle {
  lm: PoseLandmarker;
  quality: Quality;
  delegate: Delegate;
  mode: 'IMAGE' | 'VIDEO';
  numPoses: number;
}

let handle: Handle | null = null;
let loading: Promise<Handle> | null = null;
let loadingKey = '';
let tsCursor = 0;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

const origin = () => (typeof location !== 'undefined' ? location.origin : '');
const abs = (p: string) => `${origin()}${p}`;

/** Motoru (gerekirse) yükler. Aynı ayarlarla çağrılar aynı örneği paylaşır. */
export async function getLandmarker(opts: { quality: Quality; delegate?: Delegate; numPoses?: number }): Promise<Handle> {
  const quality = opts.quality;
  const delegate = opts.delegate ?? 'CPU';
  const numPoses = Math.max(1, Math.min(MAX_POSES, opts.numPoses ?? MAX_POSES));
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  if (handle && handle.quality === quality && handle.delegate === delegate) {
    if (handle.numPoses !== numPoses) {
      await handle.lm.setOptions({ numPoses });
      handle.numPoses = numPoses;
    }
    return handle;
  }
  const key = `${quality}|${delegate}|${numPoses}`;
  if (loading && loadingKey === key) return loading;
  disposeLandmarker();
  loadingKey = key;
  loading = (async () => {
    quietMediapipeInfo();
    const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
    const fileset = await FilesetResolver.forVisionTasks(abs(WASM_PATH));
    const make = (d: Delegate) =>
      PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: abs(MODEL_PATH[quality]), delegate: d },
        runningMode: 'IMAGE',
        numPoses,
        // Varsayılan 0,5 eşiği, yan yana duran ikinci kişiyi sık sık kaçırıyor (iki kişilik denemede 0,5 → 1 kişi, 0,3 → 2 kişi).
        // Düşük eşik hayalet tespit riskini artırır; bunlar düşük görünürlükle elenir ve oyuncuyu kullanıcı seçer.
        minPoseDetectionConfidence: DETECTION_CONFIDENCE,
        minPosePresenceConfidence: DETECTION_CONFIDENCE,
        minTrackingConfidence: 0.5,
      });
    let used: Delegate = delegate;
    let lm: PoseLandmarker;
    try {
      lm = await make(delegate);
    } catch (e) {
      if (delegate === 'GPU') {
        used = 'CPU'; // GPU kullanılamıyorsa CPU'ya düş
        lm = await make('CPU');
      } else throw e;
    }
    const h: Handle = { lm, quality, delegate: used, mode: 'IMAGE', numPoses };
    handle = h;
    return h;
  })();
  try {
    return await loading;
  } finally {
    loading = null;
  }
}

/** Motoru kapatır ve bellekten bırakır. */
export function disposeLandmarker() {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  if (handle) {
    try {
      handle.lm.close();
    } catch {
      /* zaten kapalı */
    }
    handle = null;
  }
}

/** Analiz bittikten bir süre sonra (yeniden kullanılmazsa) motoru bırakır. */
export function scheduleIdleDispose(ms = 60_000) {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(disposeLandmarker, ms);
}

export function isLandmarkerLoaded() {
  return !!handle;
}

async function setMode(h: Handle, mode: 'IMAGE' | 'VIDEO') {
  if (h.mode === mode) return;
  await h.lm.setOptions({ runningMode: mode });
  h.mode = mode;
}

// ── Video yardımcıları ────────────────────────────────────────

const yieldToUi = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * Analiz için görünmez (ama çözümleme yapan) bir <video> oluşturur. Kaynak, çağıranın sahip olduğu blob URL'sidir;
 * burada yeni URL üretilmez, dolayısıyla iptal edilecek bir şey yoktur. `dispose()` öğeyi söker ve çözücü belleğini bırakır.
 */
export function createAnalysisVideo(src: string): { video: HTMLVideoElement; dispose: () => void } {
  const video = document.createElement('video');
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true; // iOS Safari: tam ekrana geçmesin
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.preload = 'auto';
  video.setAttribute('aria-hidden', 'true');
  video.tabIndex = -1;
  // display:none olursa bazı tarayıcılar kareyi çözmez; 1px, saydam ve tıklanamaz bırakılır
  Object.assign(video.style, { position: 'fixed', left: '0', top: '0', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none' });
  video.src = src;
  document.body.appendChild(video);
  return {
    video,
    dispose: () => {
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch {
        /* yoksay */
      }
      video.remove();
    },
  };
}

function waitEvent(video: HTMLVideoElement, ok: string[], fail: string[], timeoutMs: number, what: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      ok.forEach((n) => video.removeEventListener(n, onOk));
      fail.forEach((n) => video.removeEventListener(n, onFail));
    };
    const onOk = () => {
      cleanup();
      resolve();
    };
    const onFail = () => {
      cleanup();
      reject(new Error('Video açılamadı. MP4 (H.264) ya da WebM biçimini deneyin.'));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Video ${what} zaman aşımına uğradı.`));
    }, timeoutMs);
    ok.forEach((n) => video.addEventListener(n, onOk));
    fail.forEach((n) => video.addEventListener(n, onFail));
  });
}

export interface VideoInfo {
  width: number;
  height: number;
  /** saniye; bilinmiyorsa null */
  duration: number | null;
}

/**
 * Üst veriyi bekler. MediaRecorder ile üretilmiş WebM dosyalarında duration = Infinity olabilir; bu durumda
 * currentTime çok büyük bir değere atlatılır, tarayıcı gerçek süreyi hesaplar ve başa dönülür.
 */
export async function prepareVideo(video: HTMLVideoElement): Promise<VideoInfo> {
  if (video.readyState < 1) await waitEvent(video, ['loadedmetadata'], ['error'], 20_000, 'üst veri yükleme');
  if (!Number.isFinite(video.duration)) {
    try {
      const done = waitEvent(video, ['durationchange', 'seeked'], ['error'], 6000, 'süre hesaplama');
      video.currentTime = 1e101;
      await done;
    } catch {
      /* süre yine de bilinmeyebilir */
    }
    try {
      await seekTo(video, 0);
    } catch {
      /* yoksay */
    }
  }
  const d = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null;
  return { width: video.videoWidth, height: video.videoHeight, duration: d };
}

/** Belirli bir ana gider, 'seeked' ve kare verisini bekler. */
export async function seekTo(video: HTMLVideoElement, t: number, timeoutMs = 10_000): Promise<void> {
  const dur = Number.isFinite(video.duration) ? video.duration : Infinity;
  const target = Math.max(0, Math.min(dur - 0.001, t));
  if (Math.abs(video.currentTime - target) < 1e-4 && video.readyState >= 2 && !video.seeking) return;
  const p = waitEvent(video, ['seeked'], ['error'], timeoutMs, 'konumlanma');
  video.currentTime = target;
  await p;
  if (video.readyState < 2) await waitEvent(video, ['loadeddata', 'canplay'], ['error'], timeoutMs, 'kare çözümleme');
}

// ── Sonuç dönüştürme ──────────────────────────────────────────

function toRaw(res: PoseLandmarkerResult): RawPose[] {
  const out: RawPose[] = [];
  const n = res.landmarks?.length ?? 0;
  for (let p = 0; p < n; p++) {
    const lm = new Float32Array(NUM_LM * 4);
    const wl = new Float32Array(NUM_LM * 3);
    const L = res.landmarks[p];
    const Wd = res.worldLandmarks?.[p];
    for (let j = 0; j < NUM_LM; j++) {
      const a = L[j];
      if (a) {
        lm[j * 4] = a.x;
        lm[j * 4 + 1] = a.y;
        lm[j * 4 + 2] = a.z;
        lm[j * 4 + 3] = a.visibility ?? 0;
      }
      const w = Wd?.[j];
      if (w) {
        wl[j * 3] = w.x;
        wl[j * 3 + 1] = w.y;
        wl[j * 3 + 2] = w.z;
      }
    }
    out.push({ lm, wl });
  }
  return out;
}

/** Çıkarıma verilecek kaynak: büyük videolar küçültülmüş tuvale çizilir. */
function makeSource(video: HTMLVideoElement, maxSide: number): { src: HTMLVideoElement | HTMLCanvasElement; dims: Dims; draw: () => void } {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const long = Math.max(vw, vh);
  if (maxSide > 0 && long > maxSide) {
    const k = maxSide / long;
    const w = Math.max(2, Math.round(vw * k));
    const h = Math.max(2, Math.round(vh * k));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: false });
    return { src: c, dims: { w, h }, draw: () => ctx?.drawImage(video, 0, 0, w, h) };
  }
  return { src: video, dims: { w: vw, h: vh }, draw: () => undefined };
}

// ── Aday oyuncular ────────────────────────────────────────────

export interface CandidateResult {
  time: number;
  dims: Dims;
  candidates: Candidate[];
  frame: RawFrame;
}

/**
 * Verilen anda karedeki kişileri bulur (oyuncu seçimi için). Durumsuz IMAGE kipi kullanılır.
 * `canvas` verilirse görüntü o tuvale (en çok `drawWidth` piksel genişliğe) çizilir.
 */
export async function detectCandidates(
  video: HTMLVideoElement,
  time: number,
  opts: { quality: Quality; delegate?: Delegate; canvas?: HTMLCanvasElement; drawWidth?: number; maxSide?: number; signal?: AbortSignal },
): Promise<CandidateResult> {
  const h = await getLandmarker({ quality: opts.quality, delegate: opts.delegate, numPoses: MAX_POSES });
  if (opts.signal?.aborted) throw new AnalysisAborted();
  await seekTo(video, time);
  const { src, dims, draw } = makeSource(video, opts.maxSide ?? 960);
  draw();
  await setMode(h, 'IMAGE');
  const res = h.lm.detect(src);
  const frame: RawFrame = { t: time, poses: toRaw(res) };
  if (opts.canvas) {
    const c = opts.canvas;
    const w = Math.min(opts.drawWidth ?? 640, dims.w);
    c.width = w;
    c.height = Math.round((w * dims.h) / dims.w);
    c.getContext('2d')?.drawImage(src, 0, 0, c.width, c.height);
  }
  return { time, dims, candidates: candidatesFromFrame(frame, dims), frame };
}

// ── Video analizi ─────────────────────────────────────────────

export interface Progress {
  done: number;
  total: number;
  elapsedMs: number;
  /** tahmini kalan süre (ms); ilk kareden önce null */
  etaMs: number | null;
  msPerFrame: number | null;
  /** son karede bulunan kişi sayısı */
  lastPoses: number;
}

export interface AnalyzeOptions {
  startSec: number;
  endSec: number;
  fps: number;
  quality: Quality;
  delegate?: Delegate;
  numPoses?: number;
  /** uzun kenar bu pikselden büyükse küçültülür (0 = kapalı) */
  maxSide?: number;
  onProgress?: (p: Progress) => void;
  signal?: AbortSignal;
}

export interface AnalyzeResult {
  frames: RawFrame[];
  dims: Dims;
  fps: number;
  startSec: number;
  endSec: number;
  delegate: Delegate;
  quality: Quality;
  processing: { totalMs: number; msPerFrame: number };
}

/** Örnekleme kare sayısı (uçlar dahil). */
export function frameCount(startSec: number, endSec: number, fps: number): number {
  return Math.max(1, Math.floor((endSec - startSec) * fps + 1e-6) + 1);
}

export async function analyzeVideo(video: HTMLVideoElement, o: AnalyzeOptions): Promise<AnalyzeResult> {
  const info = await prepareVideo(video);
  if (!info.width || !info.height) throw new Error('Video boyutu okunamadı.');
  const fps = Math.max(1, Math.min(30, o.fps));
  const dur = info.duration ?? Infinity;
  const startSec = Math.max(0, Math.min(o.startSec, dur - 0.1));
  const endSec = Math.max(startSec + 0.1, Math.min(o.endSec, dur));
  const total = frameCount(startSec, endSec, fps);
  const stepMs = Math.max(1, Math.round(1000 / fps));

  const h = await getLandmarker({ quality: o.quality, delegate: o.delegate, numPoses: o.numPoses ?? MAX_POSES });
  if (o.signal?.aborted) throw new AnalysisAborted();
  // VIDEO kipine geçerken önceki izleme durumu sıfırlansın
  if (h.mode === 'VIDEO') await h.lm.setOptions({ runningMode: 'IMAGE' });
  h.mode = 'IMAGE';
  await setMode(h, 'VIDEO');

  const { src, dims, draw } = makeSource(video, o.maxSide ?? 960);
  const frames: RawFrame[] = [];
  const t0 = performance.now();
  for (let i = 0; i < total; i++) {
    if (o.signal?.aborted) throw new AnalysisAborted();
    const t = startSec + i / fps;
    await seekTo(video, t);
    draw();
    tsCursor += stepMs;
    const res = h.lm.detectForVideo(src, tsCursor);
    const poses = toRaw(res);
    frames.push({ t: Math.round(t * 1000) / 1000, poses });
    const elapsed = performance.now() - t0;
    const done = i + 1;
    const per = elapsed / done;
    o.onProgress?.({ done, total, elapsedMs: elapsed, etaMs: per * (total - done), msPerFrame: per, lastPoses: poses.length });
    await yieldToUi();
  }
  const totalMs = performance.now() - t0;
  return {
    frames,
    dims,
    fps,
    startSec,
    endSec: startSec + (total - 1) / fps,
    delegate: h.delegate,
    quality: o.quality,
    processing: { totalMs: Math.round(totalMs), msPerFrame: Math.round(totalMs / total) },
  };
}

/** Tahmini süre (sn): kare sayısı × kare başına ms (ölçülmemişse kaba varsayım). */
export function estimateSeconds(startSec: number, endSec: number, fps: number, quality: Quality, measuredMsPerFrame?: number | null): number {
  const per = measuredMsPerFrame ?? (quality === 'full' ? 550 : 300);
  return (frameCount(startSec, endSec, fps) * per) / 1000;
}
