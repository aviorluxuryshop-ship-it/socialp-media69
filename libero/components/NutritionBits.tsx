import { PLATES, PLATE_GROUP_EXAMPLES, PLATE_GROUP_LABEL, REVIEW_BY_ID, SECTION_BY_ID, SOURCE_SHORT, type PlateGroup } from '@/data/nutrition-guide';
import { SOURCE_BY_ID } from '@/data/sources';
import { Icon } from './Icon';

/** Satır içi "Uzman incelemesi" rozeti: inceleme listesindeki maddeye bağlanır. */
export function Rv({ id }: { id: string }) {
  const r = REVIEW_BY_ID[id];
  if (!r) throw new Error(`Bilinmeyen inceleme kimliği: ${id}`);
  return (
    <a className={`rv${r.unverified ? ' rv--unv' : ''}`} href={`#uzman-${id}`} data-review={id} title={`${r.reviewer} incelemesi gerekir${r.unverified ? ' · kaynak doğrulanamadı' : ''}`} aria-label={`Uzman incelemesi gerektirir: ${r.area}`}>
      <Icon name="eye" />
      Uzman incelemesi
    </a>
  );
}

/** Bölüm altı kaynak atıfları: sayfa sonundaki kaynak listesine bağlanır. */
export function Cite({ ids }: { ids: string[] }) {
  if (ids.length === 0) return null;
  return (
    <p className="cite np">
      <span className="cite__l">Kaynaklar</span>
      {ids.map((id) => (
        <a key={id} href={`#kaynak-${id}`} title={SOURCE_BY_ID[id]?.title}>
          {SOURCE_SHORT[id] ?? id}
        </a>
      ))}
    </p>
  );
}

/** Rehber bölümü: üst bilgi (numara, başlık, giriş) + içerik + kaynak atıfları */
export function GuideSection({ id, children, noCite }: { id: string; children: React.ReactNode; noCite?: boolean }) {
  const s = SECTION_BY_ID[id];
  if (!s) throw new Error(`Bilinmeyen bölüm: ${id}`);
  return (
    <section className="gsec" id={id} aria-labelledby={`${id}-b`}>
      <header className="gsec__head np" data-reveal="heading">
        <span className="gsec__no" aria-hidden="true">{s.no}</span>
        <div>
          <p className="eyebrow">{s.nav}</p>
          <h2 className="h2" id={`${id}-b`}>
            {s.title} {s.em && <em>{s.em}</em>}
          </h2>
          <p className="lead gsec__lead">{s.lead}</p>
        </div>
      </header>
      <div className="gsec__body">{children}</div>
      {!noCite && <Cite ids={s.sources} />}
    </section>
  );
}

// ── Tabak modeli (el çizimi SVG) ─────────────────────────

const ORDER: PlateGroup[] = ['sebze', 'meyve', 'tahil', 'protein', 'sut'];
const COLOR: Record<PlateGroup, string> = { sebze: 'var(--grass)', meyve: 'var(--mint)', tahil: 'var(--accent)', protein: 'var(--flare)', sut: 'var(--sky)' };
const R = 80;
const C = 120;
const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
const pt = (deg: number, r: number) => `${(C + r * Math.cos(rad(deg))).toFixed(2)} ${(C + r * Math.sin(rad(deg))).toFixed(2)}`;
function slice(a0: number, a1: number) {
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${pt(a0, 22)} L ${pt(a0, R)} A ${R} ${R} 0 ${large} 1 ${pt(a1, R)} L ${pt(a1, 22)} A 22 22 0 ${large} 0 ${pt(a0, 22)} Z`;
}

function Plate({ id, title, caption, weights }: (typeof PLATES)[number]) {
  const total = ORDER.reduce((n, g) => n + weights[g], 0);
  let acc = 0;
  const parts = ORDER.map((g, i) => {
    const a0 = (acc / total) * 360;
    acc += weights[g];
    const a1 = (acc / total) * 360;
    const gap = 1.6;
    return { g, d: slice(a0 + gap, a1 - gap), i };
  });
  return (
    <figure className="plate" data-reveal="scale" data-plate={id}>
      <svg viewBox="0 0 240 240" role="img" aria-labelledby={`pl-${id}-t pl-${id}-d`}>
        <title id={`pl-${id}-t`}>{`${title} tabağı`}</title>
        <desc id={`pl-${id}-d`}>{caption}</desc>
        <defs>
          <radialGradient id={`pl-${id}-g`} cx="50%" cy="38%" r="70%">
            <stop offset="0" stopColor="var(--ink-750)" />
            <stop offset="1" stopColor="var(--ink-900)" />
          </radialGradient>
        </defs>
        <circle cx={C} cy={C} r="112" fill={`url(#pl-${id}-g)`} stroke="var(--line-3)" strokeWidth="1.5" />
        <circle className="draw-line" pathLength={1} cx={C} cy={C} r="100" fill="none" stroke="var(--line-2)" strokeWidth="1" />
        {parts.map((p) => (
          <path key={p.g} className="plate__s" style={{ ['--i' as string]: p.i }} d={p.d} fill={COLOR[p.g]} fillOpacity={p.g === 'meyve' ? 0.85 : 0.92} stroke="var(--ink-900)" strokeWidth="2" strokeLinejoin="round" />
        ))}
        <circle cx={C} cy={C} r="20" fill="var(--ink-900)" stroke="var(--line-2)" />
        <path d="M112 120h16M120 112v16" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
      </svg>
      <figcaption>
        <strong className="plate__t">{title}</strong>
        <span>{caption}</span>
      </figcaption>
    </figure>
  );
}

export function PlateModel() {
  return (
    <div className="plates">
      <div className="plates__row">
        {PLATES.map((p) => (
          <Plate key={p.id} {...p} />
        ))}
      </div>
      <ul className="plates__legend" aria-label="Tabak renkleri">
        {ORDER.map((g) => (
          <li key={g}>
            <i style={{ background: COLOR[g] }} aria-hidden="true" />
            <span>
              <strong>{PLATE_GROUP_LABEL[g]}</strong>
              <small>{PLATE_GROUP_EXAMPLES[g]}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Kısa bağlantı: bölüme git */
export function GoTo({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <a className="btn btn--quiet" href={`#${id}`}>
      {children}
    </a>
  );
}
