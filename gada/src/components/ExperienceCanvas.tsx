import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { ProductScene, type Quality } from './canvas/ProductScene'
import { isMobileViewport, isWebGLAvailable, prefersReducedMotion } from '@/lib/webgl'
import { StaticFallback } from './StaticFallback'
import { CanvasErrorBoundary } from './CanvasErrorBoundary'

/** Per-tier renderer settings. */
const RENDER = {
  // DPR starts at maxDpr and PerformanceMonitor drops it to minDpr if the frame rate can't hold
  high: { maxDpr: 1.75, minDpr: 1, frameloop: 'always' as const, shadows: true },
  // demand: frames are only drawn while scrolling or while the camera is still settling
  low: { maxDpr: 1.5, minDpr: 1, frameloop: 'demand' as const, shadows: false },
}

/**
 * The single fixed WebGL layer behind the whole page. Copy scrolls over it
 * in normal document flow, so there is no pinning of the canvas itself to
 * fight with on mobile browsers.
 */
export function ExperienceCanvas() {
  const [env, setEnv] = useState<{ webgl: boolean; quality: Quality; reducedMotion: boolean } | null>(null)
  const [dpr, setDpr] = useState(1)

  useEffect(() => {
    const quality: Quality = isMobileViewport() ? 'low' : 'high'
    setEnv({ webgl: isWebGLAvailable(), quality, reducedMotion: prefersReducedMotion() })
    setDpr(Math.min(window.devicePixelRatio || 1, RENDER[quality].maxDpr))
  }, [])

  if (!env) return null
  if (!env.webgl) return <StaticFallback />

  const settings = RENDER[env.quality]

  return (
    // lvh: the canvas keeps the large-viewport height, so a phone's address bar sliding
    // in and out doesn't resize (and re-frame) the scene mid-scroll
    <div className="fixed inset-x-0 top-0 -z-10 h-[100lvh]" aria-hidden="true">
      <CanvasErrorBoundary>
        <Canvas
          dpr={dpr}
          frameloop={settings.frameloop}
          shadows={settings.shadows}
          gl={{ antialias: env.quality === 'low', powerPreference: 'high-performance', stencil: false }}
          camera={{ position: [0, -0.3, 4.55], fov: 34, near: 0.05, far: 20 }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', (event) => event.preventDefault())
          }}
        >
          {/* only on the continuous loop: in demand mode idle frames would read as a frame-rate drop */}
          {settings.frameloop === 'always' && (
            <PerformanceMonitor
              flipflops={3}
              onDecline={() => setDpr(settings.minDpr)}
              onIncline={() => setDpr(Math.min(window.devicePixelRatio || 1, settings.maxDpr))}
              onFallback={() => setDpr(settings.minDpr)}
            />
          )}
          <Suspense fallback={null}>
            <ProductScene quality={env.quality} reducedMotion={env.reducedMotion} />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  )
}
