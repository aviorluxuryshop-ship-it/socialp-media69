'use client';

import { useEffect, useRef, useState } from 'react';
import { AGE_BANDS } from '@/lib/nutrition';
import { usePlan } from '@/lib/nutri-store';

interface Item {
  id: string;
  no: string;
  nav: string;
}

/** Yapışkan bölüm menüsü: geniş ekranda sol sütun, dar ekranda üstte yatay kaydırmalı şerit. Okuma konumunu izler. */
export function NutritionNav({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0].id);
  const listRef = useRef<HTMLOListElement>(null);
  const [plan] = usePlan();
  const band = AGE_BANDS.find((b) => b.id === plan.band);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.32;
      let cur = els[0]?.id ?? items[0].id;
      for (const el of els) if (el.getBoundingClientRect().top - line <= 0) cur = el.id;
      setActive((p) => (p === cur ? p : cur));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items]);

  // yatay şeritte etkin bağlantıyı görünür tut (sayfayı kaydırmadan)
  useEffect(() => {
    const ol = listRef.current;
    const a = ol?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!ol || !a || ol.scrollWidth <= ol.clientWidth + 2) return;
    ol.scrollTo({ left: a.offsetLeft - ol.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
  }, [active]);

  const idx = Math.max(0, items.findIndex((i) => i.id === active));
  return (
    <nav className="gnav np" aria-label="Rehber bölümleri" style={{ ['--p' as string]: (idx + 1) / items.length }}>
      <p className="gnav__t eyebrow">Bu sayfada</p>
      <ol ref={listRef} className="gnav__list">
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} aria-current={active === i.id ? 'true' : undefined}>
              <span className="mono gnav__no">{i.no}</span>
              <span>{i.nav}</span>
            </a>
          </li>
        ))}
      </ol>
      <a className="gnav__age" href="#yas-grubu" title="Yaş grubunu değiştir">
        <span className="mono">Yaş grubu</span>
        <strong>{band?.short}</strong>
      </a>
      <span className="gnav__bar" aria-hidden="true" />
    </nav>
  );
}
