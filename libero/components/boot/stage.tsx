import type { FootZone } from '@/data/types';
import { VIEWS, ZONES, bootAriaLabel, ballZone as pickBallZone, type BootView } from '@/lib/boot';
import { GEO } from '@/lib/boot-shapes';
import { BootDefs, id, ref } from './defs';
import { SideBoot } from './side';
import { SoleBoot } from './sole';
import { TopBoot } from './top';

export interface StageProps {
  view: BootView;
  foot: readonly FootZone[];
  /** true: sol krampon; false: sağ krampon */
  left: boolean;
  /** topu çiz (yalnızca ana görünümde) */
  ball?: boolean;
  /** SVG kimlik öneki (sayfada benzersiz) */
  uid: string;
  /** küçük önizleme: etiket, top ve erişilebilirlik adı yok */
  mini?: boolean;
}

/** Her görünümün çizimi, etiketsiz kırpma penceresi (küçük önizleme için). */
const MINI_BOX: Record<BootView, string> = {
  ust: '170 40 260 590',
  ic: '36 52 626 320',
  dis: '58 52 626 320',
  taban: '170 40 260 620',
};

/** Etiketler çizim uzayında yazılır; ayna çevrildiyse konum ve hiza ters çevrilir. */
function Labels({ view, active, flipped }: { view: BootView; active: ReadonlySet<FootZone>; flipped: boolean }) {
  const g = GEO[view];
  const entries = Object.entries(g.zones) as [FootZone, NonNullable<(typeof g.zones)[FootZone]>][];
  const mx = (x: number) => (flipped ? g.W - x : x);
  return (
    <g className="bootlabs" fontFamily="var(--font-mono)">
      {entries.map(([zid, s]) => {
        const on = active.has(zid);
        const info = ZONES[zid];
        const px = mx(s.px + g.ox);
        const py = s.py + g.oy;
        const lx = mx(s.lx + g.ox);
        const ly = s.ly + g.oy;
        const anchor = s.anchor === 'middle' ? 'middle' : flipped ? (s.anchor === 'start' ? 'end' : 'start') : s.anchor;
        const sub = on && info.sub ? info.sub : '';
        // ibre çizgisi etikete en yakın kenarda biter
        let ex = lx;
        let ey = ly;
        if (s.anchor === 'middle') {
          ey = ly < py ? ly + (sub ? 24 : 9) : ly - 21;
        } else {
          ex = lx + (anchor === 'start' ? -9 : 9);
          ey = ly - 6;
        }
        const pts: [number, number][] = [[px, py]];
        if (s.via) pts.push([mx(s.via[0] + g.ox), s.via[1] + g.oy]);
        pts.push([ex, ey]);
        const line = 'M' + pts.map((p) => `${Math.round(p[0] * 10) / 10} ${Math.round(p[1] * 10) / 10}`).join('L');
        return (
          <g key={zid} data-label={zid} className={on ? 'bootlab bootlab--on' : 'bootlab'}>
            <path d={line} className="bootlab__line" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={px} cy={py} r={on ? 6.5 : 3.4} className="bootlab__dot" />
            <text x={lx} y={ly} textAnchor={anchor} className="bootlab__t">
              {info.short.toLocaleUpperCase('tr')}
            </text>
            {sub && (
              <text x={lx} y={ly + 19} textAnchor={anchor} className="bootlab__sub">
                {sub}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Tek bir görünümün tam SVG'si: zemin ışığı, kramponun çizimi, top ve etiketler. */
export function BootStage({ view, foot, left, ball = false, uid, mini = false }: StageProps) {
  const g = GEO[view];
  const flipped = left !== g.flipsRight; // sağ ayak için yalnızca flipsRight olan görünümler çevrilir
  const active = new Set<FootZone>(foot.filter((z) => g.zones[z]));
  const u = `${uid}${view}${mini ? 'm' : ''}`;
  const bz = pickBallZone(view, foot);
  const art = (() => {
    const common = { u, active, flip: flipped, showBall: ball && !mini, ballZone: bz };
    if (view === 'ust') return <TopBoot {...common} />;
    if (view === 'taban') return <SoleBoot {...common} />;
    return <SideBoot {...common} kind={view} />;
  })();
  return (
    <svg
      className={mini ? 'bootsvg bootsvg--mini' : 'bootsvg'}
      viewBox={mini ? MINI_BOX[view] : `0 0 ${g.W} ${g.H}`}
      role={mini ? undefined : 'img'}
      aria-label={mini ? undefined : bootAriaLabel(view, foot, left)}
      aria-hidden={mini ? true : undefined}
      focusable="false"
      data-view={view}
      data-left={left ? 'true' : 'false'}
    >
      <BootDefs u={u} flip={flipped} />
      {!mini && <ellipse cx={g.W / 2} cy={g.H * 0.54} rx={g.W * 0.5} ry={g.H * 0.42} fill={ref(u, 'stage')} />}
      <g transform={flipped ? `translate(${g.W} 0) scale(-1 1)` : undefined} className="bootart">
        {art}
      </g>
      {!mini && <Labels view={view} active={active} flipped={flipped} />}
    </svg>
  );
}

export { VIEWS, id };
