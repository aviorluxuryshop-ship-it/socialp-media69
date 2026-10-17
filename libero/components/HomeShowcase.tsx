/* Ana sayfa vitrini için küçük ürün önizlemeleri.
   Hepsi saf SVG/HTML süstür (aria-hidden); gerçek veri göstermezler ve "örnek" diye işaretlenirler. */

/** Taktik tahtası önizlemesi: oyuncu noktaları, pas ve koşu okları (çizgi çizilir) */
export function MiniBoard() {
  return (
    <svg className="mini mini--board" viewBox="0 0 220 140" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="218" height="138" rx="3" fill="var(--pitch-1)" stroke="var(--pitch-line)" strokeWidth="1" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={1 + i * 36.3} y="1" width="36.3" height="138" fill={i % 2 ? 'rgb(255 255 255 / 0.025)' : 'transparent'} />
      ))}
      <g fill="none" stroke="var(--pitch-line)" strokeWidth="1">
        <path d="M110 1v138" />
        <circle cx="110" cy="70" r="19" />
        <path d="M1 36h30v68H1M219 36h-30v68h30" />
      </g>
      <g className="mini__draw" fill="none" strokeLinecap="round">
        <path className="draw-line" pathLength="1" d="M58 96c14-6 30-14 44-30" stroke="var(--ivory)" strokeWidth="1.8" />
        <path d="M128 98c8-10 14-24 20-38" stroke="var(--accent)" strokeWidth="1.8" strokeDasharray="5 4" />
        <path className="draw-line" pathLength="1" d="M104 62c20-10 40-8 62 4" stroke="var(--ivory)" strokeWidth="1.8" />
      </g>
      <g fontFamily="var(--font-mono)" fontSize="7" fontWeight="700" textAnchor="middle">
        {[
          [54, 98, 'A'],
          [106, 62, 'B'],
          [126, 100, 'C'],
          [168, 68, 'D'],
        ].map(([x, y, l]) => (
          <g key={String(l)}>
            <circle cx={x as number} cy={y as number} r="7" fill="var(--accent)" stroke="#06100c" strokeWidth="1.2" />
            <text x={x as number} y={(y as number) + 2.6} fill="var(--accent-ink)">{l}</text>
          </g>
        ))}
        {[
          [92, 52, 'S1'],
          [146, 56, 'S2'],
        ].map(([x, y, l]) => (
          <g key={String(l)}>
            <circle cx={x as number} cy={y as number} r="7" fill="var(--flare)" stroke="#06100c" strokeWidth="1.2" />
            <text x={x as number} y={(y as number) + 2.6} fill="#2a0a03" fontSize="5.6">{l}</text>
          </g>
        ))}
      </g>
      <circle cx="111" cy="68" r="2.4" fill="var(--ivory)" stroke="#06100c" strokeWidth="0.8" />
    </svg>
  );
}

/** Kişisel program önizlemesi: hafta şeridi */
export function MiniWeek() {
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const plan: Record<number, [string, number, 'saha' | 'salon' | 'ev']> = {
    0: ['Saha', 62, 'saha'],
    2: ['Salon', 78, 'salon'],
    3: ['Ev', 44, 'ev'],
    5: ['Saha', 92, 'saha'],
  };
  return (
    <div className="mini mini--week" aria-hidden="true">
      {days.map((d, i) => {
        const p = plan[i];
        return (
          <div key={d} className="mini-week__col">
            <span className="mini-week__bar">
              {p ? <span className={`mini-week__fill mini-week__fill--${p[2]}`} style={{ height: `${p[1]}%` }} /> : <span className="mini-week__rest" />}
            </span>
            <span className="mono mini-week__d">{d}</span>
            <span className="mini-week__e">{p ? p[0] : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Video analizi önizlemesi: kare, açı çizimi ve zaman çizgisi */
export function MiniVideo() {
  return (
    <svg className="mini mini--video" viewBox="0 0 220 120" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="218" height="84" rx="3" fill="url(#mv-bg)" stroke="var(--line-3)" />
      <defs>
        <linearGradient id="mv-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#10261f" />
          <stop offset="1" stopColor="#0b1a15" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="var(--sky)" strokeWidth="1.6" strokeLinecap="round">
        <path className="draw-line" pathLength="1" d="M70 66 96 36 142 28" />
        <path className="draw-line" pathLength="1" d="M86 48a14 14 0 0 1 14-9" stroke="var(--accent)" />
      </g>
      <g fill="var(--ivory)">
        <circle cx="70" cy="66" r="3" />
        <circle cx="96" cy="36" r="3" />
        <circle cx="142" cy="28" r="3" />
      </g>
      <rect x="1" y="94" width="218" height="6" rx="3" fill="var(--ink-700)" />
      <rect x="1" y="94" width="108" height="6" rx="3" fill="var(--accent)" />
      <g fill="var(--gold)">
        <rect x="46" y="90" width="2" height="14" />
        <rect x="132" y="90" width="2" height="14" />
        <rect x="176" y="90" width="2" height="14" />
      </g>
      <circle cx="109" cy="97" r="6" fill="var(--ivory)" stroke="var(--ink-950)" strokeWidth="2" />
    </svg>
  );
}

/** Performans önizlemesi: çizgi grafik (rakamsız, yalnızca biçim) */
export function MiniChart() {
  return (
    <svg className="mini mini--chart" viewBox="0 0 220 110" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="mc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sky)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--sky)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="var(--line)" strokeWidth="1">
        <path d="M0 22h220M0 52h220M0 82h220" />
      </g>
      <path d="M0 84C20 80 28 70 48 72S78 58 98 54 128 60 146 40 190 28 220 16V110H0Z" fill="url(#mc-fill)" />
      <path className="draw-line" pathLength="1" d="M0 84C20 80 28 70 48 72S78 58 98 54 128 60 146 40 190 28 220 16" fill="none" stroke="var(--sky)" strokeWidth="2.2" strokeLinecap="round" />
      <g fill="var(--ink-950)" stroke="var(--sky-hi)" strokeWidth="2">
        <circle cx="48" cy="72" r="3.5" />
        <circle cx="98" cy="54" r="3.5" />
        <circle cx="146" cy="40" r="3.5" />
      </g>
    </svg>
  );
}

/** Futbol IQ önizlemesi: gerçek bir soru metni + seçenek satırları */
export function MiniQuiz({ q, opts }: { q: string; opts: string[] }) {
  return (
    <div className="mini mini--quiz" aria-hidden="true">
      <p className="mini-quiz__q">{q}</p>
      <ul>
        {opts.slice(0, 3).map((o, i) => (
          <li key={i} className={i === 1 ? 'is-pick' : ''}>
            <span className="mono">{String.fromCharCode(65 + i)}</span>
            <span>{o}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Hero zemini: perspektifte saha çizgileri (yalnızca süs) */
export function HeroPitch() {
  return (
    <svg className="hero__pitch-svg" viewBox="0 0 1200 760" fill="none" aria-hidden="true" focusable="false">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={50 + i * 137.5} y="40" width="137.5" height="680" fill={i % 2 ? 'rgb(255 255 255 / 0.035)' : 'transparent'} />
      ))}
      <g stroke="currentColor" strokeWidth="3">
        <rect x="50" y="40" width="1100" height="680" />
        <path d="M600 40v680" />
        <circle cx="600" cy="380" r="112" />
        <path d="M50 214h176v332H50M1150 214H974v332h176" />
        <path d="M50 304h66v152H50M1150 304h-66v152h66" />
      </g>
      <circle cx="600" cy="380" r="8" fill="currentColor" />
    </svg>
  );
}
