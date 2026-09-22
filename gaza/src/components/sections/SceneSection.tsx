import type { ReactNode } from 'react'
import clsx from 'clsx'
import { sceneHeight, type SceneId } from '@/lib/scenes'

/**
 * Where a scene's copy sits relative to the can. The camera frames the can
 * to match (see desktopX / mobileY in lib/timeline.ts):
 *   bottom — centred under the can (hero, final)
 *   side   — left column on wide screens, top on phones (can shifts right / down)
 *   corner — a small label top-left, for scenes that are all product (macro)
 */
type Layout = 'bottom' | 'side' | 'corner'

type SceneSectionProps = {
  id: SceneId
  layout: Layout
  children: ReactNode
  /** Extra content pinned to the bottom edge of the frame (e.g. the footer line). */
  footer?: ReactNode
}

/**
 * One scene of the scroll. The section is as tall as scenes.ts says; its
 * copy is pinned in a viewport-high sticky frame for the scene's whole
 * active range while the fixed 3D layer animates underneath.
 */
export function SceneSection({ id, layout, children, footer }: SceneSectionProps) {
  return (
    <section id={id} className="relative" style={{ height: `${sceneHeight(id)}vh` }}>
      <div className="sticky top-0 h-[100svh] w-full">
        <div
          className={clsx(
            'container flex h-full flex-col',
            layout === 'bottom' && 'items-center justify-end pb-[11svh] text-center',
            layout === 'side' && 'items-center justify-start pt-[14svh] text-center md:items-start md:justify-center md:pt-0 md:text-left',
            layout === 'corner' && 'items-center justify-start pt-[14svh] text-center md:items-start md:pt-[16svh] md:text-left',
          )}
        >
          <div className={clsx(layout === 'side' && 'max-w-md md:max-w-[26rem]', layout === 'bottom' && 'max-w-xl')}>{children}</div>
        </div>
        {footer}
      </div>
    </section>
  )
}
