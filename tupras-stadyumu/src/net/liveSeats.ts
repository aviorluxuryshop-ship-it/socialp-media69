/**
 * Live seat sales shared by every visitor.
 *
 *   · claim(seat) sells a seat once and only once: the first buyer wins, a
 *     second buyer of the same seat (even at the same instant) is told it is
 *     taken;
 *   · onSold(fn) reports every seat sold by anyone, as it happens.
 *
 * Transports:
 *   · Firebase Realtime Database over plain REST + Server-Sent Events (no SDK).
 *     First-buyer-wins is enforced by the database rules
 *     (".write": "!data.exists()"), so two buyers can never get the same seat.
 *     Enabled when a database URL is configured (VITE_SEAT_DB_URL at build
 *     time, or ?db=<url> for testing).
 *   · BroadcastChannel: other tabs of the same browser, instantly — always on,
 *     and the only channel while no database is configured.
 */

export type ClaimResult = 'ok' | 'taken' | 'offline';
type SoldListener = (seats: number[], byOther: boolean) => void;

interface Msg {
  sold: number[];
  from: string;
}

const KEY = /^s(\d{1,6})$/;

function configuredUrl(): string | null {
  const q = new URLSearchParams(location.search).get('db');
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_SEAT_DB_URL;
  const url = (q || env || '').trim().replace(/\/+$/, '');
  return /^https:\/\/[a-z0-9.-]+\.(firebaseio\.com|firebasedatabase\.app)$/i.test(url) ? url : null;
}

export class LiveSeats {
  /** seats sold live (by anyone, this visitor included) */
  readonly sold = new Set<number>();
  /** true while the shared database stream is open */
  online = false;
  readonly shared: boolean;
  private readonly url: string | null;
  private readonly id = Math.random().toString(36).slice(2);
  private readonly mine = new Set<number>();
  private readonly listeners: SoldListener[] = [];
  private readonly statusListeners: ((online: boolean) => void)[] = [];
  private readonly channel: BroadcastChannel | null;
  private retry = 1000;

  constructor(maxSeat: number) {
    this.url = configuredUrl();
    this.shared = this.url !== null;
    this.channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('tupras-stadyumu-seats') : null;
    this.channel?.addEventListener('message', (e: MessageEvent<Msg>) => {
      if (!e.data || e.data.from === this.id || !Array.isArray(e.data.sold)) return;
      this.apply(e.data.sold.filter((s) => Number.isInteger(s) && s >= 0 && s < maxSeat), true);
    });
    if (this.url) this.connect(maxSeat);
  }

  onSold(fn: SoldListener): void {
    this.listeners.push(fn);
  }

  onStatus(fn: (online: boolean) => void): void {
    this.statusListeners.push(fn);
  }

  /** Sell a seat. Resolves 'taken' if somebody else got it first. */
  async claim(seat: number): Promise<ClaimResult> {
    if (this.sold.has(seat) && !this.mine.has(seat)) return 'taken';
    if (this.url) {
      try {
        const r = await fetch(`${this.url}/sales/s${seat}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ t: { '.sv': 'timestamp' } }),
        });
        // the rules refuse a write to a seat that already exists
        if (r.status === 401 || r.status === 403) {
          this.apply([seat], true);
          return 'taken';
        }
        if (!r.ok) return 'offline';
      } catch {
        return 'offline';
      }
    }
    this.mine.add(seat);
    this.apply([seat], false);
    this.channel?.postMessage({ sold: [seat], from: this.id } satisfies Msg);
    return 'ok';
  }

  private apply(seats: number[], byOther: boolean): void {
    const fresh = seats.filter((s) => !this.sold.has(s));
    if (!fresh.length) return;
    for (const s of fresh) this.sold.add(s);
    // a seat this visitor bought coming back on the stream is not someone else's sale
    const others = byOther ? fresh.filter((s) => !this.mine.has(s)) : [];
    if (byOther && !others.length) return;
    for (const l of this.listeners) l(byOther ? others : fresh, byOther);
  }

  private setOnline(on: boolean): void {
    if (this.online === on) return;
    this.online = on;
    for (const l of this.statusListeners) l(on);
  }

  private connect(maxSeat: number): void {
    const parse = (data: unknown): number[] => {
      const out: number[] = [];
      if (!data || typeof data !== 'object') return out;
      for (const k of Object.keys(data as object)) {
        const m = KEY.exec(k);
        if (m && (data as Record<string, unknown>)[k] !== null) {
          const s = Number(m[1]);
          if (s < maxSeat) out.push(s);
        }
      }
      return out;
    };
    const es = new EventSource(`${this.url}/sales.json`);
    const onData = (e: MessageEvent<string>) => {
      let msg: { path?: string; data?: unknown };
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      const path = msg.path ?? '/';
      if (path === '/') this.apply(parse(msg.data), true);
      else {
        const k = path.replace(/^\//, '').split('/')[0];
        if (msg.data !== null) this.apply(parse({ [k]: true }), true);
      }
    };
    es.addEventListener('put', onData as EventListener);
    es.addEventListener('patch', onData as EventListener);
    es.addEventListener('open', () => {
      this.retry = 1000;
      this.setOnline(true);
    });
    es.addEventListener('error', () => {
      this.setOnline(false);
      if (es.readyState === EventSource.CLOSED) {
        setTimeout(() => this.connect(maxSeat), this.retry);
        this.retry = Math.min(this.retry * 2, 30000);
      }
    });
    // Firebase asks a stream to re-authenticate / close with these events
    es.addEventListener('cancel', () => es.close());
    es.addEventListener('auth_revoked', () => es.close());
  }
}
