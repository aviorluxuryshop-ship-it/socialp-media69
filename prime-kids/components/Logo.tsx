import { LOGO_PATH, LOGO_VIEWBOX } from './logo-path'

/** Orijinal PRIME KIDS logosu (vektör). Rengi `currentColor` ile miras alır. */
export function Logo({ className, title = 'PRIME KIDS' }: { className?: string; title?: string }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" fillRule="evenodd" d={LOGO_PATH} />
    </svg>
  )
}
