/**
 * Digital ticket: the seat's real view (captured from the 3D scene at the
 * seat), the seat data, and a PNG export drawn on a canvas.
 */
import type { App } from '../app.ts';
import { nearestGate } from '../stadium/facade.ts';
import { blockTitle, categoryName, escapeHtml, price, standName, tierName } from './format.ts';

export interface TicketData {
  seat: number;
  stand: string;
  tier: string;
  block: string;
  row: number;
  number: number;
  price: number;
  category: string;
  gate: number;
  status: 'Müsait' | 'Satıldı' | 'Onaylandı' | 'Basın';
  code: string;
  view: string; // data URL
}

export function ticketFor(app: App, seat: number, view: string, confirmed: boolean): TicketData {
  const L = app.stadium.layout;
  const S = L.seats;
  const b = L.blocks[S.block[seat]];
  const cat = S.category[seat];
  const sold = S.sold[seat];
  const code = `BJK-${(b.code + '').replace(/\W/g, '')}-${String(S.row[seat]).padStart(2, '0')}${String(S.num[seat]).padStart(2, '0')}-${(seat * 2654435761 >>> 0).toString(36).slice(-5).toUpperCase()}`;
  return {
    seat,
    stand: standName(b),
    tier: tierName(b),
    block: blockTitle(b),
    row: S.row[seat],
    number: S.num[seat],
    price: Number(app.seatPrice(seat)),
    category: categoryName(cat),
    gate: nearestGate(L, b.tc % (Math.PI * 2)),
    status: confirmed ? 'Onaylandı' : sold === 2 ? 'Basın' : sold === 1 ? 'Satıldı' : 'Müsait',
    code,
    view,
  };
}

/** Deterministic barcode bars from the ticket code (visual only). */
function bars(code: string): number[] {
  const out: number[] = [];
  let h = 2166136261;
  for (const ch of code) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
    for (let k = 0; k < 6; k++) out.push(1 + ((h >>> (k * 4)) & 3));
  }
  return out;
}

export function showTicket(t: TicketData, onConfirm: (() => void) | null): void {
  document.querySelector('.ticket-overlay')?.remove();
  const o = document.createElement('div');
  o.className = 'ticket-overlay';
  o.setAttribute('role', 'dialog');
  o.setAttribute('aria-modal', 'true');
  o.setAttribute('aria-label', 'Dijital bilet');
  const barSvg = (() => {
    let x = 0;
    const rects: string[] = [];
    bars(t.code).forEach((w, i) => {
      if (i % 2 === 0) rects.push(`<rect x="${x}" y="0" width="${w}" height="40"/>`);
      x += w;
    });
    return `<svg viewBox="0 0 ${x} 40" preserveAspectRatio="none" aria-hidden="true">${rects.join('')}</svg>`;
  })();
  const statusClass = t.status === 'Onaylandı' ? 'ok' : t.status === 'Müsait' ? 'free' : 'sold';
  o.innerHTML = `
    <article class="ticket">
      <header class="ticket-head">
        <img src="./brand/bjk-logo.svg" alt="" width="30" height="50" />
        <div>
          <div class="ticket-club">BEŞİKTAŞ JK</div>
          <div class="ticket-venue">TÜPRAŞ STADYUMU</div>
        </div>
        <button class="ticket-close" type="button" aria-label="Kapat">×</button>
      </header>
      <figure class="ticket-view">
        <img src="${t.view}" alt="Koltuktan sahanın görünüşü" />
        <figcaption>Koltuğunuzdan görünüm</figcaption>
      </figure>
      <dl class="ticket-grid">
        <div><dt>Tribün</dt><dd>${escapeHtml(t.stand)}</dd></div>
        <div><dt>Blok</dt><dd>${escapeHtml(t.block)}</dd></div>
        <div><dt>Sıra</dt><dd>${t.row}</dd></div>
        <div><dt>Koltuk</dt><dd>${t.number}</dd></div>
        <div><dt>Fiyat</dt><dd>${price(t.price)}</dd></div>
        <div><dt>Durum</dt><dd class="st ${statusClass}">${t.status}</dd></div>
        <div><dt>Kat</dt><dd>${escapeHtml(t.tier)}</dd></div>
        <div><dt>Kategori</dt><dd>${escapeHtml(t.category)}</dd></div>
        <div><dt>Giriş</dt><dd>Kapı ${t.gate}</dd></div>
      </dl>
      <div class="ticket-stub">
        <div class="ticket-bars">${barSvg}</div>
        <div class="ticket-code">${escapeHtml(t.code)}</div>
      </div>
      <p class="ticket-note">Sunum amaçlı örnek bilettir; fiyatlar temsilidir.</p>
      <div class="ticket-actions">
        ${onConfirm ? '<button class="btn primary" data-act="confirm" type="button">Bileti Al</button>' : ''}
        <button class="btn" data-act="png" type="button">PNG olarak indir</button>
      </div>
    </article>`;
  document.body.appendChild(o);
  const close = () => o.remove();
  o.addEventListener('click', (e) => {
    if (e.target === o) close();
  });
  o.querySelector('.ticket-close')!.addEventListener('click', close);
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', esc);
    }
  });
  o.querySelector('[data-act="png"]')!.addEventListener('click', () => downloadPng(t));
  o.querySelector('[data-act="confirm"]')?.addEventListener('click', () => {
    onConfirm?.();
  });
  (o.querySelector('.ticket-close') as HTMLElement).focus();
}

async function downloadPng(t: TicketData): Promise<void> {
  const W = 900;
  const H = 1380;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const load = (src: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });
  const [crest, view] = await Promise.all([load('./brand/bjk-logo.svg'), load(t.view)]);
  g.fillStyle = '#f5f5f2';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#0a0a0b';
  g.fillRect(0, 0, W, 170);
  g.drawImage(crest, 48, 30, 66, 110);
  g.fillStyle = '#ffffff';
  g.font = '700 54px "Barlow Condensed", sans-serif';
  g.fillText('BEŞİKTAŞ JK', 140, 92);
  g.font = '500 26px "Barlow Condensed", sans-serif';
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.fillText('T Ü P R A Ş   S T A D Y U M U', 142, 132);
  // view, cover-fit 16:9
  const vw = W - 96;
  const vh = Math.round((vw * 9) / 16);
  const s = Math.max(vw / view.width, vh / view.height);
  const sw = vw / s;
  const sh = vh / s;
  g.drawImage(view, (view.width - sw) / 2, (view.height - sh) / 2, sw, sh, 48, 210, vw, vh);
  const fields: [string, string][] = [
    ['TRİBÜN', t.stand],
    ['BLOK', t.block],
    ['SIRA', String(t.row)],
    ['KOLTUK', String(t.number)],
    ['FİYAT', price(t.price)],
    ['DURUM', t.status],
    ['KAT', t.tier],
    ['KATEGORİ', t.category],
    ['GİRİŞ', `Kapı ${t.gate}`],
  ];
  const top = 210 + vh + 50;
  fields.forEach(([k, v], i) => {
    const x = 48 + (i % 3) * ((W - 96) / 3);
    const y = top + Math.floor(i / 3) * 110;
    g.fillStyle = '#6b6b6b';
    g.font = '600 20px Inter, sans-serif';
    g.fillText(k, x, y);
    g.fillStyle = '#0a0a0b';
    g.font = '700 40px "Barlow Condensed", sans-serif';
    g.fillText(v, x, y + 46);
  });
  // perforation + barcode
  const by = top + 3 * 110 + 20;
  g.strokeStyle = '#c8c8c4';
  g.setLineDash([8, 8]);
  g.beginPath();
  g.moveTo(32, by);
  g.lineTo(W - 32, by);
  g.stroke();
  g.setLineDash([]);
  let x = 48;
  const b = bars(t.code);
  const scale = (W - 96) / b.reduce((a, v) => a + v, 0);
  g.fillStyle = '#0a0a0b';
  b.forEach((w, i) => {
    if (i % 2 === 0) g.fillRect(x, by + 40, w * scale, 110);
    x += w * scale;
  });
  g.font = '600 24px Inter, sans-serif';
  g.fillText(t.code, 48, by + 190);
  g.fillStyle = '#8a8a8a';
  g.font = '400 18px Inter, sans-serif';
  g.fillText('Sunum amaçlı örnek bilettir; fiyatlar temsilidir.', 48, by + 226);
  const a = document.createElement('a');
  a.download = `${t.code}.png`;
  a.href = c.toDataURL('image/png');
  a.click();
}
