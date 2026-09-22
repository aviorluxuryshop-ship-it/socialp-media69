import { lazy, Suspense, useRef } from 'react'
import { Navbar } from '@/components/Navbar'
import { ScrollIndicator } from '@/components/ScrollIndicator'
import { Hero } from '@/components/sections/Hero'
import { SceneDiscover } from '@/components/sections/SceneDiscover'
import { Scene360 } from '@/components/sections/Scene360'
import { SceneMacro } from '@/components/sections/SceneMacro'
import { SceneAroma } from '@/components/sections/SceneAroma'
import { FinalCTA } from '@/components/sections/FinalCTA'
import { useLenisScroll } from '@/hooks/useLenisScroll'

// the 3D layer (three, r3f, drei) is its own chunk: copy and nav paint first while it streams in
const ExperienceCanvas = lazy(() => import('@/components/ExperienceCanvas').then((m) => ({ default: m.ExperienceCanvas })))

/**
 * Section order must match SCENES in lib/scenes.ts — the 3D timeline is
 * keyed to those heights. Nothing else may add height to <main>.
 */
export default function App() {
  const scrollRoot = useRef<HTMLElement>(null)
  useLenisScroll(scrollRoot)

  return (
    <>
      <Suspense fallback={null}>
        <ExperienceCanvas />
      </Suspense>
      <Navbar />
      <ScrollIndicator />
      <main ref={scrollRoot} className="relative">
        <Hero />
        <SceneDiscover />
        <Scene360 />
        <SceneMacro />
        <SceneAroma />
        <FinalCTA />
      </main>
    </>
  )
}
