export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="9" className="fill-accent" />
      <path d="M7 13.5c3-4.5 6-4.5 9 0s6 4.5 9 0" className="stroke-accent-ink" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 20c3-4.5 6-4.5 9 0s6 4.5 9 0" className="stroke-accent-ink" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="font-display text-[1.28rem] leading-none tracking-tight text-ink">StudyFlow</span>
    </span>
  );
}
