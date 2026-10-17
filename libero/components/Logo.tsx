export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="17.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M20 2.5v35" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 20h8.2M29.3 20h8.2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="20" cy="20" r="4.2" fill="var(--brass)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <LogoMark />
      <span className="wordmark__text">
        <span className="wordmark__name" lang="en">Libero</span>
        <span className="wordmark__sub">Futbol Akademisi</span>
      </span>
    </span>
  );
}
