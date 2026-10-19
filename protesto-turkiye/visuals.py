"""Kare kare görüntü üretimi (1080x1920, dikey).

Referans videonun dili: siyah-beyaz, gren, parlayan beyaz yazı, kelime kelime
gelen altyazı, sahne geçişlerinde glitch. Üzerine tek vurgu rengi olarak
bayrak kırmızısı eklenir. Hiçbir fotoğraf ya da logo kullanılmaz; her şey
yazı ve basit şekillerle çizilir.
"""

import math
import re
from collections import OrderedDict
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FPS = 30

HERE = Path(__file__).parent
ANTON = str(HERE / "fonts" / "Anton-Regular.ttf")
INTER_DIR = Path("/usr/share/fonts/opentype/inter")
INTER_XB = str(INTER_DIR / "InterDisplay-ExtraBold.otf")
INTER_B = str(INTER_DIR / "Inter-Bold.otf")
INTER_SB = str(INTER_DIR / "Inter-SemiBold.otf")

WHITE = np.array([1.0, 1.0, 1.0], np.float32)
RED = np.array([1.0, 0.13, 0.15], np.float32)
DEEP_RED = np.array([0.89, 0.04, 0.09], np.float32)  # bayrak kırmızısı
GREY = np.array([0.68, 0.68, 0.70], np.float32)

CAPTION_Y = 1300
CAPTION_MAX_W = 820
VISUAL_Y = 720
GRAIN = 0.03


def ease_out(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


def ease_in_out(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


# ------------------------------------------------------------- yazılar ----

@lru_cache(maxsize=64)
def font(path, size):
    return ImageFont.truetype(path, size)


@lru_cache(maxsize=4096)
def text_mask(text, path, size, tracking=0):
    """Yazının alfa maskesi (float32, 0..1) ve parıltısı için kenar payı."""
    f = font(path, size)
    pad = int(size * 0.45) + 24
    if tracking:
        widths = [f.getlength(ch) for ch in text]
        width = int(sum(widths) + tracking * max(0, len(text) - 1))
    else:
        width = int(f.getlength(text))
    ascent, descent = f.getmetrics()
    img = Image.new("L", (width + 2 * pad, ascent + descent + 2 * pad), 0)
    draw = ImageDraw.Draw(img)
    if tracking:
        x = pad
        for ch, w in zip(text, widths):
            draw.text((x, pad), ch, font=f, fill=255)
            x += w + tracking
    else:
        draw.text((pad, pad), text, font=f, fill=255)
    mask = np.asarray(img, np.float32) / 255.0
    # Dikey merkez, büyük harf yüksekliğinin ortası: aynı fonttaki bütün
    # kelimeler aynı taban çizgisine oturur.
    _, top, _, base = f.getbbox("H")
    return mask, pad, pad + (top + base) / 2


@lru_cache(maxsize=4096)
def glow_of(text, path, size, tracking=0, sigma=None):
    mask, _, _ = text_mask(text, path, size, tracking)
    sigma = sigma or max(4.0, size * 0.09)
    return cv2.GaussianBlur(mask, (0, 0), sigma)


def text_width(text, path, size, tracking=0):
    mask, pad, _ = text_mask(text, path, size, tracking)
    return mask.shape[1] - 2 * pad


def fit_size(lines, path, max_w, max_size, max_h=None, leading=1.05):
    size = max_size
    while size > 24:
        widest = max(text_width(l, path, size) for l in lines)
        tall = size * leading * len(lines)
        if widest <= max_w and (max_h is None or tall <= max_h):
            return size
        size -= 6
    return size


_blend_cache = OrderedDict()


def _blend_terms(mask, glow, color, opacity, glow_color, glow_gain, shadow):
    """Gölge + parıltı + yazı bindirmesini tek çarpma ve tek toplamaya indirger:
    sonuç = zemin * A + B."""
    color = np.asarray(color, np.float32)
    opacity = np.float32(opacity)
    a = mask * opacity
    keep = 1 - a
    if glow is not None:
        if shadow:
            keep = keep * (1 - np.clip(glow * (0.75 * opacity), 0, 0.85))
        gc = np.asarray(glow_color if glow_color is not None else color, np.float32)
        b = (glow * (glow_gain * opacity) * (1 - a))[..., None] * gc + a[..., None] * color
    else:
        b = a[..., None] * color
    keep = keep.astype(np.float32)
    return cv2.merge([keep, keep, keep]), b.astype(np.float32)


def blit(canvas, mask, cx, cy, color, opacity=1.0, glow=None, glow_color=None,
         glow_gain=0.9, shadow=True, center_y=None, key=None):
    """Maskeyi tuvale yerleştirir: önce gölge, sonra parıltı, sonra yazı."""
    if opacity <= 0.002:
        return
    mh, mw = mask.shape
    cyy = center_y if center_y is not None else mh / 2
    x0 = int(round(cx - mw / 2))
    y0 = int(round(cy - cyy))
    x1, y1 = x0 + mw, y0 + mh
    cx0, cy0 = max(0, x0), max(0, y0)
    cx1, cy1 = min(W, x1), min(H, y1)
    if cx0 >= cx1 or cy0 >= cy1:
        return
    if key is not None and opacity >= 0.999:
        key = (key, tuple(np.round(np.asarray(color), 3)),
               None if glow_color is None else tuple(np.round(np.asarray(glow_color), 3)),
               glow_gain, shadow, glow is not None)
        terms = _blend_cache.get(key)
        if terms is None:
            terms = _blend_terms(mask, glow, color, 1.0, glow_color, glow_gain, shadow)
            _blend_cache[key] = terms
            if len(_blend_cache) > 160:
                _blend_cache.popitem(last=False)
        else:
            _blend_cache.move_to_end(key)
    else:
        terms = _blend_terms(mask, glow, color, opacity, glow_color, glow_gain, shadow)
    A, B = terms
    sl = (slice(cy0 - y0, cy1 - y0), slice(cx0 - x0, cx1 - x0))
    region = canvas[cy0:cy1, cx0:cx1]
    region[:] = cv2.add(cv2.multiply(region, A[sl]), B[sl])


def draw_text(canvas, text, path, size, cx, cy, color=WHITE, opacity=1.0, tracking=0,
              glow=True, glow_color=None, glow_gain=0.9, scale=1.0, shadow=True):
    mask, _, center = text_mask(text, path, size, tracking)
    g = glow_of(text, path, size, tracking) if glow else None
    key = (text, path, size, tracking)
    if abs(scale - 1.0) > 1e-3:
        mask = cv2.resize(mask, None, fx=scale, fy=scale, interpolation=cv2.INTER_LINEAR)
        if g is not None:
            g = cv2.resize(g, None, fx=scale, fy=scale, interpolation=cv2.INTER_LINEAR)
        center *= scale
        key = None
    blit(canvas, mask, cx, cy, color, opacity, g, glow_color, glow_gain, shadow, center, key)


def draw_rect(canvas, x0, y0, x1, y1, color, opacity=1.0):
    x0, y0 = max(0, int(x0)), max(0, int(y0))
    x1, y1 = min(W, int(x1)), min(H, int(y1))
    if x0 < x1 and y0 < y1:
        region = canvas[y0:y1, x0:x1]
        region *= 1 - opacity
        region += opacity * color


def stroke_layer(draw_fn, sigma=10, gain=1.0, bbox=(0, 0, W, H)):
    """cv2 ile çizilen bir şeklin maskesi + parıltısı, yalnızca `bbox` içinde.

    Parıltı yarım çözünürlükte bulanıklaştırılır; göz farkı görmez, süre yarıya iner."""
    m = np.zeros((H, W), np.float32)
    draw_fn(m)
    x0, y0, x1, y1 = (int(v) for v in bbox)
    crop = np.ascontiguousarray(m[y0:y1, x0:x1])
    small = cv2.resize(crop, (crop.shape[1] // 2, crop.shape[0] // 2), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), sigma / 2)
    glow = cv2.resize(small, (crop.shape[1], crop.shape[0]), interpolation=cv2.INTER_LINEAR) * gain
    return crop, glow, (x0, y0)


def add_layer(canvas, layer, color, opacity=1.0, glow_color=None):
    mask, glow, (x0, y0) = layer
    h, w = mask.shape
    A, B = _blend_terms(mask, glow, color, opacity, glow_color, 1.0, False)
    region = canvas[y0:y0 + h, x0:x0 + w]
    region[:] = cv2.add(cv2.multiply(region, A), B)


# ----------------------------------------------------------- arka plan ----

class Backdrop:
    """Duman, kırmızı ışık, vinyet ve gren. Yumuşak katmanlar yarım çözünürlükte
    hesaplanıp büyütülür."""

    def __init__(self, seed):
        rng = np.random.default_rng(seed)
        self.smoke = []
        for _ in range(6):
            f = rng.standard_normal((40, 24)).astype(np.float32)
            f = cv2.GaussianBlur(f, (0, 0), 2.2)
            f = (f - f.min()) / (f.max() - f.min())
            self.smoke.append(f)
        hh, hw = H // 2, W // 2
        yy, xx = np.mgrid[0:hh, 0:hw].astype(np.float32)
        r = np.sqrt(((xx - hw / 2) / hw) ** 2 + ((yy - hh * 0.42) / hh) ** 2 * 1.4)
        self.red = (np.clip(1 - r / 0.75, 0, 1) ** 2.2).astype(np.float32)
        self.base = np.repeat(np.linspace(0.075, 0.025, hh, dtype=np.float32)[:, None], hw, axis=1)
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((xx - W / 2) / W) ** 2 + ((yy - H * 0.42) / H) ** 2 * 1.4)
        v = (1 - np.clip(r / 0.95, 0, 1) ** 2.4 * 0.85).astype(np.float32)
        self.vignette = cv2.merge([v, v, v])
        self.grain = []
        for _ in range(4):
            g = cv2.resize(rng.standard_normal((hh, hw)).astype(np.float32), (W, H),
                           interpolation=cv2.INTER_LINEAR) * GRAIN
            self.grain.append(cv2.merge([g, g, g]))

    def render(self, t, red_amount):
        period = 3.2
        k = t / period
        i = int(k) % len(self.smoke)
        j = (i + 1) % len(self.smoke)
        a = ease_in_out(k - int(k))
        low = (self.smoke[i] * (1 - a) + self.smoke[j] * a).astype(np.float32)
        low = np.roll(low, int(t * 1.5) % 40, axis=0)
        smoke = cv2.resize(low, (W // 2, H // 2), interpolation=cv2.INTER_CUBIC)
        grey = self.base + smoke * 0.085
        red = self.red * np.float32(red_amount)
        half = cv2.merge([grey + red * DEEP_RED[0], grey + red * DEEP_RED[1], grey + red * DEEP_RED[2]])
        return cv2.resize(half, (W, H), interpolation=cv2.INTER_LINEAR)

    def finish(self, frame, scene):
        # Gren her karede değil, her sahne geçişinde değişir: her karede
        # değişen gren videoyu 6-8 kat büyütüyor, göze ise neredeyse aynı geliyor.
        frame = cv2.multiply(frame, self.vignette)
        return cv2.add(frame, self.grain[scene % len(self.grain)])


def glitch(frame, strength, rng):
    if strength <= 0.01:
        return frame
    out = frame
    shift = int(14 * strength)
    if shift:
        out[..., 0] = np.roll(out[..., 0], shift, axis=1)
        out[..., 2] = np.roll(out[..., 2], -shift, axis=1)
    for _ in range(int(3 + 7 * strength)):
        y = int(rng.integers(0, H - 20))
        h = int(rng.integers(8, 90))
        dx = int(rng.integers(-60, 60) * strength)
        out[y:y + h] = np.roll(out[y:y + h], dx, axis=1)
    return out


# -------------------------------------------------------------- başlık ----

def draw_header(canvas, title, opacity):
    if opacity <= 0:
        return
    label = "PROTESTO TÜRKİYE"
    size = 30
    w = text_width(label, INTER_B, size, 7)
    draw_rect(canvas, W / 2 - w / 2 - 22, 128, W / 2 + w / 2 + 22, 182, DEEP_RED, 0.92 * opacity)
    draw_text(canvas, label, INTER_B, size, W / 2, 155, WHITE, opacity, tracking=7, glow=False)
    draw_text(canvas, title, INTER_SB, 28, W / 2, 222, GREY, 0.85 * opacity, tracking=6, glow=False)


def draw_title_card(canvas, video, t, opacity):
    if opacity <= 0:
        return
    title = video["title"]
    size = fit_size([title], ANTON, 920, 250)
    rise = (1 - ease_out(t / 0.6)) * 40
    draw_text(canvas, "PROTESTO TÜRKİYE", INTER_B, 34, W / 2, 690, RED, opacity, tracking=12,
              glow_gain=0.6)
    draw_text(canvas, title, ANTON, size, W / 2, 860 + rise, WHITE, opacity, glow_gain=1.1,
              scale=1 + (1 - ease_out(t / 0.5)) * 0.08)
    draw_rect(canvas, W / 2 - 70, 1010, W / 2 + 70, 1016, DEEP_RED, opacity)
    draw_text(canvas, video["kicker"].upper(), INTER_SB, 34, W / 2, 1066, GREY, opacity,
              tracking=5, glow=False)


# ------------------------------------------------------------ altyazı ----

def caption_chunks(show):
    """Altyazıyı ekranda 1–3 kelimelik öbeklere böler.

    Önce noktalama yerlerinden cümleciklere ayırır; uzun cümlecikleri eşit
    öbeklere böler ki sonda tek başına bir kelime kalmasın."""
    words = show.split()
    clauses, current = [], []
    for i, word in enumerate(words):
        current.append(i)
        if word.rstrip("*").endswith((".", ",", ":", "?", "!", "…")):
            clauses.append(current)
            current = []
    if current:
        clauses.append(current)
    chunks = []
    for clause in clauses:
        text = " ".join(words[j] for j in clause).replace("*", "")
        if len(clause) <= 3 and len(text) <= 24:
            chunks.append(clause)
            continue
        n = max(math.ceil(len(clause) / 3), math.ceil(len(text) / 22))
        n = min(n, len(clause))
        size = len(clause) / n
        cuts = [round(size * k) for k in range(n + 1)]
        chunks.extend(clause[cuts[k]:cuts[k + 1]] for k in range(n) if cuts[k] < cuts[k + 1])
    return chunks


def emphasis_flags(show):
    flags, inside = [], False
    for word in show.split():
        starts = word.startswith("*")
        if starts:
            inside = True
        flags.append(inside)
        if word.endswith("*") or word.rstrip(".,:!?…").endswith("*"):
            inside = False
    return flags


CAP_SIZE = 76
CAP_LEAD = 96


def layout_chunk(words):
    """Öbeği en fazla iki satıra yerleştirir; her kelimenin merkezini döndürür."""
    clean = [re.sub(r"\*", "", w) for w in words]
    space = font(INTER_XB, CAP_SIZE).getlength(" ")
    widths = [text_width(w, INTER_XB, CAP_SIZE, 1) for w in clean]
    lines, cur, cur_w = [], [], 0
    for i, w in enumerate(widths):
        add = w if not cur else w + space
        if cur and cur_w + add > CAPTION_MAX_W:
            lines.append(cur)
            cur, cur_w = [i], w
        else:
            cur.append(i)
            cur_w += add
    lines.append(cur)
    pos = {}
    top = CAPTION_Y - (len(lines) - 1) * CAP_LEAD / 2
    for li, line in enumerate(lines):
        total = sum(widths[i] for i in line) + space * (len(line) - 1)
        x = W / 2 - total / 2
        for i in line:
            pos[i] = (x + widths[i] / 2, top + li * CAP_LEAD)
            x += widths[i] + space
    return clean, pos


def draw_caption(canvas, line, t):
    """`line["words"]`: [(kelime, başlangıç)], `line["chunks"]`: öbekler."""
    words = line["words"]
    for ci, chunk in enumerate(line["chunks"]):
        start = words[chunk[0]][1]
        end = words[line["chunks"][ci + 1][0]][1] if ci + 1 < len(line["chunks"]) else line["hold_until"]
        if not (start - 0.05 <= t < end):
            continue
        clean, pos = layout_chunk([words[i][0] for i in chunk])
        fade_out = 1 - ease_out((t - (end - 0.08)) / 0.08) if t > end - 0.08 else 1
        for k, wi in enumerate(chunk):
            appear = words[wi][1]
            local = t - appear
            if local < -0.04:
                continue
            o = ease_out((local + 0.04) / 0.14) * fade_out
            cx, cy = pos[k]
            cy += (1 - ease_out((local + 0.04) / 0.2)) * 14
            red = line["emph"][wi]
            color = RED if red else WHITE
            draw_text(canvas, clean[k], INTER_XB, CAP_SIZE, cx, cy, color, o, tracking=1,
                      glow_color=RED if red else WHITE, glow_gain=0.55 if red else 0.35)


# ------------------------------------------------------------ görseller ----

NUM_IN = re.compile(r"\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?")


def counting(value, progress):
    """'%29,73' gibi bir değerin sayarken ara halini üretir."""
    m = NUM_IN.search(value)
    if not m or progress >= 1:
        return value
    raw = m.group(0)
    if "," in raw:
        whole, dec = raw.split(",")
        target = float(whole + "." + dec)
        shown = f"{target * progress:.{len(dec)}f}".replace(".", ",")
    else:
        target = int(raw.replace(".", ""))
        n = int(target * progress)
        shown = f"{n:,}".replace(",", ".") if "." in raw else str(n)
    return value[: m.start()] + shown + value[m.end():]


def draw_label(canvas, text, y, opacity, color=GREY, size=32):
    draw_rect(canvas, W / 2 - 55, y - 44, W / 2 + 55, y - 39, DEEP_RED, opacity)
    draw_text(canvas, text, INTER_SB, size, W / 2, y, color, opacity, tracking=4, glow=False)


def v_stat(canvas, v, tl, ctx):
    o = ease_out(tl / 0.3)
    p = ease_out(tl / 0.9) if v.get("count", True) else 1
    value = counting(v["value"], p)
    size = fit_size([v["value"]], ANTON, 940, 300)
    scale = 1 + (1 - ease_out(tl / 0.35)) * 0.12
    draw_text(canvas, value, ANTON, size, W / 2, VISUAL_Y - 30, WHITE, o, glow_color=RED,
              glow_gain=1.0, scale=scale)
    y = VISUAL_Y - 30 + size * 0.62 + 75
    label_size = 32 if text_width(v["label"], INTER_SB, 32, 4) < 960 else 26
    draw_label(canvas, v["label"], y, o, size=label_size)
    if v.get("sub"):
        so = ease_out((tl - 0.35) / 0.3)
        draw_text(canvas, v["sub"], ANTON, 96, W / 2, y + 110, RED, so, glow_gain=0.8)


def v_big(canvas, v, tl, ctx):
    lines = v["text"].split("\n")
    size = fit_size(lines, ANTON, 900, 270, max_h=700, leading=1.2)
    lead = size * 1.2
    top = VISUAL_Y - 40 - (len(lines) - 1) * lead / 2
    color = RED if v.get("red") else WHITE
    for i, text in enumerate(lines):
        local = tl - i * 0.12
        o = ease_out(local / 0.28)
        rise = (1 - ease_out(local / 0.4)) * 34
        draw_text(canvas, text, ANTON, size, W / 2, top + i * lead + rise, color, o,
                  glow_color=RED if v.get("red") else WHITE, glow_gain=0.75 if v.get("red") else 0.5)
    if v.get("sub"):
        y = top + (len(lines) - 1) * lead + size * 0.62 + 75
        label_size = 32 if text_width(v["sub"], INTER_SB, 32, 4) < 960 else 26
        draw_label(canvas, v["sub"].upper(), y, ease_out((tl - 0.2) / 0.3), size=label_size)


def _fmt(n):
    return f"{n:,}".replace(",", ".")


def v_bars(canvas, v, tl, ctx):
    items = v["items"]
    top_value = max(val for _, val in items)
    prev = ctx.get("prev_n", 0)
    x0, full = 100, 880
    row = 225
    y = VISUAL_Y - 40 - (len(items) - 1) * row / 2 - 50
    for i, (label, val) in enumerate(items[: v["n"]]):
        start = 0 if i < prev else (i - prev) * 0.25
        g = 1 if i < prev else ease_out((tl - start) / 0.9)
        o = 1 if i < prev else ease_out((tl - start) / 0.25)
        color = WHITE if i == 0 else RED
        draw_text(canvas, label, INTER_SB, 36, x0 + text_width(label, INTER_SB, 36, 3) / 2, y,
                  GREY, o, tracking=3, glow=False)
        bw = full * val / top_value * g
        draw_rect(canvas, x0, y + 36, x0 + max(bw, 6), y + 136, color, 0.92 * o)
        amount = f"{_fmt(int(val * g))} {v['unit']}"
        aw = text_width(amount, ANTON, 80)
        ax = x0 + bw + 24 + aw / 2
        inside = ax + aw / 2 > W - 40
        if inside:
            ax = x0 + bw - 24 - aw / 2
        draw_text(canvas, amount, ANTON, 80, ax, y + 86, (0.06, 0.06, 0.07) if inside else WHITE, o,
                  glow=not inside, glow_gain=0.4)
        y += row
    if v.get("label"):
        draw_label(canvas, v["label"], y + 10, ease_out(tl / 0.4), size=28)


def v_list(canvas, v, tl, ctx):
    items = v["items"]
    n = v["n"]
    row = 132
    top = VISUAL_Y - (len(items) - 1) * row / 2 - 30
    for i, (date, place) in enumerate(items[:n]):
        new = i == n - 1
        local = tl if new else 10
        o = ease_out(local / 0.3) * (1.0 if new else 0.5)
        dx = (1 - ease_out(local / 0.45)) * -60
        yy = top + i * row
        draw_rect(canvas, 90 + dx, yy - 24, 104 + dx, yy + 24, DEEP_RED, o)
        draw_text(canvas, date, ANTON, 74, 130 + dx + text_width(date, ANTON, 74) / 2, yy, RED, o,
                  glow_gain=0.5 if new else 0.15)
        draw_text(canvas, place, ANTON, 74, 450 + dx + text_width(place, ANTON, 74) / 2, yy, WHITE, o,
                  glow_gain=0.45 if new else 0.0)
        draw_rect(canvas, 90, yy + row / 2 - 1, 990, yy + row / 2, GREY, 0.18 * o)


def v_stamp(canvas, v, tl, ctx):
    items = v["items"]
    size = fit_size(items, ANTON, 820, 170)
    lead = size * 1.25
    top = VISUAL_Y - 150 - (len(items) - 1) * lead / 2
    for i, name in enumerate(items):
        o = ease_out((tl - i * 0.1) / 0.25)
        y = top + i * lead
        draw_text(canvas, name, ANTON, size, W / 2, y, WHITE, o * 0.9, glow_gain=0.4)
        w = text_width(name, ANTON, size)
        strike = ease_out((tl - 0.3 - i * 0.1) / 0.25)
        draw_rect(canvas, W / 2 - w / 2 - 20, y - 6, W / 2 - w / 2 - 20 + (w + 40) * strike, y + 10,
                  RED, o)
    stamp_y = top + (len(items) - 1) * lead + size * 0.5 + 150
    slam = tl - 0.45
    if slam > 0:
        s = 1 + (1 - ease_out(slam / 0.18)) * 0.7
        draw_stamp(canvas, "ERİŞİM ENGELİ", W / 2, stamp_y, ease_out(slam / 0.12), s)
    if v.get("sub"):
        draw_label(canvas, v["sub"], stamp_y + 190, ease_out((tl - 0.2) / 0.3))


@lru_cache(maxsize=8)
def stamp_sprite(text):
    size = 78
    mask, pad, _ = text_mask(text, ANTON, size, 4)
    h, w = mask.shape
    box = np.zeros((h + 40, w + 40), np.float32)
    box[20:20 + h, 20:20 + w] = mask
    inner = (pad - 18, pad - 26)
    cv2.rectangle(box, (inner[0], inner[1]), (box.shape[1] - inner[0], box.shape[0] - inner[1]), 1.0, 9)
    big = np.zeros((box.shape[0] + 200, box.shape[1] + 200), np.float32)
    big[100:100 + box.shape[0], 100:100 + box.shape[1]] = box
    M = cv2.getRotationMatrix2D((big.shape[1] / 2, big.shape[0] / 2), 6, 1.0)
    rot = cv2.warpAffine(big, M, (big.shape[1], big.shape[0]), flags=cv2.INTER_LINEAR)
    return rot, cv2.GaussianBlur(rot, (0, 0), 9)


def draw_stamp(canvas, text, cx, cy, opacity, scale):
    mask, g = stamp_sprite(text)
    if scale != 1:
        mask = cv2.resize(mask, None, fx=scale, fy=scale)
        g = cv2.resize(g, None, fx=scale, fy=scale)
    blit(canvas, mask * 0.95, cx, cy, RED, opacity, g, RED, 0.9)


def v_quote(canvas, v, tl, ctx):
    words = v["text"].split()
    size, maxw = 66, 860
    f = font(INTER_XB, size)
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if f.getlength(trial) > maxw and cur:
            lines.append(cur)
            cur = w
        else:
            cur = trial
    lines.append(cur)
    lead = 88
    top = VISUAL_Y - (len(lines) - 1) * lead / 2 - 40
    draw_text(canvas, "“", ANTON, 220, 150, top - 110, RED, ease_out(tl / 0.3), glow_gain=0.8)
    for i, line in enumerate(lines):
        o = ease_out((tl - 0.1 - i * 0.09) / 0.3)
        draw_text(canvas, line, INTER_XB, size, 100 + text_width(line, INTER_XB, size) / 2,
                  top + i * lead, WHITE, o, glow_gain=0.25)
    y = top + len(lines) * lead + 40
    draw_rect(canvas, 120, y - 22, 220, y - 17, DEEP_RED, ease_out((tl - 0.5) / 0.3))
    draw_text(canvas, v["cite"], INTER_SB, 30, 120 + text_width(v["cite"], INTER_SB, 30, 4) / 2,
              y + 20, GREY, ease_out((tl - 0.5) / 0.3), tracking=4, glow=False)


# Yıllık TÜFE, TÜİK (yaklaşık aylık seyir; zirve ve son değer etiketli).
CPI = [(2021.0, 15.0), (2021.5, 18.9), (2021.83, 21.3), (2021.92, 36.1), (2022.17, 61.1),
       (2022.42, 78.6), (2022.75, 85.5), (2022.92, 64.3), (2023.17, 50.5), (2023.42, 38.2),
       (2023.67, 61.5), (2023.92, 64.8), (2024.17, 68.5), (2024.33, 75.5), (2024.67, 49.4),
       (2024.92, 44.4), (2025.17, 38.1), (2025.42, 35.1), (2025.67, 33.3), (2025.92, 31.0),
       (2026.25, 32.0), (2026.58, 31.5), (2026.67, 29.7)]
CPI_LABELS = [(6, "EKİM 2022", "%85,51"), (13, "MAYIS 2024", "%75,45"), (22, "EYLÜL 2026", "%29,73")]


def v_chart(canvas, v, tl, ctx):
    x0, x1 = 110, 930
    y_bottom, y_top = 1070, 590
    def pt(year, val):
        x = x0 + (year - 2021.0) / (2026.67 - 2021.0) * (x1 - x0)
        y = y_bottom - val / 90 * (y_bottom - y_top)
        return x, y
    pts = np.array([pt(*p) for p in CPI], np.float32)
    o = ease_out(tl / 0.3)
    draw_text(canvas, "YILLIK ENFLASYON · TÜİK", INTER_SB, 30, W / 2, y_top - 190, GREY, o,
              tracking=4, glow=False)
    draw_rect(canvas, x0, y_bottom, x1, y_bottom + 2, GREY, 0.35 * o)
    y30 = pt(2021, 30)[1]
    for xx in range(x0, x1, 28):
        draw_rect(canvas, xx, y30, xx + 14, y30 + 2, GREY, 0.45 * o)
    draw_text(canvas, "%30", INTER_SB, 28, x1 + 40, y30, GREY, o, glow=False)
    for yr in (2022, 2024, 2026):
        x = pt(yr, 0)[0]
        draw_text(canvas, str(yr), INTER_SB, 26, x, y_bottom + 34, GREY, 0.8 * o, glow=False)
    p = ease_in_out((tl - 0.2) / 2.6)
    total = len(pts) - 1
    upto = p * total
    k = int(upto)
    drawn = list(pts[: k + 1])
    if k < total:
        frac = upto - k
        drawn.append(pts[k] + (pts[k + 1] - pts[k]) * frac)
    if len(drawn) >= 2:
        arr = np.array(drawn, np.int32).reshape(-1, 1, 2)
        layer = stroke_layer(lambda m: cv2.polylines(m, [arr], False, 1.0, 7, cv2.LINE_AA), 12, 1.6,
                             (x0 - 60, y_top - 80, x1 + 60, y_bottom + 60))
        add_layer(canvas, layer, RED, 1.0)
        hx, hy = drawn[-1]
        if p < 1:
            draw_text(canvas, "•", INTER_XB, 90, hx, hy, WHITE, 1.0, glow_color=RED, glow_gain=1.2)
    for idx, when, val in CPI_LABELS:
        if upto >= idx:
            lo = ease_out((upto - idx) / 1.2)
            x, y = pts[idx]
            x = min(max(x, 200), W - 200)
            draw_text(canvas, val, ANTON, 64, x, y - 70, WHITE, lo, glow_color=RED, glow_gain=0.7)
            draw_text(canvas, when, INTER_SB, 24, x, y - 122, GREY, lo, tracking=3, glow=False)


def v_clock(canvas, v, tl, ctx):
    cx, cy, r = W / 2, VISUAL_Y - 90, 270
    span = ctx["span"]
    p = ease_in_out((tl - 1.2) / max(0.5, span - 2.4))
    hours = 8 + 10 * p
    o = ease_out(tl / 0.3)

    def face(m):
        cv2.circle(m, (int(cx), int(cy)), r, 1.0, 6, cv2.LINE_AA)
        for i in range(12):
            a = i / 12 * 2 * math.pi
            inner = r - (40 if i % 3 == 0 else 24)
            cv2.line(m, (int(cx + math.sin(a) * inner), int(cy - math.cos(a) * inner)),
                     (int(cx + math.sin(a) * (r - 8)), int(cy - math.cos(a) * (r - 8))), 1.0,
                     6 if i % 3 == 0 else 3, cv2.LINE_AA)
        ha = (hours % 12) / 12 * 2 * math.pi
        cv2.line(m, (int(cx), int(cy)), (int(cx + math.sin(ha) * r * 0.5), int(cy - math.cos(ha) * r * 0.5)),
                 1.0, 12, cv2.LINE_AA)

    box = (cx - r - 60, cy - r - 60, cx + r + 60, cy + r + 60)
    add_layer(canvas, stroke_layer(face, 10, 0.9, box), WHITE, o)
    ma = (hours % 1) * 2 * math.pi
    hand = stroke_layer(lambda m: cv2.line(m, (int(cx), int(cy)),
                                           (int(cx + math.sin(ma) * r * 0.82), int(cy - math.cos(ma) * r * 0.82)),
                                           1.0, 7, cv2.LINE_AA), 10, 1.4, box)
    add_layer(canvas, hand, RED, o)
    draw_rect(canvas, cx - 14, cy - 14, cx + 14, cy + 14, RED, o)
    h = int(hours)
    m = int((hours - h) * 60)
    draw_text(canvas, f"{h:02d}:{m:02d}", ANTON, 130, W / 2, cy + r + 110, WHITE, o, glow_gain=0.6)
    if p >= 1:
        lo = ease_out((tl - 1.2 - max(0.5, span - 2.4)) / 0.3)
        draw_text(canvas, "10 SAAT", ANTON, 84, W / 2, cy + r + 225, RED, lo, glow_gain=1.0)


def v_scale(canvas, v, tl, ctx):
    cx, cy = W / 2, VISUAL_Y - 170
    o = ease_out(tl / 0.4)
    tilt = math.radians(14) * (1 - math.exp(-tl * 1.6) * math.cos(tl * 5.5))
    arm = 300

    def draw(m):
        cv2.line(m, (int(cx), int(cy - 40)), (int(cx), int(cy + 470)), 1.0, 8, cv2.LINE_AA)
        cv2.line(m, (int(cx - 150), int(cy + 470)), (int(cx + 150), int(cy + 470)), 1.0, 10, cv2.LINE_AA)
        dx, dy = math.cos(tilt) * arm, math.sin(tilt) * arm
        lx, ly, rx, ry = cx - dx, cy - dy, cx + dx, cy + dy
        cv2.line(m, (int(lx), int(ly)), (int(rx), int(ry)), 1.0, 8, cv2.LINE_AA)
        for px, py in ((lx, ly), (rx, ry)):
            bottom = py + 210
            cv2.line(m, (int(px), int(py)), (int(px - 90), int(bottom)), 1.0, 3, cv2.LINE_AA)
            cv2.line(m, (int(px), int(py)), (int(px + 90), int(bottom)), 1.0, 3, cv2.LINE_AA)
            cv2.ellipse(m, (int(px), int(bottom)), (100, 34), 0, 0, 180, 1.0, 7, cv2.LINE_AA)
        cv2.circle(m, (int(cx), int(cy - 40)), 16, 1.0, -1, cv2.LINE_AA)

    box = (cx - arm - 180, cy - arm - 80, cx + arm + 180, cy + 560)
    add_layer(canvas, stroke_layer(draw, 12, 1.0, box), WHITE, o, glow_color=RED)


def v_split(canvas, v, tl, ctx):
    o = ease_out(tl / 0.3)
    apart = ease_in_out((tl - 0.6) / 2.0) * 90
    draw_text(canvas, v["left"], ANTON, 190, W * 0.25 - apart * 0.6, VISUAL_Y - 40, WHITE, o, glow_gain=0.5)
    draw_text(canvas, v["right"], ANTON, 190, W * 0.73 + apart * 0.6, VISUAL_Y - 40, RED, o, glow_gain=0.7)
    rng = np.random.default_rng(4)
    ys = np.linspace(VISUAL_Y - 260, VISUAL_Y + 180, 14)
    xs = W * 0.5 + rng.integers(-26, 26, len(ys))
    grow = ease_out((tl - 0.3) / 0.8)
    n = max(2, int(len(ys) * grow))
    arr = np.stack([xs[:n], ys[:n]], 1).astype(np.int32).reshape(-1, 1, 2)
    box = (W / 2 - 120, VISUAL_Y - 320, W / 2 + 120, VISUAL_Y + 240)
    add_layer(canvas, stroke_layer(lambda m: cv2.polylines(m, [arr], False, 1.0, 5, cv2.LINE_AA), 8, 1.4, box),
              RED, o)


@lru_cache(maxsize=1)
def emblem():
    """Kırmızı daire içinde ay-yıldız (çizimle, logo değil)."""
    size = 300
    m_red = np.zeros((size, size), np.float32)
    c = size // 2
    cv2.circle(m_red, (c, c), 140, 1.0, -1, cv2.LINE_AA)
    m_white = np.zeros((size, size), np.float32)
    cv2.circle(m_white, (c - 18, c), 72, 1.0, -1, cv2.LINE_AA)
    cut = np.zeros((size, size), np.float32)
    cv2.circle(cut, (c + 2, c), 58, 1.0, -1, cv2.LINE_AA)
    m_white = np.clip(m_white - cut, 0, 1)
    star = []
    sx, sy, R, rr = c + 62, c, 34, 13
    for i in range(10):
        a = math.pi / 2 + i * math.pi / 5 + math.pi / 2
        rad = R if i % 2 == 0 else rr
        star.append((sx + math.cos(a) * rad, sy - math.sin(a) * rad))
    cv2.fillPoly(m_white, [np.array(star, np.int32)], 1.0, cv2.LINE_AA)
    return m_red, m_white, cv2.GaussianBlur(m_red, (0, 0), 16)


def v_cta(canvas, v, tl, ctx):
    m_red, m_white, g = emblem()
    o1 = ease_out(tl / 0.3)
    s = 1 + (1 - ease_out(tl / 0.4)) * 0.25
    if s != 1:
        m_red_s = cv2.resize(m_red, None, fx=s, fy=s)
        m_white_s = cv2.resize(m_white, None, fx=s, fy=s)
        g_s = cv2.resize(g, None, fx=s, fy=s)
    else:
        m_red_s, m_white_s, g_s = m_red, m_white, g
    blit(canvas, m_red_s, W / 2, 470, DEEP_RED, o1, g_s, RED, 1.1)
    blit(canvas, m_white_s, W / 2, 470, WHITE, o1)
    o2 = ease_out((tl - 0.25) / 0.3)
    draw_text(canvas, "SEN DE PROTESTO ETMEK İSTİYORSAN", INTER_B, 40, W / 2, 700, WHITE, o2,
              tracking=4, glow_gain=0.4)
    o3 = ease_out((tl - 2.4) / 0.3)
    draw_text(canvas, "BİZDEN HABER BEKLE", INTER_XB, 64, W / 2, 780, WHITE, o3, tracking=3,
              glow_gain=0.5)
    o4 = ease_out((tl - 3.7) / 0.3)
    draw_text(canvas, "TAKİPTE KAL", ANTON, fit_size(["TAKİPTE KAL"], ANTON, 900, 200), W / 2, 972,
              WHITE, o4, glow_gain=0.8, scale=1 + (1 - ease_out((tl - 3.7) / 0.35)) * 0.1)
    o5 = ease_out((tl - 4.9) / 0.3)
    draw_text(canvas, "BU SAYFAYI YAY", ANTON, fit_size(["BU SAYFAYI YAY"], ANTON, 900, 132), W / 2,
              1182, RED, o5, glow_gain=0.8, scale=1 + (1 - ease_out((tl - 4.9) / 0.35)) * 0.1)
    o6 = ease_out((tl - 5.6) / 0.4)
    draw_rect(canvas, 110, 1310, 230, 1314, DEEP_RED, o6)
    draw_rect(canvas, W - 230, 1288, W - 110, 1314, DEEP_RED, o6)
    draw_text(canvas, "PROTESTO TÜRKİYE", INTER_B, 38, W / 2, 1312, WHITE, o6, tracking=9, glow_gain=0.3)
    draw_text(canvas, "BARIŞÇIL · KARARLI · BİRLİKTE", INTER_SB, 28, W / 2, 1380, GREY, o6,
              tracking=6, glow=False)


VISUALS = {
    "stat": v_stat, "big": v_big, "bars": v_bars, "list": v_list, "stamp": v_stamp,
    "quote": v_quote, "chart": v_chart, "clock": v_clock, "scale": v_scale,
    "split": v_split, "cta": v_cta,
}


def draw_visual(canvas, v, tl, ctx, opacity=1.0):
    if opacity >= 0.999:
        VISUALS[v["kind"]](canvas, v, tl, ctx)
        return
    layer = canvas.copy()
    VISUALS[v["kind"]](layer, v, tl, ctx)
    canvas *= 1 - opacity
    canvas += layer * opacity
