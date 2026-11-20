/**
 * STEP 05 — Pick your seat, see the view, get the ticket.
 *
 * Flow: one button ("Koltuk Seç") → the camera drops into the bowl and turns
 * slowly; labels on the stands name the regions (Doğu Alt, Kuzey Üst, VIP,
 * Localar…) → choosing a region flies in front of it, sold seats grey → a tap
 * on a seat flies to that seat: the real view, with region, block, row, seat
 * number and price beside it → the digital ticket.
 */
import type { App } from '../app.ts';
import { Vector3 } from 'three';
import type { Block } from '../stadium/layout.ts';
import { insideFrame, PICKER_MAX, regionFrame, type KeyFrame } from '../camera/clips.ts';
import type { PickResult } from '../selection/idpass.ts';
import { blockTitle, categoryName, escapeHtml, price } from './format.ts';
import { buildRegions, nearestFreeSeat, regionOfBlock, regionStats, type Region } from './regions.ts';
import { showTicket, ticketFor } from './ticket.ts';

type Step = 'intro' | 'regions' | 'region' | 'seat';


const STEP_ORDER: Step[] = ['regions', 'region', 'seat'];

export class SeatPicker {
  step: Step = 'intro';
  region: Region | null = null;
  seat: number | null = null;
  readonly regions: Region[];
  private seatView: string | null = null;
  private notice = '';
  private readonly purchased = new Set<number>();
  private readonly stats = new Map<string, { free: number; total: number; from: number }>();
  private readonly app: App;
  private readonly panel: HTMLElement;
  private readonly body: HTMLElement;
  private readonly foot: HTMLElement;
  private readonly intro: HTMLElement;
  private readonly tip: HTMLElement;
  private readonly labels: HTMLElement;
  private readonly labelEls = new Map<string, HTMLButtonElement>();
  private pointer = { x: 0, y: 0 };
  private area = { x: 0, y: 0, w: 0, h: 0 };
  /** the user has turned the view themselves: no more automatic turning */
  private turnedByUser = false;
  private hoverRegion: Region | null = null;
  private readonly tmp = new Vector3();

  constructor(app: App) {
    this.app = app;
    this.regions = buildRegions(app.stadium.layout);

    // ---- intro card: a single action
    this.intro = document.createElement('section');
    this.intro.className = 'intro';
    this.intro.innerHTML = `
      <div class="eyebrow">Tüpraş Stadyumu · Dolmabahçe</div>
      <h1>Koltuğunu seç,<br/>sahayı oradan gör.</h1>
      <p>Stadın içine girin, bölgenizi seçin, koltuğunuza dokunun. Sahayı o koltuktan görün; sıra, koltuk numarası ve fiyatı hemen yanında.</p>
      <div class="intro-actions">
        <button class="btn primary" type="button" data-act="start">Koltuk Seç</button>
      </div>`;
    document.body.appendChild(this.intro);
    // opened straight into a view (shared link, screenshots): start without the card
    if (app.params.has('view')) this.intro.classList.add('hidden');
    this.intro.querySelector('[data-act="start"]')!.addEventListener('click', () => this.start());

    // ---- region labels on the stands
    this.labels = document.createElement('div');
    this.labels.className = 'region-labels';
    for (const r of this.regions) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'region-label off';
      el.dataset.region = r.id;
      el.innerHTML = `<b>${escapeHtml(r.name)}</b><span></span>`;
      el.addEventListener('click', () => this.chooseRegion(r));
      el.addEventListener('pointerenter', () => this.setHoverRegion(r, true));
      el.addEventListener('pointerleave', () => this.setHoverRegion(null, true));
      this.labels.appendChild(el);
      this.labelEls.set(r.id, el);
    }
    document.body.appendChild(this.labels);

    // ---- panel
    this.panel = document.createElement('aside');
    this.panel.className = 'picker hidden';
    this.panel.setAttribute('aria-label', 'Koltuk seçimi');
    this.panel.innerHTML = `
      <div class="picker-head">
        <button class="icon-btn" type="button" data-act="back" aria-label="Geri">‹</button>
        <ol class="steps">
          <li data-s="regions">Bölge</li><li data-s="region">Koltuk</li><li data-s="seat">Görüş</li>
        </ol>
        <button class="icon-btn" type="button" data-act="close" aria-label="Kapat">×</button>
      </div>
      <div class="picker-body"></div>
      <div class="picker-foot"></div>`;
    document.body.appendChild(this.panel);
    // frame the 3D view in the screen area the panel leaves free
    new ResizeObserver(() => this.updateLensShift()).observe(this.panel);
    window.addEventListener('resize', () => this.updateLensShift());
    this.body = this.panel.querySelector('.picker-body')!;
    this.foot = this.panel.querySelector('.picker-foot')!;
    this.panel.querySelector('[data-act="back"]')!.addEventListener('click', () => this.back());
    this.panel.querySelector('[data-act="close"]')!.addEventListener('click', () => this.close());

    // ---- hover tooltip
    this.tip = document.createElement('div');
    this.tip.className = 'seat-tip hidden';
    document.body.appendChild(this.tip);
    app.engine.canvas.addEventListener('pointermove', (e) => (this.pointer = { x: e.clientX, y: e.clientY }));
    app.selection.onHover((p) => this.onHover(p));
    app.selection.onClick((p) => this.onPick(p));
    app.director.controls.addEventListener('start', () => {
      if (this.step === 'intro') return;
      this.turnedByUser = true;
      this.setAutoTurn(false);
    });
    app.director.onChange((mode) => this.onDirector(mode));
    app.onFrame(() => this.updateLabels());
  }

  // ------------------------------------------------------------------ helpers

  private get L() {
    return this.app.stadium.layout;
  }

  private get portrait(): boolean {
    return this.app.engine.camera.aspect < 1;
  }

  private statsOf(r: Region) {
    let s = this.stats.get(r.id);
    if (!s) {
      s = regionStats(this.L, r, (i) => this.app.seatPrice(i));
      this.stats.set(r.id, s);
    }
    return s;
  }

  private regionOfSeat(seat: number): Region | null {
    return regionOfBlock(this.regions, this.L.seats.block[seat]);
  }

  /** Free screen area next to / above the panel (CSS px). */
  private freeArea(): { x: number; y: number; w: number; h: number } {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const top = 64; // top bar
    if (this.panel.classList.contains('hidden')) return { x: 0, y: top, w: W, h: H - top };
    const r = this.panel.getBoundingClientRect();
    const sheet = r.width > W * 0.8; // phone bottom sheet
    if (sheet) return { x: 0, y: top, w: W, h: Math.max(80, r.top - top) };
    return { x: 0, y: top, w: Math.max(200, r.left - 12), h: H - top - 24 };
  }

  private updateLensShift(): void {
    this.area = this.freeArea();
    if (this.step === 'intro') {
      this.app.engine.setLensShift(0, 0);
      return;
    }
    const a = this.area;
    this.app.engine.setLensShift(window.innerWidth / 2 - (a.x + a.w / 2), window.innerHeight / 2 - (a.y + a.h / 2));
  }

  private setAutoTurn(on: boolean): void {
    const c = this.app.director.controls;
    c.autoRotate = on;
    c.autoRotateSpeed = 0.7; // ≈ 4° per second
  }

  // ------------------------------------------------------------------ navigation

  private go(step: Step): void {
    const app = this.app;
    const sel = app.selection;
    this.step = step;
    document.body.classList.toggle('picking', step !== 'intro');
    this.intro.classList.toggle('hidden', step !== 'intro');
    this.panel.classList.toggle('hidden', step === 'intro');
    this.panel.dataset.step = step;
    this.labels.classList.remove('show');
    this.updateLensShift();
    for (const li of this.panel.querySelectorAll<HTMLElement>('.steps li')) {
      li.classList.toggle('done', STEP_ORDER.indexOf(li.dataset.s as Step) < STEP_ORDER.indexOf(step));
      li.classList.toggle('now', li.dataset.s === step);
    }
    // at the seat the view stays clean: no hover tint over the stand around you
    sel.hoverEnabled = step === 'regions' || step === 'region';
    // sold seats grey while choosing; at the seat the stand looks like match day
    sel.setAvailability(step === 'region');
    sel.selectBlock(-1);
    sel.state.row = -1;
    if (step !== 'seat') {
      this.seat = null;
      sel.selectSeat(-1);
    }
    this.setHoverRegion(null, false);
    this.hideTip();
    app.director.seatLook(false);
    this.setAutoTurn(false);
    this.render();
  }

  /** "Koltuk Seç": into the stadium. */
  start(): void {
    this.region = null;
    this.go('regions');
    this.app.flyIn(insideFrame(this.portrait), undefined, PICKER_MAX.enter);
  }

  private toRegions(): void {
    this.region = null;
    this.go('regions');
    this.app.flyToFrame(insideFrame(this.portrait), null, undefined, PICKER_MAX.region);
  }

  chooseRegion(r: Region): void {
    const fromSeat = this.step === 'seat';
    this.region = r;
    this.notice = '';
    this.go('region');
    this.app.flyToFrame(regionFrame(this.L, r.frameBlock, r.kind, this.portrait), null, undefined, fromSeat ? PICKER_MAX.back : PICKER_MAX.region);
  }

  chooseSeat(seat: number, notice = ''): void {
    const sel = this.app.selection;
    this.region = this.regionOfSeat(seat) ?? this.region;
    this.seat = seat;
    this.seatView = null;
    this.notice = notice;
    this.go('seat');
    sel.selectSeat(seat);
    this.app.flyToSeat(seat, undefined, PICKER_MAX.seat);
  }

  back(): void {
    if (this.step === 'seat' && this.region) this.chooseRegion(this.region);
    else if (this.step === 'region') this.toRegions();
    else this.close();
  }

  close(): void {
    this.region = null;
    this.go('intro');
    const app = this.app;
    const home = app.startPose;
    if (home) app.flyOut({ position: home.position.clone(), target: home.target.clone(), fov: home.fov, label: 'Dışarı' } as KeyFrame, undefined, PICKER_MAX.exit);
    else app.flyToView(app.views.find((v) => v.id === 'ustten')!);
  }

  private onDirector(mode: string): void {
    this.labels.classList.toggle('show', mode !== 'flying' && this.step === 'regions');
    if (mode !== 'locked') {
      if (this.step === 'seat') this.render();
      return;
    }
    if (this.step === 'seat' && this.seat !== null) this.arrivedAtSeat();
    else if (this.step === 'regions' || this.step === 'region') {
      // look around from here: drag turns the view in place
      this.app.director.seatLook(true);
      if (this.step === 'regions' && !this.turnedByUser) this.setAutoTurn(true);
    }
  }

  private arrivedAtSeat(): void {
    const seat = this.seat;
    this.app.director.seatLook(true);
    this.render();
    // let streaming and LOD settle for two frames, then capture the real view for the ticket
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (this.step !== 'seat' || this.seat !== seat) return;
        this.app.captureView().then((url) => {
          if (this.step !== 'seat' || this.seat !== seat) return;
          this.seatView = url;
          this.render();
        });
      }),
    );
  }

  // ------------------------------------------------------------------ 3D input

  private setHoverRegion(r: Region | null, fromList: boolean): void {
    if (this.hoverRegion === r) return;
    this.hoverRegion = r;
    this.app.selection.setHoverSet(r ? r.blocks.map((b) => b.index) : []);
    for (const [id, el] of this.labelEls) el.classList.toggle('on', id === r?.id);
    for (const el of this.body.querySelectorAll<HTMLElement>('[data-region]')) el.classList.toggle('on', el.dataset.region === r?.id);
    if (fromList && r) this.setAutoTurn(false);
  }

  private onHover(p: PickResult): void {
    if (this.step === 'intro' || p.block < 0) {
      if (this.step === 'regions') this.setHoverRegion(null, false);
      this.hideTip();
      return;
    }
    const b = this.L.blocks[p.block];
    if (b.kind === 'press') {
      this.setHoverRegion(null, false);
      this.showTip(`<b>Basın Tribünü</b><span>Satışa kapalı</span>`);
      return;
    }
    if (this.step === 'regions') {
      const r = regionOfBlock(this.regions, p.block);
      this.setHoverRegion(r, false);
      if (!r) return this.hideTip();
      const s = this.statsOf(r);
      this.showTip(`<b>${escapeHtml(r.name)}</b><span>${escapeHtml(r.note)} · ${price(s.from)}’den · ${s.free.toLocaleString('tr-TR')} boş</span>`);
      return;
    }
    if (p.seat >= 0) {
      const S = this.L.seats;
      const sold = S.sold[p.seat] !== 0 && !this.purchased.has(p.seat);
      const r = this.regionOfSeat(p.seat);
      this.showTip(
        `<b>${escapeHtml(r?.name ?? '')} · ${escapeHtml(blockTitle(b))} · Sıra ${S.row[p.seat]} · Koltuk ${S.num[p.seat]}</b>` +
          (sold ? `<span class="sold">Satıldı</span>` : `<span>${price(this.app.seatPrice(p.seat))} · ${escapeHtml(categoryName(S.category[p.seat]))}</span>`),
      );
      return;
    }
    this.showTip(`<b>${escapeHtml(blockTitle(b))}</b><span>Bir koltuğa dokunun</span>`);
  }

  private onPick(p: PickResult): void {
    if (this.step === 'intro' || p.block < 0) return;
    if (this.app.director.mode === 'flying') return;
    const b = this.L.blocks[p.block];
    if (b.kind === 'press') return;
    if (this.step === 'regions') {
      const r = regionOfBlock(this.regions, p.block);
      if (r) this.chooseRegion(r);
      return;
    }
    const S = this.L.seats;
    if (this.step === 'seat') {
      // at a seat: another free seat of the same region
      if (p.seat >= 0 && S.sold[p.seat] === 0 && this.regionOfSeat(p.seat) === this.region && p.seat !== this.seat) this.chooseSeat(p.seat);
      return;
    }
    // region step: the seat under the finger, or the closest free one
    if (p.seat >= 0 && S.sold[p.seat] === 0) {
      this.chooseSeat(p.seat);
      return;
    }
    const alt = nearestFreeSeat(this.L, b, p.seat);
    if (alt >= 0) this.chooseSeat(alt, p.seat >= 0 ? 'Dokunduğunuz koltuk satılmış; en yakın boş koltuğu seçtik.' : '');
  }

  private showTip(html: string): void {
    this.tip.innerHTML = html;
    this.tip.classList.remove('hidden');
    const w = this.tip.offsetWidth || 240;
    const x = Math.max(8, Math.min(window.innerWidth - w - 8, this.pointer.x + 16));
    const y = Math.max(8, this.pointer.y - 52);
    this.tip.style.transform = `translate(${x}px, ${y}px)`;
  }

  private hideTip(): void {
    this.tip.classList.add('hidden');
  }

  /** Region labels follow the stands on screen (only in the regions step). */
  private updateLabels(): void {
    if (this.step !== 'regions' || !this.labels.classList.contains('show')) return;
    const cam = this.app.engine.camera;
    cam.updateMatrixWorld();
    const W = window.innerWidth;
    const H = window.innerHeight;
    const a = this.area;
    for (const r of this.regions) {
      const el = this.labelEls.get(r.id)!;
      // behind the camera? (tested in camera space: with a reversed depth
      // buffer the projected z of a point behind the eye still looks valid)
      const ahead = this.tmp.copy(r.labelAt).applyMatrix4(cam.matrixWorldInverse).z < -cam.near;
      const v = this.tmp.copy(r.labelAt).project(cam);
      const x = (v.x * 0.5 + 0.5) * W;
      const y = (-v.y * 0.5 + 0.5) * H;
      const vis = ahead && x > a.x + 24 && x < a.x + a.w - 24 && y > a.y + 16 && y < a.y + a.h - 16;
      el.classList.toggle('off', !vis);
      if (vis) el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    }
  }

  // ------------------------------------------------------------------ rendering

  private blockLabel(b: Block): string {
    if (b.kind === 'suite') return b.label;
    if (b.kind === 'vip') return 'VIP';
    return b.code;
  }

  private render(): void {
    const L = this.L;
    const S = L.seats;
    let html = '';
    let foot = '';
    if (this.step === 'regions') {
      for (const r of this.regions) {
        const s = this.statsOf(r);
        this.labelEls.get(r.id)!.querySelector('span')!.textContent = `${price(s.from)}’den`;
      }
      const card = (r: Region) => {
        const s = this.statsOf(r);
        const full = s.free === 0;
        return `<button class="region-card${full ? ' off' : ''}" type="button" data-region="${r.id}" ${full ? 'disabled' : ''}>
          <span class="rc-name">${escapeHtml(r.name)}</span>
          <span class="rc-note">${escapeHtml(r.note)}</span>
          <span class="rc-meta">${full ? 'Tükendi' : `${price(s.from)}’den · ${s.free.toLocaleString('tr-TR')} boş`}</span>
        </button>`;
      };
      html = `<h2>Bölge seçin</h2>
        <p class="sub">Stadın içindesiniz. Sürükleyerek etrafa bakın; stadyumda ya da listede bir bölgeye dokunun.</p>
        <div class="region-grid">${this.regions.map(card).join('')}</div>`;
    } else if (this.step === 'region' && this.region) {
      const r = this.region;
      const s = this.statsOf(r);
      const cats = [...new Set(r.blocks.map((b) => S.category[b.seatStart]))].map((c) => categoryName(c)).join(' · ');
      html = `<div class="block-head">
          <div class="eyebrow">Bölge</div>
          <h2>${escapeHtml(r.name)}</h2>
          <div class="sub">${escapeHtml(r.note)} · ${escapeHtml(cats)}</div>
          <div class="kpis"><span><b>${price(s.from)}</b>’den</span><span><b>${s.free.toLocaleString('tr-TR')}</b> boş koltuk</span></div>
        </div>
        <ol class="howto">
          <li>Stadyumda bir koltuğa dokunun.</li>
          <li>Kamera sizi o koltuğa götürür.</li>
          <li>Sahayı oradan görün; sıra, koltuk ve fiyat yanında.</li>
        </ol>
        <div class="legend"><span><i class="lg free"></i>Boş</span><span><i class="lg sold"></i>Satıldı</span></div>`;
      foot = `<p class="foot-hint"><b>Bir koltuğa dokunun.</b> Sürükleyerek bölgede sağa sola bakabilirsiniz.</p>`;
    } else if (this.step === 'seat' && this.seat !== null) {
      const i = this.seat;
      const b = L.blocks[S.block[i]];
      const r = this.region;
      const mine = this.purchased.has(i);
      const flying = this.app.director.mode === 'flying';
      html = `<div class="seat-head">
          <div class="eyebrow">${flying ? 'Koltuğunuza gidiliyor…' : mine ? 'Bu koltuk sizin · onaylandı' : 'Koltuğunuzdan görünüm'}</div>
        </div>
        ${this.notice ? `<p class="notice">${escapeHtml(this.notice)}</p>` : ''}
        <dl class="seat-dl">
          <div><dt>Bölge</dt><dd>${escapeHtml(r?.name ?? '')}</dd></div>
          <div><dt>${b.kind === 'suite' ? 'Loca' : 'Blok'}</dt><dd>${escapeHtml(this.blockLabel(b))}</dd></div>
          <div><dt>Sıra</dt><dd>${S.row[i]}</dd></div>
          <div><dt>Koltuk</dt><dd>${S.num[i]}</dd></div>
          <div><dt>Kategori</dt><dd class="small">${escapeHtml(categoryName(S.category[i]))}</dd></div>
          <div class="price"><dt>Fiyat</dt><dd>${price(this.app.seatPrice(i))}</dd></div>
        </dl>
        <div class="seat-nav">
          <button class="btn ghost" type="button" data-act="prev">‹ Sol koltuk</button>
          <button class="btn ghost" type="button" data-act="next">Sağ koltuk ›</button>
        </div>`;
      foot = `<button class="btn primary wide" type="button" data-act="ticket" ${this.seatView ? '' : 'disabled'}>${this.seatView ? (mine ? 'Bileti Görüntüle' : 'Bileti Gör') : 'Görüş hazırlanıyor…'}</button>
        <button class="btn ghost wide" type="button" data-act="change">Başka koltuk seç</button>`;
    }
    this.body.innerHTML = html;
    this.foot.innerHTML = foot;
    this.bind();
  }

  private bind(): void {
    for (const el of this.body.querySelectorAll<HTMLElement>('[data-region]')) {
      const r = this.regions.find((x) => x.id === el.dataset.region)!;
      el.addEventListener('click', () => this.chooseRegion(r));
      el.addEventListener('pointerenter', () => this.setHoverRegion(r, true));
      el.addEventListener('pointerleave', () => this.setHoverRegion(null, true));
    }
    this.panel.querySelector('[data-act="ticket"]')?.addEventListener('click', () => this.openTicket());
    this.panel.querySelector('[data-act="change"]')?.addEventListener('click', () => this.back());
    this.panel.querySelector('[data-act="prev"]')?.addEventListener('click', () => this.neighbour(-1));
    this.panel.querySelector('[data-act="next"]')?.addEventListener('click', () => this.neighbour(1));
  }

  /** Next free seat to the spectator's left (−1) or right (+1) in the same row. */
  private neighbour(dir: -1 | 1): void {
    if (this.seat === null) return;
    const S = this.L.seats;
    const b = this.L.blocks[S.block[this.seat]];
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
            this.stats.clear();
            this.app.selection.refreshSold();
            showTicket(ticketFor(this.app, i, this.seatView!, true), null);
            this.render();
          }
        : null,
    );
  }
}

export function mountPicker(app: App): SeatPicker {
  return new SeatPicker(app);
}
