import { BALL_START_EULER, projectBallSvg, quatFromEuler, type SvgPanel } from '@/lib/motion-ball-geometry';

/**
 * Hafif top: gerçek kesik ikosahedron (12 beşgen + 20 altıgen) deseninin SVG izdüşümü.
 * 3B sahneyle aynı başlangıç duruşunu kullanır; bu yüzden WebGL'e geçişte top "zıplamaz".
 * Sunucuda üretilir (tek seferlik hesap), JS ve WebGL gerektirmez; dönme/süzülme CSS ile.
 * Yalnızca süstür: aria-hidden.
 */
const PANELS: SvgPanel[] = projectBallSvg(quatFromEuler(...BALL_START_EULER), 4, 3);

const HEX: [number, number, number] = [238, 233, 218];
const PENT: [number, number, number] = [24, 22, 18];

function shade(c: [number, number, number], facing: number): string {
  const k = 0.5 + 0.5 * Math.pow(Math.max(0, facing), 0.55);
  return `rgb(${Math.round(c[0] * k)} ${Math.round(c[1] * k)} ${Math.round(c[2] * k)})`;
}

export function BallSvg({ className = '' }: { className?: string }) {
  // arkadan öne: önce uzak paneller
  const panels = [...PANELS].sort((a, b) => a.facing - b.facing);
  return (
    <svg className={`ball-svg ${className}`.trim()} viewBox="-1.08 -1.08 2.16 2.16" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="hb-clip">
          <circle r="1" />
        </clipPath>
        <radialGradient id="hb-shade" cx="-0.36" cy="-0.42" r="1.5" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="0.32" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.72" stopColor="#020a07" stopOpacity="0.3" />
          <stop offset="1" stopColor="#010504" stopOpacity="0.8" />
        </radialGradient>
        <linearGradient id="hb-rim" x1="1" y1="1" x2="-0.2" y2="-0.2">
          <stop offset="0" stopColor="#c2f53c" stopOpacity="0.85" />
          <stop offset="0.45" stopColor="#c2f53c" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hb-spec" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath="url(#hb-clip)">
        <g className="ball-svg__spin">
          {panels.map((p, i) => (
            <path
              key={i}
              d={p.d}
              fill={shade(p.kind === 'pent' ? PENT : HEX, p.facing)}
              stroke="#2b261b"
              strokeWidth="0.014"
              strokeLinejoin="round"
            />
          ))}
        </g>
        <circle r="1" fill="url(#hb-shade)" />
      </g>
      <circle r="0.992" fill="none" stroke="url(#hb-rim)" strokeWidth="0.035" />
      <ellipse cx="-0.4" cy="-0.5" rx="0.26" ry="0.13" transform="rotate(-38 -0.4 -0.5)" fill="url(#hb-spec)" />
    </svg>
  );
}
