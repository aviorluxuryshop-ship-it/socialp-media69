import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * A procedural studio reflection environment (soft walls + a couple of
 * bright panels — the classic product-render rig), built once locally with
 * PMREMGenerator. Deliberately not drei's `<Environment preset="…">`: that
 * fetches an HDR from a public CDN, and a failed fetch there throws inside
 * the WebGL context and can take the whole canvas down with it. This has no
 * network dependency at all.
 */
export function StudioEnvironment() {
  const { gl, scene } = useThree()

  const envTexture = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
    return texture
  }, [gl])

  useEffect(() => {
    scene.environment = envTexture
    return () => {
      if (scene.environment === envTexture) scene.environment = null
      envTexture.dispose()
    }
  }, [scene, envTexture])

  return null
}
