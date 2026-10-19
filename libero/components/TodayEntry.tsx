'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { pickToday, mondayIndex, type TodayPick, type TodayTech } from '@/lib/today';
import { setProfile, useMeta, useStore, type AppState } from '@/lib/store';
import { LEVEL_HINTS, type Level } from '@/lib/types';
import { todayKey } from '@/lib/utils';
import { Icon } from './Icon';
import { StarRating } from './StarRating';

const selAll = (s: AppState) => s;

const START: TodayPick = {
  kind: 'start',
  eyebrow: 'Başlamak için',
  title: 'Teknik kütüphanesinden bir hareket seç',
  detail: 'Her tekniği saha diyagramıyla izle, seviyene göre çalış.',
  href: '/teknikler/',
  cta: 'Kütüphaneyi aç',
  chips: [],
};

/**
 * "Bugün ne çalışayım?" kartı: libero:v1 durumunu (profil, seviye, program, antrenman geçmişi, son ziyaret)
 * okur ve tek bir somut öneri sunar. Boş durumda ve bozuk veride güvenle çalışır (lib/today.ts hata fırlatmaz).
 * Sunucuda ve hidrasyondan önce aynı boyutta bir yer tutucu çizilir (yerleşim kayması yok, gün farkı uyuşmazlığı yok).
 */
export function TodayEntry({ techs }: { techs: TodayTech[] }) {
  const { ready } = useMeta();
  const st = useStore(selAll);

  const pick = useMemo<TodayPick | null>(() => {
    if (!ready) return null;
    try {
      const now = new Date();
      return pickToday({
        level: st.profile.level,
        positions: st.profile.positions,
        program: st.program,
        logs: st.logs,
        lastVisit: st.lastVisit,
        practiced: st.practiced,
        dayIndex: mondayIndex(now.getDay()),
        dateKey: todayKey(now),
        techs,
      });
    } catch {
      return START;
    }
  }, [ready, st, techs]);

  const level = st.profile.level;

  return (
    <div className="today" data-today data-ready={ready ? 'true' : 'false'} data-kind={pick?.kind ?? 'loading'} aria-busy={!ready}>
      <div className="today__main card card--edge-accent" aria-live="polite">
        {pick ? (
          <>
            <p className="today__eyebrow mono">
              <span className="today__dot" aria-hidden="true" />
              {pick.eyebrow}
            </p>
            <h3 className="today__title">{pick.title}</h3>
            <p className="today__detail">{pick.detail}</p>
            {pick.progress !== undefined && (
              <span className="bar today__bar" aria-hidden="true">
                <span style={{ width: `${Math.round(pick.progress * 100)}%` }} />
              </span>
            )}
            {pick.chips.length > 0 && (
              <ul className="today__chips" aria-label="Ayrıntılar">
                {pick.chips.map((c) => (
                  <li key={c} className="tag">
                    {c}
                  </li>
                ))}
              </ul>
            )}
            <Link href={pick.href} className="btn btn--primary btn--lg today__cta">
              {pick.cta} <Icon name="arrow" />
            </Link>
          </>
        ) : (
          <div className="today__skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <div className="today__level card">
        <p className="mono muted">Genel yetenek seviyen</p>
        <StarRating value={level} onChange={(v: Level) => setProfile({ level: v })} size="lg" label="Genel yetenek seviyeniz" />
        <p className="muted today__hint">{LEVEL_HINTS[level]}. Öneriler bu seviyeye göre değişir.</p>
      </div>
    </div>
  );
}
