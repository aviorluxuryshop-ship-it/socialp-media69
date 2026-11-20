/**
 * STEP 05 — Pick your seat, see the view, get the ticket.
 *
 * Flow: one button ("Koltuk Seç") → the camera drops into the bowl and turns
 * slowly; labels on the stands name the regions (Doğu Alt, Kuzey Üst, VIP,
 * Localar…) → choosing a region flies in front of it: free seats glow, sold
 * ones are dark → a tap on the stand zooms in until single seats are big
 * enough for a finger → a tap on a seat flies to that seat: the real view,
 * with region, block, row, seat number and price beside it → the ticket.
 *
 * The step chips (Bölge · Koltuk · Görüş) are the navigation: tap one to go
 * back to it. Seats sold by anyone show up live (net/liveSeats.ts).
 */
import type { App } from '../app.ts';
import { Vector3 } from 'three';
import type { Block } from '../stadium/layout.ts';
import { PITCH_ELEVATION } from '../stadium/config.ts';
import { insideFrame, PICKER_MAX, regionFrame, seatCloseFrame, type KeyFrame } from '../camera/clips.ts';
import type { PickResult } from '../selection/idpass.ts';
import { LiveSeats } from '../net/liveSeats.ts';
import { blockTitle, categoryName, escapeHtml, price } from './format.ts';
import { buildRegions, nearestFreeSeat, regionOfBlock, regionStats, type Region } from './regions.ts';
import { showTicket, ticketFor } from './ticket.ts';

type Step = 'intro' | 'regions' | 'region' | 'seat';

const STEP_ORDER: Step[] = ['regions', 'region', 'seat'];
/** a seat narrower than this on screen is zoomed in on first (CSS px) */
const TAP_SEAT_PX = 26;

export class SeatPicker {
  step: Step = 'intro';
  region: Region | null = null;
  seat: number | null = null;
  /** the region view is zoomed in on part of the stand */
  zoomed = false;
  readonly regions: Region[];
  readonly live: LiveSeats;
  /** last seat looked at (the "Görüş" chip returns to it) */
  private lastSeat: number | null = null;
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
  private readonly toast: HTMLElement;
  private readonly labels: HTMLElement;
  private readonly labelEls = new Map<string, HTMLButtonElement>();
  private pointer = { x: 0, y: 0 };
  private area = { x: 0, y: 0, w: 0, h: 0 };
  /** the user has turned the view themselves: no more automatic turning */
  private turnedByUser = false;
  private hoverRegion: Region | null = null;
  private readonly tmp = new Vector3();
  private toastTimer = 0;

  constructor(app: App) {
    this.app = app;
    this.regions = buildRegions(app.stadium.layout);

    // ---- intro: a single button
    this.intro = document.createElement('section');
    this.intro.className = 'intro';
    this.intro.innerHTML = `<button class="btn primary intro-btn" type="button" data-act="start">Koltuk Seç</button>`;
    document.body.appendChild(this.intro);
    // opened straight into a view (shared link, screenshots): start without the button
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

    // ---- panel: the step chips are the navigation
    this.panel = document.createElement('aside');
    this.panel.className = 'picker hidden';
    this.panel.setAttribute('aria-label', 'Koltuk seçimi');
    this.panel.innerHTML = `
      <div class="picker-head">
        <nav class="steps" aria-label="Adımlar">
          <button type="button" data-s="regions">Bölge</button><button type="button" data-s="region">Koltuk</button><button type="button" data-s="seat">Görüş</button>
        </nav>
        <span class="live-dot" title="Canlı satış"></span>
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
    for (const b of this.panel.querySelectorAll<HTMLButtonElement>('.steps button')) b.addEventListener('click', () => this.goStep(b.dataset.s as Step));
    this.panel.querySelector('[data-act="close"]')!.addEventListener('click', () => this.close());

    // ---- hover tooltip and live-sale toast
    this.tip = document.createElement('div');
    this.tip.className = 'seat-tip hidden';
    document.body.appendChild(this.tip);
    this.toast = document.createElement('div');
    this.toast.className = 'live-toast hidden';
    this.toast.setAttribute('role', 'status');
    document.body.appendChild(this.toast);

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
    this.bindZoomGestures();

    // ---- live sales
    this.live = new LiveSeats(app.stadium.layout.seats.count);
    this.live.onSold((seats, byOther) => this.onLiveSold(seats, byOther));
    this.live.onStatus((on) => this.panel.classList.toggle('live', on));
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

  private isFree(seat: number): boolean {
    return this.L.seats.sold[seat] === 0;
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

  /** Width of one seat on screen (CSS px) as seen from the current camera. */
  private seatPx(seat: number): number {
    const S = this.L.seats;
    const cam = this.app.engine.camera;
    const d = this.tmp.set(S.pos[seat * 3], S.pos[seat * 3 + 1] + PITCH_ELEVATION + 0.6, S.pos[seat * 3 + 2]).distanceTo(cam.position);
    return (window.innerHeight * 0.5) / (2 * d * Math.tan(((cam.fov / 2) * Math.PI) / 180));
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
    // at the seat the view stays clean: no hover tint over the stand around you
    sel.hoverEnabled = step === 'regions' || step === 'region';
    // only the seat under the pointer lights up while choosing a seat
    sel.hoverBlockTint = step === 'regions';
    // free seats glow while choosing; at the seat the stand looks like match day
    sel.setAvailability(step === 'regions' || step === 'region');
    sel.selectBlock(-1);
    sel.state.row = -1;
    if (step !== 'seat') {
      this.seat = null;
      sel.selectSeat(-1);
    }
    if (step !== 'region') this.zoomed = false;
    this.setHoverRegion(null, false);
    this.hideTip();
    app.director.seatLook(false);
    this.setAutoTurn(false);
    this.render();
  }

  /** A step chip: go back (or forward) to that step if it is reachable. */
  private goStep(s: Step): void {
    if (!this.canGo(s)) return;
    if (s === 'regions') this.toRegions();
    else if (s === 'region' && this.region) this.chooseRegion(this.region);
    else if (s === 'seat' && this.lastSeat !== null) this.chooseSeat(this.lastSeat);
  }

  private canGo(s: Step): boolean {
    if (this.app.director.mode === 'flying' && this.step === s) return false;
    if (s === 'regions') return this.step !== 'regions';
    if (s === 'region') return this.region !== null && (this.step === 'seat' || (this.step === 'region' && this.zoomed));
    // back to the last seat viewed, if it is still to be had
    return this.step !== 'seat' && this.lastSeat !== null && (this.isFree(this.lastSeat) || this.purchased.has(this.lastSeat));
  }

  private renderSteps(): void {
    for (const b of this.panel.querySelectorAll<HTMLButtonElement>('.steps button')) {
      const s = b.dataset.s as Step;
      const now = s === this.step;
      b.classList.toggle('now', now);
      b.classList.toggle('done', STEP_ORDER.indexOf(s) < STEP_ORDER.indexOf(this.step));
      const can = this.canGo(s);
      b.disabled = !can && !now;
      b.setAttribute('aria-current', now ? 'step' : 'false');
    }
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

  /** Zoom in on the stand around a seat until single seats are easy to tap. */
  private zoomTo(seat: number): void {
    this.zoomed = true;
    this.hideTip();
    this.app.director.seatLook(false);
    this.render();
    const f = seatCloseFrame(this.L, seat, window.innerHeight, this.portrait, this.portrait ? 44 : 40);
    this.app.flyToFrame(f, null, undefined, 1.6);
  }

  chooseSeat(seat: number, notice = ''): void {
    const sel = this.app.selection;
    this.region = this.regionOfSeat(seat) ?? this.region;
    this.seat = seat;
    this.lastSeat = seat;
    this.seatView = null;
    this.notice = notice;
    this.go('seat');
    sel.selectSeat(seat);
    this.app.flyToSeat(seat, undefined, PICKER_MAX.seat);
  }

  back(): void {
    if (this.step === 'seat' && this.region) this.chooseRegion(this.region);
    else if (this.step === 'region' && this.zoomed && this.region) this.chooseRegion(this.region);
    else if (this.step === 'region') this.toRegions();
    else this.close();
  }

  close(): void {
    this.region = null;
    document.querySelector('.ticket-overlay')?.remove();
    this.go('intro');
    const app = this.app;
    const home = app.startPose;
    if (home) app.flyOut({ position: home.position.clone(), target: home.target.clone(), fov: home.fov, label: 'Dışarı' } as KeyFrame, undefined, PICKER_MAX.exit);
    else app.flyToView(app.views.find((v) => v.id === 'ustten')!);
  }

  private onDirector(mode: string): void {
    this.labels.classList.toggle('show', mode !== 'flying' && this.step === 'regions');
    this.renderSteps();
    // the view moved: whatever was under the pointer is stale
    this.hideTip();
    this.app.selection.resetHover();
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

  // ------------------------------------------------------------------ zoom gestures

  /** Wheel and pinch change the lens (field of view) while looking around. */
  private bindZoomGestures(): void {
    const canvas = this.app.engine.canvas;
    const zoomBy = (k: number) => {
      const d = this.app.director;
      if (this.step === 'intro' || d.mode !== 'locked' || !d.seatMode) return;
      const cam = this.app.engine.camera;
      const fov = Math.min(72, Math.max(16, cam.fov * k));
      if (fov === cam.fov) return;
      cam.fov = fov;
      cam.updateProjectionMatrix();
      this.hideTip();
    };
    canvas.addEventListener(
      'wheel',
      (e) => {
        if (this.step === 'intro') return;
        e.preventDefault();
        zoomBy(Math.exp(e.deltaY * 0.0012));
      },
      { passive: false },
    );
    const touches = new Map<number, { x: number; y: number }>();
    let last = 0;
    const spread = () => {
      const [a, b] = [...touches.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) last = spread();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size !== 2) return;
      const s = spread();
      if (last > 0 && s > 0) zoomBy(last / s);
      last = s;
    });
    const up = (e: PointerEvent) => {
      touches.delete(e.pointerId);
      last = 0;
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
  }

  // ------------------------------------------------------------------ live sales

  private onLiveSold(seats: number[], byOther: boolean): void {
    const S = this.L.seats;
    for (const s of seats) S.sold[s] = 1;
    this.stats.clear();
    this.app.selection.refreshSold(seats);
    if (!byOther) return;
    // seats someone else just bought flash red, then stay dark
    const seatsSys = this.app.stadium.seats;
    for (const s of seats) seatsSys.setState(s, 'flash');
    window.setTimeout(() => {
      for (const s of seats) seatsSys.setState(s, 'normal');
    }, 1800);
    if (this.step === 'intro') return;
    // the seat this visitor is looking at is gone
    if (this.seat !== null && seats.includes(this.seat) && !this.purchased.has(this.seat)) {
      document.querySelector('.ticket-overlay')?.remove();
      this.notice = 'Bu koltuk az önce başka bir taraftar tarafından alındı. Başka bir koltuk seçin.';
      this.render();
    } else if (this.step !== 'seat') this.render();
    const near = seats.filter((s) => this.region !== null && this.regionOfSeat(s) === this.region);
    const s = near[0] ?? seats[0];
    const r = this.regionOfSeat(s);
    const more = seats.length > 1 ? ` (+${seats.length - 1})` : '';
    this.showToast(`<b>Az önce satıldı</b> ${escapeHtml(r?.name ?? '')} · Sıra ${S.row[s]} · Koltuk ${S.num[s]}${more}`);
  }

  private showToast(html: string): void {
    this.toast.innerHTML = html;
    this.toast.classList.remove('hidden');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.classList.add('hidden'), 3200);
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
      this.showTip(`<b>${escapeHtml(r.name)}</b><span>${price(s.from)}’den · ${s.free.toLocaleString('tr-TR')} boş</span>`);
      return;
    }
    if (p.seat >= 0) {
      const S = this.L.seats;
      const sold = !this.isFree(p.seat) && !this.purchased.has(p.seat);
      if (this.step === 'region' && this.seatPx(p.seat) < TAP_SEAT_PX) {
        this.showTip(`<b>${escapeHtml(blockTitle(b))}</b><span>Yakınlaştırmak için tıklayın</span>`);
        return;
      }
      this.showTip(
        `<b>Sıra ${S.row[p.seat]} · Koltuk ${S.num[p.seat]}</b>` +
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
    if (this.step === 'seat') {
      // at a seat: another free seat of the same region
      if (p.seat >= 0 && this.isFree(p.seat) && this.regionOfSeat(p.seat) === this.region && p.seat !== this.seat) this.chooseSeat(p.seat);
      return;
    }
    // region step: a tap on another region's stand switches to it
    const r = regionOfBlock(this.regions, p.block);
    if (r && r !== this.region) {
      this.chooseRegion(r);
      return;
    }
    // seats still small on screen: zoom in on the spot first
    const ref = p.seat >= 0 ? p.seat : nearestFreeSeat(this.L, b);
    if (ref >= 0 && b.tier !== 'suite' && this.seatPx(ref) < TAP_SEAT_PX) {
      this.zoomTo(ref);
      return;
    }
    // the seat under the finger, or the closest free one
    if (p.seat >= 0 && this.isFree(p.seat)) {
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
        this.labelEls.get(r.id)!.querySelector('span')!.textContent = s.free === 0 ? 'Tükendi' : `${price(s.from)}’den`;
      }
      const card = (r: Region) => {
        const s = this.statsOf(r);
        const full = s.free === 0;
        return `<button class="region-card${full ? ' off' : ''}" type="button" data-region="${r.id}" ${full ? 'disabled' : ''}>
          <span class="rc-name">${escapeHtml(r.name)}</span>
          <span class="rc-meta">${full ? 'Tükendi' : `${price(s.from)}’den`}</span>
        </button>`;
      };
      html = `<div class="region-grid">${this.regions.map(card).join('')}</div>`;
    } else if (this.step === 'region' && this.region) {
      const r = this.region;
      const s = this.statsOf(r);
      html = `<div class="region-head">
          <h2>${escapeHtml(r.name)}</h2>
          <span class="kpi">${s.free === 0 ? 'Tükendi' : `${price(s.from)}’den · <b>${s.free.toLocaleString('tr-TR')}</b> boş`}</span>
        </div>
        <div class="legend"><span><i class="lg free"></i>Boş</span><span><i class="lg sold"></i>Satıldı</span>
          <span class="hint">${this.zoomed ? 'Yeşil bir koltuğa dokunun' : 'Yakınlaşmak için tribüne dokunun'}</span></div>`;
    } else if (this.step === 'seat' && this.seat !== null) {
      const i = this.seat;
      const b = L.blocks[S.block[i]];
      const r = this.region;
      const mine = this.purchased.has(i);
      const gone = !mine && !this.isFree(i);
      const flying = this.app.director.mode === 'flying';
      html = `${this.notice ? `<p class="notice${gone ? ' bad' : ''}">${escapeHtml(this.notice)}</p>` : ''}
        <div class="seat-card">
          <button class="nav-btn" type="button" data-act="prev" aria-label="Soldaki boş koltuk">‹</button>
          <div class="seat-main">
            <div class="seat-where">${escapeHtml(r?.name ?? '')} · ${b.kind === 'suite' ? '' : 'Blok '}${escapeHtml(this.blockLabel(b))}${flying ? ' · gidiliyor…' : mine ? ' · sizin' : ''}</div>
            <div class="seat-rc">Sıra <b>${S.row[i]}</b> · Koltuk <b>${S.num[i]}</b></div>
            <div class="seat-cat">${escapeHtml(categoryName(S.category[i]))}</div>
          </div>
          <div class="seat-price">${price(this.app.seatPrice(i))}</div>
          <button class="nav-btn" type="button" data-act="next" aria-label="Sağdaki boş koltuk">›</button>
        </div>`;
      const label = gone ? 'Satıldı' : this.seatView ? (mine ? 'Bileti Görüntüle' : 'Bileti Gör') : 'Görüş hazırlanıyor…';
      foot = `<button class="btn primary wide" type="button" data-act="ticket" ${this.seatView && !gone ? '' : 'disabled'}>${label}</button>`;
    }
    this.body.innerHTML = html;
    this.foot.innerHTML = foot;
    this.foot.classList.toggle('empty', foot === '');
    this.renderSteps();
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
      if (this.isFree(i)) {
        this.chooseSeat(i);
        return;
      }
    }
  }

  private openTicket(): void {
    if (this.seat === null || !this.seatView) return;
    const i = this.seat;
    const canBuy = this.isFree(i) && !this.purchased.has(i);
    const t = ticketFor(this.app, i, this.seatView, this.purchased.has(i));
    showTicket(
      t,
      canBuy
        ? async () => {
            const res = await this.live.claim(i);
            if (res === 'ok') {
              this.purchased.add(i);
              this.L.seats.sold[i] = 1;
              this.stats.clear();
              this.app.selection.refreshSold([i]);
              if (this.seat === i) showTicket(ticketFor(this.app, i, this.seatView!, true), null);
              this.render();
              return;
            }
            document.querySelector('.ticket-overlay')?.remove();
            this.notice =
              res === 'taken'
                ? 'Bu koltuğu sizden birkaç saniye önce başka bir taraftar aldı. Başka bir koltuk seçin.'
                : 'Bağlantı kurulamadı; satın alma tamamlanmadı. Tekrar deneyin.';
            this.render();
          }
        : null,
    );
  }
}

export function mountPicker(app: App): SeatPicker {
  return new SeatPicker(app);
}
