import type { FootZone } from '@/data/types';

const OUTLINE =
  'M100 8C142 8 172 36 174 82C176 120 156 150 152 190C149 224 160 262 142 292C128 312 72 312 58 292C40 262 51 224 48 190C44 150 24 120 26 82C28 36 58 8 100 8Z';

interface ZoneDef {
  id: FootZone;
  label: string;
  rect?: [number, number, number, number]; // x, y, w, h
  note: string;
}

const ZONES: ZoneDef[] = [
  { id: 'uc', label: 'Uç', rect: [0, 0, 200, 62], note: 'Ayak parmak ucu' },
  { id: 'ic', label: 'İç yüz', rect: [0, 70, 56, 170], note: 'Ayağın iç yanı (ayak içi), geniş ve kontrollü' },
  { id: 'ustIc', label: 'Üst iç', rect: [56, 62, 28, 143], note: 'Ayak üstünün iç bölümü' },
  { id: 'ustTam', label: 'Ayak üstü (tam)', rect: [84, 62, 32, 143], note: 'Bağcık bölgesi: güçlü vuruşlar' },
  { id: 'ustDis', label: 'Üst dış (trivela)', rect: [116, 62, 28, 143], note: 'Ayak üstünün dış bölümü: dönüşlü vuruşlar' },
  { id: 'dis', label: 'Dış kenar', rect: [144, 70, 56, 170], note: 'Küçük parmak tarafının yan yüzü' },
  { id: 'topuk', label: 'Topuk', rect: [0, 240, 200, 80], note: 'Ayağın arka kısmı' },
];

/** Ayak temas yüzeyi haritası (sağ ayak, üstten görünüm). */
export function FootMap({ active }: { active: FootZone[] }) {
  const on = new Set(active);
  const id = 'foot-' + active.join('-');
  const label = ZONES.filter((z) => on.has(z.id)).map((z) => z.label);
  if (on.has('taban')) label.push('Taban');
  return (
    <figure className="footmap">
      <svg viewBox="-96 -6 392 332" role="img" aria-label={`Temas yüzeyi: ${label.join(', ')}`}>
        <defs>
          <clipPath id={id}>
            <path d={OUTLINE} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id})`}>
          <rect x="0" y="0" width="200" height="320" fill="var(--ink-800)" />
          {ZONES.map((z) =>
            z.rect ? (
              <rect
                key={z.id}
                x={z.rect[0]}
                y={z.rect[1]}
                width={z.rect[2]}
                height={z.rect[3]}
                fill={on.has(z.id) ? 'var(--brass)' : 'transparent'}
                opacity={on.has(z.id) ? 0.95 : 1}
                stroke="var(--ink-600)"
                strokeWidth="1"
              />
            ) : null,
          )}
        </g>
        <path d={OUTLINE} fill="none" stroke="var(--ivory-3)" strokeWidth="2" />
        {/* bağcıklar */}
        <g stroke="var(--ink-950)" strokeWidth="1.3" opacity=".35" strokeLinecap="round">
          {[88, 106, 124, 142, 160, 178].map((y) => (
            <path key={y} d={`M90 ${y}L110 ${y + 6}M110 ${y}L90 ${y + 6}`} />
          ))}
        </g>
        {/* etiketler */}
        <g fontFamily="var(--font-mono)" fontSize="12" letterSpacing=".6">
          <Label x={-12} y={150} anchor="end" ax={38} ay={150} on={on.has('ic')} t="İÇ YÜZ" />
          <Label x={-12} y={105} anchor="end" ax={70} ay={105} on={on.has('ustIc')} t="ÜST İÇ" />
          <Label x={212} y={150} anchor="start" ax={162} ay={150} on={on.has('dis')} t="DIŞ KENAR" />
          <Label x={212} y={105} anchor="start" ax={130} ay={105} on={on.has('ustDis')} t="ÜST DIŞ" />
          <Label x={100} y={-1} anchor="middle" ax={100} ay={28} on={on.has('uc')} t="UÇ" top />
          <Label x={-12} y={280} anchor="end" ax={72} ay={280} on={on.has('topuk')} t="TOPUK" />
          <Label x={212} y={196} anchor="start" ax={100} ay={196} on={on.has('ustTam')} t="AYAK ÜSTÜ" />
        </g>
      </svg>
      {on.has('taban') && <p className="footmap__sole mono">Taban kullanılır (ayağın altı)</p>}
      <figcaption className="mono muted">Sağ ayak · üstten görünüm</figcaption>
    </figure>
  );
}

function Label({ x, y, anchor, ax, ay, on, t, top }: { x: number; y: number; anchor: 'start' | 'end' | 'middle'; ax: number; ay: number; on: boolean; t: string; top?: boolean }) {
  const col = on ? 'var(--brass-hi)' : 'var(--ivory-4)';
  return (
    <g>
      <line x1={top ? ax : anchor === 'end' ? x + 2 : x - 2} y1={top ? 6 : y - 4} x2={ax} y2={top ? ay : ay} stroke={col} strokeWidth={on ? 1.4 : 0.8} opacity={on ? 1 : 0.55} />
      <circle cx={ax} cy={ay} r={on ? 3.2 : 2} fill={col} />
      <text x={x} y={top ? 4 : y} textAnchor={anchor} fill={col} fontWeight={on ? 700 : 400} dominantBaseline={top ? 'hanging' : 'auto'}>
        {t}
      </text>
    </g>
  );
}
