// Krampon çizimleri için ortak SVG tanımları: degradeler, doku, bulanıklık, vurgu parlaması.
// `u` (kimlik öneki) ve `flip` (çizim yatayda çevrilmişse ışığı aynı yöne tutar) alır.

export const C = {
  // grafit gövde
  up1: '#48504b',
  up2: '#2c3330',
  up3: '#151a18',
  upEdge: '#0a0d0c',
  // fildişi süs/taban
  iv1: '#f3eedf',
  iv2: '#cdc8b6',
  iv3: '#98948a',
  iv4: '#6b6a62',
  // pirinç vurgu (site belirteçleriyle aynı)
  brass: '#c9a55b',
  brassHi: '#e3c47e',
  brassLo: '#8c7239',
};

export const id = (u: string, name: string) => `${u}-${name}`;
export const ref = (u: string, name: string) => `url(#${u}-${name})`;

export function BootDefs({ u, flip }: { u: string; flip: boolean }) {
  // Işık sol üstten gelir; çizim aynalıysa gradyan yönü de ters çevrilir.
  const x1 = flip ? 1 : 0;
  const x2 = flip ? 0 : 1;
  return (
    <defs>
      <linearGradient id={id(u, 'upper')} x1={x1} y1="0" x2={x2} y2="1">
        <stop offset="0" stopColor={C.up1} />
        <stop offset="0.5" stopColor={C.up2} />
        <stop offset="1" stopColor={C.up3} />
      </linearGradient>
      <linearGradient id={id(u, 'upperV')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.up1} />
        <stop offset="0.55" stopColor={C.up2} />
        <stop offset="1" stopColor={C.up3} />
      </linearGradient>
      <linearGradient id={id(u, 'trim')} x1={x1} y1="0" x2={x2} y2="1">
        <stop offset="0" stopColor={C.iv1} />
        <stop offset="0.55" stopColor={C.iv2} />
        <stop offset="1" stopColor={C.iv3} />
      </linearGradient>
      <linearGradient id={id(u, 'trimV')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.iv1} />
        <stop offset="0.6" stopColor={C.iv2} />
        <stop offset="1" stopColor={C.iv3} />
      </linearGradient>
      <linearGradient id={id(u, 'sole')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e8e2d0" />
        <stop offset="0.5" stopColor="#c4bfad" />
        <stop offset="1" stopColor="#8f8b7c" />
      </linearGradient>
      <linearGradient id={id(u, 'liner')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#050706" />
        <stop offset="1" stopColor="#1d2320" />
      </linearGradient>
      <radialGradient id={id(u, 'glow')} cx="0.5" cy="0.5" r="0.75">
        <stop offset="0" stopColor="#f6dea0" stopOpacity="0.78" />
        <stop offset="0.55" stopColor={C.brassHi} stopOpacity="0.6" />
        <stop offset="1" stopColor={C.brass} stopOpacity="0.46" />
      </radialGradient>
      <radialGradient id={id(u, 'stud')} cx="0.38" cy="0.34" r="0.8">
        <stop offset="0" stopColor="#5a625d" />
        <stop offset="0.55" stopColor="#262b28" />
        <stop offset="1" stopColor="#0c0f0e" />
      </radialGradient>
      <linearGradient id={id(u, 'studV')} x1={x1} y1="0" x2={x2} y2="0">
        <stop offset="0" stopColor="#4b534e" />
        <stop offset="0.5" stopColor="#262b28" />
        <stop offset="1" stopColor="#0b0e0d" />
      </linearGradient>
      <filter id={id(u, 'blur6')} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <filter id={id(u, 'blur3')} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <filter id={id(u, 'blur12')} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="12" />
      </filter>
      {/* sentetik üst malzeme dokusu: ince noktalı örgü */}
      <pattern id={id(u, 'tex')} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
        <circle cx="1.75" cy="1.75" r="0.8" fill="#fff" fillOpacity="0.07" />
        <circle cx="5.25" cy="5.25" r="0.8" fill="#fff" fillOpacity="0.07" />
        <circle cx="1.75" cy="5.25" r="0.55" fill="#000" fillOpacity="0.22" />
        <circle cx="5.25" cy="1.75" r="0.55" fill="#000" fillOpacity="0.22" />
      </pattern>
      <pattern id={id(u, 'hatch')} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <path d="M0 0V9" stroke="#5a4515" strokeOpacity="0.36" strokeWidth="2.2" />
      </pattern>
      <radialGradient id={id(u, 'stage')} cx="0.5" cy="0.55" r="0.62">
        <stop offset="0" stopColor="#223228" stopOpacity="0.95" />
        <stop offset="0.55" stopColor="#14201a" stopOpacity="0.55" />
        <stop offset="1" stopColor="#0a100d" stopOpacity="0" />
      </radialGradient>
      <pattern id={id(u, 'hex')} width="12" height="10.4" patternUnits="userSpaceOnUse">
        <path d="M6 0L12 3.2V9.6L6 12.8L0 9.6V3.2Z" fill="none" stroke="#000" strokeOpacity="0.1" strokeWidth="0.8" transform="scale(1 0.8)" />
      </pattern>
    </defs>
  );
}
