import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ProductScene, type Quality } from './canvas/ProductScene'
import { isMobileViewport, isWebGLAvailable, prefersReducedMotion } from '@/lib/webgl'
import { StaticFallback } from './StaticFallback'
import { CanvasErrorBoundary } from './CanvasErrorBoundary'

/** Per-tier renderer settings. */
const RENDER = {
  high: { dpr: [1, 2] as [number, number], frameloop: 'always' as const, shadows: true },
  // demand: frames are only drawn while scrolling or while the camera is still settling
  low: { dpr: [1, 1.5] as [number, number], frameloop: 'demand' as const, shadows: false },
}

/**
 * The single fixed WebGL layer behind the whole page. Copy scrolls over it
 * in normal document flow, so there is no pinning of the canvas itself to
 * fight with on mobile browsers.
 */
export function ExperienceCanvas() {
  const [env, setEnv] = useState<{ webgl: boolean; quality: Quality; reducedMotion: boolean } | null>(null)

  useEffect(() => {
    setEnv({
      webgl: isWebGLAvailable(),
      quality: isMobileViewport() ? 'low' : 'high',
      reducedMotion: prefersReducedMotion(),
    })
  }, [])

  if (!env) return null
  if (!env.webgl) return <StaticFallback />

  const settings = RENDER[env.quality]

  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      <CanvasErrorBoundary>
        <Canvas
          dpr={settings.dpr}
          frameloop={settings.frameloop}
          shadows={settings.shadows}
          gl={{ antialias: env.quality === 'low', powerPreference: 'high-performance', stencil: false }}
          camera={{ position: [0, -0.3, 4.55], fov: 34, near: 0.05, far: 20 }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', (event) => event.preventDefault())
          }}
        >
          <Suspense fallback={null}>
            <ProductScene quality={env.quality} reducedMotion={env.reducedMotion} />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  )
}
