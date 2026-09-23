import { forwardRef, useEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  buildCanBaseGeometry,
  buildCanBodyGeometry,
  buildCanTopGeometry,
  buildLidRingGeometry,
  buildPullTabGeometry,
  buildRivetGeometry,
  buildScoreGeometry,
  CAN_HEIGHT,
  LID_PANEL_Y,
  LID_PANEL_RADIUS,
} from '@/lib/canGeometry'
import { createCanLabel, type CanLabel } from '@/lib/canLabelTexture'
import { PRODUCTS, type FlavorId } from '@/content/products'

/**
 * Phase offset so the label's front (u = 0.5 on the texture) faces +Z at
 * rotY = 0. Lathe vertices sit at (r·sin φ, y, r·cos φ) with u = φ/2π, so
 * u = 0.5 is φ = π; rotating the can by π brings it round to face the camera.
 */
export const LABEL_FRONT_OFFSET = Math.PI

/**
 * Material values in one place. The printed body takes its per-area
 * metalness/roughness from the label's finish map (see LABEL_FINISH), so
 * the scalars here stay at 1 and act as multipliers; clearcoat is the
 * over-varnish every printed can has.
 */
export const CAN_MATERIAL = {
  printed: { metalness: 1, roughness: 1, clearcoat: 0.55, clearcoatRoughness: 0.12 },
  /** Rim, lid and base: plain aluminium, a touch brushed. */
  bare: { color: '#D6D9DE', metalness: 1, roughness: 0.24 },
  /** The tab is the same stock, slightly more polished from the stamping. */
  tab: { color: '#E1E3E7', metalness: 1, roughness: 0.16 },
}

type ProductModelProps = {
  segments: number
  flavor: FlavorId
  onReady?: () => void
}

/**
 * A GADA can, built from the client's own product photos (see
 * lib/canLabelTexture.ts). Forwards a ref to its root group so ProductScene
 * can drive rotation and the intro imperatively every frame without
 * re-rendering React.
 */
export const ProductModel = forwardRef<THREE.Group, ProductModelProps>(function ProductModel({ segments, flavor, onReady }, ref) {
  const gl = useThree((state) => state.gl)
  const [label, setLabel] = useState<CanLabel | null>(null)
  const product = PRODUCTS[flavor]

  useEffect(() => {
    let cancelled = false
    let created: CanLabel | null = null
    setLabel(null)
    createCanLabel(product.textures, product.colors.can, Math.min(8, gl.capabilities.getMaxAnisotropy())).then((result) => {
      created = result
      if (cancelled) {
        result.map.dispose()
        result.finish.dispose()
      } else setLabel(result)
    })
    return () => {
      cancelled = true
      created?.map.dispose()
      created?.finish.dispose()
    }
  }, [gl, product.textures, product.colors.can])

  useEffect(() => {
    if (label) onReady?.()
  }, [label, onReady])

  const geometries = useMemo(
    () => ({
      base: buildCanBaseGeometry(segments),
      body: buildCanBodyGeometry(segments),
      top: buildCanTopGeometry(segments),
      lidRing: buildLidRingGeometry(),
      score: buildScoreGeometry(),
      tab: buildPullTabGeometry(),
      rivet: buildRivetGeometry(),
    }),
    [segments],
  )
  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries])

  const materials = useMemo(() => {
    const printed = new THREE.MeshPhysicalMaterial({ ...CAN_MATERIAL.printed })
    const bare = new THREE.MeshStandardMaterial({ ...CAN_MATERIAL.bare })
    const tab = new THREE.MeshStandardMaterial({ ...CAN_MATERIAL.tab })
    return { printed, bare, tab }
  }, [])
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])

  useEffect(() => {
    materials.printed.map = label?.map ?? null
    materials.printed.metalnessMap = label?.finish ?? null
    materials.printed.roughnessMap = label?.finish ?? null
    materials.printed.needsUpdate = true
  }, [label, materials])

  const lidY = LID_PANEL_Y + 0.002
  const tabOffset = LID_PANEL_RADIUS * 0.16

  return (
    <group ref={ref} visible={!!label}>
      <group position-y={-CAN_HEIGHT / 2}>
        <mesh geometry={geometries.base} material={materials.bare} />
        <mesh geometry={geometries.body} material={materials.printed} castShadow receiveShadow />
        <mesh geometry={geometries.top} material={materials.bare} castShadow receiveShadow />
        <mesh geometry={geometries.lidRing} material={materials.bare} position-y={lidY} />
        {/* local −z ends up at the front once LABEL_FRONT_OFFSET turns the can: opening faces the viewer, finger ring away */}
        <mesh geometry={geometries.score} material={materials.bare} position={[0, lidY, -tabOffset]} />
        <mesh geometry={geometries.tab} material={materials.tab} position={[0, lidY + 0.001, tabOffset]} rotation-y={-Math.PI / 2} castShadow />
        <mesh geometry={geometries.rivet} material={materials.tab} position={[0, lidY + 0.004, 0]} />
      </group>
    </group>
  )
})
