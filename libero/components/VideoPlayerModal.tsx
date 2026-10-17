'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Video } from '@/data/video-build';
import { VIDEO_TOPIC_NAME } from '@/data/video-topics';
import { addVideoMoment, removeVideoMoment, useStore, type AppState } from '@/lib/store';
import { videoBadges } from '@/lib/video-honesty';
import { MAX_MOMENT_TEXT, fmtTime, parseTime, type VideoMoment } from '@/lib/video-moments';
import { loadYouTubeApi, ytErrorKind, type YTPlayer } from '@/lib/youtube-api';
import { Icon } from './Icon';
import { VideoCover } from './VideoCover';

type Api = 'loading' | 'ready' | 'noapi' | 'offline' | 'embed-off' | 'missing' | 'other';

const HARD: Api[] = ['offline', 'embed-off', 'missing', 'other'];

const FAIL_TEXT: Record<'offline' | 'embed-off' | 'missing' | 'other', { title: string; body: string }> = {
  offline: { title: 'Video şu an oynatılamıyor', body: 'İnternet bağlantısı yok ya da YouTube’a ulaşılamıyor. Bağlantı gelince bu pencereyi yeniden aç.' },
  'embed-off': { title: 'Bu video burada oynatılamıyor', body: 'Video sahibi gömülü oynatmaya izin vermiyor. YouTube’da açıp izleyebilirsin.' },
  missing: { title: 'Video bulunamadı', body: 'Video kaldırılmış ya da özel yapılmış olabilir. Doğrulama tarihinden sonra değişmiş olabilir.' },
  other: { title: 'Oynatıcı bir hata verdi', body: 'Sayfayı yenileyip yeniden deneyebilir ya da videoyu YouTube’da açabilirsin.' },
};

const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

function embedSrc(id: string, start: number) {
  // youtube-nocookie: oynatılana kadar izleme çerezi bırakmaz. enablejsapi: not için süre okuma/atlama.
  // cc_load_policy + cc_lang_pref: altyazı varsa Türkçe olarak açılmaya çalışılır.
  const q = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    playsinline: '1',
    hl: 'tr',
    cc_load_policy: '1',
    cc_lang_pref: 'tr',
    enablejsapi: '1',
    origin: window.location.origin,
  });
  if (start > 0) q.set('start', String(Math.floor(start)));
  return `https://www.youtube-nocookie.com/embed/${id}?${q.toString()}`;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function VideoPlayerModal({ video, onClose, sidePanel }: { video: Video; onClose: () => void; sidePanel?: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [mounted, setMounted] = useState(false);
  const [api, setApi] = useState<Api>('loading');
  const [startAt, setStartAt] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  const [timeStr, setTimeStr] = useState('');
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState('');

  const selMoments = useMemo(() => (s: AppState) => s.videoMoments?.[video.id], [video.id]);
  const moments = useStore(selMoments) ?? EMPTY;

  // Odak tuzağı, Esc, gövde kaydırmasını kilitleme, odağı geri verme
  useEffect(() => {
    setMounted(true);
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = panelRef.current;
      if (!root) return;
      const f = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((x) => x.offsetParent !== null && x.tagName !== 'IFRAME');
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      const a = document.activeElement;
      if (!root.contains(a)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (mounted) closeRef.current?.focus();
  }, [mounted]);

  // Oynatıcı: iframe bu etkide elle kurulur (YouTube API iframe'i kendisi söker; React'in ağacıyla çakışmasın)
  useEffect(() => {
    const holder = holderRef.current;
    if (!mounted || !holder) return;
    let cancelled = false;
    const iframe = document.createElement('iframe');
    iframe.src = embedSrc(video.id, startAt);
    iframe.title = video.title;
    iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    holder.appendChild(iframe);
    setApi(navigator.onLine === false ? 'offline' : 'loading');
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(iframe, {
          events: {
            onReady: () => { if (!cancelled) setApi('ready'); },
            onError: (e) => { if (!cancelled) setApi(ytErrorKind(e.data) === 'embed-off' ? 'embed-off' : ytErrorKind(e.data) === 'missing' ? 'missing' : 'other'); },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setApi((a) => (a === 'loading' ? (navigator.onLine === false ? 'offline' : 'noapi') : a));
      });
    return () => {
      cancelled = true;
      const p = playerRef.current;
      playerRef.current = null;
      try { p?.destroy(); } catch { /* iframe zaten kaldırılmış olabilir */ }
      iframe.remove();
      setNow(null);
    };
  }, [mounted, video.id, video.title, startAt]);

  // Çevrimdışı/çevrimiçi değişimi
  useEffect(() => {
    const off = () => setApi((a) => (a === 'ready' ? a : 'offline'));
    const on = () => setApi((a) => (a === 'offline' ? 'noapi' : a));
    window.addEventListener('offline', off);
    window.addEventListener('online', on);
    return () => {
      window.removeEventListener('offline', off);
      window.removeEventListener('online', on);
    };
  }, []);

  // Oynatıcının o anki süresi (yalnızca hazırken)
  useEffect(() => {
    if (api !== 'ready') return;
    const read = () => {
      try { setNow(Math.floor(playerRef.current?.getCurrentTime() ?? 0)); } catch { /* oynatıcı kapanıyor */ }
    };
    read();
    const iv = window.setInterval(read, 500);
    return () => window.clearInterval(iv);
  }, [api]);

  const seek = (t: number) => {
    const p = playerRef.current;
    if (api === 'ready' && p) {
      try { p.seekTo(t, true); p.playVideo(); return; } catch { /* aşağıdaki yedeğe düş */ }
    }
    setStartAt(t); // oynatıcı API'si yoksa videoyu o saniyeden yeniden başlat
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const note = text.replace(/\s+/g, ' ').trim();
    if (!note) { setErr('Önce notunu yaz.'); setSaved(''); return; }
    let t: number | null = null;
    if (timeStr.trim()) {
      t = parseTime(timeStr);
      if (t === null) { setErr('Süreyi 1:25 ya da 85 gibi yaz.'); setSaved(''); return; }
    } else if (api === 'ready' && playerRef.current) {
      try { t = Math.floor(playerRef.current.getCurrentTime()); } catch { t = null; }
    }
    if (t === null) { setErr('Oynatıcıdan süre alınamadı; süreyi elle yaz (ör. 1:25).'); setSaved(''); return; }
    addVideoMoment(video.id, t, note);
    setText('');
    setTimeStr('');
    setErr('');
    setSaved(`Not eklendi: ${fmtTime(t)}`);
  };

  const remove = (m: VideoMoment) => {
    removeVideoMoment(video.id, m);
    setSaved('Not silindi.');
  };

  if (!mounted) return null;
  const hard = HARD.includes(api) ? (api as 'offline' | 'embed-off' | 'missing' | 'other') : null;
  const badges = videoBadges(video);
  const titleId = `vmodal-title-${video.id}`;

  return createPortal(
    <div className="vmodal" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`vmodal__panel ${sidePanel ? 'vmodal__panel--split' : ''}`} id="vmodal-panel" ref={panelRef}>
        <div className="vmodal__head">
          <p className="eyebrow">{VIDEO_TOPIC_NAME[video.topic]}</p>
          <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label="Videoyu kapat"><Icon name="close" /></button>
        </div>

        <div className="vmodal__main">
          <div className="vmodal__stage">
            <div className="vmodal__frame">
              <div className="vmodal__holder" ref={holderRef} />
              {hard && (
                <div className="vmodal__fail" role="alert">
                  <VideoCover topic={video.topic} className="vmodal__fail-cover" />
                  <div className="vmodal__fail-box">
                    <p className="h3">{FAIL_TEXT[hard].title}</p>
                    <p>{FAIL_TEXT[hard].body}</p>
                    <a className="btn btn--primary" href={watchUrl(video.id)} target="_blank" rel="noopener noreferrer">YouTube’da aç <Icon name="external" /></a>
                  </div>
                </div>
              )}
            </div>
            {api === 'noapi' && (
              <p className="note note--warn vmodal__banner" role="status">
                <Icon name="warn" />
                <span>
                  Oynatıcı bağlantısı kurulamadı (çevrimdışı, içerik engelleyici ya da YouTube erişimi kapalı olabilir). Süre otomatik alınamaz; notlara süreyi elle yazarak ekleyebilirsin. Video açılmıyorsa{' '}
                  <a href={watchUrl(video.id)} target="_blank" rel="noopener noreferrer">YouTube’da aç</a>.
                </span>
              </p>
            )}
          </div>

          <div className="vmodal__body">
            <h2 className="h3" id={titleId}>{video.title}</h2>
            <p className="vmodal__by">
              <a href={video.authorUrl} target="_blank" rel="noopener noreferrer">{video.author}</a>
              <span aria-hidden="true">·</span>
              <a className="vmodal__yt" href={watchUrl(video.id)} target="_blank" rel="noopener noreferrer">YouTube’da aç <Icon name="external" /></a>
            </p>

            <ul className="vbadges" aria-label="Video bilgileri">
              {badges.map((b) => (
                <li key={b.id} className={`vbadge vbadge--${b.tone}`} title={b.hint}>
                  <span>{b.label}</span>
                </li>
              ))}
            </ul>
            {badges.filter((b) => b.hint && b.id === 'sub').map((b) => <p key={b.id} className="field__hint">{b.hint}</p>)}

            <div className="vmodal__sum">
              <p className="eyebrow">Türkçe özet</p>
              <p>{video.summary}</p>
              <p className="field__hint">Bu özet video başlığı ve konusuna dayanarak bu site için yazılmıştır; videonun çevirisi ya da tam dökümü değildir. Zaman damgası içermez.</p>
            </div>
            {video.note && <p className="note note--warn"><Icon name="warn" /><span>{video.note}</span></p>}

            {video.related.length > 0 && (
              <div className="vmodal__rel">
                <p className="eyebrow">İlgili teknikler</p>
                <ul className="chips">
                  {video.related.map((r) => (
                    <li key={r.id}><Link className="chip" href={`/teknikler/${r.id}/`}>{r.name}</Link></li>
                  ))}
                </ul>
              </div>
            )}

            <section className="vmoments" aria-labelledby={`${titleId}-n`}>
              <p className="eyebrow" id={`${titleId}-n`}>Kişisel notların</p>
              <p className="field__hint">
                {api === 'ready'
                  ? `Oynatıcı hazır · şu an ${fmtTime(now ?? 0)}. Süreyi boş bırakırsan not bu ana eklenir.`
                  : 'Oynatıcıdan süre alınamıyorsa süreyi elle yaz (ör. 1:25). Notlar yalnızca bu tarayıcıda saklanır ve yedeğe girer; video sahibinin bölümleri değildir.'}
              </p>
              <form className="vmoments__form" onSubmit={submit}>
                <div className="vmoments__time">
                  <input
                    className="input mono"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={api === 'ready' ? fmtTime(now ?? 0) : '0:00'}
                    value={timeStr}
                    onChange={(e) => { setTimeStr(e.target.value); setErr(''); }}
                    aria-label="Süre (dk:sn)"
                    maxLength={9}
                  />
                </div>
                <div className="vmoments__text">
                  <input
                    className="input"
                    autoComplete="off"
                    placeholder="Bu anda neye bakacağını yaz…"
                    value={text}
                    onChange={(e) => { setText(e.target.value); setErr(''); }}
                    aria-label="Not"
                    maxLength={MAX_MOMENT_TEXT}
                  />
                </div>
                <button type="submit" className="btn btn--primary vmoments__add">Bu ana not ekle</button>
              </form>
              <p className="vmoments__msg" role="status" aria-live="polite">{err ? <span className="vmoments__err">{err}</span> : saved}</p>
              {moments.length > 0 ? (
                <ul className="vmoments__list" aria-label="Kayıtlı notların">
                  {moments.map((m, i) => (
                    <li key={`${m.at}-${m.t}-${i}`} className="vmoment">
                      <button type="button" className="vmoment__go" onClick={() => seek(m.t)} aria-label={`${fmtTime(m.t)} anına git: ${m.text}`}>
                        <span className="mono vmoment__t">{fmtTime(m.t)}</span>
                        <span className="vmoment__x">{m.text}</span>
                      </button>
                      <button type="button" className="icon-btn vmoment__del" onClick={() => remove(m)} aria-label={`Notu sil: ${m.text}`}><Icon name="trash" /></button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="field__hint">Henüz notun yok. İzlerken önemli bir anı yakalayınca buraya ekle; sonra tek dokunuşla o ana dönersin.</p>
              )}
            </section>
          </div>
        </div>

        {sidePanel && <aside className="vmodal__side" aria-label="Ek bilgi">{sidePanel}</aside>}
      </div>
    </div>,
    document.body,
  );
}

const EMPTY: VideoMoment[] = [];
