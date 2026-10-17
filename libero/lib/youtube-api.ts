/**
 * YouTube IFrame Player API — resmî betik, YALNIZCA bir video penceresi açıldığında yüklenir.
 * Amaç: oynatıcının o anki süresini okumak (kişisel not) ve notlara atlamak.
 * Betik yüklenemezse (çevrimdışı, engelleyici…) söz reddedilir; arayüz bunu dürüstçe söyler.
 */

export interface YTPlayer {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  destroy(): void;
}

export interface YTNamespace {
  Player: new (
    el: HTMLIFrameElement,
    opts: { events?: { onReady?: () => void; onError?: (e: { data: number }) => void } },
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const SRC = 'https://www.youtube.com/iframe_api';
let pending: Promise<YTNamespace> | null = null;

export function loadYouTubeApi(timeoutMs = 9000): Promise<YTNamespace> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (pending) return pending;
  pending = new Promise<YTNamespace>((resolve, reject) => {
    let done = false;
    const finish = (err?: Error) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      if (err) {
        pending = null; // sonraki açılışta yeniden denenir
        document.getElementById('yt-iframe-api')?.remove();
        reject(err);
      } else if (window.YT?.Player) resolve(window.YT);
      else {
        pending = null;
        reject(new Error('YT yok'));
      }
    };
    const timer = window.setTimeout(() => finish(new Error('zaman aşımı')), timeoutMs);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try {
        prev?.();
      } catch {
        /* önceki dinleyicinin hatası bizi etkilemesin */
      }
      finish();
    };
    const s = document.createElement('script');
    s.id = 'yt-iframe-api';
    s.src = SRC;
    s.async = true;
    s.onerror = () => finish(new Error('betik yüklenemedi'));
    document.head.appendChild(s);
  });
  return pending;
}

/** YT hata kodları: 2 geçersiz, 5 oynatıcı hatası, 100 yok/özel, 101/150 sahibi gömmeye kapalı */
export function ytErrorKind(code: number): 'embed-off' | 'missing' | 'other' {
  if (code === 101 || code === 150) return 'embed-off';
  if (code === 100) return 'missing';
  return 'other';
}
