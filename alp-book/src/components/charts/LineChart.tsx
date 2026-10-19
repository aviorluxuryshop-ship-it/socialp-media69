"use client";

import { useId, useState } from "react";
import { niceMax, useWidth } from "./useWidth";

export interface LinePoint {
  /** Tooltip başlığı (ör. "19 Eki Pzt"). */
  label: string;
  y: number | null;
}

/**
 * Zaman serisi çizgi grafiği. Kaydı olmayan günler (null) çizgide boşluk bırakır — sıfır sayılmaz.
 */
export function LineChart({
  points,
  unit,
  fmt = (n) => String(Math.round(n * 10) / 10),
  goal,
  domain,
  height = 190,
  color = "#00ff66",
  tick,
  ariaLabel,
}: {
  points: LinePoint[];
  unit: string;
  fmt?: (n: number) => string;
  goal?: { value: number; label: string };
  /** Sabit değer aralığı [alt, üst]; verilmezse 0'dan başlar. */
  domain?: [number, number];
  height?: number;
  color?: string;
  /** i. noktanın x ekseni etiketi (boş string = etiket yok). */
  tick: (i: number) => string;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");
  const L = 38, R = 10, T = 12, B = 24;
  const W = width, H = height;
  const iw = W - L - R, ih = H - T - B;
  const vals = points.map((p) => p.y).filter((v): v is number => v !== null);
  const lo = domain ? domain[0] : 0;
  const max = domain ? domain[1] : niceMax(Math.max(...vals, goal?.value ?? 0, 1) * 1.05);
  const n = points.length;
  const x = (i: number) => L + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => T + ih - ((v - lo) / (max - lo || 1)) * ih;

  const segs: { i: number; v: number }[][] = [];
  let cur: { i: number; v: number }[] = [];
  points.forEach((p, i) => {
    if (p.y === null) {
      if (cur.length) segs.push(cur);
      cur = [];
    } else cur.push({ i, v: p.y });
  });
  if (cur.length) segs.push(cur);

  const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 62))));
  const ticks = [0, 0.5, 1].map((f) => lo + f * (max - lo));

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - L) / iw) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, n === 1 ? 0 : i)));
  }

  const hp = hover !== null ? points[hover] : null;
  const tipLeft = hover !== null ? Math.min(Math.max(x(hover), 70), W - 70) : 0;

  return (
    <div ref={ref} className="relative w-full select-none">
      <svg width={W} height={H} role="img" aria-label={ariaLabel} onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} className="touch-pan-y">
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.16" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#1e1e24" strokeDasharray={t === lo ? undefined : "3 4"} />
            <text x={L - 8} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#6b6b76">{fmt(t)}</text>
          </g>
        ))}
        {goal && goal.value <= max && goal.value >= lo && (
          <g>
            <line x1={L} x2={W - R} y1={y(goal.value)} y2={y(goal.value)} stroke="#f2b35e" strokeOpacity="0.55" strokeDasharray="5 4" />
            <text x={W - R} y={y(goal.value) - 5} textAnchor="end" fontSize="10" fill="#f2b35e" stroke="#0e0e11" strokeWidth="3" paintOrder="stroke">{goal.label}</text>
          </g>
        )}
        {points.map((_, i) =>
          i % step === 0 ? (
            <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : "middle"} fontSize="10" fill="#6b6b76">
              {tick(i)}
            </text>
          ) : null,
        )}
        {segs.map((s, k) =>
          s.length > 1 ? (
            <g key={k}>
              <path d={`${s.map((p, j) => `${j ? "L" : "M"}${x(p.i)},${y(p.v)}`).join(" ")} L${x(s[s.length - 1].i)},${y(lo)} L${x(s[0].i)},${y(lo)} Z`} fill={`url(#${gid})`} />
              <path d={s.map((p, j) => `${j ? "L" : "M"}${x(p.i)},${y(p.v)}`).join(" ")} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          ) : null,
        )}
        {segs.flat().map((p) => (n <= 31 || segs.some((s) => s.length === 1 && s[0].i === p.i) ? <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r="2.6" fill="#0e0e11" stroke={color} strokeWidth="1.6" /> : null))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={T + ih} stroke="#3a3a44" />
            {hp?.y != null && <circle cx={x(hover)} cy={y(hp.y)} r="4.5" fill={color} stroke="#0e0e11" strokeWidth="2" />}
          </g>
        )}
      </svg>
      {hp && (
        <div className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg border border-line-2 bg-raised px-2.5 py-1.5 text-center shadow-lg" style={{ left: tipLeft }}>
          <p className="text-[11px] text-mute">{hp.label}</p>
          <p className="num text-[13px] font-semibold">{hp.y === null ? <span className="text-faint">Kayıt yok</span> : `${fmt(hp.y)} ${unit}`}</p>
        </div>
      )}
    </div>
  );
}
