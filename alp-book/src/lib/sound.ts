"use client";

import { useStore, useUi } from "./store";

/**
 * Sakin, yumuşak ses efektleri. Dosya yok: sesler tarayıcıda sentezlenir
 * (pentatonik sinüs "çan" tınıları + hafif yankı). Ayarlar'dan kapatılabilir.
 */

type Ctx = { c: AudioContext; dry: GainNode; send: GainNode; master: GainNode };
let rig: Ctx | null = null;
let lastAt = 0;
let lastSaveAt = 0;

const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880, B5 = 987.77, C6 = 1046.5, D6 = 1174.66;
const A4 = 440, F4 = 349.23, G4 = 392, B4 = 493.88;

function getRig(): Ctx | null {
  if (typeof window === "undefined") return null;
  const { soundOn, volume } = useStore.getState().profile;
  if (!soundOn || volume <= 0) return null;
  try {
    if (!rig) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const c = new AC();
      const master = c.createGain();
      const soften = c.createBiquadFilter();
      soften.type = "lowpass";
      soften.frequency.value = 3800;
      master.connect(soften).connect(c.destination);

      const dry = c.createGain();
      dry.connect(master);

      // Kısa, yumuşak bir yankı: üssel sönen gürültü.
      const len = Math.floor(c.sampleRate * 1.7);
      const ir = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
      const verb = c.createConvolver();
      verb.buffer = ir;
      const send = c.createGain();
      send.gain.value = 0.55;
      const wet = c.createGain();
      wet.gain.value = 0.32;
      send.connect(verb).connect(wet).connect(master);
      rig = { c, dry, send, master };
    }
    rig.master.gain.value = Math.min(1, volume) * 0.55;
    if (rig.c.state === "suspended") void rig.c.resume();
    return rig;
  } catch {
    return null;
  }
}

interface NoteOpts {
  delay?: number;
  dur?: number;
  gain?: number;
  attack?: number;
  /** Cam/çan tınısı için üst ses (2. harmonik) ekler. */
  bell?: boolean;
  /** Notanın sonunda hafifçe kayma (Hz çarpanı). */
  glide?: number;
}

function note(r: Ctx, freq: number, o: NoteOpts = {}) {
  const { delay = 0, dur = 0.7, gain = 0.12, attack = 0.012, bell = true, glide } = o;
  const t = r.c.currentTime + delay;
  const g = r.c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const osc = r.c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t);
  if (glide) osc.frequency.exponentialRampToValueAtTime(freq * glide, t + dur);
  osc.connect(g);
  osc.start(t);
  osc.stop(t + dur + 0.05);
  if (bell) {
    const g2 = r.c.createGain();
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(gain * 0.22, t + attack);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.55);
    const o2 = r.c.createOscillator();
    o2.type = "sine";
    o2.frequency.setValueAtTime(freq * 2.01, t);
    o2.connect(g2);
    o2.start(t);
    o2.stop(t + dur);
    g2.connect(r.dry);
    g2.connect(r.send);
  }
  g.connect(r.dry);
  g.connect(r.send);
}

function run(fn: (r: Ctx) => void) {
  const r = getRig();
  if (!r) return;
  lastAt = performance.now();
  fn(r);
}

export const sfx = {
  /** Çok hafif dokunuş. */
  tap: () => run((r) => note(r, 523, { dur: 0.11, gain: 0.05, attack: 0.004, bell: false })),
  /** Sayfa/sekme geçişi. */
  nav: () =>
    run((r) => {
      note(r, D5, { dur: 0.5, gain: 0.07 });
      note(r, A5, { delay: 0.06, dur: 0.5, gain: 0.04 });
    }),
  /** Evet / tamamlandı. */
  yes: () =>
    run((r) => {
      note(r, G5, { dur: 0.7, gain: 0.11 });
      note(r, C6, { delay: 0.09, dur: 0.95, gain: 0.11 });
    }),
  /** Hayır: yumuşak, alçalan tek nota. */
  no: () =>
    run((r) => {
      note(r, A4, { dur: 0.45, gain: 0.09, bell: false, glide: 0.88 });
    }),
  /** Kaydı temizle / sil. */
  clear: () => run((r) => note(r, G4, { dur: 0.16, gain: 0.05, attack: 0.005, bell: false, glide: 0.9 })),
  /** Sayı artır/azalt. */
  step: (up: boolean) => run((r) => note(r, up ? E5 : B4, { dur: 0.28, gain: 0.07 })),
  /** Genel kaydetme: sessiz tek nota. */
  save: () => {
    const now = performance.now();
    if (now - lastSaveAt < 1500) return;
    lastSaveAt = now;
    run((r) => note(r, E5, { dur: 0.6, gain: 0.06 }));
  },
  /** Yeni öğe ekleme (plan, öğün). */
  add: () =>
    run((r) => {
      note(r, E5, { dur: 0.7, gain: 0.09 });
      note(r, A5, { delay: 0.08, dur: 0.8, gain: 0.09 });
      note(r, C6, { delay: 0.16, dur: 1.0, gain: 0.09 });
    }),
  /** Plan tamamlandı: sıcak, açılan bir akor. */
  done: () =>
    run((r) => {
      note(r, C5, { dur: 1.2, gain: 0.1 });
      note(r, E5, { delay: 0.07, dur: 1.2, gain: 0.09 });
      note(r, G5, { delay: 0.14, dur: 1.3, gain: 0.09 });
      note(r, C6, { delay: 0.21, dur: 1.5, gain: 0.07 });
    }),
  /** Karşılama. */
  welcome: () =>
    run((r) => {
      [C5, G5, C6, D6].forEach((f, i) => note(r, f, { delay: i * 0.14, dur: 1.8, gain: 0.08 }));
    }),
  /** Açma / seçme. */
  open: () => run((r) => note(r, A5, { dur: 0.25, gain: 0.05, attack: 0.006 })),
  /** Ayarlar'da dinleme. */
  preview: () =>
    run((r) => {
      note(r, G5, { dur: 0.8, gain: 0.1 });
      note(r, B5, { delay: 0.12, dur: 0.9, gain: 0.08 });
    }),
};

let installed = false;

/**
 * Genel dokunma sesi: bir düğme/bağlantı tıklanır ve 120 ms içinde özel bir ses çalınmadıysa
 * hafif bir "tık" duyulur. Her kayıt değişiminde de (en fazla 1,5 sn'de bir) sessiz bir kaydetme notası çalar.
 */
export function installGlobalSounds() {
  if (installed || typeof document === "undefined") return;
  installed = true;
  document.addEventListener(
    "click",
    (e) => {
      const el = (e.target as Element | null)?.closest?.("button, a[href], [role=radio], select, summary");
      if (!el || (el as HTMLButtonElement).disabled) return;
      // Ses bağlamı bu kullanıcı hareketi içinde hazırlansın (iOS için gerekli).
      getRig();
      setTimeout(() => {
        if (performance.now() - lastAt > 120) sfx.tap();
      }, 40);
    },
    true,
  );
  useUi.subscribe((s, prev) => {
    if (s.savedAt && s.savedAt !== prev.savedAt) {
      setTimeout(() => {
        if (performance.now() - lastAt > 200) sfx.save();
      }, 60);
    }
  });
}
