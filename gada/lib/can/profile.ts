import * as THREE from 'three'

/**
 * The can's silhouette, measured off the front reference view.
 *
 * Points are [radius, row] in the reference image's own pixels (the body is
 * 150.5 px in radius; rows grow downward). They were read row by row from the
 * render's outline, so the rim, the neck, the shoulder taper and the stand
 * ring are the real ones rather than a generic can: the height-to-width ratio
 * and every curve come straight from the photograph.
 */
const R_BODY = 150.5

/** Rows where the printed label starts and stops (the paint covers the neck). */
export const LABEL_TOP_ROW = 94.5
export const LABEL_BOTTOM_ROW = 866

const TOP_ROW = 85.5
const BOTTOM_ROW = 891
const CENTER_ROW = (TOP_ROW + BOTTOM_ROW) / 2

/** From the bottom's centre, out over the stand ring, up to the label. */
const BOTTOM: [number, number][] = [
  [0, 882],
  [30, 882.3],
  [60, 883.5],
  [80, 886],
  [90, 889],
  [95, 890.4],
  [100, 891],
  [106, 890.8],
  [113, 889.5],
  [119, 887.5],
  [123, 885],
  [125.5, 882],
  [127, 879],
  [128.5, 875],
  [131, 872],
  [135, 869.5],
  [139.5, 867.5],
  [143, 866],
]

/** The printed part: bottom taper, straight body, shoulder, neck. */
const LABEL: [number, number][] = [
  [143, 866],
  [145.5, 864],
  [147.5, 861.5],
  [149, 859],
  [150.2, 857],
  [150.5, 855],
  [150.5, 160],
  [150.3, 155],
  [149.2, 150],
  [147, 145],
  [144.5, 140],
  [142, 136],
  [139.5, 131],
  [136.5, 125],
  [133, 120],
  [131, 116],
  [130, 112],
  [129.8, 108],
  [130, 104],
  [130.5, 100],
  [131.4, 96],
  [132, 94.5],
]

/** Seam, rim curl, countersink and the recessed lid. */
const TOP: [number, number][] = [
  [132, 94.5],
  [133.2, 92.5],
  [133.6, 89.5],
  [132.8, 87],
  [130.5, 85.5],
  [127.5, 85.5],
  [124, 87],
  [121, 90],
  [119, 94],
  [116, 96.5],
  [100, 97],
  [0, 97],
]

function toPoints(profile: [number, number][]) {
  return profile.map(([r, row]) => new THREE.Vector2(r / R_BODY, (CENTER_ROW - row) / R_BODY))
}

export const CAN_HEIGHT = (BOTTOM_ROW - TOP_ROW) / R_BODY
export const CAN_RADIUS = 1
export const LID_Y = (CENTER_ROW - 97) / R_BODY
export const BOTTOM_Y = (CENTER_ROW - BOTTOM_ROW) / R_BODY

const LABEL_TOP_Y = (CENTER_ROW - LABEL_TOP_ROW) / R_BODY
const LABEL_BOTTOM_Y = (CENTER_ROW - LABEL_BOTTOM_ROW) / R_BODY

export interface CanGeometry {
  label: THREE.BufferGeometry
  top: THREE.BufferGeometry
  bottom: THREE.BufferGeometry
  dispose: () => void
}

export function buildCanGeometry(segments = 160): CanGeometry {
  const label = new THREE.LatheGeometry(toPoints(LABEL), segments)
  // The lathe spreads v evenly over the profile points; the texture maps
  // image rows to height instead (the photograph is a side-on projection),
  // so v is rewritten from each vertex's height.
  const position = label.getAttribute('position')
  const uv = label.getAttribute('uv')
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i)
    uv.setY(i, (y - LABEL_BOTTOM_Y) / (LABEL_TOP_Y - LABEL_BOTTOM_Y))
  }
  uv.needsUpdate = true

  const top = new THREE.LatheGeometry(toPoints(TOP), segments)
  const bottom = new THREE.LatheGeometry(toPoints(BOTTOM), segments)

  return {
    label,
    top,
    bottom,
    dispose: () => {
      label.dispose()
      top.dispose()
      bottom.dispose()
    },
  }
}

/** A plain stay-on tab, sitting on the lid; only seen when the can tips. */
export function buildTabGeometry() {
  const shape = new THREE.Shape()
  const w = 0.26
  const l = 0.62
  const r = 0.12
  shape.moveTo(-w + r, -l / 2)
  shape.lineTo(w - r, -l / 2)
  shape.quadraticCurveTo(w, -l / 2, w, -l / 2 + r)
  shape.lineTo(w, l / 2 - r)
  shape.quadraticCurveTo(w, l / 2, w - r, l / 2)
  shape.lineTo(-w + r, l / 2)
  shape.quadraticCurveTo(-w, l / 2, -w, l / 2 - r)
  shape.lineTo(-w, -l / 2 + r)
  shape.quadraticCurveTo(-w, -l / 2, -w + r, -l / 2)
  const hole = new THREE.Path()
  hole.absellipse(0, l / 2 - 0.2, 0.15, 0.1, 0, Math.PI * 2, false, 0)
  shape.holes.push(hole)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 18,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, LID_Y + 0.006, 0.2)
  return geometry
}
