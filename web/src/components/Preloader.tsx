'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { logoMeta } from './Picture';

/**
 * Logo intro.
 *
 * The curtain markup ships in the server HTML but is `display: none` until the
 * pre-paint script in the layout adds `.is-intro` to <html>. That ordering
 * matters: mounting it on hydration instead would drop the curtain *over*
 * content the visitor could already see.
 *
 * The script only opts in when motion is welcome and the intro has not already
 * played this session, so no-JS and reduced-motion visitors never see it at all.
 */
export function Preloader({ label }: { label: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('is-intro')) return;

    const el = rootRef.current;
    const done = () => root.classList.remove('is-intro');
    if (!el) {
      done();
      return;
    }

    const tl = gsap.timeline({ onComplete: done });
    tl.to(el.querySelectorAll('[data-pl-mark]'), {
      y: '0%',
      duration: 0.85,
      ease: 'expo.out',
      stagger: 0.07,
    })
      .fromTo(
        el.querySelector('[data-pl-rule]'),
        { scaleX: 0 },
        { scaleX: 1, duration: 0.8, ease: 'expo.inOut' },
        0.2,
      )
      .to(el.querySelector('[data-pl-inner]'), { opacity: 0, duration: 0.35, ease: 'power2.in' }, '+=0.15')
      .to(el, { yPercent: -100, duration: 0.8, ease: 'expo.inOut' }, '<0.1');

    // Safety net: never hold the page hostage if something stalls.
    const bail = window.setTimeout(() => tl.progress(1), 3000);

    return () => {
      window.clearTimeout(bail);
      tl.kill();
      done();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-preloader
      // Decorative curtain; the real content sits behind it in the same document.
      aria-hidden="true"
      className="fixed inset-0 z-[100] place-items-center bg-ink grain"
    >
      <div data-pl-inner className="flex w-[min(70vw,24rem)] flex-col items-center gap-5">
        <span className="line-mask">
          <span data-pl-mark className="block translate-y-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marks/socialp.png"
              alt=""
              width={logoMeta.width}
              height={logoMeta.height}
              className="w-full"
            />
          </span>
        </span>
        <span data-pl-rule className="h-px w-full origin-left bg-white/25" />
        <span className="line-mask">
          <span data-pl-mark className="kicker block translate-y-full text-mist">
            {label}
          </span>
        </span>
      </div>
    </div>
  );
}
