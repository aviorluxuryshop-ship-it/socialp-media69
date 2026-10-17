/**
 * Oyuncu seçimi ve takip (saf fonksiyonlar).
 *
 * Takip yalnızca SÜREKLİLİĞE dayanır: kalça merkezinin konumu (gövde uzunluğuna bölünmüş uzaklık),
 * gövde boyutu ve sınırlayıcı kutu örtüşmesi (IoU). Görünüme (forma, yüz) bakan bir yeniden
 * tanıma modeli YOKTUR; bu yüzden iki oyuncu iç içe geçtiğinde ya da oyuncu kadrajdan çıkıp
 * döndüğünde sonuç belirsiz işaretlenir ve arayüz kullanıcıdan seçimi doğrulamasını ister.
 *
 * Eşleşme puanı  S = 0,55·P + 0,25·B + 0,20·K
 *   P = exp(−½ (d / (kapı/2,5))²)   d: tahmini kalça konumuna uzaklık (gövde boyu cinsinden)
 *   B = exp(−½ (ln(r) / 0,35)²)     r: gövde uzunluğu oranı (aday / önceki)
 *   K = IoU(öncekinin tahminle kaydırılmış kutusu, adayın kutusu)
 * Kapı = 0,6 + 18·dt·(1+boşluk) gövde boyu (18 GB/sn, olası en yüksek koşu hızının üstü).
 */
import { bboxIoU } from './geometry';
import {
  LM,
  NUM_LM,
  TRACK_AMBIGUOUS,
  TRACK_REACQUIRED,
  type Candidate,
  type Dims,
  type PoseStats,
  type RawFrame,
  type RawPose,
  type Seed,
  type Track,
} from './types';

const KEY_JOINTS = [LM.L_SHOULDER, LM.R_SHOULDER, LM.L_HIP, LM.R_HIP, LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE];
const VIS_OK = 0.3;

export const TRACK_PARAMS = {
  maxSpeedTLs: 18,
  minScore: 0.3,
  ambiguousRatio: 0.7,
  /** bu süreden uzun kayıp sonrası dönüş "yeniden yakalama" sayılır (sn) */
  reacquireSec: 0.5,
  /** bu orandan fazla belirsiz kare varsa kullanıcıya sorulur */
  askAmbiguousFrac: 0.1,
  askCoverage: 0.5,
};

/** Tek kişinin piksel cinsinden özeti. */
export function poseStats(p: RawPose, dims: Dims): PoseStats {
  const { w, h } = dims;
  const lm = p.lm;
  const vis = (i: number) => lm[i * 4 + 3];
  const px = (i: number) => lm[i * 4] * w;
  const py = (i: number) => lm[i * 4 + 1] * h;
  let vs = 0;
  for (const j of KEY_JOINTS) vs += vis(j);
  const meanVis = vs / KEY_JOINTS.length;

  const mid = (a: number, b: number): [number, number] => {
    const va = vis(a) >= VIS_OK;
    const vb = vis(b) >= VIS_OK;
    if (va && vb) return [(px(a) + px(b)) / 2, (py(a) + py(b)) / 2];
    if (va) return [px(a), py(a)];
    if (vb) return [px(b), py(b)];
    return [NaN, NaN];
  };
  const hip = mid(LM.L_HIP, LM.R_HIP);
  const shoulder = mid(LM.L_SHOULDER, LM.R_SHOULDER);
  const torso = Math.hypot(hip[0] - shoulder[0], hip[1] - shoulder[1]);

  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  let cnt = 0;
  for (let i = 0; i < NUM_LM; i++) {
    if (vis(i) < VIS_OK) continue;
    cnt++;
    x0 = Math.min(x0, px(i));
    x1 = Math.max(x1, px(i));
    y0 = Math.min(y0, py(i));
    y1 = Math.max(y1, py(i));
  }
  const ok = cnt >= 6 && Number.isFinite(hip[0]) && Number.isFinite(torso) && torso > 2;
  return {
    hip,
    shoulder,
    torso,
    bbox: ok ? [x0, y0, x1, y1] : [0, 0, 0, 0],
    vis: meanVis,
    heightFrac: ok ? (y1 - y0) / h : NaN,
    valid: ok && meanVis >= 0.3,
  };
}

/**
 * Bir karedeki aday oyuncular (oyuncu seçimi ekranı için). Boyuta ve güvene göre sıralı;
 * `index` karedeki kişi sırasıdır.
 */
export function candidatesFromFrame(frame: RawFrame, dims: Dims): Candidate[] {
  const out: Candidate[] = [];
  frame.poses.forEach((p, index) => {
    const s = poseStats(p, dims);
    if (!s.valid) return;
    out.push({
      index,
      bbox: [s.bbox[0] / dims.w, s.bbox[1] / dims.h, s.bbox[2] / dims.w, s.bbox[3] / dims.h],
      hip: [s.hip[0] / dims.w, s.hip[1] / dims.h],
      score: s.vis,
      heightPct: s.heightFrac * 100,
    });
  });
  return out.sort((a, b) => b.heightPct * b.score - a.heightPct * a.score);
}

/** Seçilen nokta için karedeki kişiyi bulur: noktayı içeren en küçük kutu, yoksa en yakın kalça. */
export function pickAtPoint(stats: PoseStats[], x: number, y: number, dims: Dims): number {
  const px = x * dims.w;
  const py = y * dims.h;
  let best = -1;
  let bestArea = Infinity;
  stats.forEach((s, i) => {
    if (!s.valid) return;
    const [x0, y0, x1, y1] = s.bbox;
    if (px >= x0 && px <= x1 && py >= y0 && py <= y1) {
      const area = (x1 - x0) * (y1 - y0);
      if (area < bestArea) {
        bestArea = area;
        best = i;
      }
    }
  });
  if (best >= 0) return best;
  let bd = Infinity;
  stats.forEach((s, i) => {
    if (!s.valid) return;
    const d = Math.hypot(s.hip[0] - px, s.hip[1] - py) / Math.max(1, s.torso);
    if (d < bd && d < 3) {
      bd = d;
      best = i;
    }
  });
  return best;
}

interface State {
  hip: [number, number];
  torso: number;
  bbox: [number, number, number, number];
  vel: [number, number];
  lastIdx: number;
}

function stateFrom(s: PoseStats, idx: number): State {
  return { hip: [...s.hip], torso: s.torso, bbox: [...s.bbox], vel: [0, 0], lastIdx: idx };
}

/**
 * Kare dizisi için oyuncuyu izler. `seeds` en az bir noktadır (kullanıcının seçtiği aday);
 * birden çok tohum varsa her biri o karede seçimi zorlar (düzeltme) ve izleme oradan sürer.
 */
export function trackPlayer(frames: RawFrame[], dims: Dims, fps: number, seeds: Seed[]): Track {
  const n = frames.length;
  const sel = new Int16Array(n).fill(-1);
  const conf = new Float32Array(n);
  const flags = new Uint8Array(n);
  const reasons: string[] = [];
  const dt = 1 / Math.max(1, fps);
  const stats = frames.map((f) => f.poses.map((p) => poseStats(p, dims)));

  const track: Track = {
    n,
    sel,
    conf,
    flags,
    seedFrame: -1,
    coverage: 0,
    ambiguousFrac: 0,
    reacquisitions: 0,
    needsUser: false,
    reasons,
  };
  if (!n || !seeds.length) {
    track.needsUser = true;
    reasons.push('Oyuncu seçilmedi.');
    return track;
  }

  const nearestFrame = (t: number) => {
    let bi = 0;
    let bd = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(frames[i].t - t);
      if (d < bd) {
        bd = d;
        bi = i;
      }
    }
    return bi;
  };

  // tohumları karelere çöz; seçilen kareyi bul (kare boşsa en yakın dolu kareye kay, ≤ 1 sn)
  const anchors: { frame: number; pose: number }[] = [];
  for (const sd of seeds) {
    let f = nearestFrame(sd.t);
    let pose = pickAtPoint(stats[f], sd.x, sd.y, dims);
    if (pose < 0) {
      const maxShift = Math.ceil(fps);
      for (let o = 1; o <= maxShift && pose < 0; o++) {
        for (const g of [f - o, f + o]) {
          if (g < 0 || g >= n) continue;
          const q = pickAtPoint(stats[g], sd.x, sd.y, dims);
          if (q >= 0) {
            f = g;
            pose = q;
            break;
          }
        }
      }
    }
    if (pose >= 0) anchors.push({ frame: f, pose });
  }
  if (!anchors.length) {
    track.needsUser = true;
    reasons.push('Seçilen noktada bir oyuncu bulunamadı; oyuncuyu yeniden seçin.');
    return track;
  }
  anchors.sort((a, b) => a.frame - b.frame);
  track.seedFrame = anchors[0].frame;
  const anchorAt = new Map<number, number>();
  for (const a of anchors) anchorAt.set(a.frame, a.pose);

  let ambiguousFrames = 0;
  let reacq = 0;
  let maxGapSec = 0;

  /** from'dan başlayıp dir yönünde, stop (dahil değil) karesine kadar. */
  const run = (from: number, dir: 1 | -1, stop: number) => {
    const a0 = anchorAt.get(from)!;
    sel[from] = a0;
    conf[from] = 1;
    let st = stateFrom(stats[from][a0], a0);
    let gap = 0;
    for (let k = from + dir; k !== stop && k >= 0 && k < n; k += dir) {
      // zorlanmış tohum
      const forced = anchorAt.get(k);
      if (forced !== undefined) {
        sel[k] = forced;
        conf[k] = 1;
        st = stateFrom(stats[k][forced], forced);
        gap = 0;
        continue;
      }
      const cands = stats[k];
      const stepT = Math.max(dt, Math.abs(frames[k].t - frames[k - dir].t)) * (1 + gap);
      const gate = Math.min(10, 0.6 + TRACK_PARAMS.maxSpeedTLs * stepT);
      const damp = gap > 0 ? Math.max(0, 1 - gap * 0.35) : 1;
      const predX = st.hip[0] + st.vel[0] * stepT * damp * dir;
      const predY = st.hip[1] + st.vel[1] * stepT * damp * dir;
      const dx = predX - st.hip[0];
      const dy = predY - st.hip[1];
      const pb: [number, number, number, number] = [st.bbox[0] + dx, st.bbox[1] + dy, st.bbox[2] + dx, st.bbox[3] + dy];

      const scored: { i: number; s: number }[] = [];
      cands.forEach((c, i) => {
        if (!c.valid) return;
        const d = Math.hypot(c.hip[0] - predX, c.hip[1] - predY) / st.torso;
        if (d > gate) return;
        const r = c.torso / st.torso;
        if (r < 0.45 || r > 2.2) return;
        const P = Math.exp(-0.5 * (d / (gate / 2.5)) ** 2);
        const B = Math.exp(-0.5 * (Math.log(r) / 0.35) ** 2);
        const K = bboxIoU(pb, c.bbox);
        scored.push({ i, s: 0.55 * P + 0.25 * B + 0.2 * K });
      });
      scored.sort((a, b) => b.s - a.s);
      const best = scored[0];
      if (!best || best.s < TRACK_PARAMS.minScore) {
        gap++;
        continue;
      }
      const second = scored[1];
      const amb = !!second && second.s >= TRACK_PARAMS.ambiguousRatio * best.s;
      const c = cands[best.i];
      let fl = 0;
      if (amb) fl |= TRACK_AMBIGUOUS;
      const gapSec = gap * dt;
      if (gapSec >= TRACK_PARAMS.reacquireSec) {
        fl |= TRACK_REACQUIRED;
        reacq++;
        maxGapSec = Math.max(maxGapSec, gapSec);
      }
      sel[k] = best.i;
      flags[k] = fl;
      conf[k] = Math.max(0, Math.min(1, best.s * (0.5 + 0.5 * c.vis) * (gap > 0 ? 0.75 : 1) * (amb ? 0.6 : 1)));
      const dtReal = Math.max(dt, Math.abs(frames[k].t - frames[k - dir * (1 + gap)]?.t || dt));
      const nv: [number, number] = [((c.hip[0] - st.hip[0]) / dtReal) * dir, ((c.hip[1] - st.hip[1]) / dtReal) * dir];
      st = {
        hip: [...c.hip],
        torso: 0.7 * st.torso + 0.3 * c.torso,
        bbox: [...c.bbox],
        vel: [0.6 * st.vel[0] + 0.4 * nv[0], 0.6 * st.vel[1] + 0.4 * nv[1]],
        lastIdx: best.i,
      };
      gap = 0;
    }
  };

  // ilk tohumdan geriye; her tohumdan sonrakine kadar ileriye
  run(anchors[0].frame, -1, -1);
  for (let a = 0; a < anchors.length; a++) {
    const stop = a + 1 < anchors.length ? anchors[a + 1].frame : n;
    run(anchors[a].frame, 1, stop);
  }

  let matched = 0;
  for (let i = 0; i < n; i++) {
    if (sel[i] >= 0) matched++;
    if (flags[i] & TRACK_AMBIGUOUS) ambiguousFrames++;
  }
  track.coverage = matched / n;
  track.ambiguousFrac = matched ? ambiguousFrames / matched : 0;
  track.reacquisitions = reacq;

  if (track.ambiguousFrac >= TRACK_PARAMS.askAmbiguousFrac) {
    track.needsUser = true;
    reasons.push(`Takip ${Math.round(track.ambiguousFrac * 100)}% oranında belirsiz: yakın konumlu birden fazla kişi var.`);
  }
  if (reacq > 0) {
    track.needsUser = true;
    reasons.push(`Oyuncu ${reacq} kez kayboldu ve yeniden bulundu (en uzun ${maxGapSec.toFixed(1)} sn); aynı kişi olduğunu doğrulayın.`);
  }
  if (track.coverage < TRACK_PARAMS.askCoverage) {
    track.needsUser = true;
    reasons.push(`Oyuncu karelerin yalnızca %${Math.round(track.coverage * 100)}'inde bulunabildi.`);
  }
  return track;
}
