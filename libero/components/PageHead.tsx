import Link from 'next/link';

export function Ornament() {
  // Saha merkezi: yalnızca dekoratif, tek renk çizgi
  return (
    <svg className="page-head__orn" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <circle cx="100" cy="100" r="92" />
      <circle cx="100" cy="100" r="58" />
      <path d="M100 8v184M8 100h184" />
      <circle cx="100" cy="100" r="4" fill="currentColor" />
      <path d="M40 8v36h120V8M70 192v-18h60v18" />
    </svg>
  );
}

export function PageHead({
  eyebrow,
  title,
  lead,
  crumbs,
  children,
  wide,
  index,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  crumbs?: { href?: string; label: string }[];
  children?: React.ReactNode;
  wide?: boolean;
  /** büyük dekoratif dizin numarası, ör. "03" (isteğe bağlı, yalnızca süs) */
  index?: string;
}) {
  return (
    <section className={`page-head ${wide ? 'page-head--wide' : ''}`}>
      <Ornament />
      {index && (
        <span className="page-head__index" aria-hidden="true">
          {index}
        </span>
      )}
      <div className="container">
        {crumbs && (
          <nav className="breadcrumb" aria-label="Sayfa yolu">
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: 'inline-flex', gap: 8 }}>
                {i > 0 && <span aria-hidden>/</span>}
                {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <p className="eyebrow enter" style={{ '--e': 0 } as React.CSSProperties}>{eyebrow}</p>}
        <h1 className="h1 enter" style={{ '--e': 1 } as React.CSSProperties}>{title}</h1>
        {lead && <p className="lead enter" style={{ '--e': 2 } as React.CSSProperties}>{lead}</p>}
        {children}
      </div>
    </section>
  );
}
