/**
 * The page is a stack of scenes. Each is a section `heightVh` tall with its
 * copy pinned (sticky) for the part of the scroll where the section fills
 * the viewport — its "active" range: [top, top + height - 100vh]. Between
 * two scenes there is exactly one viewport of hand-over scroll, which is
 * where the 3D camera travels from one shot to the next.
 *
 * Both the DOM (section heights) and the 3D timeline (keyframe positions)
 * read from this one list, so copy and camera can't drift apart when a
 * scene is lengthened or shortened.
 */

export const SCENES = [
  { id: 'top', heightVh: 130 },
  { id: 'urun', heightVh: 170 },
  { id: 'hikaye', heightVh: 260 },
  { id: 'icerik', heightVh: 300 },
  { id: 'aroma', heightVh: 170 },
  { id: 'final', heightVh: 150 },
] as const

export type SceneId = (typeof SCENES)[number]['id']

const tops: Record<string, number> = {}
let acc = 0
for (const scene of SCENES) {
  tops[scene.id] = acc
  acc += scene.heightVh
}

export const TOTAL_HEIGHT_VH = acc
/** Scrollable distance: the document is TOTAL_HEIGHT_VH tall and one viewport is always on screen. */
export const SCROLL_DISTANCE_VH = TOTAL_HEIGHT_VH - 100

export function sceneHeight(id: SceneId) {
  return SCENES.find((s) => s.id === id)!.heightVh
}

/**
 * Scroll progress (0..1) at a point within a scene's active range.
 * `at` = 0 is the moment the section's top reaches the top of the viewport,
 * `at` = 1 is the last moment it still fills the whole viewport.
 */
export function sceneProgress(id: SceneId, at: number) {
  const activeVh = sceneHeight(id) - 100
  return (tops[id] + activeVh * at) / SCROLL_DISTANCE_VH
}
