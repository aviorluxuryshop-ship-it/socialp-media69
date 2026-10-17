import type { FootZone } from '@/data/types';
import { BOOT_OUT, GEO, TOP_SEAM } from '@/lib/boot-shapes';
import { Ball } from './ball';
import { C, id, ref } from './defs';
import { Stitch, ZoneLayer } from './parts';

// Sağ krampon, üstten: burun yukarıda, dış yan (küçük parmak) sağda.
const OUT = BOOT_OUT;

// Bağcık sıraları (sol/sağ gözlük hattı)
const ROW_L = 'M263 158C261 230 261 320 263 380';
const ROW_R = 'M336 158C338 230 338 320 336 380';
const EYE_Y = [176, 207, 238, 269, 300, 331, 362];

// Kollar (ayak giriş ağzı)
const MOUTH_RIM =
  'M262 404C262 394 342 394 342 404C358 432 366 470 358 502C352 524 330 534 302 534C274 534 252 524 246 502C238 470 246 432 262 404Z';
const MOUTH_IN =
  'M271 413C271 407 333 407 333 413C345 437 351 468 346 495C341 511 324 521 302 521C280 521 263 511 258 495C253 468 259 437 271 413Z';

export function TopBoot({ u, active, flip, showBall, ballZone }: { u: string; active: ReadonlySet<FootZone>; flip: boolean; showBall: boolean; ballZone: FootZone | null }) {
  const g = GEO.ust;
  const ball = ballZone ? g.zones[ballZone]?.ball : undefined;
  return (
    <g transform={`translate(${g.ox} ${g.oy})`} className="boot-art boot-art--ust">
      <defs>
        <clipPath id={id(u, 'tclip')}>
          <path d={OUT} />
        </clipPath>
      </defs>

      {/* zemin gölgesi */}
      <path d={OUT} transform={`translate(${flip ? -16 : 16} 20)`} fill="#000" opacity=".55" filter={ref(u, 'blur12')} />
      <path d={OUT} transform={`translate(${flip ? -5 : 5} 8)`} fill="#000" opacity=".5" filter={ref(u, 'blur6')} />

      {/* top: kramponun altında kalır (üstten bakışta ayak topun üstündedir) */}
      {showBall && ball && <Ball u={u} x={ball.x} y={ball.y} r={ball.r} shadowDx={flip ? -8 : 8} />}

      {/* taban kenarı: üst yapının çevresinden taşan taban plakası */}
      <path d={OUT} fill="none" stroke="#0b0d0c" strokeWidth="19" strokeLinejoin="round" />
      <path d={OUT} fill="none" stroke={ref(u, 'sole')} strokeWidth="15" strokeLinejoin="round" />
      <path d={OUT} fill="none" stroke="#000" strokeOpacity=".28" strokeWidth="15" strokeLinejoin="round" strokeDasharray="1 0" />

      {/* gövde */}
      <path d={OUT} fill={ref(u, 'upper')} />
      <g clipPath={`url(#${id(u, 'tclip')})`}>
        <rect x="150" y="0" width="320" height="600" fill={ref(u, 'tex')} />

        {/* burun kapağı */}
        <path d={`${TOP_SEAM} L480 128 L480 -40 L120 -40 Z`} fill="#fff" fillOpacity=".045" />
        <path d={TOP_SEAM} fill="none" stroke="#000" strokeOpacity=".55" strokeWidth="3.2" />
        <path d={TOP_SEAM} fill="none" stroke="#efeadc" strokeOpacity=".16" strokeWidth="1" transform="translate(0 -2.2)" />
        <Stitch d={TOP_SEAM} />
        <path transform="translate(0 -9)" d={TOP_SEAM} fill="none" stroke="#efeadc" strokeOpacity=".28" strokeWidth="1.2" strokeDasharray="5 4" />

        {/* dil */}
        <path d="M268 166C282 172 290 172 302 172C314 172 322 172 332 166L334 384L268 384Z" fill="#101311" />
        <path d="M268 172L268 384" stroke="#000" strokeOpacity=".5" strokeWidth="4" />
        <path d="M332 172L332 384" stroke="#000" strokeOpacity=".5" strokeWidth="4" />
        <path d="M285 180C284 240 284 320 286 380M318 180C319 240 319 320 317 380" stroke="#fff" strokeOpacity=".05" strokeWidth="6" fill="none" />

        {/* gözlük şeritleri (eyestay) */}
        {[ROW_L, ROW_R].map((d, k) => (
          <g key={k}>
            <path d={d} stroke="#000" strokeOpacity=".45" strokeWidth="40" strokeLinecap="round" fill="none" />
            <path d={d} stroke={k === 0 ? '#343a37' : '#2d332f'} strokeWidth="37" strokeLinecap="round" fill="none" />
            <path d={d} stroke="#fff" strokeOpacity=".05" strokeWidth="20" strokeLinecap="round" fill="none" />
            <path d={d} transform="translate(-16 0)" stroke="#efeadc" strokeOpacity=".3" strokeWidth="1.2" strokeDasharray="5 4" fill="none" strokeLinecap="round" />
            <path d={d} transform="translate(16 0)" stroke="#efeadc" strokeOpacity=".3" strokeWidth="1.2" strokeDasharray="5 4" fill="none" strokeLinecap="round" />
          </g>
        ))}

        {/* bağcıklar: çapraz bantlar */}
        {EYE_Y.slice(0, -1).map((y, i) => {
          const y2 = EYE_Y[i + 1];
          const a = `M263 ${y}C284 ${y + 14} 316 ${y2 - 14} 336 ${y2}`;
          const b = `M336 ${y}C316 ${y + 14} 284 ${y2 - 14} 263 ${y2}`;
          return (
            <g key={y}>
              <path d={a} stroke="#000" strokeOpacity=".5" strokeWidth="8.5" fill="none" strokeLinecap="round" transform="translate(0 1.6)" />
              <path d={a} stroke={ref(u, 'trim')} strokeWidth="6.2" fill="none" strokeLinecap="round" />
              <path d={a} stroke="#fff" strokeOpacity=".65" strokeWidth="1.3" fill="none" strokeLinecap="round" transform="translate(0 -1.3)" />
              <path d={b} stroke="#000" strokeOpacity=".55" strokeWidth="8.5" fill="none" strokeLinecap="round" transform="translate(0 1.6)" />
              <path d={b} stroke={ref(u, 'trim')} strokeWidth="6.2" fill="none" strokeLinecap="round" />
              <path d={b} stroke="#fff" strokeOpacity=".65" strokeWidth="1.3" fill="none" strokeLinecap="round" transform="translate(0 -1.3)" />
            </g>
          );
        })}

        {/* gözlükler */}
        {EYE_Y.flatMap((y) => [263, 336].map((x) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="5.6" fill="#050706" />
            <circle cx={x} cy={y} r="5.6" fill="none" stroke={C.iv3} strokeWidth="1.8" />
            <circle cx={x - 1} cy={y - 1.2} r="5.6" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth=".9" strokeDasharray="6 30" />
          </g>
        )))}

        {/* düğüm ve kuyruklar */}
        <g>
          <path d="M299 372C284 354 266 362 268 376C270 388 290 384 299 374Z" fill="none" stroke="#000" strokeOpacity=".5" strokeWidth="8.6" strokeLinejoin="round" transform="translate(0 1.5)" />
          <path d="M299 372C314 354 332 362 330 376C328 388 308 384 299 374Z" fill="none" stroke="#000" strokeOpacity=".5" strokeWidth="8.6" strokeLinejoin="round" transform="translate(0 1.5)" />
          <path d="M299 374C292 392 278 398 272 410M299 374C308 392 322 398 328 410" stroke="#000" strokeOpacity=".5" strokeWidth="8" fill="none" strokeLinecap="round" transform="translate(0 1.5)" />
          <path d="M299 372C284 354 266 362 268 376C270 388 290 384 299 374Z" fill="none" stroke={ref(u, 'trim')} strokeWidth="6" strokeLinejoin="round" />
          <path d="M299 372C314 354 332 362 330 376C328 388 308 384 299 374Z" fill="none" stroke={ref(u, 'trim')} strokeWidth="6" strokeLinejoin="round" />
          <path d="M299 374C292 392 278 398 272 410M299 374C308 392 322 398 328 410" stroke={ref(u, 'trim')} strokeWidth="5.4" fill="none" strokeLinecap="round" />
          <ellipse cx="299" cy="373" rx="7.5" ry="6.5" fill={ref(u, 'trim')} stroke="#000" strokeOpacity=".4" strokeWidth="1" />
        </g>

        {/* giriş ağzı (ayak girişi) */}
        <path d={MOUTH_RIM} fill="none" stroke="#000" strokeOpacity=".5" strokeWidth="18" strokeLinejoin="round" filter={ref(u, 'blur3')} />
        <path d={MOUTH_RIM} fill="#2e3532" stroke="#0c0f0e" strokeWidth="1.2" />
        <path d={MOUTH_RIM} fill="none" stroke="#fff" strokeOpacity=".08" strokeWidth="5" transform="translate(-1 -1)" />
        <path d={MOUTH_IN} fill={ref(u, 'liner')} />
        <path d={MOUTH_IN} fill="none" stroke="#000" strokeOpacity=".7" strokeWidth="3" />
        <path d="M271 424C280 418 324 418 333 424" stroke="#fff" strokeOpacity=".07" strokeWidth="3" fill="none" />
        <Stitch d="M256 408C240 436 240 474 250 500C258 520 280 529 302 529C324 529 346 520 354 500C364 474 364 436 348 408" op={0.3} />

        {/* topuk bölümü: dikiş ve gölge */}
        <path d="M240 470C238 520 268 546 304 546C340 546 370 520 372 470" fill="none" stroke="#000" strokeOpacity=".25" strokeWidth="2.5" />
        <Stitch d="M236 478C238 516 266 538 304 538C342 538 370 516 372 478" op={0.28} w={1.1} />

        {/* hacim: kenarlara doğru koyulaşma, sol üstten ışık */}
        <path d={OUT} fill="none" stroke="#000" strokeOpacity=".5" strokeWidth="34" filter={ref(u, 'blur6')} />
        <path d={OUT} fill="none" stroke="#efeadc" strokeOpacity=".22" strokeWidth="2.4" transform={`translate(${flip ? -3 : 3} 3.5)`} />
        <ellipse cx="238" cy="150" rx="30" ry="62" fill="#fff" fillOpacity=".06" filter={ref(u, 'blur12')} transform={`rotate(${flip ? 14 : -14} 238 150)`} />

        {/* temas bölgeleri */}
        <ZoneLayer u={u} zones={g.zones} active={active} />
      </g>
      <path d={OUT} fill="none" stroke="#050706" strokeOpacity=".85" strokeWidth="1.6" />
    </g>
  );
}
