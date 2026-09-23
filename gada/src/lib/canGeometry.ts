import * as THREE from 'three'
import metrics from './photo-metrics.json'

/**
 * Procedural geometry for GADA's 330 ml sleek can. The height-to-width ratio
 * is measured from the client's product photos (scripts/prepare-textures.mjs
 * writes it), so the 3D can has the same silhouette as the photographed one
 * and the unwrapped photos land on it without stretching.
 *
 * Scene units: the can is CAN_HEIGHT tall. Local space: y = 0 is the base,
 * y = CAN_HEIGHT the top of the rim. Every proportion is a named fraction.
 */

export const CAN_HEIGHT = 1.3
export const CAN_RADIUS = CAN_HEIGHT / metrics.heightToWidth / 2

const R = CAN_RADIUS
const H = CAN_HEIGHT

/** Where the printed body meets the bare base, and where it meets the rolled rim. */
export const BODY_BOTTOM_Y = H * 0.028
export const BODY_TOP_Y = H * 0.975

/** The recessed lid panel the tab and rivet sit on — visibly below the rim's apex at H. */
export const LID_PANEL_Y = H * 0.95
export const LID_PANEL_RADIUS = R * 0.8

/**
 * Three lathes sharing their boundary points, because the can has three
 * finishes: a bare aluminium base, the printed body, and a bare rim + lid.
 * (The lid panel sits lower than the top of the rim, so one mesh couldn't
 * separate them by height.)
 */
const BASE_PROFILE: Array<[number, number]> = [
  // domed base: the centre sits recessed up inside the standing ring
  [0, H * 0.022],
  [R * 0.55, H * 0.017],
  [R * 0.76, H * 0.004],
  [R * 0.8, 0],
  [R * 0.88, H * 0.004],
  [R * 0.97, BODY_BOTTOM_Y],
]

const BODY_PROFILE: Array<[number, number]> = [
  [R * 0.97, BODY_BOTTOM_Y],
  [R, H * 0.045],
  [R, H * 0.2],
  [R, H * 0.5],
  [R, H * 0.8],
  [R, H * 0.955],
  // short sleek-can neck
  [R * 0.985, H * 0.965],
  [R * 0.94, BODY_TOP_Y],
]

const TOP_PROFILE: Array<[number, number]> = [
  [R * 0.94, BODY_TOP_Y],
  // rolled rim (chime): rises to its apex, then curls back down the inside to the recessed lid
  [R * 0.965, H * 0.985],
  [R * 0.93, H],
  [R * 0.86, H * 0.983],
  [LID_PANEL_RADIUS, LID_PANEL_Y],
  [R * 0.3, LID_PANEL_Y + 0.002],
  [0, LID_PANEL_Y + 0.003],
]

/**
 * LatheGeometry's own normals are analytic and match across the phi = 0
 * seam; computeVertexNormals() would average per duplicated seam vertex and
 * leave a visible line down the can, so it is deliberately not called.
 */
function lathe(profile: Array<[number, number]>, segments: number) {
  return new THREE.LatheGeometry(
    profile.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  )
}

export function buildCanBaseGeometry(segments = 96) {
  return lathe(BASE_PROFILE, segments)
}

export function buildCanTopGeometry(segments = 96) {
  return lathe(TOP_PROFILE, segments)
}

/**
 * The printed body. LatheGeometry's own V coordinate is
 * `pointIndex / (points.length - 1)` — proportional to a point's position in
 * the array, not its height — so V is rewritten as y / CAN_HEIGHT: a
 * texture row maps to a fixed height on the can, exactly as a photo row
 * does (the photos are cropped rim-top to base).
 */
export function buildCanBodyGeometry(segments = 96) {
  const geometry = lathe(BODY_PROFILE, segments)
  const position = geometry.getAttribute('position')
  const uv = geometry.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setY(i, position.getY(i) / CAN_HEIGHT)
  uv.needsUpdate = true
  return geometry
}

/** Ring stamped into the lid just inside the countersink. */
export function buildLidRingGeometry() {
  const geometry = new THREE.TorusGeometry(LID_PANEL_RADIUS * 0.88, 0.003, 6, 72)
  geometry.rotateX(Math.PI / 2)
  return geometry
}

/** Score line of the drinking opening. */
export function buildScoreGeometry() {
  const geometry = new THREE.TorusGeometry(LID_PANEL_RADIUS * 0.26, 0.0026, 6, 48)
  geometry.rotateX(Math.PI / 2)
  geometry.scale(1, 1, 0.82)
  return geometry
}

/** The pull-tab: an oval loop with a finger hole, lying flat on the lid. */
export function buildPullTabGeometry() {
  const L = LID_PANEL_RADIUS
  const shape = new THREE.Shape()
  shape.absellipse(0, 0, L * 0.34, L * 0.2, 0, Math.PI * 2, false, 0)
  const hole = new THREE.Path()
  hole.absellipse(L * 0.09, 0, L * 0.14, L * 0.1, 0, Math.PI * 2, false, 0)
  shape.holes.push(hole)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.005,
    bevelEnabled: true,
    bevelThickness: 0.0018,
    bevelSize: 0.002,
    bevelSegments: 2,
    curveSegments: 28,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}

export function buildRivetGeometry() {
  return new THREE.CylinderGeometry(LID_PANEL_RADIUS * 0.055, LID_PANEL_RADIUS * 0.065, 0.008, 20)
}
