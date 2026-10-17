'use client';

import { useId, useState, type ReactNode } from 'react';
import type { FootZone } from '@/data/types';
import { BootStage } from '@/components/boot/stage';
import { VIEWS, ZONES, ballZone, orderZones, primaryView, viewsFor, viewsOfZone, type BootView } from '@/lib/boot';

/**
 * Temas yüzeyi haritası: elle çizilmiş krampon (üstten, iç yüz, dış yüz, taban/topuk).
 * Tekniğin foot[] bölgelerinin göründüğü görünümler sekme olarak sunulur; ana görünümde
 * vurgulanan bölgeye değen küçük bir top ve sağ/sol ayak seçimi vardır.
 * Sunucuda da çizilir (statik dışa aktarımda ilk boyama beklemez).
 */
export function BootMap({ foot, contact, children }: { foot: FootZone[]; contact: string; children?: ReactNode }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const zones = orderZones(foot);
  const views = viewsFor(zones);
  const [view, setView] = useState<BootView>(() => primaryView(foot));
  const [left, setLeft] = useState(false);
  const [ball, setBall] = useState(true);
  const cur: BootView = views.includes(view) ? view : (views[0] ?? 'ust');
  const hasBall = ballZone(cur, foot) !== null;
  const caption = `${left ? 'Sol' : 'Sağ'} ayak · ${VIEWS[cur].caption}`;

  return (
    <div className="card bootcard" data-bootmap data-foot={zones.join(',')} data-view={cur} data-left={left ? 'true' : 'false'}>
      <figure className="bootmap" role="group" aria-label="Temas yüzeyi haritası: krampon çizimi">
        <div className="bootmap__stage" data-bootmap-main>
          <BootStage view={cur} foot={zones} left={left} ball={ball} uid={uid} />
        </div>
        <figcaption className="bootmap__cap mono muted" aria-live="polite">
          {caption}
        </figcaption>

        <div className="bootmap__tools">
          {views.length > 1 && (
            <div className="bootmap__views" role="group" aria-label="Görünüm seç">
              {views.map((v) => (
                <button key={v} type="button" className="bootview" aria-pressed={cur === v} data-view-btn={v} onClick={() => setView(v)}>
                  <span className="bootview__img">
                    <BootStage view={v} foot={zones} left={left} uid={uid} mini />
                  </span>
                  <span className="bootview__t mono">{VIEWS[v].label}</span>
                </button>
              ))}
            </div>
          )}
          <div className="bootmap__ctl">
            <div className="seg" role="group" aria-label="Ayak seç">
              <button type="button" aria-pressed={!left} data-foot-btn="right" onClick={() => setLeft(false)}>
                Sağ ayak
              </button>
              <button type="button" aria-pressed={left} data-foot-btn="left" onClick={() => setLeft(true)}>
                Sol ayak
              </button>
            </div>
            {hasBall && (
              <button type="button" className="bootball" aria-pressed={ball} data-ball-btn onClick={() => setBall((b) => !b)}>
                <span className="bootball__dot" aria-hidden="true" />
                Top {ball ? 'açık' : 'kapalı'}
              </button>
            )}
          </div>
        </div>
      </figure>

      <div className="bootcard__info">
        <p className="mono muted">Temas yüzeyi</p>
        <p className="surface__t">{contact}</p>
        <ul className="bootzones" aria-label="Vurgulanan temas bölgeleri">
          {zones.map((z) => (
            <li key={z} data-zone-item={z}>
              <span className="bootzones__mark" aria-hidden="true" />
              <span>
                <b>{ZONES[z].label}</b>
                <span className="bootzones__n">{ZONES[z].note}</span>
                <span className="bootzones__v mono">Görünüm: {viewsOfZone(z).map((v) => VIEWS[v].label).join(', ')}</span>
              </span>
            </li>
          ))}
        </ul>
        {children}
      </div>
    </div>
  );
}
