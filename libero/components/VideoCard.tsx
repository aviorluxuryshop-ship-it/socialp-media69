'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Video } from '@/data/videos';
import { VIDEO_TOPIC_NAME } from '@/data/videos';
import { LEVEL_NAMES } from '@/lib/types';
import { CatGlyph } from './CatGlyph';
import { Icon } from './Icon';

const SUB_LABEL: Record<Video['sub'], string> = {
  'tr-anlatim': 'Türkçe anlatım',
  'tr-ceviri': 'İngilizce · Türkçe altyazı (otomatik çeviri) açılabilir',
  'tr-yok': 'İngilizce · Türkçe altyazı doğrulanamadı',
};

export function fmtDuration(s: number | null) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function TopicGlyph({ topic, size = 30 }: { topic: Video['topic']; size?: number }) {
  if (topic === 'taktik') return <Icon name="brain" style={{ width: size, height: size }} />;
  if (topic === 'fiziksel') return <Icon name="dumbbell" style={{ width: size, height: size }} />;
  if (topic === 'onleme') return <Icon name="heart" style={{ width: size, height: size }} />;
  return <CatGlyph id={topic} size={size} />;
}

export function levelText(v: Video) {
  return v.lv[0] === v.lv[1] ? '★'.repeat(v.lv[0]) : `${'★'.repeat(v.lv[0])}–${'★'.repeat(v.lv[1])}`;
}

function embedUrl(id: string) {
  // youtube-nocookie: oynatılana kadar izleme çerezi bırakmaz.
  // cc_load_policy + cc_lang_pref: altyazı varsa Türkçe olarak açılmaya çalışılır.
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&hl=tr&cc_load_policy=1&cc_lang_pref=tr`;
}

export function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        // basit odak tuzağı
        const root = document.getElementById('vmodal-panel');
        if (!root) return;
        const f = Array.from(root.querySelectorAll<HTMLElement>('a[href],button,iframe,[tabindex]:not([tabindex="-1"])')).filter((x) => !x.hasAttribute('disabled'));
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [onClose]);

  if (!mounted) return null;
  return createPortal(
    <div className="vmodal" role="dialog" aria-modal="true" aria-label={video.title} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="vmodal__panel" id="vmodal-panel">
        <div className="vmodal__head">
          <p className="mono muted">{VIDEO_TOPIC_NAME[video.topic]}</p>
          <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label="Videoyu kapat"><Icon name="close" /></button>
        </div>
        <div className="vmodal__frame">
          <iframe
            src={embedUrl(video.id)}
            title={video.title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className="vmodal__body">
          <h2 className="h3">{video.title}</h2>
          <p className="muted">
            Kanal: <a href={video.authorUrl} target="_blank" rel="noopener noreferrer" className="btn--quiet" style={{ border: 0 }}>{video.author}</a>
            {' · '}
            <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="btn--quiet" style={{ border: 0 }}>YouTube’da aç <Icon name="external" style={{ width: 12, height: 12 }} /></a>
          </p>
          <div className="vmodal__sum">
            <p className="eyebrow">Türkçe özet</p>
            <p>{video.summary}</p>
            <p className="field__hint">Bu özet video başlığı ve konusuna dayanarak bu site için yazılmıştır; videonun tam çevirisi değildir. Altyazı: {SUB_LABEL[video.sub]}. Altyazı yoksa oynatıcıdaki “Ayarlar” menüsünden kontrol edebilirsin.</p>
          </div>
          {video.note && <p className="note note--warn" style={{ marginTop: 12 }}><Icon name="warn" /><span>{video.note}</span></p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function VideoCard({ video, compact }: { video: Video; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const dur = fmtDuration(video.seconds);
  return (
    <>
      <button type="button" className={`card vcard ${compact ? 'vcard--compact' : ''}`} onClick={() => setOpen(true)} aria-haspopup="dialog">
        <span className="vcard__thumb" aria-hidden="true">
          <span className="vcard__glyph"><TopicGlyph topic={video.topic} size={compact ? 30 : 40} /></span>
          <span className="vcard__play"><Icon name="play" /></span>
          {dur && <span className="vcard__dur mono">{dur}</span>}
        </span>
        <span className="vcard__body">
          <span className="vcard__meta mono">
            <span>{video.lang === 'tr' ? 'TR' : 'EN'}</span>
            <span>{levelText(video)}</span>
            <span>{VIDEO_TOPIC_NAME[video.topic]}</span>
          </span>
          <span className="vcard__title">{video.title}</span>
          <span className="vcard__author">{video.author}</span>
          {!compact && <span className="vcard__sum">{video.summary}</span>}
        </span>
      </button>
      {open && <VideoModal video={video} onClose={() => setOpen(false)} />}
    </>
  );
}

export { SUB_LABEL, LEVEL_NAMES };
