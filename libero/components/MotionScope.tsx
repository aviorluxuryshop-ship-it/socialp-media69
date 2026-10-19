'use client';

import { useEffect } from 'react';
import { initCardSpot, initParallax, initReveal } from '@/lib/motion';

/**
 * Sayfa içeriğini saran küçük istemci bileşeni: görünürken-yükselme gözlemcisini, paralaksı ve kart
 * ışığını kurar. app/template.tsx içinden her sayfa geçişinde yeniden bağlanır.
 */
export function MotionScope({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initCardSpot();
    const stopReveal = initReveal(document);
    const stopParallax = initParallax(document);
    return () => {
      stopReveal();
      stopParallax();
    };
  }, []);
  return <>{children}</>;
}
