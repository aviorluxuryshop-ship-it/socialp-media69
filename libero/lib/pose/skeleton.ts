/**
 * İzlenen oyuncunun ham karelerinden düzleştirilmiş, boşlukları doldurulmuş iskelet üretir.
 *
 * Adımlar (her eklem × her koordinat için):
 *  1. Görünürlük < THRESH.visMin ya da kişi eşleşmemiş → NaN (ölçülmedi)
 *  2. 3'lü medyan sıçrama ayıklama (eşik = THRESH.despikeTL × medyan gövde uzunluğu)
 *  3. ≤ THRESH.maxGapFrames kareyi doğrusal doldur (doldurulan örneğin görünürlüğü 0,4 sayılır)
 *  4. Savitzky–Golay düzleştirme (pencere fps'e göre, bkz. smoothing.ts)
 * Daha uzun boşluklar doldurulmaz: o karelerde `state` 0'dır ve metrikler NaN olur.
 *
 * Kare durumu (Skeleton.state): 0 = yok, 1 = ölçüldü, 2 = eşleşme yoktu ama komşu karelerden doldurulmuş.
 */
import { despike, fillGaps, savgol, smoothParams } from './smoothing';
import { median } from './geometry';
import { poseStats } from './tracking';
import { THRESH } from './thresholds';
import { LM, NUM_LM, type Dims, type RawFrame, type Skeleton, type Track } from './types';

/** doldurulan örneğin varsayılan görünürlüğü */
export const FILLED_VIS = 0.4;

export function buildSkeleton(frames: RawFrame[], track: Track, dims: Dims, fps: number): Skeleton {
  const n = frames.length;
  const N = n * NUM_LM;
  const x = new Float32Array(N).fill(NaN);
  const y = new Float32Array(N).fill(NaN);
  const v = new Float32Array(N);
  const wx = new Float32Array(N).fill(NaN);
  const wy = new Float32Array(N).fill(NaN);
  const wz = new Float32Array(N).fill(NaN);
  const state = new Uint8Array(n);
  const t = new Float64Array(n);
  const heightFrac = new Float32Array(n).fill(NaN);
  const torsos: number[] = [];

  for (let i = 0; i < n; i++) {
    t[i] = frames[i].t;
    const si = track.sel[i];
    if (si < 0) continue;
    const pose = frames[i].poses[si];
    if (!pose) continue;
    const st = poseStats(pose, dims);
    heightFrac[i] = st.heightFrac;
    if (Number.isFinite(st.torso)) torsos.push(st.torso);
    state[i] = 1;
    for (let j = 0; j < NUM_LM; j++) {
      const vis = pose.lm[j * 4 + 3];
      if (!(vis >= THRESH.visMin)) continue;
      const k = i * NUM_LM + j;
      x[k] = pose.lm[j * 4] * dims.w;
      y[k] = pose.lm[j * 4 + 1] * dims.h;
      v[k] = vis;
      wx[k] = pose.wl[j * 3];
      wy[k] = pose.wl[j * 3 + 1];
      wz[k] = pose.wl[j * 3 + 2];
    }
  }

  const tl = median(torsos);
  const spike = Number.isFinite(tl) ? THRESH.despikeTL * tl : Infinity;
  const sp = smoothParams(fps);
  const worldSp = { window: sp.window, order: Math.min(2, sp.order) };
  const col = new Float32Array(n);

  const proc = (arr: Float32Array, j: number, spikeThr: number, opts: { window: number; order: number }) => {
    for (let i = 0; i < n; i++) col[i] = arr[i * NUM_LM + j];
    const ds = Number.isFinite(spikeThr) ? despike(col, spikeThr) : Float32Array.from(col);
    const filled = fillGaps(ds, THRESH.maxGapFrames).y;
    const sm = savgol(filled, opts);
    for (let i = 0; i < n; i++) arr[i * NUM_LM + j] = sm[i];
  };

  for (let j = 0; j < NUM_LM; j++) {
    proc(x, j, spike, sp);
    proc(y, j, spike, sp);
    proc(wx, j, Infinity, worldSp);
    proc(wy, j, Infinity, worldSp);
    proc(wz, j, Infinity, worldSp);
    for (let i = 0; i < n; i++) {
      const k = i * NUM_LM + j;
      if (!Number.isFinite(x[k]) || !Number.isFinite(y[k])) {
        v[k] = 0;
        x[k] = NaN;
        y[k] = NaN;
      } else if (!(v[k] > 0)) {
        v[k] = FILLED_VIS; // doldurulmuş örnek
      }
    }
  }

  // eşleşmemiş ama anahtar eklemleri doldurulmuş kareler = 2; eşleşmiş ama hiçbir şey kalmayan = 0
  const key = [LM.L_HIP, LM.R_HIP, LM.L_SHOULDER, LM.R_SHOULDER];
  for (let i = 0; i < n; i++) {
    const have = key.some((j) => Number.isFinite(x[i * NUM_LM + j]) && Number.isFinite(y[i * NUM_LM + j]));
    if (state[i] === 0 && have) state[i] = 2;
    else if (state[i] === 1 && !have) state[i] = 0;
  }

  return { n, fps, dims, t, x, y, v, wx, wy, wz, state, conf: Float32Array.from(track.conf), heightFrac };
}
