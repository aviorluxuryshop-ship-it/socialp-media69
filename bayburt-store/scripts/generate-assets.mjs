/**
 * Bayburt Store — asset generator.
 *
 * Draws the three Miras Koleksiyonu kits as self-contained SVG files so the
 * storefront ships with real, on-brand product visuals instead of grey boxes.
 * Photography can replace any of them later: drop the file into
 * /public/images and point `data/products.ts` at the new path.
 *
 *   npm run assets
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const JERSEY_DIR = join(ROOT, 'public', 'images', 'jerseys')
const MOTIF_DIR = join(ROOT, 'public', 'images', 'motifs')

const round = (n) => Math.round(n * 100) / 100

/* ------------------------------------------------------------------ */
/* Geometry — one 1000×1000 raglan shirt block shared by all three kits */
/* ------------------------------------------------------------------ */

const SHIRT = [
  'M 500 74',
  'C 468 74 442 78 420 86',
  'L 148 254',
  'C 130 264 122 284 126 306',
  'L 138 388',
  'C 140 406 148 416 160 421',
  'L 282 471',
  'C 268 640 264 806 270 936',
  'C 271 952 284 962 302 963',
  'L 698 963',
  'C 716 962 729 952 730 936',
  'C 736 806 732 640 718 471',
  'L 840 421',
  'C 852 416 860 406 862 388',
  'L 874 306',
  'C 878 284 870 264 852 254',
  'L 580 86',
  'C 558 78 532 74 500 74',
  'Z',
].join(' ')

/** Torso only — bounded left and right by the raglan seams. */
const BODY = [
  'M 400 88',
  'C 362 176 312 300 282 471',
  'C 268 640 264 806 270 936',
  'C 271 952 284 962 302 963',
  'L 698 963',
  'C 716 962 729 952 730 936',
  'C 736 806 732 640 718 471',
  'C 688 300 638 176 600 88',
  'C 570 76 532 74 500 74',
  'C 468 74 430 76 400 88',
  'Z',
].join(' ')

const SLEEVE_L = [
  'M 400 88',
  'L 148 254',
  'C 130 264 122 284 126 306',
  'L 138 388',
  'C 140 406 148 416 160 421',
  'L 282 471',
  'C 312 300 362 176 400 88',
  'Z',
].join(' ')

const SLEEVE_R = [
  'M 600 88',
  'L 852 254',
  'C 870 264 878 284 874 306',
  'L 862 388',
  'C 860 406 852 416 840 421',
  'L 718 471',
  'C 688 300 638 176 600 88',
  'Z',
].join(' ')

const RAGLAN_SEAMS = 'M 400 88 C 362 176 312 300 282 471 M 600 88 C 638 176 688 300 718 471'

/** V-neck opening. */
const NECK_V = [
  'M 412 90',
  'C 440 78 470 74 500 74',
  'C 530 74 560 78 588 90',
  'L 500 225',
  'Z',
].join(' ')

/** Shallower opening that sits under the polo collar. */
const NECK_POLO = [
  'M 418 92',
  'C 444 80 472 76 500 76',
  'C 528 76 556 80 582 92',
  'L 500 200',
  'Z',
].join(' ')

/** Back neckline — a shallow lens instead of a V. */
const NECK_BACK = [
  'M 424 92',
  'C 446 112 470 120 500 120',
  'C 530 120 554 112 576 92',
  'C 552 80 528 76 500 76',
  'C 472 76 448 80 424 92',
  'Z',
].join(' ')

/** Cuff hem segments, used to lay the sleeve rings out. */
const CUFF_L = { a: [160, 421], b: [282, 471] }
const CUFF_R = { a: [840, 421], b: [718, 471] }

/**
 * A ring parallel to a cuff hem, pushed `offset` px up the sleeve and
 * extended past both ends so the clip path trims it cleanly.
 */
function cuffRing({ a, b }, offset, width, color) {
  const [ax, ay] = a
  const [bx, by] = b
  const dx = bx - ax
  const dy = by - ay
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  // Perpendicular pointing back up the sleeve, towards the shoulder.
  const nx = ax < bx ? uy : -uy
  const ny = ax < bx ? -ux : ux
  const ext = 120
  const x1 = round(ax - ux * ext + nx * offset)
  const y1 = round(ay - uy * ext + ny * offset)
  const x2 = round(bx + ux * ext + nx * offset)
  const y2 = round(by + uy * ext + ny * offset)
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" />`
}

function cuffStack(rings) {
  return [
    [CUFF_L, 'sleeve-l'],
    [CUFF_R, 'sleeve-r'],
  ]
    .map(
      ([cuff, clip]) =>
        `<g clip-path="url(#${clip})">` +
        rings.map((ring) => cuffRing(cuff, ring.offset, ring.width, ring.color)).join('') +
        '</g>',
    )
    .join('')
}

/* ------------------------------------------------------------------ */
/* Club marks                                                          */
/* ------------------------------------------------------------------ */

function star(cx, cy, outer, inner, points = 5, rotation = -90) {
  const coords = []
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = ((rotation + (i * 180) / points) * Math.PI) / 180
    coords.push(`${round(cx + radius * Math.cos(angle))},${round(cy + radius * Math.sin(angle))}`)
  }
  return `<polygon points="${coords.join(' ')}" />`
}

const CREST_SHIELD =
  'M -76 -96 L 76 -96 C 84 -96 90 -90 90 -82 L 90 26 C 90 76 40 108 0 122 C -40 108 -90 76 -90 26 L -90 -82 C -90 -90 -84 -96 -76 -96 Z'

/** Bayburtspor crest: gold shield, black name bar, tower-and-curl monogram. */
function crest(x, y, scale) {
  return `
  <g transform="translate(${x} ${y}) scale(${scale})">
    <path d="${CREST_SHIELD}" fill="#050505" transform="scale(1.10)" />
    <path d="${CREST_SHIELD}" fill="#FFFFFF" transform="scale(1.045)" />
    <path d="${CREST_SHIELD}" fill="#D4AF37" />
    <path d="${CREST_SHIELD}" fill="url(#crestSheen)" />
    <path d="M -90 -82 C -90 -90 -84 -96 -76 -96 L 76 -96 C 84 -96 90 -90 90 -82 L 90 -50 L -90 -50 Z" fill="#050505" />
    <text x="0" y="-64" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="1" fill="#FFFFFF">BAYBURTSPOR</text>
    <g fill="#050505">
      <rect x="-42" y="-32" width="16" height="96" rx="3" />
      <rect x="-47" y="-45" width="26" height="14" rx="3" />
      <rect x="-38" y="-58" width="8" height="15" rx="2" />
    </g>
    <path d="M 34 -18 C 34 -34 16 -42 4 -33 C -8 -24 -2 -8 12 2 C 28 13 34 30 22 44 C 10 57 -8 52 -12 36" fill="none" stroke="#050505" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
  </g>`
}

/** City badge worn on the hem: "69" over a small gold shield. */
function badge69(x, y, scale) {
  return `
  <g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M -54 -42 L 54 -42 C 60 -42 64 -38 64 -32 L 64 12 C 64 46 28 62 0 70 C -28 62 -64 46 -64 12 L -64 -32 C -64 -38 -60 -42 -54 -42 Z" fill="#050505" opacity="0.9" transform="scale(1.08)" />
    <path d="M -54 -42 L 54 -42 C 60 -42 64 -38 64 -32 L 64 12 C 64 46 28 62 0 70 C -28 62 -64 46 -64 12 L -64 -32 C -64 -38 -60 -42 -54 -42 Z" fill="#D4AF37" />
    <path d="M -54 -42 L 54 -42 C 60 -42 64 -38 64 -32 L 64 12 C 64 46 28 62 0 70 C -28 62 -64 46 -64 12 L -64 -32 C -64 -38 -60 -42 -54 -42 Z" fill="url(#crestSheen)" />
    <text x="0" y="-22" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" letter-spacing="1.4" fill="#0A0A0A" opacity="0.8">BAYBURT</text>
    <path d="M -34 -14 L 34 -14" stroke="#0A0A0A" stroke-width="2" opacity="0.4" />
    <text x="0" y="34" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="56" font-weight="700" fill="#0A0A0A">69</text>
  </g>`
}

/** Turkish flag tab stitched under the collar. */
function flagTab(x, y, scale = 1) {
  return `
  <g transform="translate(${x} ${y}) scale(${scale})">
    <rect x="-30" y="-20" width="60" height="40" rx="3" fill="#E30A17" />
    <circle cx="-5" cy="0" r="13" fill="#FFFFFF" />
    <circle cx="0.5" cy="0" r="10.4" fill="#E30A17" />
    <g fill="#FFFFFF">${star(14, 0, 8, 3.3)}</g>
  </g>`
}

/* ------------------------------------------------------------------ */
/* Shared defs: fabric grain, lighting, clip paths                     */
/* ------------------------------------------------------------------ */

function sharedDefs(extra = '') {
  return `
  <defs>
    <clipPath id="shirt"><path d="${SHIRT}" /></clipPath>
    <clipPath id="body"><path d="${BODY}" /></clipPath>
    <clipPath id="sleeve-l"><path d="${SLEEVE_L}" /></clipPath>
    <clipPath id="sleeve-r"><path d="${SLEEVE_R}" /></clipPath>

    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="69" result="noise" />
      <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
      <feComponentTransfer in="mono" result="soft">
        <feFuncA type="linear" slope="0.07" intercept="0" />
      </feComponentTransfer>
      <feComposite in="soft" in2="SourceGraphic" operator="in" />
    </filter>

    <linearGradient id="lightSweep" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.16" />
      <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.03" />
      <stop offset="74%" stop-color="#000000" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.20" />
    </linearGradient>

    <radialGradient id="chestLight" cx="42%" cy="26%" r="58%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="softShade">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.30" />
      <stop offset="60%" stop-color="#000000" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <linearGradient id="crestSheen" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.34" />
      <stop offset="46%" stop-color="#FFFFFF" stop-opacity="0" />
      <stop offset="100%" stop-color="#5A4310" stop-opacity="0.30" />
    </linearGradient>

    <radialGradient id="vignette" cx="50%" cy="46%" r="72%">
      <stop offset="52%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.5" />
    </radialGradient>
    ${extra}
  </defs>`
}

/** Soft shading pass laid over every kit so the fabric reads three-dimensional. */
const SHADING = `
  <g clip-path="url(#shirt)">
    <path d="${SHIRT}" fill="url(#chestLight)" />
    <path d="${SHIRT}" fill="url(#lightSweep)" />
    <ellipse cx="500" cy="120" rx="250" ry="90" fill="url(#softShade)" />
    <ellipse cx="224" cy="352" rx="140" ry="150" fill="url(#softShade)" />
    <ellipse cx="776" cy="352" rx="140" ry="150" fill="url(#softShade)" />
    <ellipse cx="500" cy="984" rx="240" ry="80" fill="url(#softShade)" />
    <ellipse cx="300" cy="720" rx="86" ry="250" fill="url(#softShade)" opacity="0.7" />
    <ellipse cx="700" cy="720" rx="86" ry="250" fill="url(#softShade)" opacity="0.7" />
    <path d="${SHIRT}" fill="#FFFFFF" filter="url(#grain)" opacity="0.45" />
  </g>
  <path d="${SHIRT}" fill="none" stroke="#000000" stroke-opacity="0.30" stroke-width="2.4" />`

/** Optional inner highlight: keeps a dark kit legible on a dark plate. */
const RIM = `
  <g clip-path="url(#shirt)">
    <path d="${SHIRT}" fill="none" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="3" />
  </g>`

const SEAMS = `
  <g clip-path="url(#shirt)" fill="none" stroke="#000000" stroke-opacity="0.14" stroke-width="2.5">
    <path d="${RAGLAN_SEAMS}" />
    <path d="M 270 936 C 380 952 620 952 730 936" />
  </g>`

function svgDocument(inner, background = 'transparent') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" role="img">
  <rect width="1000" height="1000" fill="${background}" />
${inner}
</svg>
`
}

/* ------------------------------------------------------------------ */
/* Collars                                                             */
/* ------------------------------------------------------------------ */

function ribbedNeck(layers, neck) {
  const strokes = layers
    .map(
      (layer) =>
        `<path d="${neck}" fill="none" stroke="${layer.color}" stroke-width="${layer.width}" stroke-linejoin="round" />`,
    )
    .join('')
  return `<g clip-path="url(#shirt)">${strokes}</g>`
}

const POLO_OUTER = [
  'M 500 252',
  'L 356 186',
  'C 350 176 354 165 364 160',
  'L 400 92',
  'C 430 80 464 74 500 74',
  'C 536 74 570 80 600 92',
  'L 636 160',
  'C 646 165 650 176 644 186',
  'Z',
].join(' ')

function poloCollar() {
  return `
  <g clip-path="url(#shirt)">
    <path d="${POLO_OUTER} ${NECK_POLO}" fill-rule="evenodd" fill="#0A0A0A" />
    <path d="${POLO_OUTER}" fill="none" stroke="#D4AF37" stroke-width="4.5" stroke-linejoin="round" />
    <path d="${NECK_POLO}" fill="none" stroke="#D4AF37" stroke-width="4" stroke-linejoin="round" />
    <path d="M 500 252 L 356 186 M 500 252 L 644 186" stroke="#000000" stroke-opacity="0.4" stroke-width="2" fill="none" />
  </g>`
}

/* ------------------------------------------------------------------ */
/* Kit artwork                                                         */
/* ------------------------------------------------------------------ */

const HISAR_STRIPES = [324, 412, 500, 588, 676]

function hisarBase() {
  const stripes = HISAR_STRIPES.map(
    (cx) => `<rect x="${cx - 23}" y="50" width="46" height="950" fill="#0A0A0A" />`,
  ).join('')
  const facets = `
      <g fill="#FFFFFF" fill-opacity="0.05">
        <path d="M 290 560 L 460 470 L 512 640 L 330 730 Z" />
        <path d="M 512 190 L 690 300 L 664 480 L 496 372 Z" />
        <path d="M 312 780 L 508 712 L 552 900 L 344 956 Z" />
      </g>
      <g fill="#000000" fill-opacity="0.05">
        <path d="M 540 640 L 706 586 L 712 792 L 556 836 Z" />
        <path d="M 296 300 L 430 236 L 452 400 L 306 456 Z" />
      </g>`
  return `
  <g clip-path="url(#shirt)">
    <rect width="1000" height="1000" fill="#E9A21C" />
    <rect width="1000" height="1000" fill="url(#hisarSheen)" />
  </g>
  <g clip-path="url(#body)">${facets}${stripes}</g>`
}

function coruhBase() {
  const cityArt = `
      <g stroke="#0A0A0A" stroke-opacity="0.06" fill="none" stroke-width="7" stroke-linejoin="round">
        <path d="M 300 700 L 300 556 L 338 556 L 338 596 L 376 596 L 376 542 L 414 542 L 414 596 L 452 596 L 452 556 L 490 556 L 490 700" />
        <path d="M 316 900 L 316 812 L 352 812 L 352 844 L 388 844 L 388 800 L 424 800 L 424 900" />
        <path d="M 508 500 L 508 330 L 546 330 L 546 372 L 584 372 L 584 316 L 622 316 L 622 500" />
      </g>
      <g stroke="#0A0A0A" stroke-opacity="0.055" fill="none" stroke-width="6" stroke-linecap="round">
        <path d="M 268 240 C 372 296 348 402 438 456 C 528 510 492 614 388 656" />
        <path d="M 306 224 C 416 284 392 392 482 448 C 572 504 534 616 428 660" />
        <path d="M 344 210 C 458 276 434 386 524 442 C 614 498 576 620 466 666" />
        <path d="M 286 928 C 380 896 434 922 528 890" />
        <path d="M 292 958 C 390 926 440 952 534 920" />
      </g>
      <g fill="#0A0A0A" fill-opacity="0.035">
        <path d="M 366 300 L 442 258 L 442 362 L 366 404 Z" />
        <path d="M 296 736 L 384 696 L 384 802 L 296 842 Z" />
      </g>`
  return `
  <g clip-path="url(#shirt)">
    <rect width="1000" height="1000" fill="#FFFFFF" />
    <rect width="1000" height="1000" fill="url(#coruhSheen)" />
  </g>
  <g clip-path="url(#body)">
    ${cityArt}
    <rect x="566" y="50" width="26" height="950" fill="#0A0A0A" />
    <rect x="598" y="50" width="68" height="950" fill="#E9A21C" />
    <rect x="598" y="50" width="68" height="950" fill="url(#bandSheen)" />
  </g>`
}

function cinimacinBase() {
  const panels = `
      <rect x="278" y="50" width="64" height="950" fill="#151515" />
      <rect x="352" y="50" width="48" height="950" fill="#1E1E1E" />
      <rect x="410" y="50" width="32" height="950" fill="#0E0E0E" />
      <rect x="452" y="50" width="52" height="950" fill="#1E1E1E" />
      <rect x="514" y="50" width="34" height="950" fill="#151515" />
      <rect x="558" y="50" width="56" height="950" fill="#1A1A1A" />
      <rect x="624" y="50" width="44" height="950" fill="#111111" />
      <rect x="678" y="50" width="46" height="950" fill="#1E1E1E" />`
  const chevrons = [330, 500, 670]
    .map(
      (y) =>
        `<path d="M 500 ${y} L 712 ${y + 116} L 712 ${y + 196} L 500 ${y + 80} L 288 ${y + 196} L 288 ${y + 116} Z" />`,
    )
    .join('')
  const chevronsInner = [406, 576]
    .map(
      (y) =>
        `<path d="M 500 ${y} L 660 ${y + 88} L 660 ${y + 124} L 500 ${y + 36} L 340 ${y + 124} L 340 ${y + 88} Z" />`,
    )
    .join('')
  return `
  <g clip-path="url(#shirt)"><rect width="1000" height="1000" fill="#0A0A0A" /></g>
  <g clip-path="url(#body)">
    ${panels}
    <g fill="#242424" fill-opacity="0.9">${chevrons}</g>
    <g fill="#0B0B0B" fill-opacity="0.92">${chevronsInner}</g>
    <rect x="278" y="50" width="446" height="950" fill="url(#tileMotif)" opacity="0.62" />
  </g>
  <g clip-path="url(#shirt)"><rect width="1000" height="1000" fill="url(#cinimacinSheen)" /></g>`
}

/* ------------------------------------------------------------------ */
/* Kit definitions                                                     */
/* ------------------------------------------------------------------ */

const KITS = {
  hisar: {
    defs: `
    <linearGradient id="hisarSheen" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="#F6BB40" stop-opacity="0.85" />
      <stop offset="46%" stop-color="#E9A21C" stop-opacity="0" />
      <stop offset="100%" stop-color="#B0760A" stop-opacity="0.5" />
    </linearGradient>`,
    base: hisarBase,
    neckFill: `<path d="${NECK_POLO}" fill="#121212" />`,
    collar: poloCollar,
    backCollar: `<g clip-path="url(#shirt)"><path d="${NECK_BACK}" fill="#121212" /><path d="${NECK_BACK}" fill="none" stroke="#0A0A0A" stroke-width="30" stroke-linejoin="round" /><path d="${NECK_BACK}" fill="none" stroke="#D4AF37" stroke-width="5" /></g>`,
    cuffs: [
      { offset: 18, width: 15, color: '#0A0A0A' },
      { offset: 46, width: 15, color: '#0A0A0A' },
    ],
    crest: { x: 412, y: 322, scale: 0.48 },
    flag: { x: 500, y: 128, scale: 0.76 },
    nameColor: '#0A0A0A',
    numberColor: '#0A0A0A',
    numberOutline: '#D4AF37',
    detailFocus: { x: 452, y: 232, scale: 1.85 },
  },
  coruh: {
    defs: `
    <linearGradient id="coruhSheen" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.85" />
      <stop offset="50%" stop-color="#F5F5F4" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#DBDBD8" stop-opacity="0.7" />
    </linearGradient>
    <linearGradient id="bandSheen" x1="0" y1="0" x2="1" y2="0.15">
      <stop offset="0%" stop-color="#A56C05" stop-opacity="0.4" />
      <stop offset="42%" stop-color="#F6BB40" stop-opacity="0.28" />
      <stop offset="100%" stop-color="#9C6604" stop-opacity="0.45" />
    </linearGradient>`,
    base: coruhBase,
    neckFill: `<path d="${NECK_V}" fill="#121212" />`,
    collar: () =>
      ribbedNeck(
        [
          { color: '#0A0A0A', width: 40 },
          { color: '#E9A21C', width: 26 },
          { color: '#0A0A0A', width: 14 },
          { color: '#E9A21C', width: 6 },
        ],
        NECK_V,
      ),
    backCollar: `<g clip-path="url(#shirt)"><path d="${NECK_BACK}" fill="#121212" /><path d="${NECK_BACK}" fill="none" stroke="#0A0A0A" stroke-width="34" stroke-linejoin="round" /><path d="${NECK_BACK}" fill="none" stroke="#E9A21C" stroke-width="19" /><path d="${NECK_BACK}" fill="none" stroke="#0A0A0A" stroke-width="7" /></g>`,
    cuffs: [
      { offset: 16, width: 26, color: '#0A0A0A' },
      { offset: 38, width: 11, color: '#E9A21C' },
      { offset: 56, width: 11, color: '#0A0A0A' },
      { offset: 70, width: 6, color: '#E9A21C' },
    ],
    crest: { x: 620, y: 322, scale: 0.48 },
    flag: { x: 500, y: 132, scale: 0.78 },
    nameColor: '#0A0A0A',
    numberColor: '#0A0A0A',
    numberOutline: '#E9A21C',
    detailFocus: { x: 556, y: 236, scale: 1.85 },
  },
  cinimacin: {
    defs: `
    <linearGradient id="cinimacinSheen" x1="0.05" y1="0" x2="0.95" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.09" />
      <stop offset="44%" stop-color="#FFFFFF" stop-opacity="0.015" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.4" />
    </linearGradient>
    <pattern id="tileMotif" width="92" height="92" patternUnits="userSpaceOnUse" patternTransform="translate(8 22)">
      <g fill="none" stroke="#3C3C3C" stroke-width="2.4" stroke-opacity="0.75">
        <path d="M 46 12 L 80 46 L 46 80 L 12 46 Z" />
        <path d="M 46 27 L 65 46 L 46 65 L 27 46 Z" />
        <path d="M 0 46 L 12 46 M 80 46 L 92 46 M 46 0 L 46 12 M 46 80 L 46 92" />
      </g>
      <circle cx="46" cy="46" r="4.5" fill="#3C3C3C" fill-opacity="0.75" />
    </pattern>`,
    base: cinimacinBase,
    rim: true,
    neckFill: `<path d="${NECK_V}" fill="#111111" />`,
    collar: () =>
      ribbedNeck(
        [
          { color: '#D4AF37', width: 34 },
          { color: '#0A0A0A', width: 22 },
          { color: '#D4AF37', width: 10 },
        ],
        NECK_V,
      ),
    backCollar: `<g clip-path="url(#shirt)"><path d="${NECK_BACK}" fill="#111111" /><path d="${NECK_BACK}" fill="none" stroke="#D4AF37" stroke-width="28" stroke-linejoin="round" /><path d="${NECK_BACK}" fill="none" stroke="#0A0A0A" stroke-width="17" /><path d="${NECK_BACK}" fill="none" stroke="#D4AF37" stroke-width="6" /></g>`,
    cuffs: [
      { offset: 20, width: 12, color: '#D4AF37' },
      { offset: 46, width: 12, color: '#D4AF37' },
    ],
    crest: { x: 620, y: 322, scale: 0.48 },
    flag: { x: 500, y: 132, scale: 0.78 },
    nameColor: '#D4AF37',
    numberColor: '#D4AF37',
    numberOutline: '#0A0A0A',
    detailFocus: { x: 556, y: 236, scale: 1.85 },
  },
}

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

function frontArt(key) {
  const kit = KITS[key]
  return [
    kit.base(),
    SEAMS,
    SHADING,
    kit.rim ? RIM : '',
    kit.neckFill,
    kit.collar(),
    cuffStack(kit.cuffs),
    crest(kit.crest.x, kit.crest.y, kit.crest.scale),
    badge69(650, 886, 0.46),
    flagTab(kit.flag.x, kit.flag.y, kit.flag.scale),
  ].join('\n')
}

function backArt(key) {
  const kit = KITS[key]
  return [
    kit.base(),
    SEAMS,
    SHADING,
    kit.rim ? RIM : '',
    kit.backCollar,
    cuffStack(kit.cuffs),
    badge69(650, 886, 0.4),
    `<g clip-path="url(#shirt)">
    <text x="500" y="356" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="700" letter-spacing="8" fill="${kit.nameColor}" stroke="${kit.numberOutline}" stroke-width="5" paint-order="stroke">BAYBURT</text>
    <text x="500" y="706" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="256" font-weight="700" letter-spacing="-4" fill="${kit.numberColor}" stroke="${kit.numberOutline}" stroke-width="8" paint-order="stroke">69</text>
  </g>`,
  ].join('\n')
}

function detailArt(key) {
  const { x, y, scale } = KITS[key].detailFocus
  return `
  <g transform="translate(${round(500 - scale * x)} ${round(500 - scale * y)}) scale(${scale})">
${frontArt(key)}
  </g>
  <rect width="1000" height="1000" fill="url(#vignette)" />`
}

/* ------------------------------------------------------------------ */
/* Heritage motifs used as page textures                               */
/* ------------------------------------------------------------------ */

const MOTIFS = {
  castle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <g fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round">
    <path d="M 20 380 L 20 200 L 56 200 L 56 236 L 92 236 L 92 176 L 128 176 L 128 236 L 164 236 L 164 200 L 200 200 L 200 380 Z" />
    <path d="M 200 380 L 200 140 L 236 140 L 236 184 L 272 184 L 272 116 L 308 116 L 308 184 L 344 184 L 344 140 L 380 140 L 380 380" />
    <path d="M 60 380 L 60 296 L 108 296 L 108 380" />
    <path d="M 244 380 L 244 264 L 296 264 L 296 380" />
    <path d="M 20 268 L 200 268 M 200 216 L 380 216" />
  </g>
</svg>
`,
  river: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <g fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round">
    <path d="M -20 96 C 60 44 140 148 220 96 C 300 44 380 148 460 96" />
    <path d="M -20 152 C 60 100 140 204 220 152 C 300 100 380 204 460 152" />
    <path d="M -20 208 C 60 156 140 260 220 208 C 300 156 380 260 460 208" />
    <path d="M -20 264 C 60 212 140 316 220 264 C 300 212 380 316 460 264" />
    <path d="M -20 320 C 60 268 140 372 220 320 C 300 268 380 372 460 320" />
  </g>
</svg>
`,
  tile: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <g fill="none" stroke="#FFFFFF" stroke-width="3">
    <path d="M 200 40 L 360 200 L 200 360 L 40 200 Z" />
    <path d="M 200 100 L 300 200 L 200 300 L 100 200 Z" />
    <rect x="128" y="128" width="144" height="144" transform="rotate(45 200 200)" />
    <path d="M 0 200 L 40 200 M 360 200 L 400 200 M 200 0 L 200 40 M 200 360 L 200 400" />
    <path d="M 0 0 L 80 80 M 400 0 L 320 80 M 0 400 L 80 320 M 400 400 L 320 320" />
  </g>
  <circle cx="200" cy="200" r="18" fill="#FFFFFF" />
</svg>
`,
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

function build() {
  mkdirSync(JERSEY_DIR, { recursive: true })
  mkdirSync(MOTIF_DIR, { recursive: true })

  const views = { front: frontArt, back: backArt, detail: detailArt }
  const written = []

  for (const key of Object.keys(KITS)) {
    for (const [view, render] of Object.entries(views)) {
      const doc = svgDocument(`${sharedDefs(KITS[key].defs)}\n${render(key)}`)
      const file = join(JERSEY_DIR, `${key}-${view}.svg`)
      writeFileSync(file, doc, 'utf8')
      written.push(file)
    }
  }

  for (const [name, doc] of Object.entries(MOTIFS)) {
    const file = join(MOTIF_DIR, `${name}.svg`)
    writeFileSync(file, doc, 'utf8')
    written.push(file)
  }

  for (const file of written) console.log('wrote', file.replace(`${ROOT}/`, ''))
}

build()
