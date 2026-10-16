'use client';

import { forwardRef, useId } from 'react';
import type { Actor, ArrowKind, Pt, Scene } from '@/lib/types';
import { fitView, projector, viewOf, type Arrow, type FrameState, type ViewDef } from '@/lib/scene';

/* ── Saha çizgileri (metre cinsinden, 105 × 68) ───────────── */
function PitchLines() {
  const sw = 0.34;
  const common = { fill: 'none', stroke: 'var(--pitch-line)', strokeWidth: sw } as const;
  const r = 9.15;
  const dy = Math.sqrt(r * r - 5.5 * 5.5);
  return (
    <g>
      {/* şerit desenli çim */}
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={i * 7.5} y={0} width={7.5} height={68} fill={i % 2 ? 'rgba(255,255,255,0.022)' : 'rgba(0,0,0,0.045)'} />
      ))}
      <rect x={0} y={0} width={105} height={68} {...common} />
      <path d="M52.5 0V68" {...common} />
      <circle cx={52.5} cy={34} r={r} {...common} />
      <circle cx={52.5} cy={34} r={0.5} fill="var(--pitch-line)" />
      {/* ceza sahaları */}
      <rect x={0} y={13.84} width={16.5} height={40.32} {...common} />
      <rect x={88.5} y={13.84} width={16.5} height={40.32} {...common} />
      <rect x={0} y={24.84} width={5.5} height={18.32} {...common} />
      <rect x={99.5} y={24.84} width={5.5} height={18.32} {...common} />
      <circle cx={11} cy={34} r={0.45} fill="var(--pitch-line)" />
      <circle cx={94} cy={34} r={0.45} fill="var(--pitch-line)" />
      <path d={`M16.5 ${34 - dy}A${r} ${r} 0 0 1 16.5 ${34 + dy}`} {...common} />
      <path d={`M88.5 ${34 - dy}A${r} ${r} 0 0 0 88.5 ${34 + dy}`} {...common} />
      {/* köşe yayları */}
      <path d="M0 1A1 1 0 0 0 1 0" {...common} />
      <path d="M104 0A1 1 0 0 0 105 1" {...common} />
      <path d="M0 67A1 1 0 0 1 1 68" {...common} />
      <path d="M105 67A1 1 0 0 0 104 68" {...common} />
      {/* kaleler */}
      <rect x={-2.2} y={30.34} width={2.2} height={7.32} fill="rgba(239,234,220,0.08)" stroke="var(--ivory-2)" strokeWidth={0.3} />
      <rect x={105} y={30.34} width={2.2} height={7.32} fill="rgba(239,234,220,0.08)" stroke="var(--ivory-2)" strokeWidth={0.3} />
    </g>
  );
}

/* ── Oklar ────────────────────────────────────────────────── */
function norm2(a: Pt, b: Pt): { d: number; ux: number; uy: number } {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy) || 1;
  return { d, ux: dx / d, uy: dy / d };
}

function arrowPath(
  kind: ArrowKind,
  a: Pt,
  b: Pt,
  curve: number,
  startCut: number,
  endCut: number,
  unit: number,
): string {
  const { d, ux, uy } = norm2(a, b);
  if (d < 0.6) return '';
  const s: Pt = [a[0] + ux * startCut, a[1] + uy * startCut];
  const e: Pt = [b[0] - ux * endCut, b[1] - uy * endCut];
  const nx = -uy;
  const ny = ux;

  const arc = kind === 'air' && !curve ? Math.min(6, d * 0.12) : curve;
  if (kind === 'dribble') {
    const len = Math.hypot(e[0] - s[0], e[1] - s[1]);
    const wl = unit * 1.9; // dalga boyu
    const amp = unit * 0.38;
    const n = Math.max(8, Math.ceil(len / (wl / 8)));
    let path = `M${s[0].toFixed(2)} ${s[1].toFixed(2)}`;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const off = Math.sin(t * (len / wl) * Math.PI * 2) * amp * Math.min(1, t * 6, (1 - t) * 6 + 0.15);
      path += `L${(s[0] + (e[0] - s[0]) * t + nx * off).toFixed(2)} ${(s[1] + (e[1] - s[1]) * t + ny * off).toFixed(2)}`;
    }
    return path;
  }
  if (arc) {
    const cx = (s[0] + e[0]) / 2 + nx * arc * 1.6;
    const cy = (s[1] + e[1]) / 2 + ny * arc * 1.6;
    return `M${s[0].toFixed(2)} ${s[1].toFixed(2)}Q${cx.toFixed(2)} ${cy.toFixed(2)} ${e[0].toFixed(2)} ${e[1].toFixed(2)}`;
  }
  return `M${s[0].toFixed(2)} ${s[1].toFixed(2)}L${e[0].toFixed(2)} ${e[1].toFixed(2)}`;
}

const KIND_STYLE: Record<
  ArrowKind,
  { color: string; dash?: string; w: number; head: string; cap?: 'round' | 'butt' }
> = {
  pass: { color: 'var(--ivory)', w: 1, head: 'ivory' },
  air: { color: 'var(--ivory)', dash: '0.1 1.5', w: 1.15, head: 'ivory', cap: 'round' },
  run: { color: 'var(--brass-hi)', dash: '2.1 1.5', w: 0.95, head: 'brass' },
  dribble: { color: 'var(--brass-hi)', w: 0.95, head: 'brass' },
  shot: { color: 'var(--terra)', w: 1.2, head: 'terra' },
  press: { color: 'var(--terra)', dash: '1.2 1.2', w: 0.95, head: 'terra' },
};

/* ── Bileşen ──────────────────────────────────────────────── */
export interface CanvasProps {
  scene: Scene;
  tl: FrameState[];
  frame: number;
  /** önceki adımların oklarını soluk göster */
  history?: boolean;
  vertical?: boolean;
  /** içeriğe göre otomatik kırp (varsayılan: açık) */
  fit?: boolean;
  /** doğrudan görünüm tanımı (tahta); verilirse fit yok sayılır */
  view?: ViewDef;
  instant?: boolean;
  durMs?: number;
  label: string;
  selected?: string | null;
  editable?: boolean;
  className?: string;
  onActorDown?: (id: string, e: React.PointerEvent) => void;
  onBallDown?: (e: React.PointerEvent) => void;
  onBgDown?: (e: React.PointerEvent) => void;
  onMove?: (e: React.PointerEvent) => void;
  onUp?: (e: React.PointerEvent) => void;
  drawing?: { kind: ArrowKind; from: Pt; to: Pt } | null;
  drawZone?: { x: number; y: number; w: number; h: number; k: 'free' | 'danger' | 'target' } | null;
}

const COLOR_FOR: Record<Actor['t'], { fill: string; ink: string }> = {
  a: { fill: 'var(--brass)', ink: 'var(--ink-950)' },
  b: { fill: '#b9523d', ink: 'var(--ivory)' },
  k: { fill: 'var(--mint)', ink: 'var(--ink-950)' },
  c: { fill: 'var(--brass-hi)', ink: 'var(--ink-950)' },
  m: { fill: 'none', ink: 'var(--ivory)' },
};

export const SceneCanvas = forwardRef<SVGSVGElement, CanvasProps>(function SceneCanvas(
  { scene, tl, frame, history = true, vertical, fit = true, view: viewProp, instant, durMs = 1250, label, selected, editable, className, onActorDown, onBallDown, onBgDown, onMove, onUp, drawing, drawZone },
  ref,
) {
  const uid = useId().replace(/:/g, '');
  const view: ViewDef = viewProp ?? (fit ? fitView(scene, tl, vertical) : viewOf(scene, vertical));
  const pr = projector(view);
  const u = view.unit;
  const cur = tl[Math.min(frame, tl.length - 1)];
  const isGrid = scene.v === 'grid';

  const P = (pt: Pt): Pt => pr.p(pt[0], pt[1]);
  const actorById = new Map(scene.a.map((a) => [a.id, a]));

  // ok katmanları
  const layers: { arrow: Arrow; age: number; key: string }[] = [];
  for (let i = 0; i <= Math.min(frame, tl.length - 1); i++) {
    const age = frame - i;
    if (age > 0 && !history) continue;
    tl[i].arrows.forEach((arrow, j) => layers.push({ arrow, age, key: `${i}-${j}` }));
  }

  const sw = (k: ArrowKind) => KIND_STYLE[k].w * u * 0.36;
  const headSize = u * 1.35;

  const style = {
    '--sc-dur': instant ? '0ms' : `${durMs}ms`,
  } as React.CSSProperties;

  return (
    <svg
      ref={ref}
      className={`sc ${editable ? 'sc--edit' : ''} ${className ?? ''}`}
      viewBox={`0 0 ${pr.w} ${pr.h}`}
      role="img"
      aria-label={label}
      style={style}
      onPointerDown={onBgDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <defs>
        {(['ivory', 'brass', 'terra'] as const).map((c) => (
          <marker
            key={c}
            id={`${uid}-h-${c}`}
            viewBox="0 0 10 10"
            refX="8.2"
            refY="5"
            markerWidth={headSize}
            markerHeight={headSize}
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M0.8 0.8 9.2 5 0.8 9.2 3 5Z" fill={c === 'ivory' ? 'var(--ivory)' : c === 'brass' ? 'var(--brass-hi)' : 'var(--terra)'} />
          </marker>
        ))}
        <clipPath id={`${uid}-clip`}>
          <rect x={0} y={0} width={pr.w} height={pr.h} />
        </clipPath>
      </defs>

      <rect x={0} y={0} width={pr.w} height={pr.h} fill="var(--pitch-1)" />
      <g clipPath={`url(#${uid}-clip)`}>
        {isGrid ? (
          <g transform={pr.matrix}>
            <rect x={0} y={0} width={view.x1} height={view.y1} fill="var(--pitch-2)" stroke="var(--pitch-line)" strokeWidth={0.18} strokeDasharray="0.9 0.6" />
          </g>
        ) : (
          <g transform={pr.matrix}>
            <PitchLines />
          </g>
        )}

        {/* boş / tehlikeli alanlar */}
        {cur.zones.map((z, i) => {
          const a = P([z.x, z.y]);
          const b = P([z.x + z.w, z.y + z.h]);
          const x = Math.min(a[0], b[0]);
          const y = Math.min(a[1], b[1]);
          const w = Math.abs(a[0] - b[0]);
          const h = Math.abs(a[1] - b[1]);
          const k = z.k ?? 'free';
          const col = k === 'free' ? 'var(--grass)' : k === 'danger' ? 'var(--terra)' : 'var(--brass)';
          return (
            <g key={`z${i}-${z.x}-${z.y}`} className="sc-zone">
              <rect x={x} y={y} width={w} height={h} rx={0.6} fill={col} fillOpacity={0.16} stroke={col} strokeWidth={0.22} strokeDasharray="1 0.7" />
              {z.l && (
                <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="central" fontSize={u * 0.92} className="sc-zone__t" fill={col}>
                  {z.l}
                </text>
              )}
            </g>
          );
        })}

        {drawZone && (() => {
          const a = P([drawZone.x, drawZone.y]);
          const b = P([drawZone.x + drawZone.w, drawZone.y + drawZone.h]);
          const col = drawZone.k === 'free' ? 'var(--grass)' : drawZone.k === 'danger' ? 'var(--terra)' : 'var(--brass)';
          return <rect x={Math.min(a[0], b[0])} y={Math.min(a[1], b[1])} width={Math.abs(a[0] - b[0])} height={Math.abs(a[1] - b[1])} fill={col} fillOpacity={0.2} stroke={col} strokeWidth={0.25} strokeDasharray="1 0.7" />;
        })()}

        {/* savunma / ofsayt çizgisi */}
        {cur.line !== null && (() => {
          const a = P([cur.line, view.y0]);
          const b = P([cur.line, view.y1]);
          return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="var(--terra)" strokeWidth={0.3} strokeDasharray="1.6 1.1" opacity={0.85} />;
        })()}

        {/* hayalet halkalar: hareketin başlangıcı */}
        {layers
          .filter((l) => l.age === 0 && l.arrow.by)
          .map((l) => {
            const p = P(l.arrow.from);
            return <circle key={`g${l.key}`} cx={p[0]} cy={p[1]} r={u * 0.95} fill="none" stroke={l.arrow.opp ? 'var(--terra)' : 'var(--brass-hi)'} strokeWidth={0.2} strokeDasharray="0.8 0.6" opacity={0.55} />;
          })}

        {/* oklar */}
        {layers.map(({ arrow, age, key }) => {
          const kind = arrow.opp && arrow.k === 'run' ? 'press' : arrow.k;
          const sty = KIND_STYLE[kind];
          const a = P(arrow.from);
          const b = P(arrow.to);
          const startCut = arrow.fromActor ? u * 1.05 : 0;
          const endCut = arrow.by || arrow.toActor ? u * 1.12 : u * 0.35;
          const d = arrowPath(kind, a, b, arrow.curve, startCut, endCut, u);
          if (!d) return null;
          const op = age === 0 ? 1 : age === 1 ? 0.4 : 0.2;
          const isDash = kind === 'run' || kind === 'press' || kind === 'air';
          return (
            <g key={key} className={`sc-arrow ${age === 0 ? 'sc-arrow--cur' : ''}`} style={{ opacity: op }}>
              {arrow.k === 'shot' && <path d={d} fill="none" stroke="var(--terra)" strokeOpacity={0.22} strokeWidth={sw(kind) * 2.4} strokeLinecap="round" />}
              <path
                d={d}
                fill="none"
                stroke={sty.color}
                strokeWidth={sw(kind)}
                strokeLinecap={sty.cap ?? (isDash ? 'butt' : 'round')}
                strokeDasharray={sty.dash ? sty.dash.split(' ').map((n) => Number(n) * u * 0.6).join(' ') : undefined}
                markerEnd={`url(#${uid}-h-${sty.head})`}
              />
            </g>
          );
        })}

        {/* elle çizim önizlemesi */}
        {drawing && (() => {
          const sty = KIND_STYLE[drawing.kind];
          const d = arrowPath(drawing.kind, P(drawing.from), P(drawing.to), 0, 0, u * 0.3, u);
          return d ? (
            <path d={d} fill="none" stroke={sty.color} strokeWidth={sw(drawing.kind)} opacity={0.7} strokeDasharray={sty.dash ? sty.dash.split(' ').map((n) => Number(n) * u * 0.6).join(' ') : undefined} markerEnd={`url(#${uid}-h-${sty.head})`} />
          ) : null;
        })()}

        {/* metin notları */}
        {cur.txt.map((t, i) => {
          const p = P([t.x, t.y]);
          return (
            <text key={i} x={p[0]} y={p[1]} textAnchor="middle" fontSize={u * 0.95} className="sc-note">
              {t.s}
            </text>
          );
        })}

        {/* oyuncular */}
        {scene.a.map((a) => {
          const pt = cur.pos[a.id] ?? [a.x, a.y];
          const [sx, sy] = P(pt);
          const col = COLOR_FOR[a.t];
          const isSel = selected === a.id;
          const lbl = (a.l ?? a.id).slice(0, 3);
          return (
            <g
              key={a.id}
              className={`sc-actor sc-actor--${a.t} ${isSel ? 'is-sel' : ''}`}
              style={{ transform: `translate(${sx}px, ${sy}px)` }}
              onPointerDown={onActorDown ? (e) => onActorDown(a.id, e) : undefined}
              data-id={a.id}
            >
              {a.t === 'c' ? (
                <>
                  <path d={`M0 ${-u * 0.85}L${u * 0.75} ${u * 0.6}H${-u * 0.75}Z`} fill={col.fill} stroke="var(--ink-950)" strokeWidth={0.14} strokeLinejoin="round" />
                  {a.l && (
                    <text y={u * 1.9} textAnchor="middle" fontSize={u * 0.9} className="sc-note">
                      {a.l}
                    </text>
                  )}
                </>
              ) : a.t === 'm' ? (
                <>
                  <circle r={u * 0.9} fill="rgba(239,234,220,0.06)" stroke="var(--ivory)" strokeWidth={0.2} strokeDasharray="0.7 0.5" />
                  <path d={`M${-u * 0.45} 0H${u * 0.45}M0 ${-u * 0.45}V${u * 0.45}`} stroke="var(--ivory)" strokeWidth={0.2} />
                  {a.l && (
                    <text y={u * 2} textAnchor="middle" fontSize={u * 0.9} className="sc-note">
                      {a.l}
                    </text>
                  )}
                </>
              ) : (
                <>
                  {isSel && <circle r={u * 1.55} fill="none" stroke="var(--ivory)" strokeWidth={0.22} strokeDasharray="0.7 0.5" />}
                  <circle r={u} fill={col.fill} stroke="var(--ink-950)" strokeWidth={0.2} />
                  <text textAnchor="middle" dominantBaseline="central" y={u * 0.04} fontSize={u * (lbl.length > 2 ? 0.78 : lbl.length > 1 ? 0.95 : 1.15)} className="sc-lbl" fill={col.ink}>
                    {lbl}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* top */}
        {cur.ball && (() => {
          const [bx, by] = P(cur.ball.pt);
          const off = cur.ball.holder ? [u * 1.05, u * 0.6] : [0, 0];
          return (
            <g
              className="sc-ball"
              style={{ transform: `translate(${bx + off[0]}px, ${by + off[1]}px)` }}
              onPointerDown={onBallDown}
            >
              <circle r={u * 0.62} cx={0} cy={0.1} fill="rgba(0,0,0,0.35)" />
              <circle r={u * 0.52} fill="var(--ivory)" stroke="var(--ink-950)" strokeWidth={0.16} />
              <circle r={u * 0.19} fill="var(--ink-950)" />
            </g>
          );
        })()}
      </g>
    </svg>
  );
});

/** Ekran koordinatını saha koordinatına çevir */
export function clientToPitch(svg: SVGSVGElement, e: { clientX: number; clientY: number }, view: ViewDef): Pt {
  const pr = projector(view);
  const r = svg.getBoundingClientRect();
  const sx = ((e.clientX - r.left) / r.width) * pr.w;
  const sy = ((e.clientY - r.top) / r.height) * pr.h;
  return pr.q(sx, sy);
}
