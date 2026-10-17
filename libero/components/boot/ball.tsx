import { ballGeometry } from '@/lib/boot-ball';
import { id, ref } from './defs';

const GEO = ballGeometry();

/** Küçük futbol topu: gerçek kesik ikosahedron deseni, hacim gölgesi ve parlak nokta. */
export function Ball({ u, x, y, r = 34, shadow = true, shadowDx = 6, shadowDy = 8 }: { u: string; x: number; y: number; r?: number; shadow?: boolean; shadowDx?: number; shadowDy?: number }) {
  const k = `${u}-ball${Math.round(x)}-${Math.round(y)}`;
  return (
    <g className="boot-ball" aria-hidden="true">
      {shadow && <ellipse cx={x + shadowDx} cy={y + r * 0.92 + shadowDy * 0.4} rx={r * 0.95} ry={r * 0.26} fill="#000" opacity=".5" filter={ref(u, 'blur6')} />}
      <g transform={`translate(${x} ${y}) scale(${r})`}>
        <defs>
          <radialGradient id={`${k}-b`} cx="0.36" cy="0.3" r="0.95">
            <stop offset="0" stopColor="#fffdf6" />
            <stop offset="0.55" stopColor="#ece7d8" />
            <stop offset="1" stopColor="#a9a698" />
          </radialGradient>
          <radialGradient id={`${k}-s`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#0a0c0b" stopOpacity="0.55" />
          </radialGradient>
          <linearGradient id={`${k}-p`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3a413d" />
            <stop offset="1" stopColor="#0f1210" />
          </linearGradient>
          <clipPath id={`${k}-c`}>
            <circle r="1" />
          </clipPath>
        </defs>
        <circle r="1" fill={`url(#${k}-b)`} />
        <g clipPath={`url(#${k}-c)`}>
          <path d={GEO.seams} fill="none" stroke="#6f6e63" strokeOpacity=".75" strokeWidth=".04" strokeLinecap="round" />
          {GEO.patches.map((d, i) => (
            <path key={i} d={d} fill={`url(#${k}-p)`} stroke="#0b0d0c" strokeWidth=".025" strokeLinejoin="round" />
          ))}
          <circle r="1" fill={`url(#${k}-s)`} />
          <ellipse cx="-.36" cy="-.42" rx=".26" ry=".14" transform="rotate(-38 -.36 -.42)" fill="#fff" fillOpacity=".55" />
        </g>
        <circle r=".99" fill="none" stroke="#1b1e1c" strokeOpacity=".55" strokeWidth=".02" />
      </g>
    </g>
  );
}

export { id };
