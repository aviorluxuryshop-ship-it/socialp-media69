// Sakin, isteğe bağlı sesler. Varsayılan KAPALI; ses dosyası yok, WebAudio ile üretilir.
let ctx: AudioContext | null = null;
let enabled = false;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

type Tone = "tap" | "success" | "soft" | "done";
const NOTES: Record<Tone, { f: number[]; d: number; g: number }> = {
  tap: { f: [440], d: 0.07, g: 0.025 },
  soft: { f: [392], d: 0.14, g: 0.03 },
  success: { f: [392, 523.25], d: 0.18, g: 0.035 },
  done: { f: [392, 493.88, 587.33], d: 0.2, g: 0.035 },
};

export function playTone(tone: Tone) {
  if (!enabled || typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches && tone === "tap") return;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime;
    const { f, d, g } = NOTES[tone];
    f.forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = t0 + i * d * 0.8;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(g, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + d + 0.12);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + d + 0.15);
    });
  } catch {
    /* ses kullanılamıyorsa sessizce devam */
  }
}
