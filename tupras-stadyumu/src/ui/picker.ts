/**
 * STEP 05 — Pick your seat, get the ticket.
 *
 * Flow: intro → stand (Batı/Doğu/Kuzey/Güney, VIP, Loca) → block → row →
 * seat. Every step flies the camera to its frame (stand frame, block frame,
 * the seat itself), the selected block is highlighted in post, sold seats are
 * grey, and at the seat the real view is captured for the ticket.
 */
import type { App } from '../app.ts';
import { STANDS, type StandId } from '../stadium/config.ts';
import type { Block } from '../stadium/layout.ts';
import { blockFrame, standFrame } from '../camera/clips.ts';
import type { PickResult } from '../selection/idpass.ts';
import { availability, blockTitle, categoryName, escapeHtml, price, standName, tierName } from './format.ts';
import { showTicket, ticketFor } from './ticket.ts';

type Step = 'intro' | 'stand' | 'block' | 'row' | 'seat';
type StandChoice = StandId | 'VIP' | 'LOCA';

const STAND_ORDER: StandId[] = ['BATI', 'DOGU', 'KUZEY', 'GUNEY'];

export class SeatPicker {
  step: Step = 'intro';
  stand: StandChoice | null = null;
  block: Block | null = null;
  row: number | null = null;
  seat: number | null = null;
  private seatView: string | null = null;
  private readonly purchased = new Set<number>();
  private readonly app: App;
  private readonly panel: HTMLElement;
  private readonly body: HTMLElement;
  private readonly foot: HTMLElement;
  private readonly intro: HTMLElement;
  private readonly tip: HTMLElement;
  private pointer = { x: 0, y: 0 };

  constructor(app: App) {
    this.app = app;
    // ---- intro card
    this.intro = document.createElement('section');
    this.intro.className = 'intro';
    this.intro.innerHTML = `
      <div class="eyebrow">Tüpraş Stadyumu · Dolmabahçe</div>
      <h1>Koltuğunu seç,<br/>sahayı oradan gör.</h1>
      <p>Tribünü, bloğu, sırayı ve koltuğu seçin; kamera sizi o koltuğa götürsün. Biletinizde koltuğunuzun gerçek görüşü yer alır.</p>
      <div class="intro-actions">
        <button class="btn primary" type="button" data-act="start">Koltuk Seç</button>
        <button class="btn ghost" type="button" data-act="explore">Stadyumu Gez</button>
      </div>`;
    document.body.appendChild(this.intro);
    this.intro.querySelector('[data-act="start"]')!.addEventListener('click', () => this.go('stand'));
    this.intro.querySelector('[data-act="explore"]')!.addEventListener('click', () => this.intro.classList.add('hidden'));

    // ---- panel
    this.panel = document.createElement('aside');
    this.panel.className = 'picker hidden';
    this.panel.setAttribute('aria-label', 'Koltuk seçimi');
    this.panel.innerHTML = `
      <div class="picker-head">
        <button class="icon-btn" type="button" data-act="back" aria-label="Geri">‹</button>
        <ol class="steps">
          <li data-s="stand">Tribün</li><li data-s="block">Blok</li><li data-s="row">Sıra</li><li data-s="seat">Koltuk</li>
        </ol>
        <button class="icon-btn" type="button" data-act="close" aria-label="Kapat">×</button>
      </div>
      <div class="picker-body"></div>
      <div class="picker-foot"></div>`;
    document.body.appendChild(this.panel);
    this.body = this.panel.querySelector('.picker-body')!;
    this.foot = this.panel.querySelector('.picker-foot')!;
    this.panel.querySelector('[data-act="back"]')!.addEventListener('click', () => this.back());
    this.panel.querySelector('[data-act="close"]')!.addEventListener('click', () => this.go('intro'));

    // ---- hover tooltip
    this.tip = document.createElement('div');
    this.tip.className = 'seat-tip hidden';
    document.body.appendChild(this.tip);
    app.engine.canvas.addEventListener('pointermove', (e) => (this.pointer = { x: e.clientX, y: e.clientY }));
    app.selection.onHover((p) => this.onHover(p));
    app.selection.onClick((p) => this.onPick(p));
    app.director.onChange((mode) => {
      if (mode === 'locked' && this.step === 'seat' && this.seat !== null) this.arrivedAtSeat();
    });
  }

  // ------------------------------------------------------------------ navigation

  private get L() {
    return this.app.stadium.layout;
  }

  private blocksOf(stand: StandChoice): Block[] {
    const all = this.L.blocks;
    if (stand === 'VIP') return all.filter((b) => b.kind === 'vip');
    if (stand === 'LOCA') return all.filter((b) => b.tier === 'suite');
    return all.filter((b) => b.stand === stand && b.tier !== 'suite');
  }

  /** The block that frames a stand best: lower tier, closest to the stand's middle. */
  private standAnchor(stand: StandChoice): Block {
    const bs = this.blocksOf(stand);
    if (stand === 'VIP' || stand === 'LOCA') return stand === 'LOCA' ? this.L.blocks.find((b) => b.code === 'L074')! : bs[0];
    const mid: Record<StandId, number> = { GUNEY: 0, BATI: Math.PI / 2, KUZEY: Math.PI, DOGU: (3 * Math.PI) / 2 };
    const lower = bs.filter((b) => b.tier === 'lower');
    const ang = (b: Block) => Math.abs(((b.tc - mid[stand as StandId]) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
    return lower.sort((a, b) => ang(a) - ang(b))[0];
  }

  go(step: Step): void {
    const app = this.app;
    const sel = app.selection;
    this.step = step;
    document.body.classList.toggle('picking', step !== 'intro');
    this.intro.classList.toggle('hidden', step !== 'intro');
    this.panel.classList.toggle('hidden', step === 'intro');
    this.panel.dataset.step = step;
    for (const li of this.panel.querySelectorAll<HTMLElement>('.steps li')) {
      const order = ['stand', 'block', 'row', 'seat'];
      li.classList.toggle('done', order.indexOf(li.dataset.s!) < order.indexOf(step));
      li.classList.toggle('now', li.dataset.s === step);
    }
    sel.hoverEnabled = step !== 'intro';
    sel.setAvailability(step === 'row' || step === 'seat');
    if (step !== 'seat') app.director.seatLook(false);
    if (step === 'intro') {
      this.stand = this.block = null;
      this.row = this.seat = null;
      sel.selectBlock(-1);
      sel.selectSeat(-1);
      sel.state.row = -1;
      sel.setHoverSet([]);
      this.hideTip();
      const top = app.views.find((v) => v.id === 'ustten')!;
      app.flyToView(top);
      return;
    }
    if (step === 'stand') {
      this.block = null;
      this.row = this.seat = null;
      sel.selectBlock(-1);
      sel.selectSeat(-1);
      sel.state.row = -1;
    }
    if (step === 'block') {
      this.row = this.seat = null;
      sel.selectBlock(-1);
      sel.selectSeat(-1);
      sel.state.row = -1;
    }
    if (step === 'row') {
      this.seat = null;
      sel.selectSeat(-1);
    }
    this.render();
  }

  back(): void {
    if (this.step === 'seat') this.chooseBlock(this.block!, true);
    else if (this.step === 'row') {
      if (this.stand === 'VIP') this.go('stand');
      else this.chooseStand(this.stand!);
    } else if (this.step === 'block') this.go('stand');
    else this.go('intro');
  }

  chooseStand(stand: StandChoice): void {
    this.stand = stand;
    this.app.selection.setHoverSet([]);
    if (stand === 'VIP') {
      this.chooseBlock(this.blocksOf('VIP')[0]);
      return;
    }
    const anchor = this.standAnchor(stand);
    this.app.flyToFrame(standFrame(this.L, anchor), anchor);
    this.go('block');
  }

  chooseBlock(b: Block, keepStand = false): void {
    if (!keepStand || !this.stand) this.stand = b.kind === 'vip' ? 'VIP' : b.tier === 'suite' ? 'LOCA' : b.stand;
    this.block = b;
    this.app.selection.setHoverSet([]);
    this.app.selection.selectBlock(b.index);
    this.app.flyToFrame(blockFrame(this.L, b), b);
    this.go('row');
  }

  chooseRow(row: number): void {
    this.row = row;
    this.app.selection.state.row = row;
    this.render();
  }

  chooseSeat(seat: number): void {
    const S = this.L.seats;
    const b = this.L.blocks[S.block[seat]];
    if (!this.block || this.block.index !== b.index) {
      this.block = b;
      this.stand = b.kind === 'vip' ? 'VIP' : b.tier === 'suite' ? 'LOCA' : b.stand;
      this.app.selection.selectBlock(b.index);
    }
    this.row = S.row[seat];
    this.seat = seat;
    this.seatView = null;
    this.app.selection.state.row = -1;
    this.app.selection.selectSeat(seat);
    this.app.director.seatLook(false);
    this.app.flyToSeat(seat);
    this.go('seat');
  }

  private arrivedAtSeat(): void {
    // let streaming and LOD settle for two frames, then capture the real view for the ticket
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (this.step !== 'seat' || this.seat === null) return;
        this.seatView = this.app.captureView();
        this.app.director.seatLook(true);
        this.render();
      }),
    );
  }

  // ------------------------------------------------------------------ 3D input

  private onHover(p: PickResult): void {
    if (this.step === 'intro' || p.block < 0) {
      this.hideTip();
      return;
    }
    const b = this.L.blocks[p.block];
    if (b.kind === 'press') {
      this.showTip(`<b>Basın Tribünü</b><span>Satışa kapalı</span>`);
      return;
    }
    if ((this.step === 'row' || this.step === 'seat') && p.seat >= 0) {
      const S = this.L.seats;
      const sold = S.sold[p.seat] !== 0;
      this.showTip(
        `<b>${escapeHtml(blockTitle(b))} · Sıra ${S.row[p.seat]} · Koltuk ${S.num[p.seat]}</b>` +
          (sold ? `<span class="sold">Satıldı</span>` : `<span>${price(this.app.seatPrice(p.seat))} · ${escapeHtml(categoryName(S.category[p.seat]))}</span>`),
      );
      return;
    }
    const a = availability(this.L, b);
    this.showTip(`<b>${escapeHtml(blockTitle(b))}</b><span>${escapeHtml(standName(b))} · ${escapeHtml(tierName(b))} · ${a.free} müsait</span>`);
  }

  private onPick(p: PickResult): void {
    if (this.step === 'intro' || p.block < 0) return;
    if (this.app.director.mode === 'flying') return;
    const b = this.L.blocks[p.block];
    if (b.kind === 'press') return;
    if ((this.step === 'row' || this.step === 'seat') && p.seat >= 0 && this.block && p.block === this.block.index) {
      if (this.L.seats.sold[p.seat] === 0) this.chooseSeat(p.seat);
      return;
    }
    this.chooseBlock(b);
  }

  private showTip(html: string): void {
    this.tip.innerHTML = html;
    this.tip.classList.remove('hidden');
    const x = Math.min(window.innerWidth - 240, this.pointer.x + 16);
    const y = Math.max(8, this.pointer.y - 52);
    this.tip.style.transform = `translate(${x}px, ${y}px)`;
  }

  private hideTip(): void {
    this.tip.classList.add('hidden');
  }

  // ------------------------------------------------------------------ rendering

  private render(): void {
    const L = this.L;
    const S = L.seats;
    let html = '';
    let foot = '';
    if (this.step === 'stand') {
      const minPrice = (bs: Block[]) => Math.min(...bs.map((b) => this.app.seatPrice(b.seatStart)).filter((v) => v > 0));
      const card = (key: StandChoice, title: string, note: string, bs: Block[]) => {
        const free = bs.reduce((s, b) => s + availability(L, b).free, 0);
        return `<button class="stand-card" type="button" data-stand="${key}">
          <span class="stand-name">${escapeHtml(title)}</span>
          <span class="stand-note">${escapeHtml(note)}</span>
          <span class="stand-meta">${key === 'LOCA' ? bs.length + ' loca' : bs.length + ' blok'} · ${free.toLocaleString('tr-TR')} müsait · ${price(minPrice(bs))}’den</span>
        </button>`;
      };
      html = `<h2>Tribün seçin</h2><div class="stand-grid">${STAND_ORDER.map((k) => card(k, STANDS[k].name, STANDS[k].note, this.blocksOf(k))).join('')}</div>
        <h3>Ayrıcalıklı alanlar</h3>
        <div class="stand-grid two">${card('VIP', 'VIP Tribün', 'Batı Alt · deri koltuk · protokol', this.blocksOf('VIP'))}${card('LOCA', 'Localar · Skybox', '147 loca · 12 kişilik · balkonlu', this.blocksOf('LOCA'))}</div>`;
      foot = `<p class="foot-hint">Stadyumda bir bloğa dokunarak da seçebilirsiniz.</p>`;
    } else if (this.step === 'block' && this.stand) {
      const bs = this.blocksOf(this.stand);
      const chip = (b: Block) => {
        const a = availability(L, b);
        const dis = b.kind === 'press';
        return `<button class="block-chip${dis ? ' off' : ''}" type="button" data-block="${b.index}" ${dis ? 'disabled' : ''}>
          <span class="bc-code">${escapeHtml(b.kind === 'suite' ? String(Number(b.code.slice(1))) : b.kind === 'press' ? 'BASIN' : b.code)}</span>
          <span class="bc-free">${dis ? 'kapalı' : a.free}</span></button>`;
      };
      if (this.stand === 'LOCA') {
        html = `<h2>Localar</h2><p class="sub">147 loca, katlar arasında kesintisiz bant. Bir loca seçin.</p>`;
        for (const k of STAND_ORDER) {
          const group = bs.filter((b) => b.stand === k);
          html += `<h3>${escapeHtml(STANDS[k].name)}</h3><div class="chips suites">${group.map(chip).join('')}</div>`;
        }
      } else {
        const st = STANDS[this.stand as StandId];
        html = `<h2>${escapeHtml(st.name)}</h2><p class="sub">${escapeHtml(st.note)}</p>`;
        const upper = bs.filter((b) => b.tier === 'upper');
        const lower = bs.filter((b) => b.tier === 'lower');
        html += `<h3>Üst Kat</h3><div class="chips">${upper.map(chip).join('')}</div>`;
        html += `<h3>Alt Kat</h3><div class="chips">${lower.map(chip).join('')}</div>`;
      }
      foot = `<p class="foot-hint">Rakam: müsait koltuk sayısı. Üzerine gelince blok stadyumda vurgulanır.</p>`;
    } else if (this.step === 'row' && this.block) {
      const b = this.block;
      const a = availability(L, b);
      const cat = S.category[b.seatStart];
      html = `<div class="block-head">
          <h2>${escapeHtml(blockTitle(b))}</h2>
          <div class="sub">${escapeHtml(standName(b))} · ${escapeHtml(tierName(b))} · ${escapeHtml(categoryName(cat))}</div>
          <div class="kpis"><span><b>${price(this.app.seatPrice(b.seatStart))}</b> koltuk başı</span><span><b>${a.free}</b> / ${a.total} müsait</span></div>
        </div>`;
      html += `<h3>Sıra seçin</h3><div class="rows">`;
      for (let r = b.rows; r >= 1; r--) {
        const ra = availability(L, b, r);
        const pct = ra.total ? (ra.free / ra.total) * 100 : 0;
        html += `<button class="row-btn${this.row === r ? ' on' : ''}" type="button" data-row="${r}" ${ra.free === 0 ? 'disabled' : ''}>
          <span class="rb-n">Sıra ${r}</span><span class="rb-bar"><i style="width:${pct.toFixed(0)}%"></i></span><span class="rb-f">${ra.free}</span></button>`;
      }
      html += `</div>`;
      if (this.row) {
        const r = this.row;
        html += `<h3>Sıra ${r} · koltuk seçin</h3><div class="seat-chips">`;
        for (let i = b.rowStart[r - 1]; i < b.rowStart[r]; i++) {
          const sold = S.sold[i] !== 0;
          html += `<button class="seat-chip${sold ? ' sold' : ''}" type="button" data-seat="${i}" ${sold ? 'disabled aria-label="Satıldı"' : ''}>${S.num[i]}</button>`;
        }
        html += `</div>`;
      }
      foot = `<p class="foot-hint">Gri koltuklar satılmıştır. Stadyumda bir koltuğa dokunarak da seçebilirsiniz.</p>`;
    } else if (this.step === 'seat' && this.seat !== null) {
      const i = this.seat;
      const b = L.blocks[S.block[i]];
      const sold = S.sold[i] !== 0;
      const mine = this.purchased.has(i);
      const flying = this.app.director.mode === 'flying';
      html = `<h2>${flying ? 'Koltuğunuza gidiliyor…' : 'Koltuğunuzdan görünüm'}</h2>
        <dl class="seat-dl">
          <div><dt>Tribün</dt><dd>${escapeHtml(standName(b))}</dd></div>
          <div><dt>Blok</dt><dd>${escapeHtml(blockTitle(b))}</dd></div>
          <div><dt>Sıra</dt><dd>${S.row[i]}</dd></div>
          <div><dt>Koltuk</dt><dd>${S.num[i]}</dd></div>
          <div><dt>Fiyat</dt><dd>${price(this.app.seatPrice(i))}</dd></div>
          <div><dt>Durum</dt><dd class="${mine ? 'ok' : sold ? 'sold' : 'free'}">${mine ? 'Onaylandı' : sold ? 'Satıldı' : 'Müsait'}</dd></div>
        </dl>
        <p class="sub">${flying ? '' : 'Ekranı sürükleyerek koltuktan etrafa bakabilirsiniz.'}</p>
        <div class="seat-nav">
          <button class="btn ghost" type="button" data-act="prev">‹ Sol koltuk</button>
          <button class="btn ghost" type="button" data-act="next">Sağ koltuk ›</button>
        </div>`;
      foot = `<button class="btn primary wide" type="button" data-act="ticket" ${this.seatView ? '' : 'disabled'}>${this.seatView ? 'Dijital Bileti Görüntüle' : 'Görüş hazırlanıyor…'}</button>
        <button class="btn ghost wide" type="button" data-act="change">Koltuğu değiştir</button>`;
    }
    this.body.innerHTML = html;
    this.foot.innerHTML = foot;
    this.bind();
  }

  private bind(): void {
    const sel = this.app.selection;
    for (const el of this.body.querySelectorAll<HTMLElement>('[data-stand]')) {
      const k = el.dataset.stand as StandChoice;
      el.addEventListener('click', () => this.chooseStand(k));
      el.addEventListener('pointerenter', () => sel.setHoverSet(this.blocksOf(k).map((b) => b.index)));
      el.addEventListener('pointerleave', () => sel.setHoverSet([]));
    }
    for (const el of this.body.querySelectorAll<HTMLElement>('[data-block]')) {
      const b = this.L.blocks[Number(el.dataset.block)];
      el.addEventListener('click', () => this.chooseBlock(b));
      el.addEventListener('pointerenter', () => sel.setHoverSet([b.index]));
      el.addEventListener('pointerleave', () => sel.setHoverSet([]));
    }
    for (const el of this.body.querySelectorAll<HTMLElement>('[data-row]')) {
      const r = Number(el.dataset.row);
      el.addEventListener('click', () => this.chooseRow(r));
      el.addEventListener('pointerenter', () => (sel.state.row = r));
      el.addEventListener('pointerleave', () => (sel.state.row = this.row ?? -1));
    }
    for (const el of this.body.querySelectorAll<HTMLElement>('[data-seat]')) {
      const i = Number(el.dataset.seat);
      el.addEventListener('click', () => this.chooseSeat(i));
      el.addEventListener('pointerenter', () => (sel.state.hoverSeat = i));
      el.addEventListener('pointerleave', () => (sel.state.hoverSeat = -1));
    }
    this.panel.querySelector('[data-act="ticket"]')?.addEventListener('click', () => this.openTicket());
    this.panel.querySelector('[data-act="change"]')?.addEventListener('click', () => this.back());
    this.panel.querySelector('[data-act="prev"]')?.addEventListener('click', () => this.neighbour(-1));
    this.panel.querySelector('[data-act="next"]')?.addEventListener('click', () => this.neighbour(1));
  }

  /** Next free seat to the spectator's left (−1) or right (+1) in the same row. */
  private neighbour(dir: -1 | 1): void {
    if (this.seat === null || !this.block) return;
    const S = this.L.seats;
    const b = this.block;
    const r = S.row[this.seat];
    const a = b.rowStart[r - 1];
    const e = b.rowStart[r];
    // seat numbers increase left → right and seat indices run in numbering order
    for (let i = this.seat + dir; i >= a && i < e; i += dir) {
      if (S.sold[i] === 0) {
        this.chooseSeat(i);
        return;
      }
    }
  }

  private openTicket(): void {
    if (this.seat === null || !this.seatView) return;
    const i = this.seat;
    const S = this.L.seats;
    const canBuy = S.sold[i] === 0 && !this.purchased.has(i);
    const t = ticketFor(this.app, i, this.seatView, this.purchased.has(i));
    showTicket(
      t,
      canBuy
        ? () => {
            S.sold[i] = 1;
            this.purchased.add(i);
            this.app.selection.refreshSold();
            showTicket(ticketFor(this.app, i, this.seatView!, true), null);
            this.render();
          }
        : null,
    );
  }

  /** Re-render when a flight ends or starts so the seat panel shows the right state. */
  refresh(): void {
    if (this.step === 'seat') this.render();
  }
}

export function mountPicker(app: App): SeatPicker {
  const p = new SeatPicker(app);
  app.director.onChange(() => p.refresh());
  return p;
}
