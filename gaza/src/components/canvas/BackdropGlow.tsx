import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * A soft orange light pool behind the can — the studio's backdrop spill,
 * not a neon glow. A camera-facing plane with a radial falloff, additive,
 * kept low in opacity; `amount` comes from the timeline.
 */
export function BackdropGlow({ amount }: { amount: React.MutableRefObject<number> }) {
  const mesh = useRef<THREE.Mesh>(null)

  const texture = useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,128,48,1)')
    g.addColorStop(0.3, 'rgba(255,106,19,0.4)')
    g.addColorStop(0.62, 'rgba(255,106,19,0.06)')
    g.addColorStop(1, 'rgba(255,106,19,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0,
        fog: false,
      }),
    [texture],
  )

  useEffect(
    () => () => {
      texture.dispose()
      material.dispose()
    },
    [texture, material],
  )

  useFrame(({ camera }) => {
    if (!mesh.current) return
    // sit behind the can along the view direction, and always face the lens
    mesh.current.position.copy(camera.position).normalize().multiplyScalar(-1.6)
    mesh.current.quaternion.copy(camera.quaternion)
    material.opacity = amount.current * 0.2
    mesh.current.visible = material.opacity > 0.005
  })

  return (
    <mesh ref={mesh} material={material} renderOrder={-1}>
      <planeGeometry args={[3.4, 3.4]} />
    </mesh>
  )
}
