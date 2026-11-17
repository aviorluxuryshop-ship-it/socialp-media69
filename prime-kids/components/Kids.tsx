/**
 * Primo & Pia — PRIME KIDS'in çizgi film maskotları (özgün çizim).
 * Fotoğraflardaki "güneş gözlüklü havalı çocuk" temasından türetildi:
 * gözlük alnın üstünde, kapüşonlu sweat, kocaman gülümseme.
 */

export type KidName = 'primo' | 'pia'

export const KID_META: Record<KidName, { name: string; color: string; soft: string }> = {
  // `color` buton/etiket rengi — beyaz yazıyla WCAG AA kontrastını sağlar
  primo: { name: 'Primo', color: '#1f6fa8', soft: '#e3f1fb' },
  pia: { name: 'Pia', color: '#c93c72', soft: '#fde8f0' },
}

const SKIN = '#f8cdaa'
const SKIN_SHADE = '#eeb48d'
const INK = '#2a1c15'

export function Kid({ kid, className, waving = true }: { kid: KidName; className?: string; waving?: boolean }) {
  const pia = kid === 'pia'
  const hoodie = pia ? '#ff7eab' : '#4ea6e3'
  const hoodieDark = pia ? '#e2558a' : '#2f86c4'
  const hair = pia ? '#f5c46c' : '#ebb24a'
  const hairDark = pia ? '#d9a148' : '#c98b2a'

  return (
    <svg viewBox="0 0 200 240" className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      {/* Pia'nın arkadaki uzun dalgalı saçı */}
      {pia && (
        <path
          d="M40 104 C26 150 30 196 50 214 C58 200 56 186 64 178 L136 178 C144 186 142 200 150 214 C170 196 174 150 160 104 Z"
          fill={hair}
        />
      )}

      {/* Gövde — kapüşonlu sweat */}
      <path d="M42 240 C42 196 66 170 100 170 C134 170 158 196 158 240 Z" fill={hoodie} />
      <path d="M70 176 C80 196 120 196 130 176" fill="none" stroke={hoodieDark} strokeWidth="7" strokeLinecap="round" />
      <path d="M90 190 v20 M110 190 v20" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="90" cy="212" r="3.5" fill="#fff" />
      <circle cx="110" cy="212" r="3.5" fill="#fff" />
      {/* Göğüste yıldız arma */}
      <path
        d="M132 206 l3.6 7.4 8.1 1.2 -5.9 5.7 1.4 8.1 -7.2 -3.8 -7.2 3.8 1.4 -8.1 -5.9 -5.7 8.1 -1.2 Z"
        fill="#ffd84d"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* El sallayan kol */}
      <g className={waving ? 'kid-wave' : undefined} style={{ transformOrigin: '60px 198px' }}>
        <path d="M60 202 C42 190 32 170 34 148" fill="none" stroke={hoodie} strokeWidth="22" strokeLinecap="round" />
        <path d="M60 202 C42 190 32 170 34 148" fill="none" stroke={hoodieDark} strokeWidth="22" strokeLinecap="round" strokeDasharray="1 60" opacity=".35" />
        <circle cx="34" cy="136" r="14" fill={SKIN} />
        <path d="M24 130 q-4 -8 2 -12 M30 124 q-2 -9 4 -11 M38 124 q1 -9 7 -9" fill="none" stroke={SKIN} strokeWidth="7" strokeLinecap="round" />
      </g>

      {/* Kulaklar */}
      <circle cx="38" cy="112" r="12" fill={SKIN} />
      <circle cx="162" cy="112" r="12" fill={SKIN} />
      <circle cx="38" cy="112" r="6" fill={SKIN_SHADE} />
      <circle cx="162" cy="112" r="6" fill={SKIN_SHADE} />

      {/* Kafa */}
      <circle cx="100" cy="106" r="64" fill={SKIN} />

      {/* Saç */}
      {pia ? (
        <>
          <path
            d="M36 112 C28 58 62 34 100 34 C140 34 174 58 164 112 C158 94 148 82 136 76 C126 92 104 98 88 92 C78 88 70 82 66 76 C52 84 42 96 36 112 Z"
            fill={hair}
          />
          <path d="M88 92 C96 84 100 74 100 64" fill="none" stroke={hairDark} strokeWidth="3" strokeLinecap="round" opacity=".6" />
          {/* Yıldız toka */}
          <path
            d="M146 66 l3.2 6.6 7.2 1 -5.2 5 1.2 7.2 -6.4 -3.4 -6.4 3.4 1.2 -7.2 -5.2 -5 7.2 -1 Z"
            fill="#ffd84d"
            stroke="#fff"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path
            d="M38 106 C32 58 66 36 100 36 C136 36 170 58 162 106 C156 92 150 84 142 80 L140 94 L128 74 L120 90 L108 68 L98 88 L86 70 L78 88 L66 76 C54 84 44 94 38 106 Z"
            fill={hair}
          />
          <path d="M64 50 L56 24 L80 40 L88 14 L104 36 L122 14 L128 40 L150 28 L142 54 Z" fill={hair} />
          <path d="M88 20 L94 40 M122 18 L118 40" stroke={hairDark} strokeWidth="3" strokeLinecap="round" opacity=".6" />
        </>
      )}

      {/* Alında güneş gözlüğü */}
      {pia ? (
        <g>
          <circle cx="82" cy="58" r="12" fill={INK} />
          <circle cx="118" cy="58" r="12" fill={INK} />
          <path d="M94 58 h12" stroke={INK} strokeWidth="4" />
          <circle cx="78" cy="54" r="3" fill="#fff" opacity=".7" />
          <circle cx="114" cy="54" r="3" fill="#fff" opacity=".7" />
        </g>
      ) : (
        <g>
          <rect x="64" y="50" width="32" height="19" rx="8" fill={INK} />
          <rect x="104" y="50" width="32" height="19" rx="8" fill={INK} />
          <path d="M96 58 h8" stroke={INK} strokeWidth="4" />
          <path d="M70 55 h8 M110 55 h8" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" />
        </g>
      )}

      {/* Kaşlar */}
      <path d="M70 94 q10 -7 20 -1" fill="none" stroke={hairDark} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M110 93 q10 -6 20 1" fill="none" stroke={hairDark} strokeWidth="4.5" strokeLinecap="round" />

      {/* Gözler */}
      <ellipse cx="80" cy="112" rx="9.5" ry="11.5" fill={INK} />
      <ellipse cx="120" cy="112" rx="9.5" ry="11.5" fill={INK} />
      <circle cx="83.5" cy="107.5" r="3.6" fill="#fff" />
      <circle cx="123.5" cy="107.5" r="3.6" fill="#fff" />
      <circle cx="77" cy="116.5" r="1.8" fill="#fff" />
      <circle cx="117" cy="116.5" r="1.8" fill="#fff" />
      {pia && (
        <path d="M70 104 l-5 -4 M72 100 l-3 -5 M130 104 l5 -4 M128 100 l3 -5" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      )}

      {/* Yanaklar */}
      <ellipse cx="62" cy="132" rx="11" ry="7" fill="#ff8fa3" opacity=".55" />
      <ellipse cx="138" cy="132" rx="11" ry="7" fill="#ff8fa3" opacity=".55" />

      {/* Burun */}
      <path d="M96 124 q4 4 8 0" fill="none" stroke={SKIN_SHADE} strokeWidth="3.5" strokeLinecap="round" />

      {/* Kocaman gülümseme */}
      <path d="M82 134 Q100 160 118 134 Z" fill="#8c2f35" />
      <path d="M90 145 Q100 154 110 145 Q100 140 90 145 Z" fill="#ff8a94" />
      <path d="M84 135 h32" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}
