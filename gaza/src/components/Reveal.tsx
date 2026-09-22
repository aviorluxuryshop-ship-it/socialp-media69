import type { ReactNode } from 'react'
import clsx from 'clsx'
import { useReveal } from '@/hooks/useReveal'

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={clsx('transition-all duration-[900ms] ease-luxe', visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0', className)}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}
