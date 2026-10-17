/**
 * Düzleştirilmiş iskeletten ölçümler (saf fonksiyonlar; DOM yok).
 *
 * BİRİMLER
 *  • Açı: derece; görüntü düzlemindeki 2B izdüşüm (gerçek eklem açısı DEĞİL).
 *  • Uzunluk: piksel → "gövde boyu" (GB = omuz merkezi–kalça merkezi uzaklığı, 1 sn'lik kayan medyan).
 *  • Hız: GB/sn. Kalibrasyon yoksa metre/sn'ye ÇEVRİLMEZ; kamera hareketliyse hız kameraya görelidir.
 *  • Türevler: Savitzky–Golay (deriv=1), yani pencere içi polinomun eğimi; bkz. smoothing.ts.
 *
 * FORMÜLLER
 *  • eklem açısı       θ = arccos( BA·BC / (|BA||BC|) )  — b köşe noktası
 *       diz     : kalça–diz–bilek       kalça: omuz–kalça–diz
 *       dirsek  : omuz–dirsek–el bileği  ayak bileği (yaklaşık): diz–bilek–ayak ucu
 *  • gövde eğimi (trunkTilt)  = atan2(dx, −dy), (dx,dy) = omuz − kalça (px); 0° = dikey, + = görüntüde sağa
 *  • gövde eğimi (trunkLean)  = trunkTilt × bakış yönü (+1 sağa, −1 sola) → + = bakış yönünde öne
 *  • kalça–omuz dönüş farkı   = | wrap( atan2(Δz, Δx)_omuz − atan2(Δz, Δx)_kalça ) |, dünya koordinatlarında
 *       (Δ = sağ − sol eklem). Derinlik (z) tahmini gürültülüdür; yalnızca büyüklük sırası verir.
 *  • duruş genişliği          = |sol bilek − sağ bilek| (px) ÷ GB
 *  • kalça yüksekliği         = (en aşağıdaki bilek y − kalça y) ÷ GB  (çömelince küçülür)
 *  • bakış yönü               = işaret( burun/ayak ucu ofseti ), 0,4 sn medyanı; görünüm önden/arkadansa 0 (belirsiz)
 */
import {
  angle3,
  findPeaks,
  mean,
  median,
  percentile,
  rollingMedian,
  toDeg,
  wrapDeg,
} from './geometry';
import { savgol, smoothParams } from './smoothing';
import { THRESH } from './thresholds';
import { LM, NUM_LM, type Metrics, type Segment, type Skeleton, type ViewKind } from './types';

type FA = Float32Array;
const nanArr = (n: number): FA => new Float32Array(n).fill(NaN);

export interface MetricOpts {
  /** testlerde torso uzunluğu kayan medyan penceresini sınırlamak için */
  torsoWindowSec?: number;
}

/** Bir eklemin n uzunluklu x ve y sütunlarını çıkarır. */
function joint(sk: Skeleton, j: number): { x: FA; y: FA } {
  const x = new Float32Array(sk.n);
  const y = new Float32Array(sk.n);
  for (let i = 0; i < sk.n; i++) {
    x[i] = sk.x[i * NUM_LM + j];
    y[i] = sk.y[i * NUM_LM + j];
  }
  return { x, y };
}

function mid(a: { x: FA; y: FA }, b: { x: FA; y: FA }): { x: FA; y: FA } {
  const n = a.x.length;
  const x = nanArr(n);
  const y = nanArr(n);
  for (let i = 0; i < n; i++) {
    const ax = a.x[i];
    const ay = a.y[i];
    const bx = b.x[i];
    const by = b.y[i];
    const fa = Number.isFinite(ax) && Number.isFinite(ay);
    const fb = Number.isFinite(bx) && Number.isFinite(by);
    if (fa && fb) {
      x[i] = (ax + bx) / 2;
      y[i] = (ay + by) / 2;
    } else if (fa) {
      x[i] = ax;
      y[i] = ay;
    } else if (fb) {
      x[i] = bx;
      y[i] = by;
    }
  }
  return { x, y };
}

/** Eklem açısı serisi: b köşe noktası. */
function jointAngle(a: { x: FA; y: FA }, b: { x: FA; y: FA }, c: { x: FA; y: FA }): FA {
  const n = a.x.length;
  const out = nanArr(n);
  for (let i = 0; i < n; i++) out[i] = angle3(a.x[i], a.y[i], b.x[i], b.y[i], c.x[i], c.y[i]);
  return out;
}

/** Zaman türevi (birim/sn), Savitzky–Golay. */
function deriv(a: ArrayLike<number>, fps: number): FA {
  const sp = smoothParams(fps);
  return savgol(a, { window: sp.window, order: Math.max(1, Math.min(2, sp.order)), deriv: 1, fps });
}

/**
 * Bir noktanın (x,y) hızı, GB/sn. fps ≥ 20: Savitzky–Golay türevi. fps < 20: pencere 3 örneğe düştüğü için
 * merkezî fark hızlı hareketi yarıya indirir; bu yüzden tepe hızını korumak üzere iki yönlü tek aralıklı farkın
 * (ileri ve geri) BÜYÜĞÜ alınır. Örnekleme yine de gerçek tepe hızını eksik gösterebilir (raporda belirtilir).
 */
function pointSpeed(x: FA, y: FA, torso: FA, fps: number): FA {
  if (fps >= 20) return speedOf(deriv(x, fps), deriv(y, fps), torso);
  const n = x.length;
  const out = nanArr(n);
  for (let i = 0; i < n; i++) {
    const f = i + 1 < n ? Math.hypot(x[i + 1] - x[i], y[i + 1] - y[i]) * fps : NaN;
    const b = i > 0 ? Math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]) * fps : NaN;
    const v = Number.isFinite(f) && Number.isFinite(b) ? Math.max(f, b) : Number.isFinite(f) ? f : b;
    out[i] = v / torso[i];
  }
  return out;
}

/** (dx,dy) türev çiftinden GB/sn hız. */
function speedOf(dx: FA, dy: FA, torso: FA): FA {
  const n = dx.length;
  const out = nanArr(n);
  for (let i = 0; i < n; i++) out[i] = Math.hypot(dx[i], dy[i]) / torso[i];
  return out;
}

/** Görünüme göre bakış yönü: +1 görüntüde sağa, −1 sola, 0 belirsiz. */
function estimateFacing(sk: Skeleton, torso: FA, vx: FA, speed: FA, sh: { x: FA; y: FA }): Int8Array {
  const n = sk.n;
  const raw = new Float32Array(n).fill(NaN);
  const lHeel = joint(sk, LM.L_HEEL);
  const rHeel = joint(sk, LM.R_HEEL);
  const lToe = joint(sk, LM.L_FOOT);
  const rToe = joint(sk, LM.R_FOOT);
  const nose = joint(sk, LM.NOSE);
  for (let i = 0; i < n; i++) {
    const T = torso[i];
    if (!(T > 0)) continue;
    let s = 0;
    let w = 0;
    const toeL = (lToe.x[i] - lHeel.x[i]) / T;
    const toeR = (rToe.x[i] - rHeel.x[i]) / T;
    if (Number.isFinite(toeL)) {
      s += toeL;
      w++;
    }
    if (Number.isFinite(toeR)) {
      s += toeR;
      w++;
    }
    const nz = (nose.x[i] - sh.x[i]) / T;
    if (Number.isFinite(nz)) {
      s += 0.9 * nz;
      w += 0.9;
    }
    if (w > 0) raw[i] = s / w;
  }
  const win = Math.max(3, Math.round(0.4 * sk.fps) | 1);
  const sm = rollingMedian(raw, win);
  const out = new Int8Array(n);
  for (let i = 0; i < n; i++) {
    const s = sm[i];
    if (Number.isFinite(s) && Math.abs(s) >= 0.12) {
      out[i] = s > 0 ? 1 : -1;
    } else if (speed[i] >= 1.5 && Math.abs(vx[i]) >= 0.6 * speed[i]) {
      // yürürken/koşarken hareket yönü bakış yönüdür (yan görünümde)
      out[i] = vx[i] > 0 ? 1 : -1;
    }
  }
  return out;
}

/** Hız sınıfı. */
function classify(sp: number): Segment['kind'] {
  const T = THRESH.speed;
  if (sp < T.standMax) return 'duruş';
  if (sp < T.walkMax) return 'yürüyüş';
  if (sp < T.runMax) return 'koşu';
  return 'yüksek tempo';
}

/** Hızı sınıflara ayırıp `minSegmentSec`'ten kısa parçaları komşuya katar. */
export function segmentSpeed(t: ArrayLike<number>, speed: ArrayLike<number>, fps: number): Segment[] {
  const n = speed.length;
  if (!n) return [];
  const win = Math.max(3, Math.round(0.3 * fps) | 1);
  const sm = rollingMedian(speed, win);
  const kinds: (Segment['kind'] | null)[] = [];
  for (let i = 0; i < n; i++) kinds.push(Number.isFinite(sm[i]) ? classify(sm[i]) : null);
  // ardışık aynı tür parçaları
  let segs: { kind: Segment['kind'] | null; s: number; e: number }[] = [];
  for (let i = 0; i < n; i++) {
    const last = segs[segs.length - 1];
    if (last && last.kind === kinds[i]) last.e = i;
    else segs.push({ kind: kinds[i], s: i, e: i });
  }
  const minLen = Math.max(1, Math.round(THRESH.speed.minSegmentSec * fps));
  // kısa parçaları, uzun komşuya katmayı birkaç kez dene
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (let k = 0; k < segs.length; k++) {
      const sg = segs[k];
      if (sg.e - sg.s + 1 >= minLen) continue;
      const prev = segs[k - 1];
      const next = segs[k + 1];
      const target = prev && next ? (prev.e - prev.s >= next.e - next.s ? prev : next) : prev ?? next;
      if (!target) continue;
      target.kind = target.kind ?? sg.kind;
      if (target === prev) prev.e = sg.e;
      else next!.s = sg.s;
      segs.splice(k, 1);
      changed = true;
      k--;
    }
    // aynı türleri birleştir
    const merged: typeof segs = [];
    for (const sg of segs) {
      const last = merged[merged.length - 1];
      if (last && last.kind === sg.kind) last.e = sg.e;
      else merged.push({ ...sg });
    }
    segs = merged;
    if (!changed) break;
  }
  const out: Segment[] = [];
  for (const sg of segs) {
    if (!sg.kind) continue;
    let s = 0;
    let c = 0;
    for (let i = sg.s; i <= sg.e; i++) {
      if (Number.isFinite(speed[i])) {
        s += speed[i];
        c++;
      }
    }
    out.push({ kind: sg.kind, start: sg.s, end: sg.e, tStart: t[sg.s], tEnd: t[sg.e], meanSpeed: c ? s / c : NaN });
  }
  return out;
}

export function computeMetrics(sk: Skeleton, opts: MetricOpts = {}): Metrics {
  const n = sk.n;
  const fps = sk.fps;
  const J = (j: number) => joint(sk, j);
  const lSh = J(LM.L_SHOULDER);
  const rSh = J(LM.R_SHOULDER);
  const lHip = J(LM.L_HIP);
  const rHip = J(LM.R_HIP);
  const lKnee = J(LM.L_KNEE);
  const rKnee = J(LM.R_KNEE);
  const lAnk = J(LM.L_ANKLE);
  const rAnk = J(LM.R_ANKLE);
  const lEl = J(LM.L_ELBOW);
  const rEl = J(LM.R_ELBOW);
  const lWr = J(LM.L_WRIST);
  const rWr = J(LM.R_WRIST);
  const lToe = J(LM.L_FOOT);
  const rToe = J(LM.R_FOOT);
  const hip = mid(lHip, rHip);
  const sh = mid(lSh, rSh);

  // gövde uzunluğu: kare başına, sonra kayan medyan
  const torsoRaw = nanArr(n);
  for (let i = 0; i < n; i++) torsoRaw[i] = Math.hypot(sh.x[i] - hip.x[i], sh.y[i] - hip.y[i]);
  const win = Math.max(5, Math.round((opts.torsoWindowSec ?? 1) * fps) | 1);
  const torso = rollingMedian(torsoRaw, win);
  const tMed = median(torsoRaw);
  for (let i = 0; i < n; i++) if (!(torso[i] > 1)) torso[i] = Number.isFinite(tMed) && tMed > 1 ? tMed : NaN;

  // hızlar
  const dhx = deriv(hip.x, fps);
  const dhy = deriv(hip.y, fps);
  const vx = nanArr(n);
  const vy = nanArr(n);
  for (let i = 0; i < n; i++) {
    vx[i] = dhx[i] / torso[i];
    vy[i] = dhy[i] / torso[i];
  }
  const speed = speedOf(dhx, dhy, torso);
  const heading = nanArr(n);
  for (let i = 0; i < n; i++) if (speed[i] >= THRESH.turn.minSpeed) heading[i] = toDeg(Math.atan2(-vy[i], vx[i]));

  // ayak bilekleri
  const aSpeed = (a: { x: FA; y: FA }) => pointSpeed(a.x, a.y, torso, fps);
  const ankleSpeedL = aSpeed(lAnk);
  const ankleSpeedR = aSpeed(rAnk);
  const rel = (a: { x: FA; y: FA }) => {
    const rx = nanArr(n);
    const ry = nanArr(n);
    for (let i = 0; i < n; i++) {
      rx[i] = a.x[i] - hip.x[i];
      ry[i] = a.y[i] - hip.y[i];
    }
    return pointSpeed(rx, ry, torso, fps);
  };
  const ankleRelL = rel(lAnk);
  const ankleRelR = rel(rAnk);

  // eklem açıları
  const kneeL = jointAngle(lHip, lKnee, lAnk);
  const kneeR = jointAngle(rHip, rKnee, rAnk);
  const hipL = jointAngle(lSh, lHip, lKnee);
  const hipR = jointAngle(rSh, rHip, rKnee);
  const elbowL = jointAngle(lSh, lEl, lWr);
  const elbowR = jointAngle(rSh, rEl, rWr);
  const ankleL = jointAngle(lKnee, lAnk, lToe);
  const ankleR = jointAngle(rKnee, rAnk, rToe);

  const kneeMean = nanArr(n);
  for (let i = 0; i < n; i++) {
    const a = kneeL[i];
    const b = kneeR[i];
    if (Number.isFinite(a) && Number.isFinite(b)) kneeMean[i] = (a + b) / 2;
    else if (Number.isFinite(a)) kneeMean[i] = a;
    else if (Number.isFinite(b)) kneeMean[i] = b;
  }

  // gövde eğimi, omuz/kalça çizgisi
  const trunkTilt = nanArr(n);
  for (let i = 0; i < n; i++) {
    const dx = sh.x[i] - hip.x[i];
    const dy = sh.y[i] - hip.y[i];
    if (Number.isFinite(dx) && Number.isFinite(dy) && Math.hypot(dx, dy) > 1e-6) trunkTilt[i] = toDeg(Math.atan2(dx, -dy));
  }
  const facing = estimateFacing(sk, torso, vx, speed, sh);
  const trunkLean = nanArr(n);
  let leanKnown = 0;
  let tiltKnown = 0;
  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(trunkTilt[i])) continue;
    tiltKnown++;
    if (facing[i] !== 0) {
      trunkLean[i] = trunkTilt[i] * facing[i];
      leanKnown++;
    }
  }
  const leanSigned = tiltKnown > 0 && leanKnown / tiltKnown >= 0.5;

  const lineTilt = (l: { x: FA; y: FA }, r: { x: FA; y: FA }) => {
    const out = nanArr(n);
    for (let i = 0; i < n; i++) {
      const dx = r.x[i] - l.x[i];
      const dy = r.y[i] - l.y[i];
      if (Number.isFinite(dx) && Number.isFinite(dy)) out[i] = toDeg(Math.atan2(dy, dx));
    }
    return out;
  };
  const shoulderTilt = lineTilt(lSh, rSh);
  const hipTilt = lineTilt(lHip, rHip);

  // omuz–kalça dönüş farkı (dünya x–z)
  const hipShoulderSep = nanArr(n);
  const W = (arr: Float32Array, i: number, j: number) => arr[i * NUM_LM + j];
  for (let i = 0; i < n; i++) {
    const sdx = W(sk.wx, i, LM.R_SHOULDER) - W(sk.wx, i, LM.L_SHOULDER);
    const sdz = W(sk.wz, i, LM.R_SHOULDER) - W(sk.wz, i, LM.L_SHOULDER);
    const hdx = W(sk.wx, i, LM.R_HIP) - W(sk.wx, i, LM.L_HIP);
    const hdz = W(sk.wz, i, LM.R_HIP) - W(sk.wz, i, LM.L_HIP);
    if ([sdx, sdz, hdx, hdz].every(Number.isFinite) && Math.hypot(sdx, sdz) > 0.05 && Math.hypot(hdx, hdz) > 0.05) {
      hipShoulderSep[i] = Math.abs(wrapDeg(toDeg(Math.atan2(sdz, sdx)) - toDeg(Math.atan2(hdz, hdx))));
    }
  }

  // duruş genişliği, bilek yüksekliği farkı, kalça yüksekliği
  const stanceWidth = nanArr(n);
  const ankleLift = nanArr(n);
  const hipHeight = nanArr(n);
  for (let i = 0; i < n; i++) {
    stanceWidth[i] = Math.hypot(lAnk.x[i] - rAnk.x[i], lAnk.y[i] - rAnk.y[i]) / torso[i];
    ankleLift[i] = (lAnk.y[i] - rAnk.y[i]) / torso[i];
    const low = Math.max(lAnk.y[i], rAnk.y[i]);
    const low1 = Number.isFinite(low) ? low : Number.isFinite(lAnk.y[i]) ? lAnk.y[i] : rAnk.y[i];
    hipHeight[i] = (low1 - hip.y[i]) / torso[i];
  }

  // görünürlük ortalaması (üst + alt gövde)
  const visMean = nanArr(n);
  const vj = [LM.L_SHOULDER, LM.R_SHOULDER, LM.L_HIP, LM.R_HIP, LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE];
  for (let i = 0; i < n; i++) {
    if (sk.state[i] === 0) continue;
    let s = 0;
    for (const j of vj) s += sk.v[i * NUM_LM + j];
    visMean[i] = s / vj.length;
  }

  // görünüm türü
  const swr: number[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.hypot(lSh.x[i] - rSh.x[i], lSh.y[i] - rSh.y[i]) / torso[i];
    if (Number.isFinite(r)) swr.push(r);
  }
  const shoulderWidthRatio = median(swr);
  let viewKind: ViewKind = 'belirsiz';
  if (Number.isFinite(shoulderWidthRatio)) {
    viewKind = shoulderWidthRatio >= THRESH.reliability.frontalWarnRatio ? 'önden-arkadan' : shoulderWidthRatio <= 0.4 ? 'yan' : 'çapraz';
  }

  // adımlar: iki bilek yüksekliği farkının (ankleLift) ardışık uç noktaları
  const steps: Metrics['steps'] = [];
  const minDist = Math.max(1, Math.round(THRESH.steps.minSepSec * fps));
  const prom = THRESH.steps.minProminenceTL;
  const neg = Float32Array.from(ankleLift, (v) => -v);
  const ext = [...findPeaks(ankleLift, { minProminence: prom, minDist }), ...findPeaks(neg, { minProminence: prom, minDist })].sort((a, b) => a.index - b.index);
  let lastIdx = -1e9;
  for (const p of ext) {
    if (!(speed[p.index] >= THRESH.steps.minMoveSpeed)) continue;
    if (p.index - lastIdx < minDist) continue;
    steps.push({ t: sk.t[p.index], index: p.index, strength: p.prominence });
    lastIdx = p.index;
  }
  let cadence: number | null = null;
  if (steps.length >= 4) {
    const dts: number[] = [];
    for (let k = 1; k < steps.length; k++) dts.push(steps[k].t - steps[k - 1].t);
    const md = median(dts.filter((d) => d < 1.5));
    if (Number.isFinite(md) && md > 0) cadence = Math.round(60 / md);
  }

  const segments = segmentSpeed(sk.t, speed, fps);

  return {
    n,
    fps,
    t: sk.t,
    torso,
    hipX: hip.x,
    hipY: hip.y,
    speed,
    vx,
    vy,
    heading,
    kneeL,
    kneeR,
    hipL,
    hipR,
    elbowL,
    elbowR,
    ankleL,
    ankleR,
    trunkTilt,
    trunkLean,
    facing,
    shoulderTilt,
    hipTilt,
    hipShoulderSep,
    stanceWidth,
    ankleSpeedL,
    ankleSpeedR,
    ankleRelL,
    ankleRelR,
    ankleLift,
    kneeMean,
    hipHeight,
    steps,
    cadence,
    segments,
    viewKind,
    shoulderWidthRatio,
    leanSigned,
    visMean,
  };
}

/** Küçük özet yardımcıları (rapor ve testler için). */
export function seriesStats(a: ArrayLike<number>): { min: number; max: number; mean: number; p95: number; n: number } {
  let mn = Infinity;
  let mx = -Infinity;
  let n = 0;
  for (let i = 0; i < a.length; i++) {
    const v = a[i];
    if (!Number.isFinite(v)) continue;
    n++;
    if (v < mn) mn = v;
    if (v > mx) mx = v;
  }
  return n ? { min: mn, max: mx, mean: mean(a), p95: percentile(a, 0.95), n } : { min: NaN, max: NaN, mean: NaN, p95: NaN, n: 0 };
}
