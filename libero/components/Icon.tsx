import type { SVGProps } from 'react';

// Tutarlı çizgi ikon seti: 24px ızgara, 1.5 çizgi kalınlığı, yuvarlak uçlar.
const P: Record<string, string> = {
  arrow: 'M4 12h15m-5-6 6 6-6 6',
  'arrow-up-right': 'M7 17 17 7m0 0H8m9 0v9',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 3-4.5-4.5',
  menu: 'M4 8h16M4 16h16',
  close: 'm6 6 12 12M18 6 6 18',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  chevron: 'm6 9 6 6 6-6',
  'chevron-right': 'm9 6 6 6-6 6',
  'chevron-left': 'm15 6-6 6 6 6',
  play: 'M8 5.5v13l11-6.5-11-6.5Z',
  pause: 'M8 5v14M16 5v14',
  'step-back': 'M18 5.5v13L8 12l10-6.5ZM6 5v14',
  'step-fwd': 'M6 5.5v13L16 12 6 5.5ZM18 5v14',
  trash: 'M5 7h14M10 7V4.5h4V7m-7 0 1 12.5h8L17 7M10 11v5m4-5v5',
  download: 'M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14',
  upload: 'M12 16V5m0 0L7.5 9.5M12 5l4.5 4.5M5 19.5h14',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v6m0-9.2v.2',
  warn: 'M12 4 2.8 19.5h18.4L12 4Zm0 6v4.5m0 2.5v.1',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5 8.5c.8-3.6 3.7-5.5 7.5-5.5s6.7 1.9 7.5 5.5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2',
  calendar: 'M4.5 6.5h15v13h-15v-13ZM4.5 10.5h15M8 4v4m8-4v4',
  dumbbell: 'M3 9.5v5M6 7v10M18 7v10M21 9.5v5M6 12h12',
  leaf: 'M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19c2-5 5-8 9-10',
  chart: 'M4 20V4m0 16h16M8 16v-5m4 5V8m4 8v-3',
  video: 'M3.5 6.5h12v11h-12v-11Zm12 4 5-3v9l-5-3',
  board: 'M3.5 5.5h17v13h-17v-13ZM12 5.5v13M3.5 12h17',
  bolt: 'M13 3 5 13.5h6L10.5 21 19 10h-6L13 3Z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-2.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  brain: 'M9 4.5a3 3 0 0 0-3 3v.3A3 3 0 0 0 4.5 11a3 3 0 0 0 1 2.2A3.2 3.2 0 0 0 9 19.5V4.5Zm0 0a3 3 0 0 1 3 3v12a3 3 0 0 1-3-3M15 4.5a3 3 0 0 1 3 3v.3A3 3 0 0 1 19.5 11a3 3 0 0 1-1 2.2A3.2 3.2 0 0 1 15 19.5V4.5Z',
  ball: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-12.5 3.4 2.5-1.3 4h-4.2l-1.3-4L12 8.5ZM12 3v5.5m3.4 2.5 5.3-1.5M14.1 15l3.2 4.4M9.9 15l-3.2 4.4M8.6 11 3.3 9.5',
  undo: 'M9 14 4.5 9.5 9 5M4.5 9.5H15a5 5 0 0 1 0 10h-3',
  redo: 'm15 14 4.5-4.5L15 5m4.5 4.5H9a5 5 0 0 0 0 10h3',
  copy: 'M9 9h10.5v10.5H9V9ZM5.5 15V5.5H15',
  pencil: 'm4 20 1-4.5L16.5 4a2.1 2.1 0 0 1 3 3L8 18.5 4 20Z',
  external: 'M14 4h6v6m0-6-9 9M18 14v5H5V6h5',
  refresh: 'M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5',
  flag: 'M5 21V4m0 1h12l-2 4 2 4H5',
  heart: 'M12 20s-7.5-4.6-7.5-10a4.3 4.3 0 0 1 7.5-2.8A4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z',
  lock: 'M6 11h12v9H6v-9Zm3 0V8a3 3 0 0 1 6 0v3',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  rotate: 'M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4',
  layers: 'm12 3.5 9 4.5-9 4.5L3 8l9-4.5ZM3 12.5l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5',
  zap: 'M13 3 5 13.5h6L10.5 21 19 10h-6L13 3Z',
  grid: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
};

export type IconName = keyof typeof P | string;

export function Icon({ name, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const d = P[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={name === 'arrow' ? 'arrow' : undefined}
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

export function StarGlyph({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="m12 3.2 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8L12 3.2Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
