import json, wave, numpy as np
SR = 44100
tl = json.load(open('timeline.json'))
N = int(tl['duration'] * SR) + SR
mix = np.zeros(N); rng = np.random.default_rng(7)

def load(name):
    w = wave.open(f'audio/{name}.wav'); return np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
def put(sig, t, gain=1.0):
    i = int(t * SR); j = min(N, i + len(sig))
    if i < N: mix[i:j] += sig[:j - i] * gain
def env(n, a=0.005, r=0.1):
    e = np.ones(n); na = int(a * SR); nr = min(n, int(r * SR))
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def lowpass(x, cut):
    a = np.exp(-2 * np.pi * cut / SR); y = np.empty_like(x); acc = 0.0
    # vectorised-ish via lfilter replacement
    from itertools import accumulate
    y = np.array(list(accumulate(x * (1 - a), lambda p, v: p * a + v)))
    return y
def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))

def whistle(d=0.7):
    t = tt(d); f = 2950 + 60 * np.sin(2 * np.pi * 34 * t)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.8 + 0.2 * np.sin(2 * np.pi * 34 * t)) + 0.15 * noise(d)
    return s * env(len(t), 0.02, 0.08) * 0.35
def kick():
    t = tt(0.18); f = 110 * np.exp(-t * 18) + 45
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22) + 0.4 * noise(0.18) * np.exp(-t * 80)) * 0.7
def swish(d=0.5):
    n = noise(d); n = n - lowpass(n, 1500)
    return n * np.exp(-tt(d) * 6) * 0.35
def cheer(d=3.0, g=0.3):
    n = lowpass(noise(d), 1800) * 3; t = tt(d)
    mod = 1 + 0.3 * np.sin(2 * np.pi * 3.1 * t) * np.sin(2 * np.pi * 0.7 * t)
    return n * mod * np.minimum(1, t * 4) * np.minimum(1, (d - t) * 1.5) * g
def punch():
    d = 0.16; t = tt(d); f = rng.uniform(70, 140) * np.exp(-t * 20) + 40
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18) + noise(d) * np.exp(-t * 50) * 0.8) * 0.8
def bonk():
    d = 0.25; t = tt(d); f = rng.uniform(500, 800) * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * 0.35
def boing():
    d = 0.6; t = tt(d); f = 180 + 300 * t + 60 * np.sin(2 * np.pi * 14 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) * 0.3
def step():
    d = 0.06; return noise(d) * np.exp(-tt(d) * 70) * 0.25
def heartbeat():
    s = np.zeros(int(0.5 * SR)); k = kick() * 0.9; s[:len(k)] += k; i = int(0.18 * SR); s[i:i + len(k)] += k * 0.7; return s
def whoosh(d=0.4):
    n = noise(d); t = tt(d); return lowpass(n, 2500) * np.sin(np.pi * t / d) ** 2 * 0.6
def poof(d=0.9):
    return lowpass(noise(d), 600) * np.exp(-tt(d) * 3) * 2.2
def boop(f0, d, g=0.2):  # simple tuba/trombone note
    t = tt(d); ph = 2 * np.pi * np.cumsum(f0 * (1 + 0.012 * np.sin(2 * np.pi * 5.5 * t))) / SR
    s = sum(np.sin(k * ph) / k for k in range(1, 7))
    return s * env(len(t), 0.03, 0.15) * g
def sting(freqs, d=1.2, g=0.12):
    t = tt(d); s = sum(np.sign(np.sin(2 * np.pi * f * t)) * 0.5 + np.sin(2 * np.pi * f * t) for f in freqs)
    return lowpass(s, 2500) * np.exp(-t * 1.6) * g

# --- ambience: distant city + light crowd murmur along whole match
amb = lowpass(noise(tl['duration'] + 1), 400) * 0.6 + lowpass(noise(tl['duration'] + 1), 1200) * 0.15
mix[:len(amb)] += amb * 0.35

# title sting + kick-off whistle
put(sting([220, 277, 330, 440]), 0.4); put(sting([294, 370, 440, 587], 1.6), 1.2)
put(whistle(0.9), 3.3)
# opening goal play
for t in np.arange(4.1, 8.3, 0.45): put(kick() * 0.35, t)
put(kick(), 5.6); put(kick() * 0.8, 6.1); put(kick() * 0.8, 6.6)   # wall pass + bounce
put(kick() * 1.2, 8.2); put(swish(), 8.8); put(cheer(3.5, 0.35), 8.8)
put(whoosh(0.8), 10.0)  # knee slide
# montage
for i in range(5):
    t0 = 13 + i * 2
    put(whoosh(0.25) * 0.8, t0); put(kick() * 0.5, t0 + 0.25); put(kick(), t0 + 0.6); put(swish(), t0 + 1.15); put(cheer(1.4, 0.25), t0 + 1.15)
# face-off tension
for k in range(5): put(heartbeat(), 23.2 + k * 0.5)
put(boop(55, 1.8, 0.08), 23.3)
# 90+5 heartbeat
for k in range(5): put(heartbeat() * 1.2, 25.6 + k * 0.48)
# final attack
for t in np.arange(28.1, 31.0, 0.42): put(kick() * 0.35, t)
put(kick() * 1.7, 31.45); put(whoosh(0.8) * 1.2, 31.5); put(swish(0.8) * 1.4, 32.25)
put(cheer(4.5, 0.45), 32.25); put(sting([262, 330, 392, 523], 2.0, 0.12), 32.3)
# walk / footsteps
for t in np.arange(43.1, 45.5, 0.38): put(step(), t); put(step() * 0.8, t + 0.19)
put(boop(70, 2.0, 0.07), 43.0)
# censor: pop + cartoon 'boing'
put(boing(), 45.55); put(bonk(), 45.6)
# run & collide
for t in np.arange(51.3, 53.0, 0.16): put(step() * 1.2, t)
put(punch() * 1.6, 53.0); put(poof() * 1.3, 53.0); put(bonk(), 53.05)
# fight clouds: punches, bonks, boings, garbled shouts from dialogue snippets
snips = [load(n) for n in ['b_nediyor', 'a_golgol', 'b_tukurdu', 'a_dayina']]
def fight(t0, t1, dens):
    t = t0
    while t < t1:
        r = rng.random()
        if r < 0.55: put(punch(), t, rng.uniform(0.7, 1.2))
        elif r < 0.75: put(bonk(), t)
        elif r < 0.83: put(boing(), t, 0.8)
        else:
            s = snips[rng.integers(len(snips))]; i = rng.integers(0, max(1, len(s) - 9000))
            put(s[i:i + 9000] * env(9000, 0.01, 0.05), t, 0.55)
        if rng.random() < 0.3: put(step(), t + 0.05)
        t += rng.uniform(0.6, 1.4) / dens
    put(poof(1.5) * 0.5, t0)
fight(53.2, 58.0, 4); fight(58.0, 62.5, 1.2); fight(62.5, 67.6, 6.5); fight(67.6, 69.5, 2)
# blue pops out
put(whoosh(0.4), 58.0); put(whoosh(0.4), 62.0); put(poof() * 1.5, 62.4)
# slow-motion ending: muffle everything after slowAt, add low drone + boom at blackout
sa = int(tl['slowAt'] * SR)
tail = mix[sa:].copy(); mix[sa:] = lowpass(tail, 350) * 1.6 * np.linspace(1, 0.2, len(tail))
dr = tt(4.0); put(np.sin(2 * np.pi * 48 * dr) * 0.25 * np.minimum(1, dr * 2) * np.minimum(1, (4.0 - dr)), tl['slowAt'])
put(whoosh(1.2) * 1.2, tl['slowAt'] - 0.3)
put(kick() * 1.6, tl['blackAt'] + 0.6); put(poof(2.0) * 0.8, tl['blackAt'] + 0.6)

# --- dialogue (with light compression / level matching)
for d in tl['dialog']:
    s = load(d['clip'] + ('_slow' if d['clip'] == 'a_doktor' else '')); s = s / (np.max(np.abs(s)) + 1e-6) * 0.85
    g = 0.9 if d['speaker'] != 'comm' else 0.75
    put(s, d['start'], g)
    # duck ambience under speech
fa = int((tl['blackAt'] + 1.2) * SR); mix[fa:] *= np.linspace(1, 0, len(mix) - fa) ** 2
mix = np.tanh(mix * 0.95)
mix = mix[:int(tl['duration'] * SR)]
out = (mix / np.max(np.abs(mix)) * 0.92 * 32767).astype(np.int16)
w = wave.open('mix.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes()); w.close()
print('mix ok', len(out) / SR)
