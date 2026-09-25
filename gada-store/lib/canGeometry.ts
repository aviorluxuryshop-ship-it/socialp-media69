import * as THREE from 'three'

/**
 * A real 330 ml slim can, built by hand rather than with THREE.LatheGeometry.
 *
 * LatheGeometry spaces its V coordinate by profile-point *index*, not by
 * physical arc length — add a dense ring of points for the rolled rim (which
 * a believable can needs) and every straight run of the body wall between
 * sparser points gets compressed in V, so a label texture wrapped onto it
 * stretches unevenly near the cap. That reads exactly like the "texture
 * kayması" this can exists to avoid. Building the ring geometry directly
 * means every vertex gets the UV its real position earns: U is the true
 * revolve angle (so it lines up with the four photographed camera angles at
 * u = 0, 0.25, 0.5, 0.75), and V is the physical height fraction inside the
 * label band — a straight, unwarped, uniformly-scaled copy of the source
 * photograph, nothing more.
 */

export const LABEL_Y0 = 0.028
export const LABEL_Y1 = 0.93

interface ProfilePoint {
  /** Height, 0 at the can's foot to 1 at the top of the lid. */
  y: number
  /** Radius as a fraction of the can's own radius (1 = full body radius). */
  r: number
  group: 'metal' | 'label'
}

/**
 * Bottom to top. Every duplicated (y, r) pair is intentional: it is where
 * the label's printed edge meets bare aluminium, the same hard seam a real
 * can has, and it needs two vertices so each side can carry its own UV /
 * material without the interpolation dragging one into the other.
 */
// r is a fraction of the `radius` argument, and the body wall — the widest
// point that matters for the silhouette — sits at r = 1.0 exactly, so
// `radius` passed to buildCanGeometry is the can's true body radius, not a
// bounding value some other row happens to exceed.
const PROFILE: ProfilePoint[] = [
  { y: 0.0, r: 0.0, group: 'metal' }, // foot centre — closes the bottom
  { y: 0.006, r: 1.16, group: 'metal' }, // foot standing edge
  { y: 0.016, r: 1.16, group: 'metal' }, // foot wall
  { y: LABEL_Y0 - 0.004, r: 1.0, group: 'metal' }, // chamfer into the body
  { y: LABEL_Y0, r: 1.0, group: 'label' }, // label starts (v = 0)
  { y: 0.5, r: 1.0, group: 'label' }, // straight body
  { y: LABEL_Y1, r: 1.0, group: 'label' }, // label ends (v = 1)
  { y: LABEL_Y1 + 0.004, r: 1.0, group: 'metal' }, // bare shoulder starts
  { y: 0.958, r: 0.86, group: 'metal' }, // neck taper
  { y: 0.975, r: 0.8, group: 'metal' }, // neck, short vertical run
  { y: 0.985, r: 0.89, group: 'metal' }, // rolled rim, bulges out
  { y: 0.993, r: 0.83, group: 'metal' }, // rim's top inner edge
  { y: 1.0, r: 0.0, group: 'metal' }, // lid centre — closes the top
]

export interface CanGeometryResult {
  geometry: THREE.BufferGeometry
  /** Real-world proportions: radius and height in metres, for camera framing. */
  radius: number
  height: number
}

/**
 * @param radialSegments columns around the can. Kept a multiple of 4 so a
 * column lands exactly on each photographed angle, though the UV math holds
 * for any value.
 */
export function buildCanGeometry(radialSegments = 128, radius = 0.0265, height = 0.178): CanGeometryResult {
  const cols = radialSegments + 1 // duplicate seam column so u=0 and u=1 both exist
  const rows = PROFILE.length

  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []

  // Per-row outward normal in the (r, y) plane, from the averaged slope of
  // the profile segments on either side — a lathe surface's standard normal.
  const rowNormal2D: [number, number][] = PROFILE.map((_, i) => {
    const prev = PROFILE[Math.max(0, i - 1)]!
    const next = PROFILE[Math.min(rows - 1, i + 1)]!
    const dr = next.r - prev.r
    const dy = next.y - prev.y
    const len = Math.hypot(dr, dy) || 1
    // Perpendicular to the tangent, pointing away from the axis.
    return [dy / len, -dr / len]
  })

  for (let row = 0; row < rows; row += 1) {
    const point = PROFILE[row]!
    const [nr, ny] = rowNormal2D[row]!
    const isCenter = point.r === 0
    const v =
      point.group === 'label'
        ? THREE.MathUtils.clamp((point.y - LABEL_Y0) / (LABEL_Y1 - LABEL_Y0), 0, 1)
        : point.y

    for (let col = 0; col < cols; col += 1) {
      const u = col / radialSegments
      const theta = u * Math.PI * 2
      const cos = Math.cos(theta)
      const sin = Math.sin(theta)

      positions.push(point.r * radius * cos, point.y * height, point.r * radius * sin)

      if (isCenter) {
        normals.push(0, point.y < 0.5 ? -1 : 1, 0)
      } else {
        normals.push(nr * cos, ny, nr * sin)
      }

      uvs.push(u, v)
    }
  }

  const indices: number[] = []
  const labelStart: number[] = []
  const labelCount: number[] = []
  const metalStart: number[] = []
  const metalCount: number[] = []

  for (let row = 0; row < rows - 1; row += 1) {
    const a = PROFILE[row]!
    const b = PROFILE[row + 1]!
    const isLabelBand = a.group === 'label' && b.group === 'label'
    const bandIndices: number[] = []

    for (let col = 0; col < radialSegments; col += 1) {
      const i0 = row * cols + col
      const i1 = i0 + 1
      const i2 = i0 + cols
      const i3 = i2 + 1

      // Wound so the triangle faces outward (away from the axis) — with
      // +X/+Y/+Z the usual way round, walking columns in increasing angle
      // order takes (i0,i1,i2) inward-facing, not out. Every case below is
      // the reverse of the "obvious" order for exactly that reason; get it
      // backwards and FrontSide culling hides the near wall instead of the
      // far one, so the camera ends up looking through the can at whatever
      // photograph is on the *opposite* side — which reads as "the wrong
      // face" while every UV and camera number checks out individually.
      //
      // One more consequence of facing the triangles outward this way: read
      // left-to-right across increasing U, a photo now appears mirrored
      // relative to how it reads on the physical can. Rather than flip U
      // (which would rotate which photo lands on which checkpoint), the
      // four source photos in public/textures/*/label.jpg are pre-mirrored
      // when the label strip is built — regenerate them the same way if the
      // source photography ever changes.
      if (a.r === 0) {
        // Bottom cap: triangle fan, skip degenerate quad and emit one tri.
        bandIndices.push(i0, i2, i3)
      } else if (b.r === 0) {
        // Top cap.
        bandIndices.push(i0, i3, i1)
      } else {
        bandIndices.push(i0, i2, i1, i1, i2, i3)
      }
    }

    if (isLabelBand) {
      labelStart.push(indices.length)
      labelCount.push(bandIndices.length)
    } else {
      metalStart.push(indices.length)
      metalCount.push(bandIndices.length)
    }
    indices.push(...bandIndices)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)

  // Three.js groups don't need to be contiguous or unique per material —
  // registering one per band, in the order the indices were pushed, is
  // enough. Material 0 is the aluminium cap/foot/lid, material 1 the label.
  for (let i = 0; i < metalStart.length; i += 1) {
    geometry.addGroup(metalStart[i]!, metalCount[i]!, 0)
  }
  for (let i = 0; i < labelStart.length; i += 1) {
    geometry.addGroup(labelStart[i]!, labelCount[i]!, 1)
  }

  geometry.computeBoundingSphere()

  return { geometry, radius, height }
}
