'use client';

import { useEffect, useRef } from 'react';

/** Ölçülü görünür olma animasyonu: bir kez, hareket azaltma tercihine saygılı. */
export function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  as?: 'div' | 'section' | 'li' | 'article';
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-in');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const T = Tag as 'div';
  return (
    <T
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </T>
  );
}
