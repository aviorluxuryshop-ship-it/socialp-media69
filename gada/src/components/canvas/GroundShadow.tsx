import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { CAN_RADIUS } from '@/lib/canGeometry'

/**
 * Mobile stand-in for ContactShadows: a pre-baked soft ellipse under the
 * can. Costs one textured quad instead of an extra depth render and two
 * blur passes every frame.
 */
export function GroundShadow({ y }: { y: number }) {
  const texture = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(0,0,0,0.75)')
    g.addColorStop(0.45, 'rgba(0,0,0,0.35)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    return new THREE.CanvasTexture(canvas)
  }, [])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh position-y={y} rotation-x={-Math.PI / 2} renderOrder={-1}>
      <planeGeometry args={[CAN_RADIUS * 4.4, CAN_RADIUS * 4.4]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  )
}
