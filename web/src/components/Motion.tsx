'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const REDUCED = '(prefers-reduced-motion: reduce)';
const EASE_OUT = 'power3.out';

/**
 * The single owner of page motion.
 *
 * Choreography is declared on the markup with data attributes and wired up here,
 * which keeps every section a server component (full HTML for crawlers, no
 * hydration cost) while the animation logic stays in one auditable place.
 *
 *   data-reveal="up|fade"   fade/slide in on enter
 *   data-lines              headline: each .line-mask > span wipes up
 *   data-words              statement: each word wipes up, staggered
 *   data-img-reveal         image: frame wipes open while the picture settles
 *   data-stagger            container whose [data-stagger-item]s sequence in
 *   data-parallax="n"       decorative layer drifts n% against the scroll
 *   data-depth="n"          layer follows the pointer at depth n (px at edge)
 *   data-draw               hairline rule that draws across as it enters
 *   data-scrub-fill         element whose scaleY tracks section progress
 *   data-magnetic           control that leans toward the cursor
 */
export function Motion() {
  useEffect(() => {
    const reduced = window.matchMedia(REDUCED);

    // Development-only escape hatch for QA on a machine that has OS-level
    // "reduce motion" switched on. Compiled out of production builds, so the
    // accessibility preference is always honoured for real visitors.
    const forceMotion =
      process.env.NODE_ENV !== 'production' &&
      new URLSearchParams(window.location.search).has('motion');

    if (reduced.matches && !forceMotion) return;

    const root = document.documentElement;
    root.classList.add('js-motion');
    if (forceMotion) root.classList.add('force-motion');

    // ---- Smooth scroll ---------------------------------------------------
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Anchor links route through Lenis so in-page jumps stay smooth.
    const onAnchorClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest?.('a[href*="#"]') as HTMLAnchorElement | null;
      if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const url = new URL(link.href, window.location.href);
      if (url.pathname !== window.location.pathname || !url.hash) return;
      const target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -80, duration: 1.15 });
      history.pushState(null, '', url.hash);
    };
    document.addEventListener('click', onAnchorClick);

    const ctx = gsap.context(() => {
      // The hero is above the fold, so it plays a single load intro instead of
      // scroll triggers. Its elements are excluded from the loops below.
      const heroEl = document.querySelector<HTMLElement>('[data-hero]');
      const outsideHero = (el: HTMLElement) => !heroEl?.contains(el);

      // ---- Enter animations ---------------------------------------------

      gsap.utils.toArray<HTMLElement>('[data-reveal]').filter(outsideHero).forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: EASE_OUT,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });

      // Headlines wipe line by line — the signature move, used only on H1/H2.
      gsap.utils.toArray<HTMLElement>('[data-lines]').filter(outsideHero).forEach((el) => {
        const lines = el.querySelectorAll<HTMLElement>('.line-mask > span');
        gsap.to(lines, {
          y: '0%',
          duration: 1.05,
          ease: 'expo.out',
          stagger: 0.085,
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
      });

      // Statement type reveals word by word, faster and tighter than lines.
      gsap.utils.toArray<HTMLElement>('[data-words]').forEach((el) => {
        const words = el.querySelectorAll<HTMLElement>('span > span');
        gsap.to(words, {
          y: '0%',
          duration: 0.8,
          ease: 'expo.out',
          stagger: { each: 0.028, amount: Math.min(words.length * 0.028, 0.9) },
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
      });

      // Images open from the bottom edge while the picture eases out of a
      // slight over-scale — reads like a camera settling rather than a fade.
      gsap.utils.toArray<HTMLElement>('[data-img-reveal]').filter(outsideHero).forEach((el) => {
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
          .to(el, { clipPath: 'inset(0 0 0% 0)', duration: 1.15, ease: 'expo.out' })
          .to(el.children, { scale: 1, duration: 1.5, ease: 'expo.out' }, 0);
      });

      gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((group) => {
        const kids = gsap.utils.toArray<HTMLElement>('[data-stagger-item]', group);
        if (!kids.length) return;
        gsap.set(kids, { opacity: 0, y: 26 });
        gsap.to(kids, {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: EASE_OUT,
          stagger: { each: 0.075, amount: Math.min(kids.length * 0.075, 0.6) },
          scrollTrigger: { trigger: group, start: 'top 84%', once: true },
        });
      });

      // Hairline rules draw across rather than appearing.
      gsap.utils.toArray<HTMLElement>('[data-draw]').forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0, transformOrigin: 'left center' },
          {
            scaleX: 1,
            duration: 1.1,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          },
        );
      });

      // Progress rails (the production-process spine).
      gsap.utils.toArray<HTMLElement>('[data-scrub-fill]').forEach((el) => {
        const section = el.closest('section') ?? el.parentElement ?? el;
        gsap.fromTo(
          el,
          { scaleY: 0, transformOrigin: 'top center' },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: { trigger: section, start: 'top 65%', end: 'bottom 80%', scrub: 0.5 },
          },
        );
      });

      if (heroEl) {
        // ---- Hero load intro --------------------------------------------
        // Plays once on load: photography settles in, the headline wipes up
        // line by line, then the supporting copy and CTAs follow.
        const q = gsap.utils.selector(heroEl);
        // Wait out the logo curtain when it is playing, otherwise start almost
        // immediately.
        const start = document.documentElement.classList.contains('is-intro') ? 1.05 : 0.1;

        // Applied immediately, not at tween start, so there is no flash of the
        // un-animated plate during the delay.
        gsap.set(q('[data-hero-bed]'), { scale: 1.12, opacity: 0 });

        const intro = gsap.timeline({ delay: start, defaults: { ease: 'expo.out' } });

        // 1. Backdrop plate eases out of a slight over-scale.
        intro.to(q('[data-hero-bed]'), { scale: 1, opacity: 1, duration: 1.6 }, 0);

        // 2. Floating frames wipe open and settle back from over-scale.
        const frames = q('[data-img-reveal]');
        if (frames.length) {
          intro
            .to(frames, { clipPath: 'inset(0 0 0% 0)', duration: 1.1, stagger: 0.12 }, 0.25)
            .to(
              frames.flatMap((f) => Array.from((f as HTMLElement).children)),
              { scale: 1, duration: 1.5, stagger: 0.12 },
              0.25,
            );
        }

        // 3. Headline wipes up, line by line.
        intro.to(q('h1 .line-mask > span'), { y: '0%', duration: 1.1, stagger: 0.09 }, 0.35);

        // 4. Lead copy and CTAs follow shortly after the heading.
        intro.to(
          q('[data-reveal]'),
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: EASE_OUT },
          0.95,
        );

        // Hero exit: the whole composition sinks and dims as it leaves.
        const copy = heroEl.querySelector<HTMLElement>('[data-hero-copy]');
        const bed = heroEl.querySelector<HTMLElement>('[data-hero-bed]');
        const out = gsap.timeline({
          scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: 0.6 },
        });
        if (copy) out.to(copy, { yPercent: -26, opacity: 0, ease: 'none' }, 0);
        if (bed) out.to(bed, { yPercent: 14, scale: 1.08, ease: 'none' }, 0);
      }
    });

    // ---- Parallax (rebindable) --------------------------------------------
    // Decorative layers only — never body copy, never controls. The gallery
    // filter swaps these nodes in and out, so this set is torn down and rebuilt
    // on `sp:relayout` rather than bound once at mount.
    let parallaxTweens: gsap.core.Tween[] = [];

    const mountParallax = () => {
      parallaxTweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      parallaxTweens = gsap.utils.toArray<HTMLElement>('[data-parallax]').map((el) => {
        const shift = Number(el.dataset.parallax) || 8;
        return gsap.fromTo(
          el,
          { yPercent: -shift / 2 },
          {
            yPercent: shift / 2,
            ease: 'none',
            scrollTrigger: {
              trigger: el.parentElement ?? el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.7,
            },
          },
        );
      });
    };

    mountParallax();

    const onRelayout = () => {
      mountParallax();
      ScrollTrigger.refresh();
    };
    window.addEventListener('sp:relayout', onRelayout);

    // ---- Pointer ----------------------------------------------------------
    // One rAF-throttled listener publishes pointer state; layers read it via
    // per-element quickTo setters, so there is no React work per move.
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    let detachPointer: (() => void) | undefined;

    const attachPointer = () => {
      if (!fine.matches) return;

      const layers = gsap.utils.toArray<HTMLElement>('[data-depth]').map((el) => ({
        el,
        depth: Number(el.dataset.depth) || 12,
        x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }),
        y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }),
      }));

      const stages = gsap.utils.toArray<HTMLElement>('[data-tilt]').map((el) => ({
        el,
        amount: Number(el.dataset.tilt) || 4,
        rx: gsap.quickTo(el, 'rotationX', { duration: 1.1, ease: 'power3.out' }),
        ry: gsap.quickTo(el, 'rotationY', { duration: 1.1, ease: 'power3.out' }),
      }));

      let px = 0;
      let py = 0;
      let queued = false;

      const apply = () => {
        queued = false;
        root.style.setProperty('--px', px.toFixed(4));
        root.style.setProperty('--py', py.toFixed(4));
        for (const l of layers) {
          l.x(px * l.depth);
          l.y(py * l.depth);
        }
        for (const s of stages) {
          s.ry(px * s.amount);
          s.rx(-py * s.amount);
        }
      };

      const onMove = (e: PointerEvent) => {
        root.style.setProperty('--mx', `${e.clientX}px`);
        root.style.setProperty('--my', `${e.clientY}px`);
        px = (e.clientX / window.innerWidth) * 2 - 1;
        py = (e.clientY / window.innerHeight) * 2 - 1;
        if (!queued) {
          queued = true;
          requestAnimationFrame(apply);
        }
      };

      window.addEventListener('pointermove', onMove, { passive: true });

      // Magnetic controls: lean toward the cursor, snap back on leave.
      const magnets = gsap.utils.toArray<HTMLElement>('[data-magnetic]');
      const magnetCleanups = magnets.map((el) => {
        const mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
        const my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
        const enterMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          mx((e.clientX - (r.left + r.width / 2)) * 0.28);
          my((e.clientY - (r.top + r.height / 2)) * 0.4);
        };
        const leave = () => {
          mx(0);
          my(0);
        };
        el.addEventListener('pointermove', enterMove);
        el.addEventListener('pointerleave', leave);
        return () => {
          el.removeEventListener('pointermove', enterMove);
          el.removeEventListener('pointerleave', leave);
        };
      });

      detachPointer = () => {
        window.removeEventListener('pointermove', onMove);
        magnetCleanups.forEach((fn) => fn());
      };
    };

    attachPointer();
    const onFineChange = () => {
      detachPointer?.();
      detachPointer = undefined;
      attachPointer();
    };
    fine.addEventListener('change', onFineChange);

    // Late-arriving webfonts and images change trigger positions.
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      document.removeEventListener('click', onAnchorClick);
      window.removeEventListener('load', onLoad);
      window.removeEventListener('sp:relayout', onRelayout);
      fine.removeEventListener('change', onFineChange);
      detachPointer?.();
      parallaxTweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
      root.classList.remove('js-motion', 'force-motion');
    };
  }, []);

  return null;
}
