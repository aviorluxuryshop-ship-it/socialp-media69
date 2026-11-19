/* Logic checks for the seat map: run with `npm test`. */
import { buildLayout, seatEye } from '../src/stadium/layout.ts';
import { CATEGORIES } from '../src/stadium/config.ts';

let failures = 0;
const check = (ok: boolean, msg: string) => {
  if (!ok) { failures++; console.error('FAIL', msg); } else console.log('ok  ', msg);
};

const t0 = performance.now();
const L = buildLayout();
const ms = performance.now() - t0;
console.log('layout built in', ms.toFixed(0), 'ms');
console.log('totals', L.totals);
const byStand: Record<string, number> = {};
for (const b of L.blocks) byStand[b.stand + ':' + b.tier] = (byStand[b.stand + ':' + b.tier] ?? 0) + b.seatCount;
console.log('by stand', byStand);
console.log('upper rows', L.blocks.filter(b => b.tier === 'upper').map(b => `${b.code}:${b.rows}`).join(' '));
console.log('lower', L.blocks.filter(b => b.tier === 'lower').map(b => `${b.code}:${b.stand[0]}:${b.seatCount}`).join(' '));
console.log('upper', L.blocks.filter(b => b.tier === 'upper').map(b => `${b.code}:${b.stand[0]}:${b.seatCount}`).join(' '));

const S = L.seats;
// 1. capacity within 6% of the official 42,684
check(Math.abs(S.count - 42684) / 42684 < 0.06, `capacity ${S.count} ≈ 42 684`);
check(L.totals.suites === 147 * 12, 'suite seats = 147 × 12');
// 2. unique (block,row,num)
const keys = new Set<string>();
let dup = 0;
for (let i = 0; i < S.count; i++) {
  const k = `${S.block[i]}-${S.row[i]}-${S.num[i]}`;
  if (keys.has(k)) dup++;
  keys.add(k);
}
check(dup === 0, `unique seat ids (${dup} duplicates)`);
// 3. every seat faces the pitch centre (within 60°)
let bad = 0;
for (let i = 0; i < S.count; i++) {
  const x = S.pos[i * 3], z = S.pos[i * 3 + 2];
  const fx = Math.sin(S.yaw[i]), fz = Math.cos(S.yaw[i]);
  const l = Math.hypot(x, z);
  if ((-x * fx - z * fz) / l < 0.5) bad++;
}
check(bad === 0, `seats face the pitch (${bad} off)`);
// 4. no two seats closer than 0.45 m in the same block row
let tooClose = 0;
for (const b of L.blocks) {
  for (let r = 0; r < b.rows; r++) {
    for (let i = b.rowStart[r]; i < b.rowStart[r + 1] - 1; i++) {
      const d = Math.hypot(S.pos[i * 3] - S.pos[i * 3 + 3], S.pos[i * 3 + 2] - S.pos[i * 3 + 5]);
      if (d < 0.45) tooClose++;
    }
  }
}
check(tooClose === 0, `seat spacing ≥ 0.45 m (${tooClose} too close)`);
// 5. seats from adjacent blocks never overlap (min distance across all seats via grid)
const cell = 0.5; const grid = new Map<string, number[]>();
for (let i = 0; i < S.count; i++) {
  const k = `${Math.floor(S.pos[i*3]/cell)},${Math.floor(S.pos[i*3+1]/cell)},${Math.floor(S.pos[i*3+2]/cell)}`;
  (grid.get(k) ?? grid.set(k, []).get(k)!).push(i);
}
let overlaps = 0;
for (let i = 0; i < S.count; i++) {
  const cx = Math.floor(S.pos[i*3]/cell), cy = Math.floor(S.pos[i*3+1]/cell), cz = Math.floor(S.pos[i*3+2]/cell);
  for (let dx=-1;dx<=1;dx++) for (let dy=-1;dy<=1;dy++) for (let dz=-1;dz<=1;dz++) {
    for (const j of grid.get(`${cx+dx},${cy+dy},${cz+dz}`) ?? []) {
      if (j <= i) continue;
      const d = Math.hypot(S.pos[i*3]-S.pos[j*3], S.pos[i*3+1]-S.pos[j*3+1], S.pos[i*3+2]-S.pos[j*3+2]);
      if (d < 0.44) overlaps++;
    }
  }
}
check(overlaps === 0, `no overlapping seats (${overlaps})`);
// 6. eye positions are above their seat and inside the bowl
const e = seatEye(L, 1000);
check(e.y > S.pos[1001] && e.y < 40, 'seat eye height');
// 7. categories valid
let badCat = 0;
for (let i = 0; i < S.count; i++) if (!CATEGORIES[S.category[i]]) badCat++;
check(badCat === 0, 'categories valid');
// 8. block naming
const codes = L.blocks.filter(b => b.tier !== 'suite').map(b => b.code);
check(codes.includes('115') && codes.includes('VIP') && codes.includes('BASIN') && codes.includes('404'), 'expected block codes present');
const press = L.blocks.find(b => b.code === 'BASIN')!, vip = L.blocks.find(b => b.code === 'VIP')!;
check(press.stand === 'BATI' && vip.stand === 'BATI', 'VIP and press box on the west main stand');
const b415 = L.blocks.find(b => b.code === '415')!, b416 = L.blocks.find(b => b.code === '416')!;
check(b415.stand === 'BATI' && b416.stand === 'BATI' && b415.index + 2 === b416.index, '415 / 416 flank the press box');
const doguRows = Math.max(...L.blocks.filter(b => b.tier === 'upper' && b.stand === 'DOGU').map(b => b.rows));
const batiRows = Math.max(...L.blocks.filter(b => b.tier === 'upper' && b.stand === 'BATI').map(b => b.rows));
check(doguRows < batiRows, `east upper tier kept lower (${doguRows} < ${batiRows} rows)`);
const b405 = L.blocks.find(b => b.code === '405')!;
check(b405.center[0] > 0 && b405.center[2] < 0, '405 (away) in the south-east corner');
const sold = Array.from(S.sold).filter(v => v === 1).length;
console.log('sold share', (sold / S.count).toFixed(2));
if (failures) { console.error(failures, 'check(s) failed'); process.exit(1); }
console.log('all checks passed');
