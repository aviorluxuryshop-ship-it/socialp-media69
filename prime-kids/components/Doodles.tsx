/** Hafif, çocuksu süslemeler — yıldız, bulut, kalp, kıvrım. Dekoratiftir, ekran okuyuculardan gizlidir. */
type P = { className?: string; style?: React.CSSProperties }

export function Star({ className, style, color = '#ffd84d' }: P & { color?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} style={style} aria-hidden="true">
      <path d="M20 3l4.9 10 11 1.6-8 7.8 1.9 11L20 28.2 10.2 33.4l1.9-11-8-7.8 11-1.6z" fill={color} stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  )
}

export function Cloud({ className, style }: P) {
  return (
    <svg viewBox="0 0 80 48" className={className} style={style} aria-hidden="true">
      <path d="M20 44h44a14 14 0 0 0 0-28 18 18 0 0 0-34-4A15 15 0 0 0 20 44z" fill="#fff" stroke="#cfe5f4" strokeWidth="3" />
    </svg>
  )
}

export function Heart({ className, style, color = '#ff7eab' }: P & { color?: string }) {
  return (
    <svg viewBox="0 0 40 36" className={className} style={style} aria-hidden="true">
      <path d="M20 33S3 23 3 12a8.5 8.5 0 0 1 17-2 8.5 8.5 0 0 1 17 2c0 11-17 21-17 21z" fill={color} />
    </svg>
  )
}

export function Squiggle({ className, style, color = '#4ea6e3' }: P & { color?: string }) {
  return (
    <svg viewBox="0 0 80 20" className={className} style={style} aria-hidden="true">
      <path d="M3 12c8-10 14 6 22-2s14 6 22-2 14 6 22-2" fill="none" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  )
}
