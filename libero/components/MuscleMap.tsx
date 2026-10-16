'use client';

import type { MuscleId } from '@/data/exercises';
import { MUSCLE_NAME } from '@/data/exercises';

type Shape = { m: MuscleId; d: string };

// Basitleştirilmiş kas haritası: 200 × 420 ızgara; sol/sağ simetrik.
const mirror = (d: string): string =>
  d.replace(/([MLCZ])([^MLCZ]*)/g, (_, c: string, args: string) => {
    if (c === 'Z') return 'Z';
    const nums = args.trim().split(/[\s,]+/).map(Number);
    const out: number[] = [];
    for (let i = 0; i < nums.length; i += 2) out.push(200 - nums[i], nums[i + 1]);
    return c + out.join(' ');
  });

const both = (m: MuscleId, d: string): Shape[] => [
  { m, d },
  { m, d: mirror(d) },
];

const FRONT: Shape[] = [
  { m: 'neck', d: 'M91 52 L109 52 L111 68 L89 68 Z' },
  ...both('shoulder', 'M70 76 C58 78 50 88 50 104 L66 104 C70 94 74 86 80 80 Z'),
  ...both('chest', 'M80 80 C90 78 98 82 100 88 L100 124 C90 128 78 124 72 112 C70 98 74 86 80 80 Z'),
  ...both('arm', 'M48 108 C44 130 44 150 46 168 L60 168 C62 150 64 130 64 108 Z'),
  ...both('arm', 'M45 172 C42 192 42 210 44 230 L58 230 C60 210 62 192 62 172 Z'),
  { m: 'core', d: 'M80 128 L120 128 L118 192 C112 202 88 202 82 192 Z' },
  ...both('hipflex', 'M82 196 L98 200 L96 218 L84 214 Z'),
  ...both('quad', 'M72 218 C66 244 68 272 76 298 L92 298 C94 272 94 244 92 220 Z'),
  ...both('adductor', 'M94 222 C97 244 97 270 95 296 L100 296 L100 224 Z'),
  ...both('calf', 'M76 306 C74 332 76 360 82 386 L94 386 C98 360 98 332 96 306 Z'),
];

const BACK: Shape[] = [
  { m: 'neck', d: 'M91 52 L109 52 L111 68 L89 68 Z' },
  ...both('shoulder', 'M70 76 C58 78 50 88 50 104 L66 104 C70 94 74 86 80 80 Z'),
  { m: 'back', d: 'M78 76 C90 72 110 72 122 76 L124 130 C114 138 86 138 76 130 Z' },
  ...both('arm', 'M48 108 C44 130 44 150 46 168 L60 168 C62 150 64 130 64 108 Z'),
  ...both('arm', 'M45 172 C42 192 42 210 44 230 L58 230 C60 210 62 192 62 172 Z'),
  { m: 'core', d: 'M82 136 L118 136 L118 172 L82 172 Z' },
  ...both('glute', 'M74 176 C66 194 70 214 96 216 L100 178 Z'),
  ...both('hamstring', 'M72 220 C68 246 70 274 78 298 L94 298 C96 274 96 246 94 220 Z'),
  ...both('calf', 'M76 304 C72 330 76 358 84 384 L94 384 C98 358 98 330 96 304 Z'),
];

interface Props {
  primary?: MuscleId[];
  secondary?: MuscleId[];
  selected?: MuscleId | '';
  onPick?: (m: MuscleId) => void;
  compact?: boolean;
}

function Fig({ shapes, label, primary, secondary, selected, onPick }: { shapes: Shape[]; label: string } & Omit<Props, 'compact'>) {
  const P = new Set(primary ?? []);
  const S = new Set(secondary ?? []);
  return (
    <svg viewBox="30 0 140 410" role="img" aria-label={label} className="musclemap__fig">
      <circle cx="100" cy="30" r="21" className="mm-base" />
      {shapes.map((s, i) => {
        const on = P.has(s.m) || selected === s.m;
        const sec = !on && S.has(s.m);
        const cls = `mm-shape ${on ? 'mm-on' : sec ? 'mm-sec' : ''} ${onPick ? 'mm-btn' : ''}`;
        return (
          <path
            key={i}
            d={s.d}
            className={cls}
            onClick={onPick ? () => onPick(s.m) : undefined}
            tabIndex={onPick ? 0 : undefined}
            role={onPick ? 'button' : undefined}
            aria-label={onPick ? MUSCLE_NAME[s.m] : undefined}
            onKeyDown={onPick ? (e) => (e.key === 'Enter' || e.key === ' ' ? (e.preventDefault(), onPick(s.m)) : undefined) : undefined}
          >
            <title>{MUSCLE_NAME[s.m]}</title>
          </path>
        );
      })}
    </svg>
  );
}

export function MuscleMap(props: Props) {
  return (
    <figure className={`musclemap ${props.compact ? 'musclemap--compact' : ''}`}>
      <div className="musclemap__figs">
        <div>
          <Fig shapes={FRONT} label="Ön görünüm kas haritası" {...props} />
          <figcaption className="mono muted">Ön</figcaption>
        </div>
        <div>
          <Fig shapes={BACK} label="Arka görünüm kas haritası" {...props} />
          <figcaption className="mono muted">Arka</figcaption>
        </div>
      </div>
    </figure>
  );
}
