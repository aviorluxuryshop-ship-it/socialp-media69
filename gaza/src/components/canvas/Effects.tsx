import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DepthOfField, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { type DepthOfFieldEffect, ToneMappingMode } from 'postprocessing'
import type * as THREE from 'three'

/** Depth of field tuning for the macro shots. */
export const DOF = {
  /** World units around the focus point that stay sharp. */
  focusRange: 0.3,
  /** Bokeh size at full macro strength. */
  maxBokeh: 2.2,
}

type EffectsProps = {
  /** 0..1 from the timeline — 0 everywhere but the macro scene. */
  strength: React.MutableRefObject<number>
  /** World point the lens focuses on (the camera's look-at target). */
  focus: React.MutableRefObject<THREE.Vector3>
}

/**
 * Desktop-only post stack. It stays on for the whole page, with the bokeh
 * dialled to zero outside the macro scene, so the image never changes
 * character when DOF kicks in. Tone mapping moves in here because three
 * skips the renderer's own tone mapping when drawing into a render target.
 */
export function Effects({ strength, focus }: EffectsProps) {
  const dof = useRef<DepthOfFieldEffect>(null)

  useFrame(() => {
    const effect = dof.current
    if (!effect) return
    effect.target = focus.current
    effect.bokehScale = strength.current * DOF.maxBokeh
  })

  return (
    <EffectComposer multisampling={4}>
      <DepthOfField ref={dof} focusRange={DOF.focusRange} bokehScale={0} resolutionScale={0.5} />
      <Vignette offset={0.32} darkness={0.5} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
