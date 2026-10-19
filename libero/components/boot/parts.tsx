import type { FootZone } from '@/data/types';
import type { ZoneShape } from '@/lib/boot-shapes';
import { C, id, ref } from './defs';

/** Vurgulanan bölgeler: pirinç parlaması + nabız halkası. Pasif bölgeler ince noktalı çizgi olarak görünür. */
export function ZoneLayer({ u, zones, active }: { u: string; zones: Partial<Record<FootZone, ZoneShape>>; active: ReadonlySet<FootZone> }) {
  const entries = Object.entries(zones) as [FootZone, ZoneShape][];
  return (
    <g className="boot-zones">
      {entries.map(([zid, s]) => {
        const on = active.has(zid);
        return (
          <g key={zid} data-zone={zid} data-active={on ? 'true' : 'false'} className={on ? 'boot-z boot-z--on' : 'boot-z'}>
            {on && <path className="boot-z__halo" d={s.d} fill={C.brassHi} filter={ref(u, 'blur12')} />}
            <path
              className="boot-z__fill"
              d={s.d}
              fill={on ? ref(u, 'glow') : 'transparent'}
              stroke={on ? C.brassHi : '#efeadc'}
              strokeOpacity={on ? 1 : 0.16}
              strokeWidth={on ? 2.4 : 1.2}
              strokeDasharray={on ? undefined : '3 6'}
              strokeLinejoin="round"
            />
            {on && <path className="boot-z__hatch" d={s.d} fill={ref(u, 'hatch')} />}
          </g>
        );
      })}
    </g>
  );
}

/** İnce dikiş çizgisi. */
export function Stitch({ d, color = '#efeadc', op = 0.38, w = 1.3, dash = '5 4' }: { d: string; color?: string; op?: number; w?: number; dash?: string }) {
  return <path d={d} fill="none" stroke={color} strokeOpacity={op} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" />;
}

export { id, ref };
