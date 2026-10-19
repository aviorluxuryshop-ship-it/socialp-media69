"""Seslendirme, ses efekti ve müzik.

Ses: varsayılan olarak XTTS v2'nin derin erkek sesi (Damien Black), çevrimdışı
ve ücretsiz; Türkçeyi doğal bir anlatıcı gibi okur. XTTS kurulu değilse Piper
TTS'in Türkçe sesi (tr_TR-dfki-medium) kullanılır; o daha robotik olduğu için
perdesi düşürülür. Her iki ses de kalınlaştırılır, sıkıştırılır ve salona
yayılan bir yankı eklenir.

Müzik: telif sorunu olmasın diye hiçbir kayıt kullanılmaz; karanlık drone,
kalp atışı gibi bas vuruşları, geçiş "whoosh"ları ve kapanıştaki yükselme
burada sentezlenir.
"""

import hashlib
import re
import subprocess
import wave
from pathlib import Path

import numpy as np
from scipy.signal import fftconvolve

SR = 44100
PIPER_SR = 22050

ONES = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"]
TENS = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"]
VOWELS = set("aeıioöuüAEIİOÖUÜâîû")


def _below_thousand(n):
    hundreds, rest = divmod(n, 100)
    tens, ones = divmod(rest, 10)
    words = []
    if hundreds:
        words.append("yüz" if hundreds == 1 else f"{ONES[hundreds]} yüz")
    if tens:
        words.append(TENS[tens])
    if ones:
        words.append(ONES[ones])
    return " ".join(words)


def number_words(n):
    if n == 0:
        return "sıfır"
    words = []
    for size, name in ((10**9, "milyar"), (10**6, "milyon"), (1000, "bin")):
        count, n = divmod(n, size)
        if count:
            words.append(name if (name == "bin" and count == 1) else f"{_below_thousand(count)} {name}")
    if n:
        words.append(_below_thousand(n))
    return " ".join(words)


def _attach_suffix(spoken, suffix):
    # Ekler yazıldığı gibi eklenir; tek ses değişimi "dört" + ünlü -> "dörd".
    if suffix and spoken.endswith("dört") and suffix[0] in VOWELS:
        spoken = spoken[:-1] + "d"
    return spoken + suffix


NUMBER = re.compile(r"(%)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?(?:'([a-zçğıöşü]+))?")


def _speak_number(match):
    percent, integer, decimals, suffix = match.groups()
    spoken = number_words(int(integer.replace(".", "")))
    if decimals:
        spoken += " virgül " + number_words(int(decimals))
    spoken = _attach_suffix(spoken, suffix or "")
    return ("yüzde " + spoken) if percent else spoken


def speakable(text):
    """Ekrandaki altyazıyı seslendirilecek metne çevirir."""
    text = text.replace("*", "")
    text = re.sub(r"\bTÜİK", "Tüik", text)
    text = re.sub(r"\bENAG", "Enag", text)
    text = re.sub(r"\bTL\b", "lira", text)
    text = NUMBER.sub(_speak_number, text)
    return text


def syllables(word):
    """Türkçede hece sayısı ünlü sayısına eşittir; süre tahmini için yeterli."""
    return max(1, sum(ch in VOWELS for ch in word))


def word_weights(show):
    """Altyazıdaki her kelimenin seslendirmede kapladığı göreli süre."""
    weights = []
    for word in show.split():
        spoken = speakable(word)
        w = sum(syllables(part) for part in spoken.split())
        if word.rstrip("*").endswith((",", ":")):
            w += 1.6
        elif word.rstrip("*").endswith((".", "!", "?", "…")):
            w += 2.4
        weights.append(w)
    return weights


class Voice:
    """Piper: küçük ve hızlı, ama robotik; perdesi düşürülerek kullanılır."""
    sr = PIPER_SR
    pitch = 0.87

    def __init__(self, model_path):
        from piper import PiperVoice, SynthesisConfig

        self.voice = PiperVoice.load(str(model_path))
        self.config_cls = SynthesisConfig

    def line(self, text, length_scale):
        cfg = self.config_cls(length_scale=length_scale, noise_scale=0.6, noise_w_scale=0.7)
        chunks = [c.audio_float_array for c in self.voice.synthesize(text, syn_config=cfg)]
        audio = np.concatenate(chunks).astype(np.float32)
        return trim_silence(audio, PIPER_SR)


class XttsVoice:
    """XTTS v2: doğal Türkçe anlatıcı. Model yalnızca önbellekte olmayan bir satır
    için yüklenir; üretilen her satır .cache/xtts/ içinde saklanır."""
    sr = 24000
    pitch = 1.0
    SPEAKER = "Damien Black"
    BASE_SPEED = 1.10  # length_scale 1.16 ≈ 0.95 hız: ağır ama doğal

    def __init__(self, model_dir, cache_dir):
        self.model_dir = Path(model_dir)
        self.cache = Path(cache_dir)
        self.cache.mkdir(parents=True, exist_ok=True)
        self.model = None

    def _load(self):
        import torch
        from TTS.tts.configs.xtts_config import XttsConfig
        from TTS.tts.models.xtts import Xtts

        cfg = XttsConfig()
        cfg.load_json(str(self.model_dir / "config.json"))
        self.model = Xtts.init_from_config(cfg)
        self.model.load_checkpoint(cfg, checkpoint_dir=str(self.model_dir), use_deepspeed=False)
        self.torch = torch

    def line(self, text, length_scale):
        speed = round(self.BASE_SPEED / length_scale, 3)
        key = hashlib.sha1(f"{self.SPEAKER}|{speed}|{text}".encode()).hexdigest()[:16]
        path = self.cache / f"{key}.wav"
        if not path.exists():
            write_wav(path, self._best_take(text, speed), self.sr)
        audio, _ = read_wav(path)
        return trim_silence(audio, self.sr)

    def _best_take(self, text, speed, tries=5):
        """XTTS kısa cümlelerin sonuna bazen fazladan hece ekler ya da bir
        kelimeyi yutar. Her denemeyi Whisper'a dinletir, sondaki fazlalığı keser,
        metne en çok uyanı seçer."""
        if self.model is None:
            self._load()
        spk = self.model.speaker_manager.speakers[self.SPEAKER]
        best = (-1.0, None)
        for seed in range(1, tries + 1):
            self.torch.manual_seed(seed)
            out = self.model.inference(text, "tr", spk["gpt_cond_latent"], spk["speaker_embedding"],
                                       temperature=0.65, speed=speed, enable_text_splitting=False)
            wav = trim_silence(np.asarray(out["wav"], np.float32), self.sr)
            score, wav = _listen(text, wav, self.sr)
            if score > best[0]:
                best = (score, wav)
            if score >= 0.97:
                break
        return best[1]


_whisper = None


def _words(text):
    text = speakable(text).replace("I", "ı").replace("İ", "i").lower()
    return re.findall(r"[a-zçğıöşüâîû]+", text)


def _closest(token, vocab):
    """Whisper'ın biraz farklı yazdığı kelimeyi (sevep → sebep) metindekine eşler."""
    import difflib

    hit = difflib.get_close_matches(token, vocab, n=1, cutoff=0.75)
    return hit[0] if hit else token


def _listen(text, wav, sr):
    """(metne uyum 0..1, sondaki fazlalığı kesilmiş ses)."""
    global _whisper
    import difflib

    from faster_whisper import WhisperModel

    if _whisper is None:
        _whisper = WhisperModel("small", compute_type="int8")
    idx = np.arange(0, len(wav), sr / 16000).astype(int)
    segments, _ = _whisper.transcribe(wav[idx], language="tr", word_timestamps=True)
    want = _words(text)
    heard = [(_closest(tok, want), w.end) for seg in segments for w in seg.words
             for tok in _words(w.word)]
    match = difflib.SequenceMatcher(None, want, [h[0] for h in heard], autojunk=False)
    score = match.ratio()
    blocks = [b for b in match.get_matching_blocks() if b.size]
    if blocks and blocks[-1].a + blocks[-1].size == len(want):
        last = blocks[-1].b + blocks[-1].size - 1
        if last < len(heard) - 1:  # son kelimeden sonra duyulan her şey fazlalık
            cut = min(len(wav), int((heard[last][1] + 0.06) * sr))
            fade = min(cut, int(0.04 * sr))
            wav = wav[:cut].copy()
            wav[cut - fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
            score = difflib.SequenceMatcher(None, want, [h[0] for h in heard[: last + 1]],
                                            autojunk=False).ratio()
    return score, wav


def trim_silence(audio, sr, threshold=0.015, keep=0.03):
    loud = np.flatnonzero(np.abs(audio) > threshold)
    if not len(loud):
        return audio
    pad = int(keep * sr)
    return audio[max(0, loud[0] - pad): loud[-1] + pad]


def write_wav(path, audio, sr):
    audio = np.clip(audio, -1, 1)
    data = (audio * 32767).astype(np.int16)
    channels = 1 if data.ndim == 1 else data.shape[1]
    with wave.open(str(path), "wb") as w:
        w.setnchannels(channels)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(data.tobytes())


def read_wav(path):
    with wave.open(str(path), "rb") as w:
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
        data = data.astype(np.float32) / 32768
        if w.getnchannels() > 1:
            data = data.reshape(-1, w.getnchannels())
        return data, w.getframerate()


def deepen(raw, work_dir, sr=PIPER_SR, pitch=0.87):
    """Ham sesi derin, dolgun bir anlatıcı sesine çevirir (44.1 kHz mono)."""
    src = Path(work_dir) / "voice_raw.wav"
    dst = Path(work_dir) / "voice_deep.wav"
    write_wav(src, raw, sr)
    shift = [f"rubberband=pitch={pitch}:tempo=1:formant=shifted:pitchq=quality"] if pitch != 1 else []
    chain = ",".join([
        f"aresample={SR}",
        *shift,
        "highpass=f=55",
        "equalizer=f=120:t=q:w=0.9:g=5",
        "equalizer=f=380:t=q:w=1.2:g=-2",
        "equalizer=f=2800:t=q:w=1.4:g=3",
        "acompressor=threshold=-22dB:ratio=3.5:attack=4:release=140:makeup=5",
    ])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", chain, "-ac", "1", str(dst)],
                   check=True)
    audio, _ = read_wav(dst)
    return audio


def hall_reverb(mono, seconds=2.2, wet=0.22, seed=7):
    """Sentetik bir salon yankısı; sol ve sağ kanal farklı yansır."""
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    decay = np.exp(-t * 6.9 / seconds)
    out = []
    for ch in range(2):
        ir = rng.standard_normal(n) * decay
        ir[: int(0.018 * SR) + ch * 90] = 0  # erken yansıma gecikmesi
        ir = _one_pole_lowpass(ir, 5200)
        ir /= np.sqrt(np.sum(ir**2))
        out.append(fftconvolve(mono, ir)[: len(mono)])
    wet_sig = np.stack(out, axis=1)
    dry = np.stack([mono, mono], axis=1)
    return dry * (1 - wet * 0.5) + wet_sig * wet


def _one_pole_lowpass(x, cutoff):
    # Basit tek kutuplu alçak geçiren; IIR'yi scipy ile hızlı uygula.
    from scipy.signal import lfilter

    a = np.exp(-2 * np.pi * cutoff / SR)
    return lfilter([1 - a], [1, -a], x)


def build_voice(voice, lines, work_dir, intro, length_scale):
    """Satırları tek tek seslendirir, aralarına nefes payı koyar.

    Dönüş: (derinleştirilmiş mono ses, satır başlangıç/bitiş zamanları)."""
    pieces, timings = [], []
    cursor = intro
    pieces.append(np.zeros(int(intro * voice.sr), np.float32))
    for i, line in enumerate(lines):
        text = line["say"] or speakable(line["show"])
        audio = voice.line(text, length_scale * line.get("pace", 1.0))
        is_cta = line["v"] and line["v"]["kind"] == "cta"
        if is_cta:
            gap = 0.55  # kapanış öncesi yükselme için yer
            pieces.append(np.zeros(int(gap * voice.sr), np.float32))
            cursor += gap
        start = cursor
        pieces.append(audio)
        cursor += len(audio) / voice.sr
        timings.append((start, cursor))
        pause = line["pause"]
        if pause is None:
            pause = 0.12 if line["show"].rstrip("*").endswith("...") else 0.34
        if i < len(lines) - 1:
            pieces.append(np.zeros(int(pause * voice.sr), np.float32))
            cursor += pause
    raw = np.concatenate(pieces)
    deep = deepen(raw, work_dir, voice.sr, voice.pitch)
    return deep, timings


# ---------------------------------------------------------------- müzik ----

def _env(n, attack, release):
    env = np.ones(n, np.float32)
    a, r = int(attack * SR), int(release * SR)
    if a:
        env[:a] = np.linspace(0, 1, a)
    if r:
        env[-r:] *= np.linspace(1, 0, r)
    return env


def _saw(freq, t):
    return 2 * ((t * freq) % 1.0) - 1


def _add(track, start, sig):
    i = int(start * SR)
    if i >= len(track):
        return
    j = min(len(track), i + len(sig))
    track[i:j] += sig[: j - i]


def boom(seconds=2.4, f0=58, f1=27, gain=1.0, seed=0):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    freq = f1 + (f0 - f1) * np.exp(-t * 3.2)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t * 1.6)
    rng = np.random.default_rng(seed)
    crack = _one_pole_lowpass(rng.standard_normal(n), 900) * np.exp(-t * 9) * 0.9
    sig = (body + crack) * gain
    return np.stack([sig, sig], axis=1).astype(np.float32)


def thump(gain=0.6):
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    freq = 42 + 48 * np.exp(-t * 22)
    sig = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 9) * gain
    return np.stack([sig, sig], axis=1).astype(np.float32)


def whoosh(seconds=0.55, gain=0.35, seed=1, rising=True):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    noise = rng.standard_normal((n, 2))
    out = np.zeros_like(noise)
    sweep = np.linspace(400, 5200, n) if rising else np.linspace(5200, 400, n)
    # Kayan bant geçiren: parça parça alçak geçirenler arasındaki fark.
    step = 2048
    for s in range(0, n, step):
        seg = noise[s:s + step]
        hi = sweep[min(s, n - 1)]
        for ch in range(2):
            out[s:s + step, ch] = _one_pole_lowpass(seg[:, ch], hi) - _one_pole_lowpass(seg[:, ch], hi * 0.35)
    env = np.sin(np.linspace(0, np.pi, n)) ** 2
    return (out * env[:, None] * gain).astype(np.float32)


def riser(seconds=1.6, gain=0.4, seed=3):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    noise = _one_pole_lowpass(rng.standard_normal(n), 3000)
    freq = 90 * (2 ** (t / seconds * 2.5))
    tone = np.sin(2 * np.pi * np.cumsum(freq) / SR) * 0.5
    env = (t / seconds) ** 2.2
    sig = (noise * 0.6 + tone) * env * gain
    return np.stack([sig, sig * 0.96], axis=1).astype(np.float32)


def tick(gain=0.18, seed=5):
    n = int(0.04 * SR)
    rng = np.random.default_rng(seed)
    t = np.arange(n) / SR
    sig = (rng.standard_normal(n) - _one_pole_lowpass(rng.standard_normal(n), 2500)) * np.exp(-t * 160) * gain
    return np.stack([sig, sig], axis=1).astype(np.float32)


def drone(seconds):
    """Re minör üzerine karanlık, hafifçe nefes alan bir taban."""
    n = int(seconds * SR)
    t = np.arange(n) / SR
    left = np.zeros(n, np.float32)
    right = np.zeros(n, np.float32)
    breathe = 0.75 + 0.25 * np.sin(2 * np.pi * t / 7.5)
    left += 0.30 * np.sin(2 * np.pi * 36.71 * t)
    right += 0.30 * np.sin(2 * np.pi * 36.75 * t)
    for freq, amp in ((73.42, 0.16), (110.0, 0.07), (174.61, 0.045), (220.0, 0.03)):
        left += amp * _saw(freq * 0.998, t)
        right += amp * _saw(freq * 1.002, t)
    left = _one_pole_lowpass(_one_pole_lowpass(left, 420), 420) * breathe
    right = _one_pole_lowpass(_one_pole_lowpass(right, 420), 420) * breathe
    # Yüksekte ince, gergin bir ton (referanstaki sürekli tonu andırır).
    high = 0.018 * np.sin(2 * np.pi * 587.33 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * t / 3.1))
    sig = np.stack([left + high, right + high], axis=1)
    return sig * _env(n, 1.2, 1.8)[:, None]


def build_music(total, intro, hits, cta_start, clock_span=None, bpm=72):
    """`hits`: görsel değişim anları (vuruş + whoosh), `cta_start`: kapanış."""
    music = drone(total).astype(np.float32)
    _add(music, 0.02, boom(gain=1.1, seed=11))
    beat = 60 / bpm
    t = intro
    k = 0
    while t < cta_start - 0.2:
        if k % 2 == 0:
            _add(music, t, thump(0.55 if k % 4 == 0 else 0.35))
        t += beat
        k += 1
    for i, h in enumerate(hits):
        if h <= intro + 0.05 or abs(h - cta_start) < 0.3:
            continue
        _add(music, max(0, h - 0.45), whoosh(seed=20 + i, gain=0.22))
        _add(music, h, boom(1.6, 52, 30, gain=0.45, seed=30 + i))
    _add(music, max(0, cta_start - 1.6), riser())
    _add(music, cta_start, boom(3.0, 62, 26, gain=1.25, seed=99))
    if clock_span:
        a, b = clock_span
        t = a
        while t < b:
            _add(music, t, tick())
            t += 0.25 if t > a + 1.0 else 0.5
    return music


def duck(music, voice, amount=0.55):
    """Ses konuşurken müziği kıs (sidechain)."""
    env = np.abs(voice)
    env = _one_pole_lowpass(env, 6)
    env = env / (env.max() + 1e-9)
    gain = 1 - amount * np.clip(env * 2.2, 0, 1)
    return music * gain[: len(music), None]


def mix(voice_mono, music, out_path):
    n = len(music)
    voice = np.zeros(n, np.float32)
    voice[: min(n, len(voice_mono))] = voice_mono[:n]
    voice = voice / (np.abs(voice).max() + 1e-9) * 0.9
    wet = hall_reverb(voice)
    bed = duck(music, voice)
    bed = bed / (np.abs(bed).max() + 1e-9) * 0.42
    out = wet + bed
    out = np.tanh(out * 1.1) / np.tanh(1.1)
    write_wav(out_path, out.astype(np.float32), SR)
