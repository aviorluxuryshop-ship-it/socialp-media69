import { useMemo } from 'react';
import { SEG, type Vec2 } from '@/lib/motion/rig';
import { compileMotion, frameAt, type Frame, type TechMotion } from '@/lib/motion/timeline';
import { f1 } from './draw';

// "Üstten bakış" kutusu: yandan görünümde okunamayan yönleri (kavis, top yönlendirme, baskı) gösterir.
// Yukarı = oyuncunun önü, sağ = oyuncunun sağı. Şematiktir; ölçek topun yoluna göre sığdırılır.

const W = 132;
const H = 156;
const PAD = 16;
const STEP = 0.04;

interface PlanPath {
  /** topun planı: [x, z] */
  ball: Vec2[];
  /** oyuncu pelvisinin x'i (z = 0) */
  player: number[];
  /** [x0, x1, z0, z1] kapsayan kutu */
  box: [number, number, number, number];
}

export function planPath(m: TechMotion): PlanPath {
  const c = compileMotion(m);
  const n = Math.ceil(m.dur / STEP);
  const ball: Vec2[] = [];
  const player: number[] = [];
  for (let i = 0; i <= n; i++) {
    const f = frameAt(m, Math.min(m.dur, i * STEP), c);
    ball.push([f.ball.x, f.ball.z]);
    player.push(f.sk.pelvis[0]);
  }
  let x0 = Infinity,
    x1 = -Infinity,
    z0 = Infinity,
    z1 = -Infinity;
  const add = (x: number, z: number) => {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    z0 = Math.min(z0, z);
    z1 = Math.max(z1, z);
  };
  ball.forEach(([x, z]) => add(x, z));
  player.forEach((x) => add(x, 0));
  if (m.plan?.press) add(m.plan.press[0], m.plan.press[1]);
  return { ball, player, box: [x0, x1, z0, z1] };
}

export function PlanView({ m, frame, label }: { m: TechMotion; frame: Frame; label: string }) {
  const path = useMemo(() => planPath(m), [m]);
  const [x0, x1, z0, z1] = path.box;
  // en az 1,6 m genişlik / 1,6 m yükseklik göster; içerik ortalanır
  const xr = Math.max(1.6, x1 - x0);
  const zr = Math.max(1.6, z1 - z0);
  const s = Math.min((W - 2 * PAD) / zr, (H - 2 * PAD) / xr);
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const T = (x: number, z: number): Vec2 => [W / 2 + (z - cz) * s, H / 2 - (x - cx) * s];

  const i = Math.min(path.ball.length - 1, Math.max(0, Math.round(frame.t / STEP)));
  const full = path.ball.map(([x, z]) => T(x, z));
  const toD = (pts: Vec2[]) => 'M' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L');
  const done = full.slice(0, i + 1);
  const pl = T(frame.sk.pelvis[0], 0);
  const b = T(frame.ball.x, frame.ball.z);
  const press = m.plan?.press ? T(m.plan.press[0], m.plan.press[1]) : null;
  const rBall = Math.max(2.6, SEG.ball * s);

  return (
    <svg className="tm-plan" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} focusable="false" xmlns="http://www.w3.org/2000/svg" data-plan>
      {/* ileri yönü gösteren ince ok */}
      <path d={`M${W - 12} ${H - 12}V${H - 34}m-3.5 5.5L${W - 12} ${H - 34}l3.5 5.5`} fill="none" stroke="#f3f0e5" strokeOpacity=".4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* topun tüm yolu (soluk) ve gidilen kısım */}
      <path d={toD(full)} fill="none" stroke="#f3f0e5" strokeOpacity=".28" strokeWidth="1.4" strokeDasharray="2.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={toD(done)} fill="none" stroke="#c2f53c" strokeOpacity=".9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {press && (
        <g transform={`translate(${f1(press[0])} ${f1(press[1])})`} data-press>
          <circle r="6.6" fill="#ff6142" fillOpacity=".16" stroke="#ff6142" strokeWidth="1.4" />
          <path d="M-2.6 -2.6l5.2 5.2m0 -5.2l-5.2 5.2" stroke="#ff9078" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )}
      {/* oyuncu: daire + ön yön işareti */}
      <g transform={`translate(${f1(pl[0])} ${f1(pl[1])})`}>
        <ellipse rx="7.2" ry="4.4" fill="#d5d3c8" stroke="#050807" strokeWidth=".9" />
        <path d="M-3.2 -5.6L0 -9.6L3.2 -5.6Z" fill="#d5d3c8" stroke="#050807" strokeWidth=".8" strokeLinejoin="round" />
      </g>
      {/* top */}
      <circle cx={f1(b[0])} cy={f1(b[1])} r={f1(rBall)} fill="#f3f0e5" stroke="#050807" strokeWidth="1" />
    </svg>
  );
}
