/**
 * No product photography yet — this renders a credible stand-in for each
 * card: a credit-card-shaped plate in the product's own color with the
 * NFC wave mark etched into it, so the catalog still reads as a real
 * catalog rather than a wall of gray boxes.
 */
export function ProductVisual({ color, name }: { color: string; name: string }) {
  const isLight = isLightColor(color)
  const textColor = isLight ? 'rgba(16,17,20,0.85)' : 'rgba(255,255,255,0.85)'

  return (
    <div
      className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-card"
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${shade(color, -18)} 100%)`,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-25 blur-2xl"
        style={{ background: shade(color, 40) }}
      />
      <div className="relative flex w-[78%] flex-col justify-between p-5" style={{ color: textColor }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] opacity-80">TagOne</span>
          <NfcWave color={textColor} />
        </div>
        <div className="mt-6">
          <p className="text-sm font-semibold leading-tight">{name}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] opacity-70">NFC Kart · Dokun &amp; Paylaş</p>
        </div>
      </div>
    </div>
  )
}

function NfcWave({ color }: { color: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 15a8 8 0 0 1 0-6" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      <path d="M9 17a12 12 0 0 1 0-10" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
      <path d="M12 19a16 16 0 0 1 0-14" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function isLightColor(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const luma = 0.299 * r + 0.587 * g + 0.114 * b
  return luma > 170
}

function shade(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex)
  const clamp = (v: number) => Math.max(0, Math.min(255, v))
  const nr = clamp(r + amount)
  const ng = clamp(g + amount)
  const nb = clamp(b + amount)
  return `rgb(${nr}, ${ng}, ${nb})`
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
}
