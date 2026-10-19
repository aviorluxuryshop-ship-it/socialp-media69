"""Hazır seslendirme kayıtları (ElevenLabs) ve satır zamanlarının çıkarılması.

`seslendirme/<ad>.mp3` varsa video Piper yerine bu kaydı kullanır. Kayıt tek
parça olduğu için hangi satırın ne zaman okunduğunu bilmeyiz; Whisper'ın kelime
zamanlarını metindeki kelimelerle eşleyip her satırın başlangıç ve bitişini
buluruz. Altyazı ve sahne geçişleri bu zamanlara göre ilerler.
"""

import difflib
import re
import subprocess
from pathlib import Path

import numpy as np

import audio

HERE = Path(__file__).parent
VOICE_DIR = HERE / "seslendirme"
WORD = re.compile(r"[a-zçğıöşüâîû0-9]+")


def recording(slug):
    path = VOICE_DIR / f"{slug}.mp3"
    return path if path.exists() else None


def load(path, sr=audio.SR):
    """Kaydı mono float32 olarak okur; baştaki ve sondaki sessizliği atar."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return audio.trim_silence(np.frombuffer(raw, np.float32).copy(), sr, threshold=0.01)


def _tokens(text):
    text = text.replace("I", "ı").replace("İ", "i").lower()
    return WORD.findall(text)


_model = None


def _whisper_words(samples, sr, prompt):
    global _model
    from faster_whisper import WhisperModel

    if _model is None:
        _model = WhisperModel("small", compute_type="int8")
    idx = np.round(np.arange(0, len(samples), sr / 16000)).astype(int)
    idx = idx[idx < len(samples)]
    segments, _ = _model.transcribe(samples[idx], language="tr", word_timestamps=True,
                                    initial_prompt=prompt[:600])
    words = []
    for seg in segments:
        for w in seg.words:
            for tok in _tokens(w.word):
                words.append((tok, w.start, w.end))
    return words


def line_timings(samples, sr, lines):
    """Her satırın kayıttaki (başlangıç, bitiş) zamanı, saniye cinsinden."""
    texts = [line["say"] or audio.speakable(line["show"]) for line in lines]
    script, owner = [], []
    for i, text in enumerate(texts):
        for tok in _tokens(text):
            script.append(tok)
            owner.append(i)
    heard = _whisper_words(samples, sr, " ".join(texts))
    match = difflib.SequenceMatcher(None, script, [w[0] for w in heard], autojunk=False)
    starts, ends = [None] * len(script), [None] * len(script)
    for a, b, size in match.get_matching_blocks():
        for k in range(size):
            starts[a + k], ends[a + k] = heard[b + k][1], heard[b + k][2]

    total = len(samples) / sr
    timings = []
    for i in range(len(lines)):
        idx = [k for k, o in enumerate(owner) if o == i]
        s = [starts[k] for k in idx if starts[k] is not None]
        e = [ends[k] for k in idx if ends[k] is not None]
        timings.append([min(s) if s else None, max(e) if e else None])
    # Eşleşmeyen satırlar komşularının arasına yerleştirilir.
    for i, (s, e) in enumerate(timings):
        prev_end = timings[i - 1][1] if i else 0.0
        nxt = next((t[0] for t in timings[i + 1:] if t[0] is not None), total)
        if s is None:
            s = prev_end + 0.05
        if e is None:
            e = max(s + 0.3, nxt - 0.05)
        timings[i] = [max(s, prev_end), e]
    timings[-1][1] = max(timings[-1][1], total - 0.05)
    return [tuple(t) for t in timings]


def speed_up(samples, factor, sr=audio.SR):
    """Perdeyi bozmadan hızlandırır (factor > 1 daha hızlı)."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-",
                          "-af", f"atempo={factor:.4f}", "-f", "f32le", "-"],
                         input=samples.astype(np.float32).tobytes(), capture_output=True,
                         check=True).stdout
    return np.frombuffer(raw, np.float32).copy()
