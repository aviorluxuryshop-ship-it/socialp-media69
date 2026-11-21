"""Soundtrack for the barber website + CRM promo.

Everything is synthesised here (no samples, no licensing questions):
a 120 BPM beat in C major (C – G – Am – F) plus UI sound effects that are
cued to the same timestamps the animation in index.html uses.

Usage:  python3 audio.py out/soundtrack.wav
"""
import sys
import wave

import numpy as np

SR = 44100
DUR = 43.0
N = int(SR * DUR)
BEAT = 0.5  # 120 BPM
rng = np.random.default_rng(7)

# ---- cue sheet (seconds) — keep in sync with index.html -------------------
WORDS = [0.30, 0.46, 0.62, 0.78]                 # headline lines
SHAKES = [0.35, 1.35, 2.35]                      # phone buzz bursts
PILLS = [1.60, 2.05, 2.50]                       # notification pills
PAIN_IN = [4.10, 4.55, 5.00]                     # pain lines slide in
STRIKES = [4.48, 4.93, 5.38]                     # red strike-through
TAPS = [11.5, 13.3, 14.1, 15.0, 15.6, 16.3, 17.7]
TYPE_RUNS = [(16.72, 17.06, 10), (17.18, 17.52, 14)]
SUCCESS = 18.10
PACKET = (20.2, 21.22)
DING = 21.22
CARDS = [25.35, 25.55, 25.75, 25.95]
MSG_OUT, MSG_IN = 26.70, 28.25
BENEFITS = [33.15, 33.60, 34.05]
WHOOSH = [3.72, 9.70, 11.80, 14.40, 16.55, 19.00, 24.60, 32.70]
SHINES = [39.4, 40.9]

# ---- buses ----------------------------------------------------------------
dryL = np.zeros(N); dryR = np.zeros(N)
musL = np.zeros(N); musR = np.zeros(N)       # music (gets side-chained)
revL = np.zeros(N); revR = np.zeros(N)       # reverb send


def tvec(d):
    return np.arange(int(d * SR)) / SR


def place(bufL, bufR, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i + len(sig) <= 0:
        return
    s = sig * gain
    if i < 0:
        s = s[-i:]
        i = 0
    j = min(N, i + len(s))
    s = s[: j - i]
    a = (pan + 1) * np.pi / 4
    bufL[i:j] += s * np.cos(a) * np.sqrt(2)
    bufR[i:j] += s * np.sin(a) * np.sqrt(2)


def add(sig, t, gain=1.0, pan=0.0, rev=0.0, bus='dry'):
    if bus == 'dry':
        place(dryL, dryR, sig, t, gain, pan)
    else:
        place(musL, musR, sig, t, gain, pan)
    if rev:
        place(revL, revR, sig, t, gain * rev, pan)


def fft_filter(x, lo=None, hi=None, order=2):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    H = np.ones_like(f)
    if lo:
        H *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    if hi:
        H *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    return np.fft.irfft(X * H, len(x))


def svf(x, fc, damp=0.9, mode='bp'):
    """Chamberlin state-variable filter with a per-sample cutoff."""
    x = x.tolist()
    fc = np.broadcast_to(fc, (len(x),)).tolist()
    low = band = 0.0
    out = [0.0] * len(x)
    for n, v in enumerate(x):
        f = 2 * np.sin(np.pi * min(fc[n], SR / 6) / SR)
        high = v - low - damp * band
        band += f * high
        low += f * band
        out[n] = band if mode == 'bp' else (low if mode == 'lp' else high)
    return np.array(out)


def norm(x):
    m = np.max(np.abs(x))
    return x / m if m else x


def saw(freq, d, top=6000, detune=0.0):
    t = tvec(d)
    out = np.zeros_like(t)
    k = 1
    while k * freq < top:
        out += np.sin(2 * np.pi * k * freq * (1 + detune) * t + rng.uniform(0, 6.28)) / k
        k += 1
    return out


def adsr(n, a=0.005, d=0.1, s=0.7, r=0.1):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na, endpoint=False)
    nd = min(nd, n - na)
    e[na:na + nd] = np.linspace(1, s, nd, endpoint=False)
    nr = min(nr, n)
    e[n - nr:] *= np.linspace(1, 0, nr)
    return e


NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}


def hz(name):
    n, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTE[n] + 12 * (o + 1) - 69) / 12)


# ---- instruments ------------------------------------------------------------
def kick():
    t = tvec(0.45)
    f = 48 + 120 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = fft_filter(rng.standard_normal(len(t)), lo=2500) * np.exp(-t * 400) * 0.3
    return norm(np.tanh(1.6 * (body + click)))


def clap():
    t = tvec(0.3)
    n = rng.standard_normal(len(t))
    env = np.exp(-t * 22)
    for off in (0.0, 0.011, 0.022):
        env += 0.9 * np.exp(-np.maximum(t - off, 0) * 180) * (t >= off)
    return norm(fft_filter(n * env, lo=900, hi=6000))


def hat(open_=False):
    t = tvec(0.25 if open_ else 0.06)
    n = fft_filter(rng.standard_normal(len(t)), lo=7000)
    return norm(n * np.exp(-t * (14 if open_ else 70)))


def bass_note(f, d):
    s = saw(f, d, top=900) + 0.6 * np.sin(2 * np.pi * f * tvec(d))
    s = fft_filter(s, hi=520)
    return norm(s) * adsr(len(s), 0.004, 0.08, 0.75, 0.05)


def pad_chord(notes, d, cutoff=1800):
    s = np.zeros(int(d * SR))
    for nm in notes:
        f = hz(nm)
        s += saw(f, d, top=4000, detune=-0.004) + saw(f, d, top=4000, detune=0.004)
    s = fft_filter(s, hi=cutoff)
    return norm(s) * adsr(len(s), 0.25, 0.3, 0.85, 0.35)


def pluck(f, d=0.35):
    t = tvec(d)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return s * np.exp(-t * 11) * adsr(len(t), 0.002, 0.01, 1, 0.02)


def bell(f, d=1.2, bright=1.0):
    t = tvec(d)
    s = np.zeros_like(t)
    for ratio, amp, dec in ((1, 1, 3.2), (2.01, .45 * bright, 5), (3.0, .25 * bright, 7), (4.17, .18 * bright, 9), (5.43, .1 * bright, 12)):
        s += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * dec)
    return norm(s) * adsr(len(t), 0.002, 0.01, 1, 0.05)


def tap_click():
    t = tvec(0.05)
    n = fft_filter(rng.standard_normal(len(t)), lo=3000) * np.exp(-t * 260)
    tone = np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 120)
    return norm(0.6 * n + tone)


def key_tick():
    t = tvec(0.025)
    return norm(fft_filter(rng.standard_normal(len(t)), lo=2500, hi=9000) * np.exp(-t * 300))


def pop(f0=900, f1=520, d=0.12):
    t = tvec(d)
    f = f1 + (f0 - f1) * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * adsr(len(t), 0.002, 0.01, 1, 0.01)


def buzz(d=0.75):
    t = tvec(d)
    s = np.sign(np.sin(2 * np.pi * 165 * t)) * 0.5 + np.sin(2 * np.pi * 330 * t) * 0.3
    am = 0.55 + 0.45 * np.sin(2 * np.pi * 28 * t)
    s = fft_filter(s * am, hi=900, lo=80)
    return norm(s) * adsr(len(t), 0.02, 0.05, 1, 0.08)


def whoosh(d=0.45, f0=400, f1=4000):
    t = tvec(d)
    n = rng.standard_normal(len(t))
    fc = f0 * (f1 / f0) ** (np.sin(np.pi * t / d) ** 2)
    s = svf(n, fc, damp=0.8)
    return norm(s) * np.sin(np.pi * t / d) ** 2


def riser(d=1.0):
    t = tvec(d)
    n = rng.standard_normal(len(t))
    fc = 300 * (9000 / 300) ** (t / d)
    s = svf(n, fc, damp=0.5)
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / d) ** 2) / SR) * 0.25
    return norm(s + sweep) * (t / d) ** 2


def impact(d=2.2):
    t = tvec(d)
    sub = np.sin(2 * np.pi * np.cumsum(32 + 50 * np.exp(-t * 6)) / SR) * np.exp(-t * 2.2)
    noise = fft_filter(rng.standard_normal(len(t)), hi=3500) * np.exp(-t * 9)
    return norm(np.tanh(1.8 * (sub + 0.5 * noise)))


def zip_(d):
    t = tvec(d)
    f = 380 * (1700 / 380) ** ((t / d) ** 1.3)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * t))
    return s * np.sin(np.pi * t / d) ** 0.7


def shimmer():
    out = np.zeros(int(0.9 * SR))
    for k in range(7):
        b = bell(hz(['C7', 'E7', 'G7', 'B6', 'D7', 'G7', 'C8'][k]), 0.5, 0.4)
        i = int(k * 0.06 * SR)
        out[i:i + len(b)] += b[: len(out) - i] * (0.9 - k * 0.08)
    return norm(out)


# ---- music --------------------------------------------------------------------
PROG = [  # (pad voicing, bass root)
    (['C4', 'E4', 'G4', 'C5'], 'C2'),
    (['B3', 'D4', 'G4', 'B4'], 'G2'),
    (['A3', 'C4', 'E4', 'A4'], 'A2'),
    (['A3', 'C4', 'F4', 'A4'], 'F2'),
]
ARP = [0, 2, 1, 3, 2, 1, 3, 2]  # index into the voicing, 8th notes

K, C, H, HO = kick(), clap(), hat(), hat(True)
kicks = []

# intro pad: Am (0–4), F (4–6), G (6–7) — darker, filtered
add(pad_chord(['A3', 'C4', 'E4'], 4.2, cutoff=650), 0.0, 0.16, bus='mus', rev=0.5)
add(pad_chord(['A3', 'C4', 'F4'], 2.2, cutoff=1000), 4.0, 0.16, bus='mus', rev=0.5)
add(pad_chord(['B3', 'D4', 'G4'], 1.1, cutoff=1300), 6.0, 0.16, bus='mus', rev=0.5)
add(bass_note(hz('F2'), 1.9), 4.0, 0.22, bus='mus')
add(bass_note(hz('G2'), 0.9), 6.0, 0.22, bus='mus')

# section 2 (4–6.75): kick + hats to build pressure
for b in range(int((6.75 - 4.0) / BEAT)):
    t = 4.0 + b * BEAT
    add(K, t, 0.75); kicks.append(t)
    add(H, t + BEAT / 2, 0.10, pan=0.25)

# main groove 7–37 and lighter outro 37–41
t = 7.0
while t < 41.0 - 1e-6:
    bar = int(round((t - 7.0) / 2.0))
    voicing, root = PROG[bar % 4]
    main = t < 36.75
    outro = t >= 37.0
    if main or outro:
        add(pad_chord(voicing, 2.05, cutoff=2400 if not outro else 1500), t, 0.15, bus='mus', rev=0.45)
    for b in range(4):
        tb = t + b * BEAT
        if tb >= 36.75 and tb < 37.0:
            continue
        if not outro or b in (0, 2):
            add(K, tb, 0.9 if not outro else 0.6); kicks.append(tb)
        if b in (1, 3):
            add(C, tb, 0.30 if not outro else 0.2, rev=0.35)
        add(H, tb + BEAT / 2, 0.11, pan=0.3)
        if not outro and b == 3:
            add(HO, tb + BEAT / 2, 0.06, pan=-0.3)
        if not outro:
            add(H, tb + BEAT / 4, 0.05, pan=-0.25)
            add(H, tb + 3 * BEAT / 4, 0.05, pan=-0.25)
        # pumping off-beat bass
        add(bass_note(hz(root), 0.22), tb + BEAT / 2, 0.30, bus='mus')
    # pluck arpeggio while the product is on screen (10–33)
    if 10.0 <= t < 33.0:
        for k, idx in enumerate(ARP):
            add(pluck(hz(voicing[idx]) * 2, 0.4), t + k * 0.25, 0.07, pan=(-0.35 if k % 2 else 0.35), bus='mus', rev=0.6)
    t += 2.0

# ending chord
add(pad_chord(['C4', 'E4', 'G4', 'C5'], 2.4, cutoff=1400), 41.0, 0.17, bus='mus', rev=0.6)
add(bass_note(hz('C2'), 1.6), 41.0, 0.25, bus='mus')
add(bell(hz('C6'), 2.0, 0.7), 41.0, 0.20, rev=0.8)
add(bell(hz('G6'), 2.0, 0.7), 41.06, 0.14, pan=0.3, rev=0.8)

# ---- sound effects --------------------------------------------------------------
for s in SHAKES:
    add(buzz(0.75), s, 0.32)
for i, s in enumerate(WORDS):
    add(pop(700 + i * 60, 380), s, 0.25)
for i, s in enumerate(PILLS):
    add(bell(hz('A5') * (1 + i * 0.06), 0.4, 0.5), s, 0.20, pan=0.15, rev=0.3)
    add(bell(hz('E6') * (1 + i * 0.06), 0.4, 0.5), s + 0.07, 0.16, pan=0.15, rev=0.3)
add(riser(1.0), 2.9, 0.18)
for s in PAIN_IN:
    add(whoosh(0.35, 300, 2500), s - 0.05, 0.16, pan=-0.3)
for s in STRIKES:
    add(whoosh(0.22, 3000, 700), s, 0.20, pan=0.2)
add(riser(1.2), 5.8, 0.26)
add(impact(2.4), 7.0, 0.85, rev=0.4)
add(shimmer(), 7.05, 0.10, rev=0.6)
for s in WHOOSH:
    add(whoosh(0.45), s, 0.17, pan=rng.uniform(-0.4, 0.4))
for s in TAPS:
    add(tap_click(), s, 0.34)
for s, e, n in TYPE_RUNS:
    for k in range(n):
        add(key_tick(), s + (e - s) * k / n, 0.16, pan=rng.uniform(-0.2, 0.2))
for k, nm in enumerate(['C6', 'E6', 'G6', 'C7']):
    add(bell(hz(nm), 1.2, 0.6), SUCCESS + 0.05 + k * 0.07, 0.17, rev=0.6)
add(zip_(PACKET[1] - PACKET[0]), PACKET[0], 0.09, rev=0.3)
add(bell(hz('E6'), 1.3), DING, 0.38, rev=0.5)
add(bell(hz('B6'), 1.3), DING + 0.11, 0.30, rev=0.5)
for i, s in enumerate(CARDS):
    add(pop(600 + i * 120, 420 + i * 80), s, 0.22, pan=[-0.3, 0.3, -0.3, 0.3][i])
add(pop(1200, 1700, 0.1), MSG_OUT, 0.18)
add(bell(hz('G5'), 0.5, 0.4), MSG_IN, 0.16, rev=0.3)
add(bell(hz('C6'), 0.5, 0.4), MSG_IN + 0.08, 0.14, rev=0.3)
for i, s in enumerate(BENEFITS):
    add(impact(0.6), s, 0.35)
    add(bell(hz(['C6', 'E6', 'G6'][i]), 0.8, 0.5), s, 0.10, rev=0.5)
add(riser(1.1), 35.9, 0.24)
add(impact(2.8), 37.0, 0.9, rev=0.5)
add(shimmer(), 37.05, 0.14, rev=0.7)
for s in SHINES:
    add(shimmer(), s, 0.07, rev=0.6)

# ---- side-chain the music bus to the kick ------------------------------------
duck = np.ones(N)
dt = tvec(0.3)
shape = 1 - 0.55 * np.exp(-dt / 0.09)
for k in kicks:
    i = int(k * SR)
    j = min(N, i + len(shape))
    duck[i:j] = np.minimum(duck[i:j], shape[: j - i])
musL *= duck; musR *= duck


# ---- reverb (FFT convolution with decaying stereo noise) ----------------------
def ir(seed, d=1.6):
    r = np.random.default_rng(seed)
    t = tvec(d)
    return fft_filter(r.standard_normal(len(t)), lo=200, hi=7000) * np.exp(-t * 3.2) * 0.03


def conv(x, h):
    n = 1 << int(np.ceil(np.log2(len(x) + len(h))))
    y = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(h, n), n)
    return y[: len(x)]


wetL = conv(revL, ir(1)); wetR = conv(revR, ir(2))

L = dryL + musL + wetL
R = dryR + musR + wetR

# fades + gentle bus saturation
fade = np.ones(N)
fi = int(0.3 * SR); fade[:fi] = np.linspace(0, 1, fi)
fo_s, fo_e = int(42.2 * SR), N
fade[fo_s:fo_e] = np.linspace(1, 0, fo_e - fo_s) ** 1.5
L *= fade; R *= fade
peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
L = np.tanh(1.3 * L / peak) / np.tanh(1.3) * 0.89
R = np.tanh(1.3 * R / peak) / np.tanh(1.3) * 0.89

out = sys.argv[1] if len(sys.argv) > 1 else 'out/soundtrack.wav'
pcm = (np.stack([L, R], axis=1) * 32767).astype('<i2')
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote', out, f'{DUR:.1f}s')
