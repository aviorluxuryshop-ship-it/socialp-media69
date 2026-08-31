'use client';

import { useEffect, useState } from 'react';
import { Picture } from '../Picture';
import { Words } from '../Type';
import type { Dict } from '@/content/tr';
import { anchors } from '@/lib/dict';

type Cat = 'video' | 'photo' | 'brand' | 'social';

/**
 * Curated portfolio wall.
 *
 * Every frame is real Socialp Media material. The assets are natively vertical
 * (they are made for social), so variety comes from column width and crop ratio
 * rather than from forcing landscape crops that would throw away the frame.
 *
 * Layout is a CSS multi-column masonry: it stays genuinely asymmetric and, more
 * importantly, it reflows cleanly when a filter removes items — which an
 * explicitly placed grid would not.
 */
const WALL: { id: string; cat: Cat; ratio: string; drift: number }[] = [
  { id: 'showroom-otomotiv', cat: 'video', ratio: '3 / 4', drift: 10 },
  { id: 'guzellik-merkezi', cat: 'photo', ratio: '4 / 5', drift: 6 },
  { id: 'telefon-tepsi', cat: 'brand', ratio: '3 / 4', drift: 12 },
  { id: 'nail-dergi', cat: 'social', ratio: '4 / 5', drift: 8 },
  { id: 'restoran-masa', cat: 'photo', ratio: '9 / 16', drift: 10 },
  { id: 'mekan-video-kurulum', cat: 'video', ratio: '4 / 5', drift: 7 },
  { id: 'instagram-tepsi', cat: 'brand', ratio: '3 / 4', drift: 9 },
  { id: 'ekip-salon', cat: 'social', ratio: '9 / 16', drift: 11 },
  { id: 'konsept-editorial', cat: 'video', ratio: '3 / 4', drift: 8 },
  { id: 'studyo-sanat', cat: 'photo', ratio: '4 / 5', drift: 6 },
  { id: 'meta-tepsi', cat: 'brand', ratio: '3 / 4', drift: 10 },
  { id: 'gazete-siyahbeyaz', cat: 'social', ratio: '4 / 5', drift: 9 },
  { id: 'roportaj-stüdyo', cat: 'video', ratio: '9 / 16', drift: 12 },
  { id: 'kamera-detay', cat: 'photo', ratio: '9 / 16', drift: 7 },
  { id: 'bilboard-mockup', cat: 'brand', ratio: '9 / 16', drift: 10 },
  { id: 'cekim-mavi', cat: 'social', ratio: '9 / 16', drift: 8 },
  { id: 'kafe-tanitim', cat: 'video', ratio: '4 / 5', drift: 9 },
  { id: 'mekan-isik', cat: 'photo', ratio: '9 / 16', drift: 11 },
  { id: 'sokak-tabela', cat: 'brand', ratio: '3 / 4', drift: 7 },
  { id: 'cekim-kamera', cat: 'social', ratio: '9 / 16', drift: 10 },
  { id: 'icerik-hazir', cat: 'video', ratio: '9 / 16', drift: 8 },
  { id: 'fon-perde', cat: 'brand', ratio: '4 / 5', drift: 9 },
  { id: 'cekim-studyo', cat: 'social', ratio: '9 / 16', drift: 6 },
];

export function Work({ dict }: { dict: Dict }) {
  const [filter, setFilter] = useState<Cat | 'all'>('all');
  const f = dict.work.filters;

  const tabs: { key: Cat | 'all'; label: string }[] = [
    { key: 'all', label: f.all },
    { key: 'video', label: f.video },
    { key: 'photo', label: f.photo },
    { key: 'brand', label: f.brand },
    { key: 'social', label: f.social },
  ];

  const visible = WALL.filter((w) => filter === 'all' || w.cat === filter);

  // The wall reflows when the filter changes: tell the motion layer to rebind
  // parallax to the new nodes and recompute every trigger position below.
  useEffect(() => {
    const id = requestAnimationFrame(() => window.dispatchEvent(new Event('sp:relayout')));
    return () => cancelAnimationFrame(id);
  }, [filter]);

  return (
    <section id={anchors.work} className="relative py-sect" aria-labelledby="work-title">
      <div className="shell">
        <div className="mb-12 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="kicker mb-8 text-signal-lift">{dict.work.kicker}</p>
            <Words id="work-title" as="h2" text={dict.work.heading} className="display display-lg max-w-[12ch]" />
          </div>
          <p data-reveal="up" className="lead self-end text-mist lg:col-span-5">
            {dict.work.lead}
          </p>
        </div>

        {/* Filter — a real tablist, keyboard operable, never hover-gated. */}
        <div
          role="tablist"
          aria-label={dict.work.kicker}
          className="hair mb-10 flex flex-wrap gap-x-2 gap-y-1 border-t pt-6"
        >
          {tabs.map((t) => {
            const on = filter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setFilter(t.key)}
                className={`relative min-h-11 px-4 text-sm transition-colors duration-300 ${
                  on ? 'text-paper' : 'text-mist-dim hover:text-mist'
                }`}
              >
                {t.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 bottom-1 h-px origin-left bg-signal transition-transform duration-500 ${
                    on ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            );
          })}
          <span className="kicker ml-auto self-center text-mist-dim tabular">
            {String(visible.length).padStart(2, '0')}
          </span>
        </div>

        <div className="[column-gap:1.25rem] sm:columns-2 lg:columns-3 lg:[column-gap:1.75rem]">
          {visible.map((item) => (
            <figure key={item.id} className="mb-5 break-inside-avoid lg:mb-7">
              <div className="media group" style={{ aspectRatio: item.ratio }}>
                {/* Parallax happens inside the frame, so masonry flow is never
                    disturbed and images cannot overlap their neighbours. */}
                <div data-parallax={item.drift} className="absolute -inset-y-[9%] inset-x-0">
                  <Picture
                    id={item.id}
                    alt={dict.work.alts[item.id] ?? ''}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                    className="cover"
                  />
                </div>
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/75 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                />
                <figcaption className="kicker absolute bottom-4 left-4 text-paper/75 transition-colors duration-500 group-hover:text-paper">
                  {f[item.cat]}
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
