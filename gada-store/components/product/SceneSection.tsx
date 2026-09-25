'use client'

import { useRef } from 'react'
import type { ReactNode } from 'react'
import clsx from 'clsx'

import { useReveal } from './useReveal'

// Narrow viewports always centre the text: with the can dead-centre on
// screen at every width, a left/right column on a phone sits close enough
// to it to read as clutter rather than composition. The side-aligned layout
// is a wider-screen refinement, from `sm:` up.
const ALIGN_CLASSES = {
  left: 'items-center text-center mx-auto sm:items-start sm:text-left sm:mr-auto sm:ml-0',
  right: 'items-center text-center mx-auto sm:items-end sm:text-right sm:ml-auto sm:mr-0',
  center: 'items-center text-center mx-auto',
} as const

export function SceneSection({
  align = 'center',
  kicker,
  children,
  className,
  wide = false,
}: {
  align?: 'left' | 'right' | 'center'
  kicker?: string
  children: ReactNode
  className?: string
  wide?: boolean
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  useReveal(ref, { from: align === 'center' ? 'up' : align })

  return (
    <section className="scene-act px-6 sm:px-10">
      <div className="container">
        <div
          ref={ref}
          className={clsx(
            'flex flex-col gap-5',
            wide ? 'max-w-2xl' : 'max-w-md',
            ALIGN_CLASSES[align],
            className,
          )}
          style={{ opacity: 0 }}
        >
          {kicker ? (
            <p className="font-sans text-xs font-medium uppercase tracking-wide4 text-[var(--accent)] drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
              {kicker}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  )
}
