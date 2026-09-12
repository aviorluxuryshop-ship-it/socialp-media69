import type { ReactNode } from 'react'

import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  eyebrow?: string
  title: ReactNode
  lead?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn(align === 'center' && 'mx-auto max-w-3xl text-center', className)}>
      {eyebrow ? (
        <Reveal as="p" className="eyebrow mb-5" distance={12}>
          {eyebrow}
        </Reveal>
      ) : null}

      <Reveal as="h2" from="above" className="font-display text-[clamp(1.9rem,4.4vw,3.25rem)] font-semibold uppercase leading-[1.16] tracking-tight text-balance text-white">
        {title}
      </Reveal>

      {lead ? (
        <Reveal
          as="p"
          delay={0.08}
          className={cn(
            'mt-6 max-w-prose font-sans text-[15px] leading-relaxed text-pretty text-smoke',
            align === 'center' && 'mx-auto',
          )}
        >
          {lead}
        </Reveal>
      ) : null}
    </div>
  )
}
