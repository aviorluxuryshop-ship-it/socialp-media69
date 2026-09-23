import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * A soft light pool behind the can, tinted to the active flavor — the
 * studio's backdrop spill, not a neon glow. A camera-facing plane with a
 * radial falloff, additive, kept low in opacity; `amount` comes from the
 * timeline.
 */
export function BackdropGlow({ amount, color }: { amount: React.MutableRefObject<number>; color: string }) {
  const mesh = useRef<THREE.Mesh>(null)

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 256
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])

  // repainted per flavor rather than tinted with a material colour: the falloff itself stays crisp
  useEffect(() => {
    const canvas = texture.image as HTMLCanvasElement
    const ctx = canvas.getContext('2d')!
    const rgb = new THREE.Color(color)
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => Math.round(c * 255))
    const size = canvas.width
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, `rgba(${r},${g},${b},1)`)
    grad.addColorStop(0.3, `rgba(${r},${g},${b},0.4)`)
    grad.addColorStop(0.62, `rgba(${r},${g},${b},0.06)`)
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    texture.needsUpdate = true
  }, [texture, color])

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
