import * as THREE from 'three'

/**
 * Procedural geometry for a standard 330 ml beverage can (66 mm diameter,
 * ~115 mm tall, 202 lid on a 211 body — so the lid is ~0.8 of the body
 * diameter). Scene units: the can is 1.16 tall. Lathe profiles give the
 * domed base, straight wall, necked shoulder, rolled rim and the recessed
 * lid panel.
 *
 * All proportions are named here so the silhouette can be retuned in one
 * place. Local space: y=0 is the base, y=CAN_HEIGHT the top of the rim.
 */

export const CAN_RADIUS = 0.335
export const CAN_HEIGHT = 1.16
export const LID_RADIUS = CAN_RADIUS * 0.8

/** Straight printed wall, in local y. The label texture is laid out against this band. */
export const WALL_BOTTOM_Y = 0.07
export const WALL_TOP_Y = CAN_HEIGHT * 0.875

/** Height of the recessed lid panel the tab and rivet sit on. */
export const LID_PANEL_Y = CAN_HEIGHT * 0.955

const R = CAN_RADIUS
const H = CAN_HEIGHT

/** Where the printed body meets the bare base, and where it meets the rolled rim. */
export const BODY_BOTTOM_Y = 0.025
export const BODY_TOP_Y = H * 0.972

/**
 * The can is three lathes sharing their boundary points, because it is three
 * finishes: a bare aluminium base, the printed body, and a bare rim + lid.
 * (The recessed lid panel sits lower than the top of the printed neck, so a
 * single mesh can't separate them by height alone.)
 */
const BASE_PROFILE: Array<[number, number]> = [
  // domed base: the centre sits recessed up inside the standing ring
  [0, 0.035],
  [R * 0.55, 0.028],
  [R * 0.72, 0.006],
  [R * 0.78, 0],
  [R * 0.86, 0.004],
  [R * 0.95, BODY_BOTTOM_Y],
]

function bodyProfile(): Array<[number, number]> {
  const points: Array<[number, number]> = [
    [R * 0.95, BODY_BOTTOM_Y],
    [R, WALL_BOTTOM_Y],
  ]
  const wallSteps = 8
  for (let i = 1; i <= wallSteps; i++) points.push([R, THREE.MathUtils.lerp(WALL_BOTTOM_Y, WALL_TOP_Y, i / wallSteps)])
  points.push(
    // necked shoulder
    [R * 0.985, H * 0.905],
    [R * 0.93, H * 0.93],
    [R * 0.86, H * 0.955],
    [R * 0.82, BODY_TOP_Y],
  )
  return points
}

const TOP_PROFILE: Array<[number, number]> = [
  [R * 0.82, BODY_TOP_Y],
  // rolled rim (chime), then down the inner wall into the recessed lid
  [R * 0.83, H * 0.985],
  [R * 0.815, H],
  [R * 0.78, H * 0.99],
  [R * 0.765, H * 0.958],
  [R * 0.72, LID_PANEL_Y],
  [R * 0.3, LID_PANEL_Y + 0.002],
  [0, LID_PANEL_Y + 0.003],
]

/**
 * LatheGeometry's own normals are analytic and match across the phi=0 seam;
 * computeVertexNormals() would average faces per duplicated seam vertex and
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
 * `pointIndex / (points.length - 1)` — proportional to a point's position
 * in the array, not its height — so V is rewritten as y / CAN_HEIGHT: a
 * texture row maps to a fixed height on the can, which is what a printed
 * label is.
 */
export function buildCanBodyGeometry(segments = 96) {
  const geometry = lathe(bodyProfile(), segments)
  const position = geometry.getAttribute('position')
  const uv = geometry.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setY(i, position.getY(i) / CAN_HEIGHT)
  uv.needsUpdate = true
  return geometry
}

/** Ring stamped into the lid just inside the countersink. */
export function buildLidRingGeometry() {
  const geometry = new THREE.TorusGeometry(LID_RADIUS * 0.78, 0.0035, 6, 72)
  geometry.rotateX(Math.PI / 2)
  return geometry
}

/** Score line of the drinking opening, toward the front of the lid. */
export function buildScoreGeometry() {
  const geometry = new THREE.TorusGeometry(0.062, 0.003, 6, 48)
  geometry.rotateX(Math.PI / 2)
  geometry.scale(1, 1, 0.82)
  return geometry
}

/** The pull-tab: an oval loop with a finger hole, lying flat on the lid. */
export function buildPullTabGeometry() {
  const shape = new THREE.Shape()
  shape.absellipse(0, 0, 0.08, 0.048, 0, Math.PI * 2, false, 0)
  const hole = new THREE.Path()
  hole.absellipse(0.022, 0, 0.034, 0.024, 0, Math.PI * 2, false, 0)
  shape.holes.push(hole)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.006,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.0025,
    bevelSegments: 2,
    curveSegments: 28,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}

export function buildRivetGeometry() {
  return new THREE.CylinderGeometry(0.013, 0.015, 0.01, 20)
}
