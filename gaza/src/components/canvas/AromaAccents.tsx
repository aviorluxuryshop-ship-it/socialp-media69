import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'

/**
 * SAHNE 4's accents: a few real 3D orange slices and leaves drifting beside
 * the can, plus a sparse scatter of warm particles. Everything sits behind
 * or to the side of the can and scales in from nothing, driven by the
 * timeline's `aroma` value — never in front of the product.
 */

function citrusTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2

  ctx.fillStyle = '#F47A12'
  ctx.beginPath()
  ctx.arc(c, c, c, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FFF1DA'
  ctx.beginPath()
  ctx.arc(c, c, c * 0.9, 0, Math.PI * 2)
  ctx.fill()

  const segments = 10
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2 + 0.03
    const a1 = ((i + 1) / segments) * Math.PI * 2 - 0.03
    const g = ctx.createRadialGradient(c, c, c * 0.08, c, c, c * 0.84)
    g.addColorStop(0, '#FFC46B')
    g.addColorStop(0.6, '#FF9A2E')
    g.addColorStop(1, '#FF8414')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(c + Math.cos((a0 + a1) / 2) * c * 0.07, c + Math.sin((a0 + a1) / 2) * c * 0.07)
    ctx.arc(c, c, c * 0.84, a0, a1)
    ctx.closePath()
    ctx.fill()
  }

  // juice vesicles
  ctx.globalAlpha = 0.18
  ctx.strokeStyle = '#FFE7BF'
  ctx.lineWidth = 2
  for (let i = 0; i < 260; i++) {
    const a = Math.random() * Math.PI * 2
    const r = c * (0.15 + Math.random() * 0.65)
    const x = c + Math.cos(a) * r
    const y = c + Math.sin(a) * r
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function leafShape() {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.quadraticCurveTo(0.09, 0.08, 0, 0.26)
  shape.quadraticCurveTo(-0.09, 0.08, 0, 0)
  return shape
}

const SLICES: Array<{ position: [number, number, number]; rotation: [number, number, number]; scale: number; spin: number }> = [
  { position: [0.66, 0.3, -0.35], rotation: [1.1, 0.3, 0.2], scale: 1, spin: 0.18 },
  { position: [0.55, -0.34, -0.15], rotation: [0.5, -0.6, 0.4], scale: 0.78, spin: -0.14 },
  { position: [-0.6, 0.22, -0.75], rotation: [1.3, 0.8, -0.3], scale: 0.6, spin: 0.12 },
]

const LEAVES: Array<{ position: [number, number, number]; rotation: [number, number, number]; scale: number }> = [
  { position: [0.8, 0.5, -0.45], rotation: [0.3, 0.6, -0.9], scale: 1 },
  { position: [-0.7, -0.28, -0.35], rotation: [-0.2, -0.5, 2.2], scale: 0.85 },
]

type AromaAccentsProps = {
  amount: React.MutableRefObject<number>
  particles: number
}

export function AromaAccents({ amount, particles }: AromaAccentsProps) {
  const group = useRef<THREE.Group>(null)
  const sliceRefs = useRef<Array<THREE.Mesh | null>>([])
  const sparklesRef = useRef<THREE.Points>(null)

  const resources = useMemo(() => {
    const flesh = citrusTexture()
    const sliceGeometry = new THREE.CylinderGeometry(0.16, 0.16, 0.03, 48)
    const peel = new THREE.MeshStandardMaterial({ color: '#EE7410', roughness: 0.6, envMapIntensity: 0.5 })
    const face = new THREE.MeshPhysicalMaterial({ map: flesh, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.35, envMapIntensity: 0.45 })
    const leafGeometry = new THREE.ShapeGeometry(leafShape(), 16)
    const leaf = new THREE.MeshStandardMaterial({ color: '#2F7A35', roughness: 0.5, envMapIntensity: 0.5, side: THREE.DoubleSide })
    return { flesh, sliceGeometry, sliceMaterials: [peel, face, face], leafGeometry, leaf }
  }, [])

  useEffect(
    () => () => {
      resources.flesh.dispose()
      resources.sliceGeometry.dispose()
      resources.sliceMaterials.forEach((m) => m.dispose())
      resources.leafGeometry.dispose()
      resources.leaf.dispose()
    },
    [resources],
  )

  const lastParticleOpacity = useRef(-1)

  useFrame((state, delta) => {
    const a = amount.current
    if (group.current) {
      // opaque, shared materials: they grow in from a point rather than fading, which keeps them cheap
      group.current.visible = a > 0.01
      group.current.scale.setScalar(THREE.MathUtils.smootherstep(a, 0, 1))
    }
    if (a > 0.01) {
      sliceRefs.current.forEach((mesh, i) => {
        if (!mesh) return
        mesh.rotation.z += delta * SLICES[i].spin
        mesh.position.y = SLICES[i].position[1] + Math.sin(state.clock.elapsedTime * 0.6 + i) * 0.015
      })
    }

    // drei's Sparkles keeps opacity as a per-particle attribute, so fade the whole set by rewriting it
    const attr = sparklesRef.current?.geometry.getAttribute('opacity') as THREE.BufferAttribute | undefined
    const target = a * 0.55
    if (attr && Math.abs(target - lastParticleOpacity.current) > 0.004) {
      ;(attr.array as Float32Array).fill(target)
      attr.needsUpdate = true
      lastParticleOpacity.current = target
    }
    if (sparklesRef.current) sparklesRef.current.visible = a > 0.01
  })

  return (
    <>
      <group ref={group}>
        {SLICES.map((slice, i) => (
          <mesh
            key={i}
            ref={(el) => {
              sliceRefs.current[i] = el
            }}
            geometry={resources.sliceGeometry}
            material={resources.sliceMaterials}
            position={slice.position}
            rotation={slice.rotation}
            scale={slice.scale}
            castShadow
          />
        ))}
        {LEAVES.map((leaf, i) => (
          <mesh key={i} geometry={resources.leafGeometry} material={resources.leaf} position={leaf.position} rotation={leaf.rotation} scale={leaf.scale} />
        ))}
      </group>
      {particles > 0 && (
        <Sparkles
          ref={sparklesRef}
          count={particles}
          speed={0.2}
          opacity={1}
          size={2.6}
          scale={[2.2, 1.6, 1.4]}
          position={[0.1, 0.05, -0.3]}
          color="#FF9A4A"
          noise={0.6}
        />
      )}
    </>
  )
}
