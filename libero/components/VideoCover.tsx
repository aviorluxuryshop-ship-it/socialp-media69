import type { ReactNode } from 'react';
import type { VideoTopic } from '@/data/video-topics';

/**
 * Konuya özel, elle çizilmiş kapak görselleri (14 konu).
 * Saha geometrisi + nesneler (top, krampon, koni, kale, eldiven…) site paletiyle çizilir.
 * Her kart önce bu kapağı gösterir; YouTube küçük resmi (varsa) üstüne biner,
 * yüklenemezse / kapalıysa bu kapak kalır.
 *
 * Çizim ızgarası 320 × 180 (16:9). Renkler styles/video.css içindeki sınıflardan gelir.
 */

type Tone = 'brass' | 'terra' | 'grass' | 'mint' | 'ivory';

export const COVER_TONE: Record<VideoTopic, Tone> = {
  pas: 'brass',
  sut: 'terra',
  kontrol: 'mint',
  surme: 'grass',
  kafa: 'ivory',
  bitiricilik: 'terra',
  hucum: 'brass',
  savunma: 'mint',
  kalecilik: 'mint',
  duran: 'brass',
  topsuz: 'ivory',
  taktik: 'brass',
  fiziksel: 'terra',
  onleme: 'grass',
};

/** Her konunun bir kapağı vardır (mantık testi bunu denetler) */
export const COVER_TOPICS = Object.keys(COVER_TONE) as VideoTopic[];

const pent = (cx: number, cy: number, r: number, rot = -90) =>
  Array.from({ length: 5 }, (_, i) => {
    const a = ((rot + i * 72) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

function Ball({ x, y, r = 10, spin = 0, ghost = false }: { x: number; y: number; r?: number; spin?: number; ghost?: boolean }) {
  const seams = Array.from({ length: 5 }, (_, i) => {
    const a = ((-90 + spin + i * 72) * Math.PI) / 180;
    const p = r * 0.4;
    const q = r * 0.86;
    return <line key={i} x1={x + p * Math.cos(a)} y1={y + p * Math.sin(a)} x2={x + q * Math.cos(a)} y2={y + q * Math.sin(a)} className="vc-seam" />;
  });
  const patches = Array.from({ length: 5 }, (_, i) => {
    const a = ((-90 + spin + 36 + i * 72) * Math.PI) / 180;
    return <circle key={i} cx={x + r * 0.9 * Math.cos(a)} cy={y + r * 0.9 * Math.sin(a)} r={r * 0.2} className="vc-ball-p" />;
  });
  return (
    <g opacity={ghost ? 0.28 : 1}>
      <circle cx={x} cy={y + r * 0.95} r={r * 0.8} className="vc-shadow" transform={`translate(0 ${r * 0.18}) scale(1 .34)`} style={{ transformOrigin: `${x}px ${y + r * 0.95}px` }} />
      <circle cx={x} cy={y} r={r} className="vc-ball" />
      {!ghost && (
        <>
          {seams}
          {patches}
          <polygon points={pent(x, y, r * 0.4, -90 + spin)} className="vc-ball-p" />
        </>
      )}
    </g>
  );
}

function Disc({ x, y, r = 7, tone = 'brass', hollow = false }: { x: number; y: number; r?: number; tone?: Tone | 'ink'; hollow?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r + 3.5} className="vc-halo" />
      <circle cx={x} cy={y} r={r} className={hollow ? 'vc-disc-hollow' : `vc-f-${tone}`} />
      <circle cx={x} cy={y} r={r} className="vc-disc-ring" />
      {!hollow && <circle cx={x - r * 0.28} cy={y - r * 0.3} r={r * 0.26} className="vc-gloss" />}
    </g>
  );
}

function Cross({ x, y, s = 5 }: { x: number; y: number; s?: number }) {
  return <path d={`M${x - s} ${y - s}L${x + s} ${y + s}M${x + s} ${y - s}L${x - s} ${y + s}`} className="vc-x" />;
}

function Cone({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="6" rx="9" ry="3" className="vc-shadow" />
      <rect x="-8" y="3" width="16" height="3.4" rx="1.2" className="vc-f-terra-d" />
      <path d="M-6 3.4 0-13 6 3.4Z" className="vc-f-terra" />
      <path d="M-3.6-3.4h7.2L5 .2H-5Z" className="vc-f-ivory" />
    </g>
  );
}

/** Ok ucu: (x,y) uç noktası, angle derece (0 = sağa) */
function Head({ x, y, angle, s = 7, cls = 'vc-f-brass' }: { x: number; y: number; angle: number; s?: number; cls?: string }) {
  return <path d={`M0 0L${-s} ${-s * 0.55}L${-s * 0.72} 0L${-s} ${s * 0.55}Z`} transform={`translate(${x} ${y}) rotate(${angle})`} className={cls} />;
}

function Flag({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - 26} className="vc-pole" />
      <path d={`M${x} ${y - 26}l15 5.5L${x} ${y - 15}Z`} className="vc-f-terra" />
    </g>
  );
}

function Goal({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const cols = Math.floor(w / 11);
  const rows = Math.floor(h / 11);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className="vc-net-bg" />
      {Array.from({ length: cols - 1 }, (_, i) => <line key={`c${i}`} x1={x + ((i + 1) * w) / cols} y1={y} x2={x + ((i + 1) * w) / cols} y2={y + h} className="vc-net" />)}
      {Array.from({ length: rows - 1 }, (_, i) => <line key={`r${i}`} x1={x} y1={y + ((i + 1) * h) / rows} x2={x + w} y2={y + ((i + 1) * h) / rows} className="vc-net" />)}
      <path d={`M${x} ${y + h}V${y}H${x + w}V${y + h}`} className="vc-post" />
    </g>
  );
}

/** Çim şeritleri + isteğe bağlı saha çizgileri */
function Turf({ children, stripes = 8 }: { children?: ReactNode; stripes?: number }) {
  const w = 320 / stripes;
  return (
    <g>
      {Array.from({ length: stripes }, (_, i) => (i % 2 ? <rect key={i} x={i * w} y="0" width={w} height="180" className="vc-stripe" /> : null))}
      {children}
    </g>
  );
}

const SCENES: Record<VideoTopic, () => ReactNode> = {
  // ── PAS: iki oyuncu arasında kavisli pas, üçüncü seçenek soluk çizgiyle
  pas: () => (
    <>
      <Turf>
        <circle cx="160" cy="205" r="62" className="vc-ln" />
        <line x1="0" y1="143" x2="320" y2="143" className="vc-ln2" />
      </Turf>
      <path d="M60 128L150 142L252 58" className="vc-tri" />
      <path d="M62 124C88 38 190 28 244 58" className="vc-route" />
      <Head x={246} y={59} angle={28} s={9} />
      <Ball x={150} y={41} r={9.5} spin={22} />
      <Disc x={56} y={130} r={9} tone="brass" />
      <Disc x={254} y={64} r={9} tone="ivory" />
      <Disc x={152} y={146} r={7} tone="ivory" hollow />
      <Cross x={108} y={84} s={4.5} />
    </>
  ),
  // ── ŞUT: kale önü, topun izi ve köşe hedefi
  sut: () => (
    <>
      <Turf>
        <path d="M30 180L72 112H248L290 180" className="vc-ln" />
        <path d="M120 112V92M200 112V92" className="vc-ln2" />
      </Turf>
      <Goal x={96} y={18} w={128} h={64} />
      <circle cx="205" cy="36" r="17" className="vc-target" />
      <circle cx="205" cy="36" r="10" className="vc-target" />
      <circle cx="205" cy="36" r="3.2" className="vc-f-terra" />
      <path d="M156 150C150 112 176 70 199 44" className="vc-route vc-route--terra" />
      <Head x={202} y={40} angle={-52} s={9} cls="vc-f-terra" />
      <Ball x={140} y={142} r={9} spin={-10} ghost />
      <Ball x={148} y={152} r={10.5} spin={10} />
      <path d="M118 160l12-5M112 168l14-6M108 150l11-3" className="vc-speed" />
    </>
  ),
  // ── TOP KONTROLÜ: kramponun üstünde sakinleşen top
  kontrol: () => (
    <>
      <Turf>
        <ellipse cx="164" cy="146" rx="130" ry="14" className="vc-ln2" />
      </Turf>
      <ellipse cx="164" cy="144" rx="78" ry="6" className="vc-shadow" />
      <Ball x={168} y={22} r={9} ghost />
      <Ball x={168} y={42} r={9} spin={30} ghost />
      <path d="M168 62V68" className="vc-route vc-route--short" />
      <Ball x={170} y={84} r={13} spin={14} />
      <path d="M144 96Q170 112 196 96" className="vc-cushion" />
      <path d="M134 104Q170 128 206 104" className="vc-cushion vc-cushion--2" />
      {/* krampon */}
      <path d="M96 120C96 100 100 82 110 70L148 66L152 92C176 98 204 104 222 114C230 119 232 128 228 134L98 134Z" className="vc-boot" transform="translate(0 6)" />
      <path d="M96 128H228" className="vc-sole" transform="translate(0 6)" />
      <path d="M156 96l14 3M162 104l14 3M168 112l14 3" className="vc-lace" transform="translate(0 6)" />
      {[112, 142, 188, 214].map((sx) => <rect key={sx} x={sx - 4} y="140" width="8" height="7" rx="1.4" className="vc-stud" />)}
      <path d="M104 100h18" className="vc-boot-tab" transform="translate(0 6)" />
    </>
  ),
  // ── TOP SÜRME: konilerin arasından kıvrılan sürüş çizgisi
  surme: () => (
    <>
      <Turf>
        <line x1="0" y1="120" x2="320" y2="120" className="vc-ln2" />
      </Turf>
      <path d="M30 100C52 100 58 70 82 70S106 122 132 122S158 70 184 70S208 122 234 122S262 100 292 100" className="vc-route vc-route--wide" />
      <Head x={294} y={100} angle={0} s={9} />
      {[[82, 98], [132, 100], [184, 98], [234, 100]].map(([x, y], i) => <Cone key={i} x={x} y={y} />)}
      <Ball x={34} y={100} r={9.5} spin={30} />
      <path d="M12 94h10M8 102h12" className="vc-speed" />
    </>
  ),
  // ── KAFA: gelen top, alın teması, çıkan top
  kafa: () => (
    <>
      <Turf>
        <line x1="0" y1="152" x2="320" y2="152" className="vc-ln" />
        <path d="M250 152V118H320" className="vc-ln2" />
      </Turf>
      <path d="M52 22C100 30 150 54 176 80" className="vc-route vc-route--dim" />
      <path d="M182 78C214 60 244 38 280 24" className="vc-route" />
      <Head x={282} y={23} angle={-24} s={9} />
      <ellipse cx="138" cy="152" rx="40" ry="4.5" className="vc-shadow" />
      <path d="M96 150C98 124 112 114 136 112C160 114 172 124 176 150Z" className="vc-body" />
      <path d="M124 114h24l-2 10h-20Z" className="vc-neck" />
      <circle cx="140" cy="96" r="17" className="vc-head" />
      <path d="M152 86C160 90 160 104 150 110" className="vc-brow" />
      <path d="M126 82C132 74 148 74 154 82" className="vc-hair" />
      <Ball x={180} y={74} r={12} spin={24} />
      <path d="M194 62l8-8M198 72l11-3M196 84l9 5" className="vc-speed vc-speed--hit" />
    </>
  ),
  // ── BİTİRİCİLİK: ceza sahası, açı ve kaleciyle karşı karşıya
  bitiricilik: () => (
    <>
      <Turf>
        <rect x="64" y="-10" width="192" height="104" className="vc-ln" />
        <rect x="116" y="-10" width="88" height="46" className="vc-ln" />
        <path d="M128 94A34 34 0 0 0 192 94" className="vc-ln2" />
        <circle cx="160" cy="68" r="2.2" className="vc-f-ivory" />
      </Turf>
      <path d="M160 128L134 6M160 128L186 6" className="vc-tri-ln" />
      <path d="M160 128L134 6H186Z" className="vc-cone-fill" />
      <path d="M160 122C174 92 184 56 184 24" className="vc-route vc-route--terra" />
      <Head x={184} y={21} angle={-90} s={9} cls="vc-f-terra" />
      <rect x="130" y="2" width="60" height="3.4" className="vc-f-ivory" />
      <Disc x={150} y={20} r={6.5} tone="mint" />
      <path d="M142 20l-10 0M158 20l10 0" className="vc-keeper-arms" />
      <circle cx="184" cy="26" r="6" className="vc-target" />
      <Cross x={184} y={26} s={3.2} />
      <Disc x={160} y={140} r={9} tone="terra" />
      <Ball x={172} y={150} r={7.5} spin={12} />
    </>
  ),
  // ── HÜCUM: üç hat boyunca ileri doğru koşular, savunma hattı
  hucum: () => (
    <>
      <Turf>
        <rect x="70" y="-10" width="180" height="62" className="vc-ln" />
        <rect x="120" y="-10" width="80" height="24" className="vc-ln" />
        <line x1="0" y1="118" x2="320" y2="118" className="vc-ln2" />
      </Turf>
      {[84, 128, 192, 236].map((x) => <Cross key={x} x={x} y={72} s={4.5} />)}
      <path d="M70 160C70 120 76 96 96 62" className="vc-route vc-route--soft" />
      <Head x={98} y={58} angle={-62} s={8} />
      <path d="M250 160C250 120 244 96 224 62" className="vc-route vc-route--soft" />
      <Head x={222} y={58} angle={-118} s={8} />
      <path d="M160 156V28" className="vc-route vc-route--wide" />
      <Head x={160} y={20} angle={-90} s={11} />
      <Disc x={70} y={162} r={7} tone="brass" />
      <Disc x={250} y={162} r={7} tone="brass" />
      <Disc x={160} y={164} r={8} tone="ivory" />
      <Ball x={176} y={170} r={6} spin={8} />
    </>
  ),
  // ── SAVUNMA: sıkı hat, rakip hücumunu durdurma
  savunma: () => (
    <>
      <Turf>
        <rect x="64" y="-10" width="192" height="52" className="vc-ln" />
        <path d="M128 42A32 32 0 0 0 192 42" className="vc-ln2" />
      </Turf>
      <path d="M62 96H258" className="vc-link" />
      {[62, 118, 174, 230].map((x) => <Disc key={x} x={x + 8} y={96} r={8} tone="mint" />)}
      {[[92, 156], [160, 164], [226, 156]].map(([x, y], i) => (
        <g key={i}>
          <Cross x={x} y={y} s={5} />
          <path d={`M${x} ${y - 10}V${y - 34}`} className="vc-route vc-route--terra vc-route--soft" />
        </g>
      ))}
      {[100, 168, 234].map((x) => <path key={x} d={`M${x - 10} 116H${x + 10}`} className="vc-stop" />)}
      <path d="M160 18l22 7v14c0 14-9 24-22 29-13-5-22-15-22-29V25Z" className="vc-shield" transform="translate(0 -6)" />
    </>
  ),
  // ── KALECİLİK: eldiven ve kale
  kalecilik: () => (
    <>
      <Turf>
        <path d="M0 168H320" className="vc-ln2" />
      </Turf>
      <Goal x={196} y={12} w={96} h={54} />
      <path d="M298 14C262 22 244 38 226 60" className="vc-route vc-route--dim" />
      <Ball x={226} y={62} r={11} spin={18} />
      {/* eldiven */}
      <g transform="translate(-30 4)">
        <rect x="116" y="142" width="62" height="24" rx="5" className="vc-glove-cuff" />
        <path d="M116 152H178M116 158H178" className="vc-glove-line" />
        <rect x="108" y="88" width="78" height="58" rx="16" className="vc-glove" />
        <rect x="112" y="46" width="15" height="52" rx="7.5" className="vc-glove" />
        <rect x="129" y="34" width="15" height="62" rx="7.5" className="vc-glove" />
        <rect x="146" y="40" width="15" height="58" rx="7.5" className="vc-glove" />
        <rect x="163" y="54" width="15" height="46" rx="7.5" className="vc-glove" />
        <rect x="82" y="94" width="16" height="44" rx="8" className="vc-glove" transform="rotate(-38 90 116)" />
        <path d="M112 66h15M129 58h15M146 62h15M163 74h15" className="vc-glove-line" />
        <path d="M118 112q30 16 62 0" className="vc-glove-grip" />
        <path d="M124 124h50" className="vc-glove-grip" />
      </g>
    </>
  ),
  // ── DURAN TOPLAR: korner yayı, bayrak ve ceza sahasına kavisli servis
  duran: () => (
    <>
      <Turf>
        <rect x="-20" y="22" width="126" height="132" className="vc-ln" />
        <rect x="-20" y="62" width="50" height="52" className="vc-ln" />
        <path d="M106 66A40 40 0 0 1 106 110" className="vc-ln2" />
        <path d="M262 180A26 26 0 0 1 320 150" className="vc-ln" transform="translate(-2 0)" />
      </Turf>
      <path d="M296 150C240 98 170 70 112 86" className="vc-route" />
      <Head x={110} y={86} angle={196} s={9} />
      <Flag x={300} y={154} />
      <Ball x={290} y={154} r={8} spin={30} />
      {[[60, 70], [88, 94], [66, 126]].map(([x, y], i) => <Disc key={i} x={x} y={y} r={7} tone="brass" />)}
      {[[74, 96], [48, 100]].map(([x, y], i) => <Cross key={i} x={x} y={y} s={4.5} />)}
    </>
  ),
  // ── TOPSUZ: koşu çizgileri ve ofsayt hattı
  topsuz: () => (
    <>
      <Turf>
        <line x1="160" y1="0" x2="160" y2="180" className="vc-ln2" />
        <circle cx="160" cy="90" r="36" className="vc-ln2" />
      </Turf>
      <line x1="226" y1="8" x2="226" y2="172" className="vc-offside" />
      <path d="M60 140C84 112 116 86 160 78" className="vc-route vc-route--dash" />
      <Head x={162} y={78} angle={-8} s={8} />
      <path d="M96 160C150 150 200 120 250 56" className="vc-route vc-route--dash" />
      <Head x={252} y={53} angle={-52} s={8} />
      <path d="M44 62C80 54 120 40 196 34" className="vc-route vc-route--dash vc-route--dim" />
      <Head x={198} y={34} angle={-4} s={8} cls="vc-f-ivory" />
      <path d="M62 142L252 58" className="vc-pass-ghost" />
      <Disc x={56} y={144} r={7.5} tone="brass" />
      <Disc x={94} y={162} r={7.5} tone="ivory" />
      <Disc x={42} y={64} r={7.5} tone="ivory" />
      <Ball x={68} y={150} r={6} spin={0} />
      <Cross x={236} y={46} s={4.5} />
      <Cross x={236} y={104} s={4.5} />
    </>
  ),
  // ── TAKTİK: 4-3-3 dizilimi ve oyun planı okları
  taktik: () => (
    <>
      <Turf stripes={10}>
        <rect x="10" y="12" width="300" height="156" className="vc-ln" />
        <line x1="160" y1="12" x2="160" y2="168" className="vc-ln2" />
        <circle cx="160" cy="90" r="26" className="vc-ln2" />
      </Turf>
      <path d="M40 90H100M100 40H190M100 140H190M100 90H190" className="vc-link vc-link--thin" transform="translate(0 0)" />
      <path d="M100 40V140M150 56V124M190 40V140" className="vc-link vc-link--thin" />
      <Disc x={34} y={90} r={7} tone="mint" />
      {[40, 72, 108, 140].map((y) => <Disc key={y} x={80} y={y} r={7} tone="brass" />)}
      {[56, 90, 124].map((y) => <Disc key={y} x={140} y={y} r={7} tone="brass" />)}
      {[44, 90, 136].map((y) => <Disc key={y} x={204} y={y} r={7} tone="brass" />)}
      <path d="M212 44C238 40 256 52 262 70" className="vc-route vc-route--soft" />
      <Head x={263} y={74} angle={78} s={8} />
      <path d="M212 136C238 140 256 128 262 110" className="vc-route vc-route--soft" />
      <Head x={263} y={106} angle={-78} s={8} />
      {[[268, 90], [250, 60], [250, 120]].map(([x, y], i) => <Cross key={i} x={x} y={y} s={4.5} />)}
    </>
  ),
  // ── FİZİKSEL: halter, hız çizgileri, koşu şeritleri
  fiziksel: () => (
    <>
      <Turf>
        <path d="M0 150L320 128M0 164L320 148M0 178L320 168" className="vc-ln2" />
      </Turf>
      <path d="M18 70h54M6 88h66M26 106h48" className="vc-speed vc-speed--long" />
      <rect x="112" y="87" width="104" height="8" rx="3" className="vc-bar" />
      <rect x="116" y="88.5" width="96" height="2" className="vc-bar-hi" />
      <rect x="98" y="58" width="13" height="64" rx="4" className="vc-plate" />
      <rect x="84" y="68" width="13" height="44" rx="4" className="vc-plate vc-plate--2" />
      <rect x="217" y="58" width="13" height="64" rx="4" className="vc-plate" />
      <rect x="231" y="68" width="13" height="44" rx="4" className="vc-plate vc-plate--2" />
      <rect x="150" y="84" width="14" height="14" rx="2" className="vc-grip" />
      <rect x="170" y="84" width="14" height="14" rx="2" className="vc-grip" />
      <path d="M262 66l12-12M270 86l16-4M262 106l12 10" className="vc-speed vc-speed--hit" />
    </>
  ),
  // ── ISINMA VE ÖNLEME: kalkan, artı işareti ve nabız çizgisi
  onleme: () => (
    <>
      <Turf>
        <circle cx="160" cy="90" r="64" className="vc-ln2" />
        <line x1="0" y1="90" x2="320" y2="90" className="vc-ln2" />
      </Turf>
      <path d="M0 108H92l10-8 10 30 14-64 14 54 10-12h160" className="vc-pulse" transform="translate(0 -18)" />
      <path d="M160 24l50 16v34c0 32-22 56-50 66-28-10-50-34-50-66V40Z" className="vc-shield vc-shield--big" />
      <path d="M160 44l34 11v24c0 22-15 38-34 45-19-7-34-23-34-45V55Z" className="vc-shield-in" />
      <path d="M160 70v38M141 89h38" className="vc-plus" />
    </>
  ),
};

export function VideoCover({ topic, className = '' }: { topic: VideoTopic; className?: string }) {
  const scene = SCENES[topic];
  return (
    <span className={`vcov ${className}`} data-tone={COVER_TONE[topic]} data-topic={topic} aria-hidden="true">
      <svg className="vcov__svg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" focusable="false">
        {scene()}
      </svg>
    </span>
  );
}
