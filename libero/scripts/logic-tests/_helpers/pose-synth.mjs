// Sentetik iskelet üreteci (mantık testleri için). Gerçek bir video DEĞİLDİR: basit ileri kinematik ile
// 33 noktalı BlazePose düzeninde yan görünümlü (ya da dönmüş) bir oyuncu üretir; böylece açı, hız, takip ve olay
// tespiti bilinen "gerçek" değerlere karşı sınanabilir.
//
// Koordinatlar: görüntü piksel (x sağa, y aşağı), ortografik izdüşüm. Gövde uzunluğu T px (omuz–kalça).
// Vücut ölçüleri (T biriminde): uyluk 0,85 · kaval 0,85 · üst kol 0,58 · ön kol 0,52 · omuz yarı genişliği 0,42 · kalça yarı genişliği 0,28.
// Dünya koordinatı: metre = T-birimi × 0,52.

export const DIMS = { w: 1280, h: 720 };
export const T_PX = 120;
const SEG = { thigh: 0.85, shank: 0.85, uarm: 0.58, farm: 0.52, halfSh: 0.42, halfHip: 0.28 };
const M_PER_T = 0.52;

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function gauss(r) {
  const u = Math.max(1e-9, r());
  const v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const ease = (u) => u * u; // hızlanan
export const smooth = (u) => u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;

/** p = { x (T), baseY px, yaw (rad), twist (rad), lean (rad), legs:{L:{a,k},R:{a,k}}, arms:{L,R} (rad), vis } → {lm, wl} */
export function render(p, opt = {}) {
  const { w, h } = DIMS;
  const T = p.T ?? T_PX;
  const yawH = p.yaw - (p.twist ?? 0) / 2;
  const yawS = p.yaw + (p.twist ?? 0) / 2;
  const F = (yaw) => [Math.cos(yaw), Math.sin(yaw)];
  const Rg = (yaw) => [-Math.sin(yaw), Math.cos(yaw)];
  // gövde koordinatından (f,u,s) dünyaya
  const toW = (yaw, f, u, s) => {
    const [fx, fz] = F(yaw);
    const [rx, rz] = Rg(yaw);
    return [f * fx + s * rx, u, f * fz + s * rz];
  };
  const legs = p.legs;
  const ankleU = (leg) => {
    const al = leg.a;
    const be = leg.a - leg.k;
    return -(SEG.thigh * Math.cos(al) + SEG.shank * Math.cos(be));
  };
  const hipU = -Math.min(ankleU(legs.L), ankleU(legs.R));
  const pts = new Array(33);
  const set = (i, xyz, vis = p.vis ?? 0.95) => {
    pts[i] = { x: xyz[0], u: xyz[1], z: xyz[2], v: vis };
  };
  const hipsW = (s) => toW(yawH, 0, 0, s * SEG.halfHip);
  const addLeg = (side, leg) => {
    const s = side === 'L' ? -1 : 1;
    const hip = hipsW(s);
    const al = leg.a;
    const be = leg.a - leg.k;
    const thigh = toW(yawH, SEG.thigh * Math.sin(al), -SEG.thigh * Math.cos(al), 0);
    const knee = [hip[0] + thigh[0], hip[1] + thigh[1], hip[2] + thigh[2]];
    const shank = toW(yawH, SEG.shank * Math.sin(be), -SEG.shank * Math.cos(be), 0);
    const ank = [knee[0] + shank[0], knee[1] + shank[1], knee[2] + shank[2]];
    const fwd = toW(yawH, Math.cos(be), Math.sin(be), 0);
    const down = toW(yawH, Math.sin(be), -Math.cos(be), 0);
    const heel = [ank[0] - 0.12 * fwd[0] + 0.1 * down[0], ank[1] - 0.12 * fwd[1] + 0.1 * down[1], ank[2] - 0.12 * fwd[2] + 0.1 * down[2]];
    const toe = [ank[0] + 0.45 * fwd[0] + 0.05 * down[0], ank[1] + 0.45 * fwd[1] + 0.05 * down[1], ank[2] + 0.45 * fwd[2] + 0.05 * down[2]];
    const o = side === 'L' ? 0 : 1;
    set(23 + o, hip);
    set(25 + o, knee);
    set(27 + o, ank);
    set(29 + o, heel);
    set(31 + o, toe);
  };
  addLeg('L', legs.L);
  addLeg('R', legs.R);
  // gövde, omuz, kol, baş (omuz merkezi = kalça + gövde yönü)
  const lean = p.lean ?? 0;
  const trunkF = Math.sin(lean);
  const trunkU = Math.cos(lean);
  const shoulderC = toW(yawS, trunkF, trunkU, 0);
  const sh = (s) => {
    const o = toW(yawS, 0, 0, s * SEG.halfSh);
    return [shoulderC[0] + o[0], shoulderC[1] + o[1], shoulderC[2] + o[2]];
  };
  const addArm = (side, a) => {
    const s = side === 'L' ? -1 : 1;
    const S = sh(s);
    const el = toW(yawS, SEG.uarm * Math.sin(a), -SEG.uarm * Math.cos(a), 0);
    const E = [S[0] + el[0], S[1] + el[1], S[2] + el[2]];
    const fa = toW(yawS, SEG.farm * Math.sin(a + 1.2), -SEG.farm * Math.cos(a + 1.2), 0);
    const Wr = [E[0] + fa[0], E[1] + fa[1], E[2] + fa[2]];
    const o = side === 'L' ? 0 : 1;
    set(11 + o, S);
    set(13 + o, E);
    set(15 + o, Wr);
    for (const j of [17, 19, 21]) set(j + o, Wr, 0.7);
  };
  addArm('L', p.arms?.L ?? 0.1);
  addArm('R', p.arms?.R ?? -0.1);
  const headF = toW(yawS, 0.2 * trunkU + trunkF * 0.5, 0.5 * trunkU - 0.2 * trunkF, 0);
  const nose = [shoulderC[0] + headF[0], shoulderC[1] + headF[1], shoulderC[2] + headF[2]];
  set(0, nose);
  for (const [j, s] of [[2, -1], [5, 1]]) {
    const o = toW(yawS, 0, 0, s * 0.1);
    set(j, [nose[0] + o[0], nose[1] + 0.08, nose[2] + o[2]]);
  }
  for (const [j, s] of [[7, -1], [8, 1]]) {
    const o = toW(yawS, -0.1, 0, s * 0.18);
    set(j, [nose[0] + o[0], nose[1] + 0.04, nose[2] + o[2]]);
  }
  for (const j of [1, 3, 4, 6, 9, 10]) set(j, nose, 0.8);

  const lm = new Float32Array(33 * 4);
  const wl = new Float32Array(33 * 3);
  const cx = p.x * T + (p.x0px ?? w * 0.1);
  const baseY = p.baseY ?? 640;
  for (let i = 0; i < 33; i++) {
    const q = pts[i];
    const xImg = cx + q.x * T;
    const yImg = baseY - (hipU + q.u) * T;
    lm[i * 4] = xImg / w;
    lm[i * 4 + 1] = yImg / h;
    lm[i * 4 + 2] = q.z * 0.5;
    lm[i * 4 + 3] = q.v;
    wl[i * 3] = q.x * M_PER_T;
    wl[i * 3 + 1] = -q.u * M_PER_T;
    wl[i * 3 + 2] = q.z * M_PER_T;
  }
  return { lm, wl };
}

/** ileri doğru koşu/yürüyüş adımı: faz → { a, k } */
export function gaitLeg(phase, amp = 0.55, flex = 1.0) {
  return { a: amp * Math.sin(phase), k: 0.3 + flex * Math.max(0, Math.cos(phase - 0.4)) };
}

/**
 * Senaryo çalıştırıcı. script(t) → { v (GB/sn, yatay; işaret yönü verir), vUp (GB/sn, görüntüde yukarı),
 * stride (Hz, 0 = adım yok), legs?, yaw?, lean?, twist? } döndürür. Konum, hızın zaman integralidir.
 * options: { fps, duration, noiseT (gövde boyunun oranı), seed, dropouts: [[t0,t1],...], spikes: n, vis }
 */
export function simulate(script, options = {}) {
  const fps = options.fps ?? 30;
  const dur = options.duration ?? 6;
  const noise = options.noise ?? 0;
  const R = rng(options.seed ?? 7);
  const sub = 240;
  let x = options.x0 ?? 0;
  let yUp = 0;
  let phaseL = 0;
  const frames = [];
  const params = [];
  const n = Math.floor(dur * fps);
  let ti = 0;
  const steps = Math.round(dur * sub);
  const store = new Map();
  for (let s = 0; s <= steps; s++) {
    const t = s / sub;
    const sc = script(t);
    if (s % Math.round(sub / fps) === 0) store.set(Math.round(t * fps), { t, x, yUp, phase: phaseL, sc });
    x += (sc.v ?? 0) * (1 / sub);
    yUp += (sc.vUp ?? 0) * (1 / sub);
    phaseL += 2 * Math.PI * (sc.stride ?? 0) * (1 / sub);
  }
  for (let i = 0; i < n; i++) {
    const st = store.get(i);
    const sc = st.sc;
    const ph = st.phase;
    const gait = (sc.stride ?? 0) > 0;
    const defaultL = gait ? gaitLeg(ph, sc.amp ?? 0.55, sc.flex ?? 1.0) : { a: 0.02, k: 0.1 };
    const defaultR = gait ? gaitLeg(ph + Math.PI, sc.amp ?? 0.55, sc.flex ?? 1.0) : { a: 0.0, k: 0.1 };
    const Tpx = options.T ?? T_PX;
    const p = {
      T: Tpx,
      x0px: options.x0px,
      x: st.x,
      baseY: (options.baseY ?? 640) - st.yUp * Tpx,
      yaw: sc.yaw ?? 0,
      twist: sc.twist ?? 0,
      lean: sc.lean ?? (gait ? 0.12 : 0.03),
      legs: { L: sc.legs?.L ?? defaultL, R: sc.legs?.R ?? defaultR },
      arms: { L: gait ? -0.7 * Math.sin(ph) : 0.05, R: gait ? 0.7 * Math.sin(ph) : -0.05 },
      vis: options.vis ?? 0.95,
    };
    params.push(p);
    const t = i / fps;
    const pose = render(p);
    // gürültü
    if (noise > 0) {
      for (let j = 0; j < 33; j++) {
        pose.lm[j * 4] += (gauss(R) * noise * (options.T ?? T_PX)) / DIMS.w;
        pose.lm[j * 4 + 1] += (gauss(R) * noise * (options.T ?? T_PX)) / DIMS.h;
        pose.lm[j * 4 + 3] = clamp01(pose.lm[j * 4 + 3] - Math.abs(gauss(R)) * 0.03);
      }
    }
    frames.push({ t, poses: [pose], truth: { sc, p } });
  }
  // kare kaybı
  for (const [a, b] of options.dropouts ?? []) {
    for (const f of frames) if (f.t >= a && f.t < b) f.poses = [];
  }
  // tek karelik sıçramalar (yanlış tespit): bir eklemi 2 gövde boyu savur
  for (let k = 0; k < (options.spikes ?? 0); k++) {
    const i = 3 + Math.floor(R() * (frames.length - 6));
    const pose = frames[i].poses[0];
    if (!pose) continue;
    const j = [25, 26, 27, 28][Math.floor(R() * 4)];
    pose.lm[j * 4] += (2 * T_PX) / DIMS.w;
  }
  return frames;
}

/** Birden çok kişiyi tek kare dizisine birleştirir; sıra her karede karıştırılır (MediaPipe sıra garantisi vermez). */
export function merge(people, seed = 3) {
  const R = rng(seed);
  const n = Math.max(...people.map((p) => p.length));
  const out = [];
  for (let i = 0; i < n; i++) {
    const poses = [];
    const ids = [];
    people.forEach((pf, pi) => {
      const f = pf[i];
      if (f && f.poses[0]) {
        poses.push(f.poses[0]);
        ids.push(pi);
      }
    });
    // karıştır
    for (let a = poses.length - 1; a > 0; a--) {
      const b = Math.floor(R() * (a + 1));
      [poses[a], poses[b]] = [poses[b], poses[a]];
      [ids[a], ids[b]] = [ids[b], ids[a]];
    }
    out.push({ t: people[0][i]?.t ?? i, poses, ids });
  }
  return out;
}

// ── Hazır senaryolar ───────────────────────────────────────────

const strikeBase = { a0: 0.1, aBack: -0.8, aFront: 1.0, kBack: 1.9, kEnd: 0.15 };

/** t0 anında biten vuruş: [t0−0.45, t0−0.15] geri savurma, [t0−0.15, t0] vuruş, [t0, t0+0.35] takip. */
export function kickLeg(t, t0, o = {}) {
  const s = { ...strikeBase, ...o };
  if (t < t0 - 0.45 || t > t0 + 0.35) return null;
  if (t < t0 - 0.15) {
    const u = smooth((t - (t0 - 0.45)) / 0.3);
    return { a: lerp(s.a0, s.aBack, u), k: lerp(0.3, s.kBack, u) };
  }
  if (t < t0) {
    const u = ease((t - (t0 - 0.15)) / 0.15);
    return { a: lerp(s.aBack, s.aFront, u), k: lerp(s.kBack, s.kEnd, Math.pow((t - (t0 - 0.15)) / 0.15, 1.3)) };
  }
  const u = smooth((t - t0) / 0.35);
  return { a: lerp(s.aFront, 0.2, u), k: lerp(s.kEnd, 0.4, u) };
}

/** Üç vuruşlu klip: hafif yürüyüş + vuruşlar (sağ, sol, sağ). Doğru tepe anları döner. */
export function kicksClip(options = {}) {
  const hits = options.hits ?? [
    { t: 1.6, side: 'R' },
    { t: 3.6, side: 'L' },
    { t: 5.4, side: 'R' },
  ];
  const supportK = options.supportK ?? 0.45;
  const script = (t) => {
    const sc = { v: 0.6, stride: 0, lean: options.lean ?? 0.05 };
    for (const h of hits) {
      const kl = kickLeg(t, h.t, options.kick);
      if (kl) {
        sc.legs = h.side === 'R' ? { R: kl, L: { a: -0.05, k: supportK } } : { L: kl, R: { a: -0.05, k: supportK } };
        sc.twist = 0.5 * Math.sin(Math.PI * clamp01((t - (h.t - 0.45)) / 0.8));
        sc.v = 0.3;
      }
    }
    return sc;
  };
  const frames = simulate(script, { duration: options.duration ?? 7, fps: options.fps ?? 30, noise: options.noise ?? 0, seed: options.seed ?? 11, dropouts: options.dropouts, spikes: options.spikes, ...(options.sim ?? {}) });
  return { frames, truth: hits.map((h) => ({ type: 'vurus', t: h.t, side: h.side === 'R' ? 'sağ' : 'sol' })) };
}

/** Sabit tempoyla koşu (vuruş OLMAMALI). */
export function runningClip(options = {}) {
  const v = options.v ?? 8;
  const script = () => ({ v, stride: 1.4, lean: 0.14 });
  return { frames: simulate(script, { duration: options.duration ?? 6, fps: options.fps ?? 30, noise: options.noise ?? 0, seed: options.seed ?? 5, ...(options.sim ?? {}) }), truth: [] };
}

/** Yürüyüş (vuruş OLMAMALI). */
export function walkingClip(options = {}) {
  const script = () => ({ v: 2.6, stride: 0.9, amp: 0.35, flex: 0.5, lean: 0.04 });
  return { frames: simulate(script, { duration: options.duration ?? 6, fps: options.fps ?? 30, noise: options.noise ?? 0, seed: 4, ...(options.sim ?? {}) }), truth: [] };
}

/** Yerinde duruş. */
export function standingClip(options = {}) {
  return { frames: simulate(() => ({ v: 0, stride: 0 }), { duration: options.duration ?? 5, fps: options.fps ?? 30, noise: options.noise ?? 0, seed: 2, ...(options.sim ?? {}) }), truth: [] };
}

/** 6 GB/sn sağa koşu → 1,4–1,7 sn arasında dönüş → sola koşu. */
export function turnClip(options = {}) {
  const fps = options.fps ?? 30;
  const script = (t) => {
    const v = t < 1.4 ? 6 : t < 1.7 ? lerp(6, -6, (t - 1.4) / 0.3) : -6;
    return { v, stride: 1.4, lean: 0.12, yaw: t < 1.55 ? 0 : Math.PI };
  };
  return { frames: simulate(script, { duration: 3.4, fps, noise: options.noise ?? 0, seed: 8, ...(options.sim ?? {}) }), truth: [{ type: 'yon-degistirme', t: 1.55 }] };
}

/** Duruştan 12 GB/sn'ye hızlanma (2 sn), sonra sabit. */
export function sprintClip(options = {}) {
  const fps = options.fps ?? 30;
  const script = (t) => {
    const v = t < 0.8 ? 0 : t < 2.8 ? (12 * (t - 0.8)) / 2 : 12;
    return { v, stride: v > 0.3 ? 0.5 + v * 0.1 : 0, lean: 0.05 + 0.03 * Math.min(1, v / 6) };
  };
  return { frames: simulate(script, { duration: 4.2, fps, noise: options.noise ?? 0, seed: 9, ...(options.sim ?? {}) }), truth: [{ type: 'hizlanma', t: 2.8 }] };
}

/** Çömelme: 1,0–2,4 sn arası. */
export function crouchClip(options = {}) {
  const fps = options.fps ?? 30;
  const script = (t) => {
    const u = t < 1 ? 0 : t < 1.4 ? smooth((t - 1) / 0.4) : t < 2.2 ? 1 : t < 2.6 ? 1 - smooth((t - 2.2) / 0.4) : 0;
    return {
      v: 0,
      stride: 0,
      legs: { L: { a: lerp(0.02, 1.0, u), k: lerp(0.1, 2.0, u) }, R: { a: lerp(0, 1.0, u), k: lerp(0.1, 2.0, u) } },
      lean: lerp(0.03, 0.5, u),
    };
  };
  return { frames: simulate(script, { duration: 3.8, fps, noise: options.noise ?? 0, seed: 12, ...(options.sim ?? {}) }), truth: [{ type: 'comelme', t: 1.8 }] };
}

/** Sağ bacak havada tek ayak duruşu: 1,0–2,6 sn. */
export function oneLegClip(options = {}) {
  const fps = options.fps ?? 30;
  const script = (t) => {
    const u = t < 1 ? 0 : t < 1.3 ? smooth((t - 1) / 0.3) : t < 2.3 ? 1 : t < 2.6 ? 1 - smooth((t - 2.3) / 0.3) : 0;
    return { v: 0, stride: 0, legs: { L: { a: 0.02, k: 0.1 }, R: { a: lerp(0, 0.8, u), k: lerp(0.1, 1.6, u) } } };
  };
  return { frames: simulate(script, { duration: 4, fps, noise: options.noise ?? 0, seed: 13, ...(options.sim ?? {}) }), truth: [{ type: 'durus', t: 1.8, support: 'sol' }] };
}

/** Eşleşme ölçümü: olaylar ile gerçek anlar arasında tolerans içinde eşleştirme. */
export function score(events, truth, type, tol) {
  const ev = events.filter((e) => e.type === type);
  const used = new Set();
  let tp = 0;
  for (const g of truth.filter((x) => x.type === type)) {
    let best = -1;
    let bd = Infinity;
    ev.forEach((e, i) => {
      if (used.has(i)) return;
      const d = Math.abs(e.t - g.t);
      if (d < bd && d <= tol) {
        bd = d;
        best = i;
      }
    });
    if (best >= 0) {
      used.add(best);
      tp++;
    }
  }
  const nTruth = truth.filter((x) => x.type === type).length;
  return { tp, fp: ev.length - tp, fn: nTruth - tp, precision: ev.length ? tp / ev.length : nTruth ? 0 : 1, recall: nTruth ? tp / nTruth : 1 };
}
