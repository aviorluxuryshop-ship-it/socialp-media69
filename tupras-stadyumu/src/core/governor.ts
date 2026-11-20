/**
 * Frame-time governor.
 *
 * Watches the real frame interval (requestAnimationFrame to
 * requestAnimationFrame, so frames limited by the GPU count too) and trades
 * image quality for smoothness one step at a time: pixel ratio first, then the
 * night bloom, shadow resolution and detail radii.
 *
 *   · a step that does not make frames faster is undone and the governor stops
 *     degrading — e.g. a phone in low-power mode capped at 30 Hz, where lower
 *     quality would buy nothing;
 *   · when frames stay comfortably fast it gives steps back one by one, with a
 *     back-off that doubles every time so it can never oscillate;
 *   · it never touches the stadium or seat data — only how they are drawn.
 */

export interface GovernorStep {
  name: string;
  apply(): void;
  revert(): void;
}

export interface GovernorOptions {
  /** frames per measurement window */
  window?: number;
  /** degrade when the mean frame interval is above this (ms) */
  slowMs?: number;
  /** upgrade when the mean is below this … */
  fastMs?: number;
  /** … and the 90th percentile below this (ms) */
  fastP90Ms?: number;
  /** a step must cut the mean by this factor to count as an improvement */
  mustImprove?: number;
  /** consecutive steps without improvement before giving up (they are undone) */
  maxFutile?: number;
  /** wait after a change before measuring again (ms) */
  settleMs?: number;
  /** first wait before giving a step back (ms); doubles each time */
  upgradeAfterMs?: number;
  /** upgrades that had to be taken back before upgrading stops for good */
  maxFailedUpgrades?: number;
}

export class FrameGovernor {
  /** number of steps currently applied */
  level = 0;
  /** true once degrading stopped helping: no further degradation */
  locked = false;
  /** last measured mean frame interval (ms) */
  meanMs = 0;
  readonly history: string[] = [];
  private readonly steps: GovernorStep[];
  private readonly o: Required<GovernorOptions>;
  private samples: number[] = [];
  private last = 0;
  private settleUntil = 0;
  /** mean before the current run of degradations, and how many steps it has */
  private runBase = 0;
  private runSteps = 0;
  private runBest = Infinity;
  private upgradeAfter: number;
  private fastSince = 0;
  private lastUpgradeAt = -Infinity;
  private failedUpgrades = 0;

  constructor(steps: GovernorStep[], opts: GovernorOptions = {}) {
    this.steps = steps;
    this.o = {
      window: opts.window ?? 90,
      slowMs: opts.slowMs ?? 20,
      fastMs: opts.fastMs ?? 17.6,
      fastP90Ms: opts.fastP90Ms ?? 21,
      mustImprove: opts.mustImprove ?? 0.93,
      maxFutile: opts.maxFutile ?? 3,
      settleMs: opts.settleMs ?? 1500,
      upgradeAfterMs: opts.upgradeAfterMs ?? 8000,
      maxFailedUpgrades: opts.maxFailedUpgrades ?? 3,
    };
    this.upgradeAfter = this.o.upgradeAfterMs;
  }

  get stepCount(): number {
    return this.steps.length;
  }

  /** Call once per animation frame with its timestamp (ms). */
  tick(now: number): void {
    if (typeof document !== 'undefined' && document.hidden) {
      this.last = 0;
      this.samples.length = 0;
      return;
    }
    if (this.last > 0) {
      const dt = now - this.last;
      // ignore stalls (tab switch, debugger, a long synchronous load)
      if (dt > 0 && dt < 250) this.samples.push(dt);
    }
    this.last = now;
    if (now < this.settleUntil) {
      this.samples.length = 0;
      return;
    }
    if (this.samples.length < this.o.window) return;

    // the mean, not the median: with vsync a GPU at 25 ms shows as alternating
    // 16.7/33.3 ms intervals, so only the mean moves smoothly with the load
    const sorted = this.samples.slice().sort((a, b) => a - b);
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    this.samples.length = 0;
    this.meanMs = mean;

    if (this.runSteps > 0) {
      if (mean < this.runBest * this.o.mustImprove) {
        // the run is paying off: it starts over from here
        this.note(`${this.steps[this.level - 1].name}: ${this.runBase.toFixed(1)} → ${mean.toFixed(1)} ms`);
        this.runSteps = 0;
      } else if (this.runSteps >= this.o.maxFutile || mean <= this.o.slowMs) {
        // nothing changed (e.g. a display capped at 30 Hz): undo the run, stop degrading
        for (let k = 0; k < this.runSteps; k++) {
          this.level--;
          this.steps[this.level].revert();
        }
        this.note(`${this.runSteps} adım fayda etmedi (${this.runBase.toFixed(1)} → ${mean.toFixed(1)} ms), geri alındı`);
        this.runSteps = 0;
        this.locked = true;
        this.settleUntil = now + this.o.settleMs;
        return;
      }
    }

    if (mean > this.o.slowMs) {
      this.fastSince = 0;
      if (now - this.lastUpgradeAt < this.upgradeAfter / 2 + 10000) this.failedUpgrades++;
      this.lastUpgradeAt = -Infinity;
      if (this.locked || this.level >= this.steps.length) {
        this.runSteps = 0;
        return;
      }
      if (this.runSteps === 0) {
        this.runBase = mean;
        this.runBest = mean;
      }
      this.runBest = Math.min(this.runBest, mean);
      this.steps[this.level].apply();
      this.level++;
      this.runSteps++;
      this.settleUntil = now + this.o.settleMs;
      return;
    }
    this.runSteps = 0;

    const canUpgrade = this.level > 0 && this.failedUpgrades < this.o.maxFailedUpgrades;
    if (canUpgrade && mean < this.o.fastMs && p90 < this.o.fastP90Ms) {
      if (this.fastSince === 0) this.fastSince = now;
      else if (now - this.fastSince >= this.upgradeAfter) {
        this.level--;
        const s = this.steps[this.level];
        s.revert();
        // if the step turns out to be needed after all it may be applied again
        this.locked = false;
        this.note(`${s.name}: geri verildi`);
        this.upgradeAfter *= 2;
        this.fastSince = 0;
        this.lastUpgradeAt = now;
        this.settleUntil = now + this.o.settleMs;
      }
    } else {
      this.fastSince = 0;
    }
  }

  private note(s: string): void {
    this.history.push(s);
    if (this.history.length > 20) this.history.shift();
  }
}
