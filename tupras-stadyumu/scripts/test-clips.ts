/* Camera clip checks (STEP 03): continuity, smoothness and clearance. Run: npm run test:clips */
import { Vector3 } from 'three';
import { buildLayout, seatEye, type StadiumLayout } from '../src/stadium/layout.ts';
import { FASCIA, FACADE, PITCH_ELEVATION, ROOF, LOWER, UPPER } from '../src/stadium/config.ts';
import { Flight, insideFrame, PICKER_MAX, planEnter, planExit, planToFrame, planToSeat, overOpening, regionFrame, roofUnderside, seatFrame, type KeyFrame } from '../src/camera/clips.ts';
import { buildRegions } from '../src/ui/regions.ts';
import { buildViews, middleSeat } from '../src/camera/views.ts';
import type { CameraPose } from '../src/camera/views.ts';

const Y = PITCH_ELEVATION;
const L = buildLayout();
const views = buildViews(L);
let failures = 0;
const fail = (m: string) => {
  failures++;
  if (failures < 40) console.error('FAIL', m);
};

/** Distance from the front curve along the outward normal + plan angle, for a point. */
function standCoords(layout: StadiumLayout, x: number, z: number) {
  const t = Math.atan2(z, x);
  // march along the normal of the front curve point at the same plan angle (good enough near the stands)
  const q = layout.front.point(t);
  const n = layout.front.normal(t);
  const d = (x - q.x) * n.x + (z - q.z) * n.z;
  return { t, d };
}

function rowSurface(prof: { d: number; y: number }[], rows: number, d: number): number | null {
  if (d < prof[0].d || d > prof[rows].d) return null;
  let r = 0;
  while (r < rows - 1 && d > prof[r + 1].d) r++;
  return prof[r].y;
}

function blockAt(layout: StadiumLayout, tier: 'lower' | 'upper', t: number) {
  const tt = ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  for (const b of layout.blocks) {
    if (b.tier !== tier) continue;
    const a0 = b.t0, a1 = b.t1;
    if ((tt >= a0 && tt <= a1) || (tt + 2 * Math.PI >= a0 && tt + 2 * Math.PI <= a1)) return b;
  }
  return null;
}

/** Returns a reason string if the camera at p (world) intersects the structure. */
function collides(layout: StadiumLayout, p: Vector3): string | null {
  const yl = p.y - Y;
  const o = layout.outer;
  const inRing = Math.pow(Math.abs(p.x) / o.a, o.p) + Math.pow(Math.abs(p.z) / o.b, o.p) < 1;
  if (!inRing) return null;
  if (yl < 0.6) return 'below pitch';
  // roof structure: from its underside (lower ring/radials) up to above the membrane
  const under = roofUnderside(layout, p.x, p.z);
  if (under !== Infinity && yl > under - 0.4 && yl < FACADE.ringY + FACADE.ringWave + 2.5) return `roof (y=${yl.toFixed(1)} under=${under.toFixed(1)})`;
  void overOpening;
  void ROOF;
  const { t, d } = standCoords(layout, p.x, p.z);
  if (d < -0.4) return null; // over the pitch / run-off
  // lower tier
  const lb = blockAt(layout, 'lower', t);
  if (lb) {
    const s = rowSurface(layout.lowerProfile, lb.rows, d);
    if (s !== null && yl < s + 1.0) return `lower tier ${lb.code} d=${d.toFixed(1)} y=${yl.toFixed(1)} surf=${s.toFixed(1)}`;
    if (d < 0.3 && yl < layout.lowerProfile[0].y + 1.0) return 'front parapet';
  }
  // upper tier slab: solid between soffit and treads
  const ub = blockAt(layout, 'upper', t);
  if (ub && d > FASCIA.d - 0.3 && d < UPPER.firstRowD + ub.rows * UPPER.tread + 0.4) {
    const s = rowSurface(layout.upperProfile, ub.rows, Math.max(d, UPPER.firstRowD)) ?? layout.upperProfile[0].y;
    const soffit = Math.max(FASCIA.bottomY, s - 2.1);
    if (yl > soffit - 0.3 && yl < s + 1.0) return `upper tier ${ub.code} d=${d.toFixed(1)} y=${yl.toFixed(1)}`;
  }
  // behind the lower tier (suites/concourse) below the soffit is only for suite seats
  if (d > LOWER.firstRowD + LOWER.maxRows * LOWER.tread + 2.2 && yl < FASCIA.bottomY) return 'inside suites / concourse';
  return null;
}

interface Stats {
  maxStep: number;
  maxAng: number;
  maxAcc: number;
  dur: number;
}

/**
 * maxDuration: the picker's capped UI moves — faster than the drone limits,
 * so only collisions, continuity and turn rate are checked for them.
 */
function check(name: string, frames: KeyFrame[], from: CameraPose, endPos: Vector3, exempt: Vector3[], maxDuration = Infinity): Stats {
  const f = new Flight(frames, 1, maxDuration);
  const capped = Number.isFinite(maxDuration);
  if (f.duration > maxDuration + 1e-6) fail(`${name}: ${f.duration.toFixed(2)} s is over the ${maxDuration} s cap`);
  const pose: CameraPose = { position: new Vector3(), target: new Vector3(), fov: 50 };
  const dt = 1 / 60;
  let prevP: Vector3 | null = null;
  let prevD: Vector3 | null = null;
  let prevV = 0;
  let accAt = '';
  let prevAcc = 0;
  const st: Stats = { maxStep: 0, maxAng: 0, maxAcc: 0, dur: f.duration };
  f.poseAt(0, pose);
  if (pose.position.distanceTo(from.position) > 1e-3) fail(`${name}: does not start at the current pose`);
  for (let tm = 0; tm <= f.duration + 1e-9; tm += dt) {
    f.poseAt(tm, pose);
    const dir = pose.target.clone().sub(pose.position).normalize();
    if (prevP && prevD) {
      const step = pose.position.distanceTo(prevP);
      const allowed = (capped ? 2.6 : 1.0) + (capped ? 0.03 : 0.012) * Math.max(0, pose.position.y - Y);
      if (step > allowed) {
        fail(`${name}: too fast ${(step * 60).toFixed(0)} m/s at height ${(pose.position.y - Y).toFixed(0)} m (t=${tm.toFixed(2)})`);
        break;
      }
      const ang = (Math.acos(Math.min(1, Math.max(-1, dir.dot(prevD)))) * 180) / Math.PI;
      const v = step / dt;
      st.maxStep = Math.max(st.maxStep, step);
      st.maxAng = Math.max(st.maxAng, ang);
      // relative speed change per frame: a discontinuity shows up as a spike
      const acc = (v - prevV) / dt;
      if (Math.abs(acc) > (capped ? 260 : 70) + (capped ? 2 : 0.7) * Math.max(0, pose.position.y - Y)) {
        fail(`${name}: harsh acceleration ${acc.toFixed(0)} m/s² at t=${tm.toFixed(2)}`);
        break;
      }
      // a velocity discontinuity shows up as a spike in the change of acceleration
      if (tm > 2 * dt && Math.abs(acc - prevAcc) > st.maxAcc) {
        st.maxAcc = Math.abs(acc - prevAcc);
        accAt = `t=${tm.toFixed(2)}/${f.duration.toFixed(2)} a=${prevAcc.toFixed(1)}→${acc.toFixed(1)} seg=${f.segmentAt(tm).label}`;
      }
      prevAcc = acc;
      if (ang > st.maxAng) worstTurn = `${name} t=${tm.toFixed(2)} seg=${f.segmentAt(tm).label}`;
      prevV = v;
    }
    const nearExempt = exempt.some((e) => e.distanceTo(pose.position) < 2.6);
    if (!nearExempt) {
      const c = collides(L, pose.position);
      if (c) {
        fail(`${name}: collision at t=${tm.toFixed(2)}s (${c}) pos=${pose.position.toArray().map((v) => v.toFixed(1))}`);
        break;
      }
    }
    if (pose.target.distanceTo(pose.position) < 3) fail(`${name}: look target collapses onto the camera at t=${tm.toFixed(2)}`);
    prevP = pose.position.clone();
    prevD = dir;
  }
  f.poseAt(f.duration, pose);
  if (pose.position.distanceTo(endPos) > 1e-3) fail(`${name}: does not end at the destination`);
  // clip boundaries: frame i is exactly the end of clip i-1 and the start of clip i
  for (let i = 1; i < frames.length - 1; i++) {
    f.poseAt(f.segments[i - 1].end, pose);
    if (pose.position.distanceTo(frames[i].position) > 1e-3) fail(`${name}: clip ${i} end frame mismatch`);
  }
  if (st.maxAng > (capped ? 3.2 : 2.6)) fail(`${name}: rotation jump ${st.maxAng.toFixed(2)}°/frame`);
  if (st.maxAcc > (capped ? 60 : 25)) fail(`${name}: speed discontinuity (acceleration jumps ${st.maxAcc.toFixed(1)} m/s² in one frame) at ${accAt}`);
  return st;
}

let worstTurn = '';
const aerial: CameraPose = { position: new Vector3(-260, Y + 210, 330), target: new Vector3(0, Y + 8, 0), fov: 50 };
const all: Stats[] = [];

// 1. from the aerial start to the middle seat of every block, and to a sample of suites
const targets = L.blocks.filter((b) => b.tier !== 'suite').map((b) => middleSeat(L, b.index, Math.ceil(b.rows / 2), 0.3));
for (const si of L.suiteBlocks.filter((_, i) => i % 12 === 0)) targets.push(middleSeat(L, si, 1));
for (const s of targets) {
  const frames = planToSeat({ layout: L }, aerial, s);
  const e = seatEye(L, s);
  const endP = new Vector3(e.x, e.y + Y, e.z);
  all.push(check(`aerial→${L.blocks[L.seats.block[s]].code}`, frames, aerial, endP, [endP]));
}

// 2. seat → seat: same block, neighbouring block, opposite stand, upper ↔ lower, suite ↔ seat
const pairs: [number, number][] = [];
const byCode = (c: string) => L.blocks.find((b) => b.code === c)!.index;
pairs.push([middleSeat(L, byCode('105'), 4, 0.2), middleSeat(L, byCode('105'), 18, 0.8)]);
pairs.push([middleSeat(L, byCode('105'), 20, 0.5), middleSeat(L, byCode('106'), 20, 0.5)]);
pairs.push([middleSeat(L, byCode('110'), 12, 0.3), middleSeat(L, byCode('122'), 12, 0.3)]);
pairs.push([middleSeat(L, byCode('416'), 12, 0.3), middleSeat(L, byCode('112'), 6, 0.3)]);
pairs.push([middleSeat(L, byCode('402'), 15, 0.3), middleSeat(L, byCode('420'), 3, 0.3)]);
pairs.push([middleSeat(L, L.suiteBlocks[73], 1), middleSeat(L, byCode('VIP'), 10, 0.5)]);
pairs.push([middleSeat(L, byCode('VIP'), 2, 0.5), middleSeat(L, L.suiteBlocks[10], 2)]);
for (const [a, b] of pairs) {
  const ea = seatEye(L, a);
  const from: CameraPose = { position: new Vector3(ea.x, ea.y + Y, ea.z), target: new Vector3(ea.x * -0.12, Y + 1.2, ea.z * -0.12), fov: 62 };
  const frames = planToSeat({ layout: L }, from, b);
  const eb = seatEye(L, b);
  const endP = new Vector3(eb.x, eb.y + Y, eb.z);
  all.push(check(`seat ${L.blocks[L.seats.block[a]].code}→${L.blocks[L.seats.block[b]].code}`, frames, from, endP, [from.position, endP]));
}

// 3. every locked view to every other (the views bar)
for (const a of views) {
  for (const b of views) {
    if (a === b) continue;
    let frames: KeyFrame[];
    const dest: KeyFrame = { position: b.position.clone(), target: b.target.clone(), fov: b.fov, label: b.label };
    if (b.seat !== undefined) frames = planToSeat({ layout: L }, a, b.seat);
    else frames = planToFrame({ layout: L }, a, dest, null);
    const ex = [a.position, b.position];
    all.push(check(`view ${a.id}→${b.id}`, frames, a, b.position, ex));
  }
}

// 4. the picker: start pose → inside → every region → a seat there → back → out (capped UI moves)
const picker: Stats[] = [];
for (const portrait of [false, true]) {
  const start: CameraPose = portrait
    ? { position: new Vector3(-70, 280, 520), target: new Vector3(-11, -40, 144), fov: 58 }
    : { position: new Vector3(-60, 240, 430), target: new Vector3(-30, 4, 0), fov: 50 };
  const tag = portrait ? 'portrait' : 'landscape';
  const inside = insideFrame(portrait);
  picker.push(check(`picker ${tag} enter`, planEnter({ layout: L }, start, inside), start, inside.position, [], PICKER_MAX.enter));
  for (const r of buildRegions(L)) {
    const rf = regionFrame(L, r.frameBlock, r.kind, portrait);
    if (!overOpening(rf.position.x, rf.position.z, 4)) fail(`picker ${r.id}: region frame not over the opening`);
    picker.push(check(`picker ${tag} inside→${r.id}`, planToFrame({ layout: L }, inside, rf, null), inside, rf.position, [], PICKER_MAX.region));
    const ends = [r.anchor, r.blocks[0], r.blocks[r.blocks.length - 1]];
    for (const b of ends) {
      const s = b.tier === 'suite' ? middleSeat(L, b.index, 1) : middleSeat(L, b.index, Math.ceil(b.rows / 2), 0.5);
      const sf = seatFrame(L, s);
      picker.push(check(`picker ${tag} ${r.id}→${b.code}`, planToSeat({ layout: L }, rf, s), rf, sf.position, [sf.position], PICKER_MAX.seat));
      picker.push(check(`picker ${tag} ${b.code}→${r.id}`, planToFrame({ layout: L }, sf, rf, null), sf, rf.position, [sf.position], PICKER_MAX.back));
    }
    picker.push(check(`picker ${tag} ${r.id}→inside`, planToFrame({ layout: L }, rf, inside, null), rf, inside.position, [], PICKER_MAX.region));
  }
  const out: KeyFrame = { ...start, position: start.position.clone(), target: start.target.clone(), label: 'Dışarı' };
  picker.push(check(`picker ${tag} exit`, planExit({ layout: L }, inside, out), inside, start.position, [], PICKER_MAX.exit));
}
const pmax = (k: keyof Stats) => Math.max(...picker.map((s) => s[k]));
console.log(`picker flights: ${picker.length} · max step ${pmax('maxStep').toFixed(2)} m/frame · max turn ${pmax('maxAng').toFixed(2)}°/frame · max accel jump ${pmax('maxAcc').toFixed(1)} · durations ${Math.min(...picker.map((s) => s.dur)).toFixed(1)}–${pmax('dur').toFixed(1)} s`);

{
  const s = middleSeat(L, L.blocks.find((b) => b.code === '416')!.index, 10, 0.3);
  const fl = new Flight(planToSeat({ layout: L }, aerial, s));
  console.log('aerial→416 clips:', fl.segments.map((g) => `${g.label} ${(g.end - g.start).toFixed(1)}s`).join(' · '), `= ${fl.duration.toFixed(1)} s`);
}
const max = (k: keyof Stats) => Math.max(...all.map((s) => s[k]));
console.log(`flights checked: ${all.length}`);
console.log(`max step ${max('maxStep').toFixed(2)} m/frame · max turn ${max('maxAng').toFixed(2)}°/frame · max accel jump ${max('maxAcc').toFixed(1)} m/s²/frame · durations ${Math.min(...all.map((s) => s.dur)).toFixed(1)}–${max('dur').toFixed(1)} s`);
console.log('worst turn:', worstTurn);
if (failures) {
  console.error(`${failures} problem(s)`);
  process.exit(1);
}
console.log('all clip checks passed');
