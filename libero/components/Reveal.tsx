import type { CSSProperties } from 'react';

type Variant = 'up' | 'fade' | 'left' | 'right' | 'scale' | 'heading';

/**
 * Görünürken yükselen sarmalayıcı. Sunucuda da çizilir (ayrı bir istemci bileşeni değil);
 * gözlemciyi components/MotionScope.tsx bir kez kurar. İçerik hiçbir koşulda görünmez kalmaz:
 * bkz. styles/motion.css ve lib/motion.ts.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  delay = 0,
  variant = 'up',
  style,
}: {
  children: React.ReactNode;
  as?: 'div' | 'section' | 'li' | 'article' | 'span' | 'p' | 'header';
  className?: string;
  /** ms; aynı anda görünen kardeşler zaten kademelenir */
  delay?: number;
  variant?: Variant;
  style?: CSSProperties;
}) {
  const T = Tag as 'div';
  return (
    <T
      className={`reveal ${className}`.trim()}
      data-reveal={variant === 'up' ? '' : variant}
      data-delay={delay ? delay : undefined}
      style={style}
    >
      {children}
    </T>
  );
}

/** Görünür olunca 0'dan sayan sayı. Metin sunucuda zaten son değerdir (JS'siz ve arama motoru için). */
export function Count({ to, className = 'num', suffix = '' }: { to: number; className?: string; suffix?: string }) {
  return (
    <span className={className} data-count={to}>
      {to}
      {suffix}
    </span>
  );
}
