// Frame governor behaviour on synthetic devices: node --experimental-strip-types scripts/test-governor.ts
import { FrameGovernor, type GovernorStep } from '../src/core/governor.ts';

let failed = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`);
  if (!ok) failed++;
};

/** Simulate `seconds` of frames; `cost(level)` is the GPU/CPU time of one frame (ms). */
function run(cost: (level: number) => number, seconds: number, vsync = 1000 / 60) {
  let applied = 0;
  const steps: GovernorStep[] = Array.from({ length: 6 }, (_, i) => ({
    name: `s${i}`,
    apply: () => applied++,
    revert: () => applied--,
  }));
  const g = new FrameGovernor(steps);
  let t = 0;
  let changes = 0;
  let lastLevel = 0;
  const tail: number[] = [];
  // pipelined GPU: frames finish every `cost` ms and are shown on the next vsync
  // (or the display's own cap); rAF follows presentation
  let gpu = 0;
  let prev = 0;
  while (t < seconds * 1000) {
    const c = Math.max(cost(g.level), 1);
    gpu = Math.max(gpu, prev - vsync) + c; // the CPU may run one frame ahead
    const present = Math.max(Math.ceil(gpu / vsync - 1e-9) * vsync, prev + vsync);
    const interval = present - prev;
    prev = present;
    t = present;
    g.tick(t);
    if (g.level !== lastLevel) {
      changes++;
      lastLevel = g.level;
    }
    if (t > (seconds - 20) * 1000) tail.push(interval);
  }
  tail.sort((a, b) => a - b);
  const tailMean = tail.reduce((a, b) => a + b, 0) / tail.length;
  return { level: g.level, applied, changes, locked: g.locked, tailMedian: tailMean, history: g.history };
}

// 1) slow GPU on a 2× screen: 31 ms at full quality; realistic step savings
//    (pixel ratio 2 → 1.6 → 1, bloom, shadows, detail radii, pixel ratio 0.8)
const SAVE = [0.7, 0.55, 0.92, 0.9, 0.85, 0.75];
const costAt = (base: number) => (l: number) => SAVE.slice(0, l).reduce((c, f) => c * f, base);
{
  const r = run(costAt(31), 240);
  check(r.applied === r.level, 'steps applied == level');
  check(r.tailMedian <= 17.8, `slow GPU settles at 60 Hz (median ${r.tailMedian.toFixed(1)} ms, level ${r.level})`);
  check(r.changes <= 10, `slow GPU: few changes (${r.changes})`);
}
// 1b) very slow GPU on a 1× screen (no pixel-ratio headroom): 26 ms, small steps
{
  const r = run((l) => 26 * Math.pow(0.88, l), 240);
  check(r.tailMedian <= 17.8 || r.level === 6, `1× slow GPU improves (median ${r.tailMedian.toFixed(1)} ms, level ${r.level})`);
}
// 2) display capped at 30 Hz: nothing helps → revert and lock at full quality
{
  const r = run(() => 12, 120, 1000 / 30);
  check(r.level === 0 && r.locked, `30 Hz display: back to full quality and locked (level ${r.level})`);
  check(r.changes <= 4, `30 Hz display: one short try (${r.changes} changes)`);
}
// 3) fast device: no change at all
{
  const r = run(() => 9, 120);
  check(r.level === 0 && r.changes === 0, 'fast device untouched');
}
// 4) borderline device: 21 ms at level 0, 15 ms at level 1 → must not flip-flop
{
  const r = run((l) => (l === 0 ? 21 : 15), 600);
  check(r.changes <= 8, `borderline device: bounded flips over 10 min (${r.changes})`);
  check(r.level >= 1, `borderline device ends degraded one step (level ${r.level})`);
}
console.log(failed ? `${failed} governor checks failed` : 'all governor checks passed');
process.exit(failed ? 1 : 0);
