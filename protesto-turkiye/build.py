"""Protesto Türkiye videolarını üretir.

    python3 build.py            # 12 videonun hepsi
    python3 build.py 01 07      # yalnızca adı bu öneklerle başlayanlar
    python3 build.py --jobs 3   # aynı anda kaç video işlensin
    python3 build.py --voice piper  # XTTS yerine küçük Piper sesi

Çıktı: videolar/<ad>.mp4 (1080x1920, 30 fps, en fazla 60 sn) ve
kapaklar/<ad>.jpg.
"""

import argparse
import functools
import subprocess
import sys
import tempfile
import time
import urllib.request
from multiprocessing import Pool
from pathlib import Path

import cv2
import numpy as np

import audio
import voiceover
import visuals as vs
from content import VIDEOS

HERE = Path(__file__).parent
OUT = HERE / "videolar"
COVERS = HERE / "kapaklar"
CACHE = HERE / ".cache"
MODEL_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/tr/tr_TR/dfki/medium/"
MODEL = "tr_TR-dfki-medium.onnx"
XTTS_URL = "https://huggingface.co/coqui/XTTS-v2/resolve/main/"
XTTS_DIR = CACHE / "xtts-v2"

INTRO = 0.3         # video doğrudan giriş cümlesiyle başlar; başlık kartı yalnızca kapakta
TAIL = 1.8          # kapanış kartı seslendirmeden sonra ekranda kalır
LENGTH_SCALE = 1.16  # 1'den büyük = daha ağır, dramatik okuma
MAX_SECONDS = 60.0
SPEEDUP = 1.3       # konuşma ve duraklar bu kadar hızlandırılır (perde değişmez)
VISUAL_LEAD = 0.15  # görsel, sesten biraz önce gelir
CROSSFADE = 0.1  # glitch kesmesi geçişi örter; uzun olursa iki sayı üst üste biner


def ensure_model():
    CACHE.mkdir(exist_ok=True)
    for name in (MODEL, MODEL + ".json"):
        path = CACHE / name
        if not path.exists():
            print(f"indiriliyor: {name}")
            urllib.request.urlretrieve(MODEL_URL + name, path)
    return CACHE / MODEL


def ensure_xtts():
    XTTS_DIR.mkdir(parents=True, exist_ok=True)
    for name in ("config.json", "vocab.json", "speakers_xtts.pth", "model.pth"):
        path = XTTS_DIR / name
        if not path.exists():
            print(f"indiriliyor: XTTS {name}")
            urllib.request.urlretrieve(XTTS_URL + name, path)
    return XTTS_DIR


def make_voice(kind):
    if kind == "xtts":
        return audio.XttsVoice(ensure_xtts(), CACHE / "xtts")
    return audio.Voice(ensure_model())


def timeline(video, timings, total):
    lines = []
    for i, (line, (start, end)) in enumerate(zip(video["lines"], timings)):
        words = line["show"].split()
        weights = audio.word_weights(line["show"])
        acc, times = 0.0, []
        for w in weights:
            times.append(start + (end - start) * acc / sum(weights))
            acc += w
        nxt = timings[i + 1][0] if i + 1 < len(timings) else total
        lines.append({
            "words": list(zip(words, times)),
            "chunks": vs.caption_chunks(line["show"]),
            "emph": vs.emphasis_flags(line["show"]),
            "start": start,
            "end": end,
            "hold_until": min(nxt - 0.05, end + 0.9),
            "cta": bool(line["v"] and line["v"]["kind"] == "cta"),
        })

    scenes = []
    for line, (start, _) in zip(video["lines"], timings):
        if line["v"]:
            scenes.append({"v": line["v"], "t": max(INTRO - 0.2, start - VISUAL_LEAD), "ctx": {}})
    for i, s in enumerate(scenes):
        s["until"] = scenes[i + 1]["t"] if i + 1 < len(scenes) else total
        s["ctx"]["span"] = s["until"] - s["t"]
        prev = scenes[i - 1]["v"] if i else None
        if s["v"]["kind"] == "bars" and prev and prev["kind"] == "bars" and prev["items"] == s["v"]["items"]:
            s["ctx"]["prev_n"] = prev["n"]
    return lines, scenes


def composer(video, lines, scenes, total):
    """t saniyesindeki kareyi (float32 RGB, 0..1) üreten fonksiyon."""
    rng = np.random.default_rng(sum(map(ord, video["slug"])))
    bg = vs.Backdrop(seed=len(video["slug"]) * 7)
    hits = [s["t"] for s in scenes]
    cta_t = next((s["t"] for s in scenes if s["v"]["kind"] == "cta"), total)
    beat = 60 / 72

    def compose(t):
        red = 0.10 + 0.05 * np.exp(-((t - INTRO) % (2 * beat)) * 5) * (INTRO < t < cta_t)
        for h in [0.02] + hits:
            if 0 <= t - h < 1.5:
                red += 0.28 * np.exp(-(t - h) * 3.2)
        frame = bg.render(t, red)

        header_o = min(1.0, max(0.0, (t - INTRO + 0.1) / 0.4)) * (1 - min(1.0, max(0.0, (t - cta_t) / 0.3)))
        vs.draw_header(frame, video["title"], header_o)

        for s in scenes:
            if s["t"] <= t < s["until"] + CROSSFADE:
                o = 1.0 if t < s["until"] else 1 - (t - s["until"]) / CROSSFADE
                vs.draw_visual(frame, s["v"], t - s["t"], s["ctx"], o)

        for line in lines:
            if not line["cta"] and line["start"] - 0.1 <= t < line["hold_until"]:
                vs.draw_caption(frame, line, t)

        flash = 0.0
        g = 0.0
        if t < 0.45:
            g = max(g, 1 - t / 0.45)
        for h in hits:
            if 0 <= t - h < 0.22:
                g = max(g, 1 - (t - h) / 0.22)
                flash = max(flash, 0.16 * (1 - (t - h) / 0.12))
        if flash > 0:
            frame += flash
        frame = vs.glitch(frame, g, rng)
        frame = bg.finish(frame, sum(h <= t for h in hits))
        np.clip(frame, 0, 1, out=frame)
        return frame

    def cover():
        """Kapak: konu başlığı kartı, videonun kendisinde yer almaz."""
        frame = bg.render(1.0, 0.16)
        vs.draw_title_card(frame, video, 1.0, 1.0)
        frame = bg.finish(frame, 1)
        np.clip(frame, 0, 1, out=frame)
        return frame

    compose.cover = cover
    return compose


def render(video, lines, scenes, total, audio_path, out_path):
    compose = composer(video, lines, scenes, total)
    cmd = ["ffmpeg", "-v", "error", "-y",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{vs.W}x{vs.H}", "-r", str(vs.FPS), "-i", "-",
           "-i", str(audio_path),
           "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-pix_fmt", "yuv420p",
           "-profile:v", "high",
           "-c:a", "aac", "-b:a", "192k", "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-ar", "48000",
           "-movflags", "+faststart", "-shortest", str(out_path)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(int(round(total * vs.FPS))):
        proc.stdin.write(cv2.convertScaleAbs(compose(f / vs.FPS), alpha=255).tobytes())
    proc.stdin.close()
    if proc.wait():
        raise RuntimeError(f"ffmpeg failed for {video['slug']}")


def plan(video, voice, tmp):
    """Seslendirir ve zaman çizelgesini çıkarır; video 60 sn'yi aşarsa hızlandırır."""
    rec = voiceover.recording(video["slug"])
    if rec:
        return plan_recorded(video, rec)
    scale = LENGTH_SCALE
    while True:
        deep, timings = audio.build_voice(voice, video["lines"], tmp, INTRO, scale)
        deep = voiceover.speed_up(deep, SPEEDUP)
        timings = [(a / SPEEDUP, b / SPEEDUP) for a, b in timings]
        total = timings[-1][1] + TAIL
        if total <= MAX_SECONDS or scale <= 0.9:
            break
        scale -= 0.04
    assert total <= MAX_SECONDS, f"{video['slug']}: {total:.1f} sn"
    lines, scenes = timeline(video, timings, total)
    return deep, total, lines, scenes


def plan_recorded(video, path):
    """seslendirme/ içindeki hazır kaydı kullanır; satır zamanlarını kayıttan çıkarır."""
    speech = voiceover.load(path)
    room = MAX_SECONDS - INTRO - TAIL - 0.1
    factor = len(speech) / audio.SR / room
    if factor > 1:
        speech = voiceover.speed_up(speech, factor)
    rel = voiceover.line_timings(speech, audio.SR, video["lines"])
    deep = np.concatenate([np.zeros(int(INTRO * audio.SR), np.float32), speech])
    timings = [(INTRO + s, INTRO + e) for s, e in rel]
    total = INTRO + len(speech) / audio.SR + TAIL
    lines, scenes = timeline(video, timings, total)
    return deep, total, lines, scenes


def build(video, voice_kind="xtts"):
    started = time.time()
    voice = make_voice(voice_kind)
    with tempfile.TemporaryDirectory() as tmp:
        deep, total, lines, scenes = plan(video, voice, tmp)
        hits = [s["t"] for s in scenes]
        cta_t = next(s["t"] for s in scenes if s["v"]["kind"] == "cta")
        clock = next(((s["t"] + 1.2, s["until"] - 1.0) for s in scenes if s["v"]["kind"] == "clock"), None)
        music = audio.build_music(total, INTRO, hits, cta_t, clock)
        wav = Path(tmp) / "mix.wav"
        audio.mix(deep, music, wav)
        OUT.mkdir(exist_ok=True)
        out = OUT / f"{video['slug']}.mp4"
        render(video, lines, scenes, total, wav, out)
    COVERS.mkdir(exist_ok=True)
    cover = cv2.convertScaleAbs(composer(video, lines, scenes, total).cover(), alpha=255)
    cv2.imwrite(str(COVERS / f"{video['slug']}.jpg"), cover[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 92])
    print(f"{video['slug']}: {total:.1f} sn, {time.time() - started:.0f} sn'de üretildi", flush=True)
    return video["slug"], total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("only", nargs="*", help="ad önekleri, ör. 01 07")
    ap.add_argument("--jobs", type=int, default=3)
    ap.add_argument("--voice", choices=["xtts", "piper"], default="xtts")
    args = ap.parse_args()
    todo = [v for v in VIDEOS if not args.only or any(v["slug"].startswith(p) for p in args.only)]
    if not todo:
        sys.exit("eşleşen video yok")
    voice = make_voice(args.voice)
    if args.voice == "xtts":
        # XTTS büyük bir model: bütün satırları önce tek süreçte seslendirip
        # önbelleğe al, paralel işlerde model hiç yüklenmesin.
        for video in todo:
            if not voiceover.recording(video["slug"]):
                with tempfile.TemporaryDirectory() as tmp:
                    plan(video, voice, tmp)
            print(f"{video['slug']}: seslendirildi", flush=True)
    with Pool(min(args.jobs, len(todo))) as pool:
        for slug, total in pool.imap_unordered(functools.partial(build, voice_kind=args.voice), todo):
            pass


if __name__ == "__main__":
    main()
