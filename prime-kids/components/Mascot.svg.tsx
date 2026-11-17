/**
 * Primo — markanın tek renkli, çizgisel stil asistanı.
 * Fotoğraflardaki "güneş gözlüklü havalı çocuk" temasından türetildi;
 * logonun siyah-beyaz, sade diliyle uyumlu kalsın diye çizgi film değil,
 * minimal bir karakter olarak tasarlandı.
 */
export function PrimoFace({ className, waving = false }: { className?: string; waving?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      {/* saç perçemi */}
      <path d="M38 34c4-14 18-20 30-17 4-6 14-6 18 1-6-1-9 2-10 4 8 2 13 8 14 14" fill="none" stroke="#151311" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {/* yüz */}
      <circle cx="60" cy="62" r="38" fill="#fff" stroke="#151311" strokeWidth="5" />
      {/* gözlük */}
      <path d="M24 54h72" stroke="#151311" strokeWidth="5" strokeLinecap="round" />
      <rect x="29" y="50" width="26" height="18" rx="7" fill="#151311" />
      <rect x="65" y="50" width="26" height="18" rx="7" fill="#151311" />
      <path d="M34 55l6 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".85" />
      <path d="M70 55l6 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".85" />
      {/* yanaklar */}
      <circle cx="33" cy="78" r="5" fill="#f4b9c6" />
      <circle cx="87" cy="78" r="5" fill="#f4b9c6" />
      {/* gülümseme */}
      <path d="M48 80c6 8 18 8 24 0" fill="none" stroke="#151311" strokeWidth="5" strokeLinecap="round" />
      {waving && (
        <g className="origin-[100px_100px] animate-wave">
          <path d="M98 92c6-4 10-12 9-20" fill="none" stroke="#151311" strokeWidth="5" strokeLinecap="round" />
          <circle cx="107" cy="68" r="7" fill="#fff" stroke="#151311" strokeWidth="5" />
        </g>
      )}
    </svg>
  )
}
