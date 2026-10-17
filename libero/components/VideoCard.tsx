'use client';

import { useState, type ReactNode } from 'react';
import type { Video } from '@/data/video-build';
import { VIDEO_TOPIC_NAME } from '@/data/video-topics';
import { useUiPrefs } from '@/lib/ui-prefs';
import { Icon } from './Icon';
import { VideoCover } from './VideoCover';
import { VideoPlayerModal } from './VideoPlayerModal';

export function fmtDuration(s: number | null) {
  if (!s) return '';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}

/** "★★–★★★" ya da "★★" */
export function levelText(v: Pick<Video, 'lv'>) {
  return v.lv[0] === v.lv[1] ? '★'.repeat(v.lv[0]) : `${'★'.repeat(v.lv[0])}–${'★'.repeat(v.lv[1])}`;
}

const levelWords = (v: Pick<Video, 'lv'>) => (v.lv[0] === v.lv[1] ? `seviye ${v.lv[0]}` : `seviye ${v.lv[0]} ile ${v.lv[1]} arası`);

/**
 * Kapak: önce konuya özel çizilmiş kapak. Kullanıcı izin verdiyse (lib/ui-prefs.ts) YouTube'un
 * küçük resmi üstüne biner; yüklenemezse ya da kapalıysa çizim kalır. Kapalıyken dış istek yapılmaz.
 */
export function VideoThumb({ id, topic }: { id: string; topic: Video['topic'] }) {
  const ui = useUiPrefs();
  const [bad, setBad] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const show = ui.hydrated && ui.ytThumbs && !bad;
  return (
    <>
      <VideoCover topic={topic} />
      {show && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="vcard__img"
          data-loaded={loaded ? 'true' : 'false'}
          src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth < 200) setBad(true); // YouTube yer tutucusu (küçük gri görsel)
            else setLoaded(true);
          }}
          onError={() => setBad(true)}
        />
      )}
    </>
  );
}

export function VideoCard({ video, compact, sidePanel }: { video: Video; compact?: boolean; sidePanel?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const dur = fmtDuration(video.seconds);
  return (
    <>
      <button
        type="button"
        className={`card vcard ${compact ? 'vcard--compact' : ''}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${video.title} — ${video.author}. ${video.lang === 'tr' ? 'Türkçe' : 'İngilizce'}, ${levelWords(video)}${dur ? `, ${dur}` : ''}. Videoyu aç`}
      >
        <span className="vcard__thumb" aria-hidden="true">
          <VideoThumb id={video.id} topic={video.topic} />
          <span className="vcard__shade" />
          <span className="vcard__play"><Icon name="play" /></span>
          {dur && <span className="vcard__dur mono">{dur}</span>}
        </span>
        <span className="vcard__body">
          <span className="vcard__meta mono">
            <span className={`vcard__lang vcard__lang--${video.lang}`}>{video.lang === 'tr' ? 'TR' : 'EN'}</span>
            <span className="vcard__lv">{levelText(video)}</span>
            <span className="vcard__topic">{VIDEO_TOPIC_NAME[video.topic]}</span>
          </span>
          <span className="vcard__title">{video.title}</span>
          <span className="vcard__author">{video.author}</span>
          {!compact && <span className="vcard__sum">{video.summary}</span>}
        </span>
      </button>
      {open && <VideoPlayerModal video={video} sidePanel={sidePanel} onClose={() => setOpen(false)} />}
    </>
  );
}
