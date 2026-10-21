import assert from "node:assert/strict";
import { test } from "node:test";
import {
  STATIC_PROGRESS,
  STEP_ORDER,
  activeStep,
  cameraAzimuth,
  introOpacity,
  labelOpacity,
  separation,
  smooth,
} from "./timeline.ts";

const samples = Array.from({ length: 1001 }, (_, i) => i / 1000);

test("smooth is bounded and monotonic", () => {
  let prev = -1;
  for (const x of samples) {
    const v = smooth(0.2, 0.6, x);
    assert.ok(v >= 0 && v <= 1);
    assert.ok(v >= prev - 1e-12);
    prev = v;
  }
  assert.equal(smooth(0.2, 0.6, 0), 0);
  assert.equal(smooth(0.2, 0.6, 1), 1);
});

test("the three groups separate in order and never reassemble as progress grows", () => {
  let prev = { windshield: 0, side: 0, rear: 0 };
  for (const p of samples) {
    const s = separation(p);
    for (const id of STEP_ORDER) assert.ok(s[id] >= prev[id] - 1e-12, `${id} reassembled at ${p}`);
    prev = s;
  }
  assert.deepEqual(separation(0), { windshield: 0, side: 0, rear: 0 });
  // Windshield finishes before the side windows start, and so on.
  assert.equal(separation(0.35).windshield, 1);
  assert.equal(separation(0.35).side, 0);
  assert.equal(separation(0.65).side, 1);
  assert.equal(separation(0.65).rear, 0);
});

test("scrolling back reverses the state exactly", () => {
  for (const p of [0.05, 0.22, 0.45, 0.8]) {
    assert.deepEqual(separation(p), separation(p));
    assert.equal(cameraAzimuth(p), cameraAzimuth(p));
  }
});

test("labels appear one at a time", () => {
  for (const p of samples) {
    const visible = STEP_ORDER.filter((id) => labelOpacity(id, p) > 0.5);
    assert.ok(visible.length <= 1, `more than one label at ${p}: ${visible}`);
  }
  assert.equal(activeStep(0), -1);
  assert.equal(activeStep(0.3), 0);
  assert.equal(activeStep(0.6), 1);
  assert.equal(activeStep(0.9), 2);
});

test("static (reduced-motion) pose has everything separated and the intro hidden", () => {
  const s = separation(STATIC_PROGRESS);
  assert.ok(s.windshield === 1 && s.side === 1 && s.rear > 0.95);
  assert.equal(introOpacity(STATIC_PROGRESS), 0);
});

test("camera azimuth sweeps from the front towards the rear", () => {
  assert.ok(cameraAzimuth(0) < 60);
  assert.ok(cameraAzimuth(1) > 120);
  let prev = -Infinity;
  for (const p of samples) {
    const a = cameraAzimuth(p);
    assert.ok(a >= prev - 1e-9);
    prev = a;
  }
});
