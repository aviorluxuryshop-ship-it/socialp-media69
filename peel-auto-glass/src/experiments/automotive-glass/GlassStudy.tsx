"use client";

import { useEffect, useRef, useState } from "react";
import { CANVAS_LABEL, LEAD, STEPS, TITLE } from "./content";
import styles from "./glass-study.module.css";
import type { StudyScene } from "./scene";
import { STATIC_PROGRESS, STEP_ORDER, activeStep, clamp01, introOpacity, labelOpacity } from "./timeline";

type Mode = "loading" | "live" | "static" | "unsupported";

/**
 * Where each label card sits relative to its anchor point, in CSS px (desktop only).
 * `x` is the gap between anchor and card edge; `side` says which side of the anchor the card is on.
 */
const CARD_PLACEMENT = {
  windshield: { side: "right", x: 190, y: -20 },
  side: { side: "left", x: 170, y: -200 },
  rear: { side: "right", x: 170, y: -170 },
} as const;
const EDGE = 16;

export function GlassStudy() {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [mode, setMode] = useState<Mode>("loading");
  const [step, setStep] = useState(-1);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!track || !stage || !canvas) return;

    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compact = window.matchMedia("(max-width: 767px)").matches;
    let scene: StudyScene | null = null;
    let disposed = false;
    let raf = 0;
    let running = false;
    let current = 0;
    let lastStep = -2;
    let stillPose = false;

    const size = () => {
      const r = stage.getBoundingClientRect();
      scene?.resize(r.width, r.height, Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2));
    };

    const measure = (): number => {
      const r = track.getBoundingClientRect();
      const range = r.height - window.innerHeight;
      return range > 0 ? clamp01(-r.top / range) : 0;
    };

    /** Move HTML overlays: labels follow their glass pane and stay inside the stage. */
    const layout = (p: number) => {
      if (stillPose) {
        // No scrolling in the still pose: keep the title up and leave the explanations to the list below.
        if (introRef.current) introRef.current.style.opacity = "1";
        for (const el of labelRefs.current) if (el) el.style.visibility = "hidden";
        return;
      }
      if (introRef.current) introRef.current.style.opacity = String(introOpacity(p));
      if (railRef.current) railRef.current.style.setProperty("--p", String(p));
      const a = scene?.anchors();
      const stageRect = stage.getBoundingClientRect();
      STEP_ORDER.forEach((id, i) => {
        const root = labelRefs.current[i];
        if (!root || !a) return;
        const o = labelOpacity(id, p);
        root.style.opacity = String(o);
        root.style.visibility = o > 0.01 ? "visible" : "hidden";
        if (o <= 0.01) return;

        const [dot, leader, card] = Array.from(root.children) as HTMLElement[];
        const { side, x: gap, y: dy } = CARD_PLACEMENT[id];
        const cw = card.offsetWidth;
        const ch = card.offsetHeight;
        const ax = a[id].x;
        const ay = a[id].y;

        let left = side === "right" ? ax + gap : ax - gap - cw;
        let top = ay + dy - ch / 2;
        left = Math.min(Math.max(left, EDGE), stageRect.width - cw - EDGE);
        top = Math.min(Math.max(top, EDGE + 8), stageRect.height - ch - EDGE);

        // Leader runs from the anchor to the nearest vertical edge of the card.
        const ex = side === "right" ? left : left + cw;
        const ey = Math.min(Math.max(ay, top + 14), top + ch - 14);
        const len = Math.hypot(ex - ax, ey - ay);
        dot.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
        leader.style.transform = `translate3d(${ax}px, ${ay}px, 0) rotate(${Math.atan2(ey - ay, ex - ax)}rad)`;
        leader.style.width = `${len}px`;
        card.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      });
      const s = activeStep(p);
      if (s !== lastStep) {
        lastStep = s;
        setStep(s);
      }
    };

    const draw = (p: number) => {
      if (!scene) return;
      scene.setProgress(p);
      scene.render();
      layout(p);
    };

    const tick = () => {
      const target = measure();
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.0004) current = target;
      draw(current);
      if (current !== target && !disposed) raf = requestAnimationFrame(tick);
      else running = false;
    };

    const kick = () => {
      if (running || disposed || mode === "static") return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const onMotionPreference = () => window.location.reload();

    const onResize = () => {
      size();
      if (reducedQuery.matches) draw(STATIC_PROGRESS);
      else draw(current);
    };

    (async () => {
      try {
        const { createStudyScene } = await import("./scene");
        if (disposed) return;
        scene = createStudyScene(canvas, { compact });
      } catch {
        if (!disposed) setMode("unsupported");
        return;
      }
      size();
      if (reducedQuery.matches) {
        // No scroll-linked motion: show one composed, fully separated pose.
        stillPose = true;
        setMode("static");
        draw(STATIC_PROGRESS);
      } else {
        setMode("live");
        current = measure();
        draw(current);
        window.addEventListener("scroll", kick, { passive: true });
      }
      window.addEventListener("resize", onResize);
      // A changed motion preference is rare; reloading re-evaluates it cleanly.
      reducedQuery.addEventListener("change", onMotionPreference);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", onResize);
      reducedQuery.removeEventListener("change", onMotionPreference);
      scene?.dispose();
    };
    // `mode` is only read to stop scroll handling in the static pose; setting it must not rebuild the scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isStatic = mode === "static" || mode === "unsupported";

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <span>Experiment · Automotive glass study</span>
        <span>Private preview. Not part of the public website.</span>
      </header>

      <section ref={trackRef} className={`${styles.track} ${isStatic ? styles.trackStatic : ""}`} aria-label={TITLE}>
        <div ref={stageRef} className={styles.stage}>
          <canvas ref={canvasRef} className={styles.canvas} role="img" aria-label={CANVAS_LABEL} />

          <div ref={introRef} className={styles.intro}>
            <p className={styles.kicker}>Design experiment</p>
            <h1 className={styles.title}>{TITLE}</h1>
            <p className={styles.lead}>{LEAD}</p>
            {mode === "live" && (
              <p className={styles.cue} aria-hidden>
                <span /> Scroll
              </p>
            )}
          </div>

          {STEPS.map((s, i) => (
            <div
              key={s.id}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              className={`${styles.label} ${CARD_PLACEMENT[s.id].side === "left" ? styles.labelLeft : ""}`}
              style={{ visibility: "hidden", opacity: 0 }}
              aria-hidden
            >
              <span className={styles.dot} />
              <span className={styles.leader} />
              <div className={styles.card}>
                <span className={styles.num}>{s.number}</span>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
              </div>
            </div>
          ))}

          {/* Small screens: one caption at the bottom instead of floating labels. */}
          {mode === "live" && step >= 0 && (
            <div className={styles.caption} aria-hidden>
              <span className={styles.num}>{STEPS[step].number} / 03</span>
              <h2>{STEPS[step].title}</h2>
              <p>{STEPS[step].text}</p>
            </div>
          )}

          {mode === "live" && (
            <div ref={railRef} className={styles.rail} aria-hidden>
              <span className={styles.railFill} />
            </div>
          )}

          <p className="sr-only" aria-live="polite">
            {mode === "live" && step >= 0 ? `${STEPS[step].title}: ${STEPS[step].text}` : ""}
          </p>

          {mode === "loading" && <p className={styles.status}>Loading 3D scene…</p>}
          {mode === "unsupported" && (
            <p className={styles.status}>
              3D graphics are not available in this browser, so the animation can&rsquo;t be shown. The components are
              described below.
            </p>
          )}
        </div>
      </section>

      <section className={styles.notes} aria-label="Components">
        <h2 className={styles.notesTitle}>What you are looking at</h2>
        <ol className={styles.notesList}>
          {STEPS.map((s) => (
            <li key={s.id}>
              <span className={styles.num}>{s.number}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <p className={styles.footnote}>
          A procedural, unbranded vehicle model built for this experiment. It is a stylised illustration, not any
          manufacturer&rsquo;s product.
        </p>
      </section>
    </div>
  );
}
