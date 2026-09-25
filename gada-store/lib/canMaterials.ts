import * as THREE from 'three'

/**
 * Shared across both flavours — it's the same physical can, aluminium
 * doesn't change colour between SKUs. Sampled from the true top-rim pixels
 * of the product photography rather than guessed.
 */
export const ALUMINIUM_COLOR = '#CDCBC9'

let sharedMaxAnisotropy: number | null = null

export function loadLabelTexture(renderer: THREE.WebGLRenderer, url: string): Promise<THREE.Texture> {
  sharedMaxAnisotropy ??= renderer.capabilities.getMaxAnisotropy()
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.minFilter = THREE.LinearMipmapLinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.anisotropy = sharedMaxAnisotropy ?? 1
        texture.generateMipmaps = true
        texture.needsUpdate = true
        resolve(texture)
      },
      undefined,
      reject,
    )
  })
}

/**
 * @returns [metal, label] — index-matched to the geometry's two groups
 * (buildCanGeometry writes material 0 = metal, 1 = label).
 */
export function createCanMaterials(
  labelTexture: THREE.Texture,
  envMap: THREE.Texture,
): [THREE.MeshPhysicalMaterial, THREE.MeshPhysicalMaterial] {
  const metal = new THREE.MeshPhysicalMaterial({
    color: ALUMINIUM_COLOR,
    metalness: 0.9,
    roughness: 0.36,
    envMap,
    envMapIntensity: 0.85,
    clearcoat: 0.12,
    clearcoatRoughness: 0.45,
  })

  // Printed ink under a thin satin coat over aluminium — some metalness so
  // it still reads as a can and not a paper label, but low enough that the
  // photographed colour stays true; the clearcoat is what gives it the
  // slight gloss a real can label has without tinting the artwork silver.
  const label = new THREE.MeshPhysicalMaterial({
    map: labelTexture,
    metalness: 0.08,
    roughness: 0.5,
    envMap,
    envMapIntensity: 0.32,
    clearcoat: 0.35,
    clearcoatRoughness: 0.35,
  })

  return [metal, label]
}
