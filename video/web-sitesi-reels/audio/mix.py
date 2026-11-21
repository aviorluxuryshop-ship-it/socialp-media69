"""Sound design + final mix for the Socialp Media web-site reel.

Inputs (same folder): vo_a.mp3 (voiceover), music_v2b.mp3 (instrumental bed).
Every SFX is synthesised here and placed on the same cue times as anim.js.
Output: ../out/mix.wav (48 kHz stereo, 20 s, loudness-normalised later by ffmpeg).
"""
import subprocess
import numpy as np
from scipy import signal

SR = 48000
DUR = 20.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
HERE = __file__.rsplit('/', 1)[0]


def load(path, filters=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path]
    if filters:
        cmd += ['-af', filters]
    cmd += ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)


def place(bus, snd, t, gain=1.0, pan=0.0):
    """mix a mono/stereo sound into the stereo bus at time t with equal-power pan"""
    if snd.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        snd = np.stack([snd * l * 1.414, snd * r * 1.414], 1)
    i = int(round(t * SR))
    if i < 0:
        snd, i = snd[-i:], 0
    j = min(N, i + len(snd))
    if j > i:
        bus[i:j] += snd[: j - i] * gain


def env_ad(n, a, d_curve=6.0):
    """attack fraction a, exponential-ish decay"""
    x = np.linspace(0, 1, n)
    na = max(1, int(n * a))
    e = np.ones(n)
    e[:na] = np.linspace(0, 1, na) ** 1.5
    e[na:] = np.exp(-d_curve * np.linspace(0, 1, n - na))
    return e


def sweep_filter(x, f0, f1, kind='bandpass', q=1.2, block=256):
    """time-varying filter: cutoff glides f0->f1 (log), block-wise with carried state"""
    y = np.zeros_like(x)
    nb = int(np.ceil(len(x) / block))
    zi = None
    for b in range(nb):
        f = f0 * (f1 / f0) ** (b / max(1, nb - 1))
        f = min(f, SR * 0.45)
        if kind == 'bandpass':
            bw = f / q
            lo, hi = max(20, f - bw / 2), min(SR * 0.49, f + bw / 2)
            sos = signal.butter(2, [lo, hi], 'bandpass', fs=SR, output='sos')
        else:
            sos = signal.butter(2, f, kind, fs=SR, output='sos')
        if zi is None or zi.shape != (sos.shape[0], 2):
            zi = np.zeros((sos.shape[0], 2))
        seg = x[b * block:(b + 1) * block]
        y[b * block:b * block + len(seg)], zi = signal.sosfilt(sos, seg, zi=zi)
    return y


def reverb(x, secs=1.4, mix=0.25, tone=5000):
    n = int(SR * secs)
    ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 7, n))
    ir = signal.sosfilt(signal.butter(1, tone, 'low', fs=SR, output='sos'), ir)
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = signal.fftconvolve(x, ir)[: len(x) + n]
    out = np.zeros(len(x) + n)
    out[: len(x)] += x * (1 - mix)
    out[: len(wet)] += wet * mix
    return out


# ------------------------------------------------------------------ sounds
def whoosh(d=0.6, f0=300, f1=3000, peak=0.6):
    n = int(SR * d)
    x = rng.standard_normal(n)
    y = sweep_filter(x, f0, f1, 'bandpass', q=0.9)
    t = np.linspace(0, 1, n)
    e = np.where(t < peak, (t / peak) ** 2, np.exp(-5 * (t - peak) / (1 - peak)))
    return y * e / (np.abs(y).max() + 1e-9)


def impact(d=1.6, f=52):
    n = int(SR * d)
    t = np.arange(n) / SR
    pitch = f * (1 + 1.6 * np.exp(-t * 18))
    boom = np.sin(2 * np.pi * np.cumsum(pitch) / SR) * np.exp(-t * 2.6)
    nz = signal.sosfilt(signal.butter(2, 900, 'low', fs=SR, output='sos'), rng.standard_normal(n)) * np.exp(-t * 16)
    click = rng.standard_normal(n) * np.exp(-t * 400)
    y = boom * 1.0 + nz * 0.9 + click * 0.25
    return reverb(y / np.abs(y).max(), 1.8, 0.22, 2500)


def tick(f=3200, d=0.03):
    n = int(SR * d)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 260) * 0.6
    y += signal.sosfilt(signal.butter(2, 2500, 'high', fs=SR, output='sos'), rng.standard_normal(n)) * np.exp(-t * 600) * 0.7
    return y


def key_click():
    n = int(SR * 0.045)
    t = np.arange(n) / SR
    y = signal.sosfilt(signal.butter(2, [1800, 6000], 'bandpass', fs=SR, output='sos'), rng.standard_normal(n)) * np.exp(-t * 300)
    y += np.sin(2 * np.pi * (900 + rng.uniform(-80, 80)) * t) * np.exp(-t * 180) * 0.3
    return y / np.abs(y).max()


def pop(f0=420, f1=980, d=0.16):
    n = int(SR * d)
    t = np.arange(n) / SR
    f = f0 + (f1 - f0) * (1 - np.exp(-t * 60))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28)
    y[: int(SR * 0.004)] *= np.linspace(0, 1, int(SR * 0.004))
    return reverb(y, 0.6, 0.18)


def ping(f=1318.5):
    n = int(SR * 0.9)
    t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t * 3)
         + 0.25 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 9)) * np.exp(-t * 6.5)
    y[: 96] *= np.linspace(0, 1, 96)
    return reverb(y / np.abs(y).max(), 1.2, 0.3)


def glitch(d=0.34):
    n = int(SR * d)
    t = np.arange(n) / SR
    y = np.zeros(n)
    seg_len = int(SR * 0.028)
    for s in range(0, n, seg_len):
        f = rng.choice([90, 140, 220, 330, 1800, 2600])
        on = rng.random() > 0.25
        tt = t[s:s + seg_len]
        y[s:s + seg_len] = np.sign(np.sin(2 * np.pi * f * tt)) * on * rng.uniform(0.4, 1)
    y = np.round(y * 6) / 6  # bit crush
    y = signal.sosfilt(signal.butter(2, 5000, 'low', fs=SR, output='sos'), y)
    return y * np.exp(-t * 4)


def riser(d=0.55):
    n = int(SR * d)
    t = np.linspace(0, 1, n)
    nz = sweep_filter(rng.standard_normal(n), 400, 9000, 'bandpass', q=1.5)
    f = 180 * (12 ** t)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35
    y = (nz / np.abs(nz).max() + tone) * t ** 2.2
    return y


def shimmer(d=2.2):
    n = int(SR * d)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for k, f in enumerate([1046.5, 1568, 2093, 2637, 3136]):
        y += np.sin(2 * np.pi * f * t + k) * np.exp(-t * (1.4 + k * 0.5)) * (1 - 0.12 * k)
    y *= 1 + 0.25 * np.sin(2 * np.pi * 7 * t)
    y[: 480] *= np.linspace(0, 1, 480)
    return reverb(y / np.abs(y).max(), 2.0, 0.4)


def sub_drop(d=1.2, f0=90, f1=38):
    n = int(SR * d)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 5)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)


# ------------------------------------------------------------------ cue sheet
sfx = np.zeros((N, 2))

# hook: odometer ticks decelerating toward 2026 (positions of the ones-digit changes)
yv = lambda t: 1990 + 36 * (1 - (1 - min(1, max(0, (t - 0.02) / 1.23))) ** 4)
last = int(yv(0))
ts = np.arange(0, 1.26, 1 / 2000)
for tt in ts:
    v = int(yv(tt))
    if v != last:
        place(sfx, tick(3000 + (v % 2) * 600), tt, 0.32, pan=0.15 * (1 if v % 2 else -1))
        last = v
place(sfx, whoosh(1.25, 120, 2400, 0.95), 0.0, 0.32)
place(sfx, impact(), 1.25, 0.45)
place(sfx, sub_drop(1.6, 70, 32), 1.25, 0.4)
place(sfx, whoosh(0.55, 500, 2600, 0.55), 2.42, 0.28, pan=-0.2)
# broken site
place(sfx, whoosh(0.5, 300, 2000, 0.6), 2.95, 0.22)
for i, c in enumerate('www.isletmeniz.com'):
    place(sfx, key_click(), 3.08 + i * (0.77 / 18), 0.05, pan=rng.uniform(-0.3, 0.3))
place(sfx, glitch(), 4.62, 0.2)
place(sfx, impact(1.0, 46), 4.62, 0.28)
# whip to search scene
place(sfx, whoosh(0.5, 2500, 300, 0.4), 5.2, 0.34, pan=0.2)
for i in range(len('yakınımdaki en iyi kafe')):
    place(sfx, key_click(), 5.78 + i * (0.84 / 23), 0.045, pan=rng.uniform(-0.3, 0.3))
for i in range(3):
    place(sfx, pop(380 + i * 70, 820 + i * 120, 0.12), 6.74 + i * 0.13, 0.16)
place(sfx, glitch(0.26), 7.58, 0.16)
place(sfx, impact(1.1, 44), 7.61, 0.3)

# tension bed under the "problem" half: low drone + clock tick-tock (time is passing)
tb = np.arange(int(SR * 8.7)) / SR
drone = (np.sin(2 * np.pi * 49 * tb) + 0.5 * np.sin(2 * np.pi * 73.5 * tb + 1)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.5 * tb))
drone += signal.sosfilt(signal.butter(2, 260, 'low', fs=SR, output='sos'), rng.standard_normal(len(tb))) * 0.6
drone *= np.clip(tb / 0.25, 0, 1) * np.clip((8.62 - tb) / 0.12, 0, 1) * (0.55 + 0.45 * np.clip((tb - 2.5) / 5.5, 0, 1))
place(sfx, drone / np.abs(drone).max(), 0.0, 0.09)
for k, tt in enumerate(np.arange(2.6, 8.2, 0.5)):
    place(sfx, tick(1900 if k % 2 else 2500, 0.04), tt, 0.07 + 0.05 * (tt - 2.6) / 5.6, pan=(-0.25, 0.25)[k % 2])
# reveal
place(sfx, whoosh(0.45, 2200, 200, 0.3), 8.1, 0.25)
place(sfx, riser(0.5), 8.12, 0.38)
place(sfx, impact(2.0, 50), 8.62, 0.6)
place(sfx, shimmer(), 8.62, 0.12)
place(sfx, whoosh(0.5, 400, 3000, 0.5), 10.5, 0.26, pan=-0.2)
# build
for i in range(7):
    place(sfx, pop(500 + i * 40, 1100 + i * 60, 0.1), 10.95 + i * 0.055, 0.09, pan=-0.3 + i * 0.1)
place(sfx, whoosh(0.42, 300, 3500, 0.5), 11.4, 0.26, pan=-0.3)
place(sfx, whoosh(0.42, 300, 3500, 0.5), 11.96, 0.26, pan=0.3)
place(sfx, whoosh(0.6, 250, 2500, 0.6), 12.5, 0.3, pan=0.5)
for tc, p in [(12.01, -0.4), (12.65, 0.4), (13.61, -0.4), (14.17, 0.4)]:
    place(sfx, pop(520, 1250, 0.18), tc, 0.24, pan=p)
place(sfx, whoosh(0.4, 1500, 9000, 0.35), 13.5, 0.34)
place(sfx, shimmer(1.4), 14.5, 0.1)
# demand
place(sfx, whoosh(0.55, 2600, 300, 0.45), 15.1, 0.3)
for i, tc in enumerate([15.72, 16.12, 16.52, 16.92]):
    place(sfx, ping([1318.5, 1568, 1396.9, 1760][i]), tc, 0.22, pan=(-0.2, 0.2)[i % 2])
place(sfx, pop(300, 700, 0.2), 16.25, 0.12)
# CTA
place(sfx, whoosh(0.6, 3000, 200, 0.45), 17.4, 0.34)
place(sfx, impact(1.6, 56), 17.62, 0.25)
place(sfx, pop(400, 1000, 0.2), 18.24, 0.2)
click = tick(2200, 0.05)
place(sfx, click, 18.72, 0.7)
place(sfx, pop(700, 1400, 0.25), 18.72, 0.22)
for i in range(3):
    place(sfx, pop(600 + i * 100, 1300 + i * 150, 0.12), 18.82 + i * 0.13, 0.12, pan=-0.2 + i * 0.2)
place(sfx, shimmer(1.8), 18.9, 0.12)

# ------------------------------------------------------------------ voice + music
vo = load(f'{HERE}/vo_a.mp3',
          'highpass=f=75,equalizer=f=220:t=q:w=1:g=-1.5,equalizer=f=3800:t=q:w=1.2:g=2.5,'
          'acompressor=threshold=-22dB:ratio=3:attack=4:release=90:makeup=4dB')
VO_AT = 0.35
vob = np.zeros((N, 2))
place(vob, vo, VO_AT, 1.0)

mus = load(f'{HERE}/music_v2b.mp3')
MUS_AT = 0.62  # the track's drop (8.0 s) lands on the logo reveal at 8.62 s
mb = np.zeros((N, 2))
place(mb, mus, MUS_AT, 1.0)

# sidechain-style ducking driven by the voice envelope
venv = np.abs(vob).max(1)
win = int(SR * 0.03)
venv = np.convolve(venv, np.ones(win) / win, 'same')
att, rel = np.exp(-1 / (SR * 0.02)), np.exp(-1 / (SR * 0.35))
sm = np.zeros(N)
acc = 0.0
for i in range(0, N, 64):  # coarse follower is plenty
    v = venv[i]
    acc = v + (acc - v) * (att ** 64 if v > acc else rel ** 64)
    sm[i:i + 64] = acc
duck = 1 - 0.7 * np.clip(sm / (np.percentile(sm[sm > 0], 90) + 1e-9), 0, 1)
t = np.arange(N) / SR
music_gain = 0.34 * duck
music_gain *= np.clip((20.0 - t) / 0.9, 0, 1) ** 1.5      # fade out
music_gain *= np.where(t < 8.62, 2.6, 1.0)                  # quiet intro needs a lift
mb *= music_gain[:, None]

mix = vob * 1.0 + mb + sfx * 0.85
mix[-int(SR * 0.05):] *= np.linspace(1, 0, int(SR * 0.05))[:, None]
peak = np.abs(mix).max()
mix = mix / peak * 0.89
out = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
import wave
with wave.open(f'{HERE}/../out/mix_raw.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('peak before norm', peak)

if __name__ == '__main__':
    def db(x):
        return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
    for a, b in [(0, 1.2), (1.2, 2.4), (2.9, 5.1), (5.6, 8.1), (8.6, 10.5), (10.8, 15.2), (15.5, 17.4), (17.6, 18.8), (18.8, 20)]:
        i, j = int(a * SR), int(b * SR)
        print(f'{a:5.1f}-{b:5.1f}  vo {db(vob[i:j]):6.1f}  music {db(mb[i:j]):6.1f}  sfx {db(sfx[i:j] * 0.85):6.1f}')
