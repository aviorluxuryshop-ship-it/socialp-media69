/**
 * Pure scroll-timeline maths for the automotive glass study. No DOM, no three.js,
 * so it can be unit-tested with `node --test`.
 *
 * Progress `p` runs 0..1 across the pinned scroll track. Each glass group separates
 * in its own window and stays separated; its label fades in and out in a slightly
 * wider window. Everything is a pure function of `p`, so scrolling back reverses it.
 */

export type StepId = "windshield" | "side" | "rear";

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** Hermite smoothstep between a and b. */
export function smooth(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Progress window in which each group travels from assembled (0) to separated (1). */
export const SEPARATION: Record<StepId, readonly [number, number]> = {
  windshield: [0.1, 0.3],
  side: [0.4, 0.6],
  rear: [0.7, 0.9],
};

/** Window in which each label is on screen (fades in over the first and out over the last 0.05). */
export const LABEL_WINDOW: Record<StepId, readonly [number, number]> = {
  windshield: [0.2, 0.4],
  side: [0.5, 0.7],
  rear: [0.8, 1.0],
};

export const STEP_ORDER: readonly StepId[] = ["windshield", "side", "rear"];

/** Progress used for the static, reduced-motion presentation: everything separated, rear label shown. */
export const STATIC_PROGRESS = 0.93;

export function separation(p: number): Record<StepId, number> {
  return {
    windshield: smooth(...SEPARATION.windshield, p),
    side: smooth(...SEPARATION.side, p),
    rear: smooth(...SEPARATION.rear, p),
  };
}

const FADE = 0.05;

export function labelOpacity(id: StepId, p: number): number {
  const [a, b] = LABEL_WINDOW[id];
  return Math.min(smooth(a, a + FADE, p), 1 - smooth(b - FADE, b, p) * (id === "rear" ? 0 : 1));
}

/** Index of the step whose label is most visible, or -1 during the intro. */
export function activeStep(p: number): number {
  let best = -1;
  let bestOpacity = 0.5;
  STEP_ORDER.forEach((id, i) => {
    const o = labelOpacity(id, p);
    if (o > bestOpacity) {
      best = i;
      bestOpacity = o;
    }
  });
  return best;
}

/** Camera azimuth in degrees: 0 = in front of the car, 90 = beside it, 180 = behind it. */
export function cameraAzimuth(p: number): number {
  return 38 + 26 * smooth(0, 0.4, p) + 78 * smooth(0.5, 0.95, p);
}

/** Camera elevation in degrees. */
export function cameraElevation(p: number): number {
  return 10 + 7 * smooth(0.3, 0.95, p);
}

/** Opacity of the opening title card. */
export function introOpacity(p: number): number {
  return 1 - smooth(0.04, 0.14, p);
}
