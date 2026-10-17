/* ───────────────────────────────────────────────────────────
   Libero hareket sistemi — saf yardımcılar + küçük DOM çalışma zamanı.
   Animasyon kitaplığı yok: CSS (styles/motion.css) + IntersectionObserver + rAF.

   Kurallar
   • Yalnızca transform/opacity canlandırılır; kaydırma işleyicileri React durumu yazmaz.
   • İçerik ASLA görünmez kalmaz: gözlemci yoksa / çalışmıyorsa / hızlı kaydırmada
     zamanlayıcı ve kaydırma yedekleri her şeyi açar; hareket azaltma tercihinde hemen.
   • Saf fonksiyonlar (en üst bölüm) DOM'suz test edilir: scripts/logic-tests/design-motion.mjs
   ─────────────────────────────────────────────────────────── */

/* ── Saf yardımcılar ───────────────────────────────────── */

export const clamp = (x: number, a: number, b: number): number => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export function easeOutCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}
export function easeOutExpo(t: number): number {
  const x = clamp(t, 0, 1);
  return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

/** Sayaç değeri: t (0..1) anında from→to arası tamsayı (yumuşak biten). */
export function countValue(t: number, to: number, from = 0): number {
  return Math.round(lerp(from, to, easeOutCubic(t)));
}

/** "127" → 127; bozuk girişte null. */
export function parseCountTarget(v: string | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) && n >= 0 && n <= 1e9 ? Math.round(n) : null;
}

/** Sayıyı Türkçe biçimle yazar (1.234). Intl yoksa düz basar. */
export function formatCount(n: number): string {
  try {
    return new Intl.NumberFormat('tr-TR').format(n);
  } catch {
    return String(n);
  }
}

/** Aynı anda görünür olan n öğe için kademeli gecikmeler (ms): step aralıkla, en çok max adım. */
export function staggerDelays(n: number, stepMs = 70, maxSteps = 6): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(Math.min(i, maxSteps) * stepMs);
  return out;
}

/** Bir öğe artık "gösterilmeli" mi? (viewport altından belli bir pay içeride ya da tamamen yukarıda kaldıysa) */
export function shouldRevealNow(rect: { top: number; bottom: number }, vh: number, bottomMargin = 0.06): boolean {
  if (rect.bottom <= 0) return true; // üstte kaldı (hızlı kaydırma / sayfa yenileme)
  return rect.top < vh * (1 - bottomMargin);
}

export type BallMode = 'webgl' | 'svg';
export interface DeviceInfo {
  reducedMotion: boolean;
  webgl: boolean;
  coarsePointer: boolean;
  width: number;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  saveData?: boolean;
}
export interface BallPlan {
  mode: BallMode;
  /** false → tek sabit kare (hareket azaltma) */
  animate: boolean;
  texture: 'high' | 'low';
  reason: 'ok' | 'no-webgl' | 'low-power';
}

/** Hero topu için sahne planı: WebGL mi, SVG yedeği mi; doku kalitesi; animasyon var mı. */
export function chooseBallMode(d: DeviceInfo): BallPlan {
  const animate = !d.reducedMotion;
  if (!d.webgl) return { mode: 'svg', animate, texture: 'low', reason: 'no-webgl' };
  const lowPower =
    !!d.saveData ||
    (d.coarsePointer && d.width < 820) ||
    (d.deviceMemory !== undefined && d.deviceMemory <= 2) ||
    (d.hardwareConcurrency !== undefined && d.hardwareConcurrency <= 2);
  if (lowPower) return { mode: 'svg', animate, texture: 'low', reason: 'low-power' };
  const high =
    !d.coarsePointer &&
    d.width >= 1100 &&
    (d.deviceMemory === undefined || d.deviceMemory >= 4) &&
    (d.hardwareConcurrency === undefined || d.hardwareConcurrency >= 4);
  return { mode: 'webgl', animate, texture: high ? 'high' : 'low', reason: 'ok' };
}

/** Paralaks yalnızca ince imleçli, geniş ekranda ve hareket azaltma kapalıyken. */
export function parallaxEnabled(d: Pick<DeviceInfo, 'reducedMotion' | 'coarsePointer' | 'width'>): boolean {
  return !d.reducedMotion && !d.coarsePointer && d.width >= 1024;
}

/* ── DOM çalışma zamanı (yalnızca istemci) ─────────────── */

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export function prefersReducedMotion(): boolean {
  return isBrowser && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function readDevice(webgl: boolean): DeviceInfo {
  const nav = (isBrowser ? navigator : {}) as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return {
    reducedMotion: prefersReducedMotion(),
    webgl,
    coarsePointer: isBrowser && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches,
    width: isBrowser ? window.innerWidth : 1280,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    saveData: nav.connection?.saveData,
  };
}

/** WebGL gerçekten kullanılabilir mi? (bağlam açmayı dener ve hemen bırakır) */
export function hasWebGL(): boolean {
  if (!isBrowser) return false;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Sayacı canlandırır. Metin zaten son değerdir; yalnızca 0'dan oynatır. */
function runCount(el: HTMLElement): void {
  const to = parseCountTarget(el.dataset.count);
  if (to === null || el.dataset.counted === '1') return;
  el.dataset.counted = '1';
  const from = parseCountTarget(el.dataset.countFrom) ?? 0;
  const dur = 1300;
  const t0 = performance.now();
  const step = (now: number) => {
    const t = (now - t0) / dur;
    el.textContent = formatCount(countValue(t, to, from));
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = formatCount(to);
  };
  requestAnimationFrame(step);
}

/**
 * Görünür olma animasyonları: [data-reveal] öğeleri yaklaşınca .is-in alır; [data-count] sayaçları oynar.
 * Dönen işlev gözlemciyi ve dinleyicileri temizler.
 */
export function initReveal(root: ParentNode = document): () => void {
  if (!isBrowser) return () => {};
  const html = document.documentElement;
  const reveals = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)'));
  const counters = Array.from(root.querySelectorAll<HTMLElement>('[data-count]'));
  const reduced = prefersReducedMotion();

  const open = (el: HTMLElement, delayMs?: number) => {
    if (delayMs !== undefined && !el.dataset.delay) el.style.setProperty('--d', `${delayMs}ms`);
    el.classList.add('is-in');
    if (el.hasAttribute('data-count')) runCount(el);
  };

  // Hareket azaltma ya da gözlemci yok: her şey hemen açık, sayaçlar son değerde.
  if (reduced || typeof IntersectionObserver === 'undefined') {
    reveals.forEach((el) => el.classList.add('is-in'));
    return () => {};
  }

  // Elle verilen gecikme (data-delay="120")
  for (const el of reveals) if (el.dataset.delay) el.style.setProperty('--d', `${Number(el.dataset.delay) || 0}ms`);

  // Görünüm dışındaki sayaçlar 0'dan başlasın (kimse görmez); görünür olanlar hemen oynar
  const vh0 = window.innerHeight;
  for (const c of counters) {
    if (c.hasAttribute('data-reveal')) continue;
    if (c.getBoundingClientRect().top > vh0) {
      c.textContent = formatCount(parseCountTarget(c.dataset.countFrom) ?? 0);
    }
  }

  const pending = new Set<HTMLElement>([...reveals, ...counters.filter((c) => !c.classList.contains('is-in'))]);
  let ioFired = false;
  let raf = 0;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const finish = () => {
    if (pending.size === 0) teardownListeners();
  };

  const io = new IntersectionObserver(
    (entries) => {
      ioFired = true;
      const hit = entries
        .filter((e) => e.isIntersecting || e.boundingClientRect.bottom <= 0)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      const delays = staggerDelays(hit.length);
      hit.forEach((e, i) => {
        const el = e.target as HTMLElement;
        if (!pending.has(el)) return;
        pending.delete(el);
        io.unobserve(el);
        open(el, e.boundingClientRect.bottom <= 0 ? 0 : delays[i]);
      });
      finish();
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0 },
  );
  pending.forEach((el) => io.observe(el));

  // Yedek: gözlemci geç kalır ya da hiç ateşlenmezse konuma bakarak aç
  const sweep = (force = false) => {
    raf = 0;
    const vh = window.innerHeight;
    const batch: HTMLElement[] = [];
    pending.forEach((el) => {
      if (force || shouldRevealNow(el.getBoundingClientRect(), vh, 0.06)) batch.push(el);
    });
    const delays = staggerDelays(batch.length);
    batch.forEach((el, i) => {
      pending.delete(el);
      io.unobserve(el);
      open(el, force ? 0 : delays[i]);
    });
    finish();
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(() => sweep());
  };
  const onShow = () => sweep();
  const onVisible = () => {
    if (document.visibilityState === 'visible') sweep();
  };
  function teardownListeners() {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    window.removeEventListener('pageshow', onShow);
    document.removeEventListener('visibilitychange', onVisible);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('pageshow', onShow);
  document.addEventListener('visibilitychange', onVisible);

  timers.push(setTimeout(() => sweep(), 1200));
  timers.push(setTimeout(() => sweep(), 3200));
  // Gözlemci hiç çalışmadıysa: ne olursa olsun her şeyi aç
  timers.push(
    setTimeout(() => {
      if (!ioFired) sweep(true);
    }, 4200),
  );

  html.classList.add('motion-live');

  return () => {
    io.disconnect();
    if (raf) cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    teardownListeners();
  };
}

/**
 * Paralaks: [data-parallax] kapsayıcısının içindeki [data-depth="0.3"] katmanları imleç ve kaydırmayla
 * hafifçe kayar. Yalnızca transform; rAF ile sınırlı; boştayken döngü durur.
 */
export function initParallax(root: ParentNode = document): () => void {
  if (!isBrowser) return () => {};
  const scopes = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax]'));
  if (scopes.length === 0 || !parallaxEnabled(readDevice(false))) return () => {};

  const cleanups: (() => void)[] = [];
  for (const scope of scopes) {
    const layers = Array.from(scope.querySelectorAll<HTMLElement>('[data-depth]')).map((el) => ({
      el,
      depth: Number(el.dataset.depth) || 0,
      rot: Number(el.dataset.rot) || 0,
    }));
    if (layers.length === 0) continue;
    let visible = true;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let sy = 0;
    let raf = 0;
    const apply = () => {
      raf = 0;
      cx = lerp(cx, tx, 0.085);
      cy = lerp(cy, ty, 0.085);
      for (const l of layers) {
        const x = cx * l.depth * 26;
        const y = cy * l.depth * 18 + sy * l.depth * -0.12;
        l.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)${l.rot ? ` rotate(${(cx * l.rot).toFixed(2)}deg)` : ''}`;
      }
      if (visible && (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002)) raf = requestAnimationFrame(apply);
    };
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(apply);
    };
    const onMove = (e: PointerEvent) => {
      const r = scope.getBoundingClientRect();
      tx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
      ty = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      kick();
    };
    const onScroll = () => {
      sy = clamp(window.scrollY, 0, 1400);
      kick();
    };
    const io = new IntersectionObserver((es) => {
      visible = es.some((e) => e.isIntersecting);
      if (visible) kick();
    });
    io.observe(scope);
    scope.addEventListener('pointermove', onMove, { passive: true });
    scope.addEventListener('pointerleave', onLeave, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    cleanups.push(() => {
      io.disconnect();
      scope.removeEventListener('pointermove', onMove);
      scope.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      for (const l of layers) l.el.style.transform = '';
    });
  }
  return () => cleanups.forEach((c) => c());
}

let spotReady = false;
/** Kartlarda imleci izleyen ışık (--mx/--my). Bir kez kurulur; yalnızca üzerine gelinebilen cihazlarda. */
export function initCardSpot(): void {
  if (!isBrowser || spotReady) return;
  if (typeof window.matchMedia !== 'function' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  spotReady = true;
  let raf = 0;
  let last: PointerEvent | null = null;
  const apply = () => {
    raf = 0;
    const e = last;
    if (!e || !(e.target instanceof Element)) return;
    const card = e.target.closest<HTMLElement>('a.card, .card--hover, [data-spot]');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`);
    card.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`);
  };
  document.addEventListener(
    'pointermove',
    (e) => {
      last = e;
      if (!raf) raf = requestAnimationFrame(apply);
    },
    { passive: true },
  );
}
