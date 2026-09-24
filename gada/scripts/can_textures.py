"""
GADA kutu dokuları.

Kaynak: media-source/ altındaki iki referans görsel (her birinde ÖN, ARKA, SAĞ,
SOL görünüm). Bu betik ambalajı yeniden çizmez; yalnızca fotoğrafları hizalar:

1. Her kutunun silüetini satır satır, alt-piksel hassasiyetinde bulur.
2. Sekiz görünümü aynı kutu formuna (iki ön görünümün ortalama oranı) oturtur.
   Görünümler arasındaki %1-5'lik genişlik farkı burada düzelir; gerçek bir
   silindirin genişliği döndükçe değişmez.
3. Her görünüm için sütun bazlı ışığı çıkarır: I = albedo * L(x) + beyaz * S(x).
   Tarayıcıdaki shader bu profil sayesinde etiketi silindir üzerinde kaydırırken
   stüdyo ışığını sabit tutar.

Çıktılar:
  public/can/{seftali,limon}-{hd,sd}.webp   4 görünümlük atlas (ÖN, SAĞ, ARKA, SOL)
  public/can/isik.png                       8 satırlık ışık profili
  public/img/{seftali,limon}-on.webp       tek görünüm (JS öncesi / yedek)
  lib/can-meta.ts                           shader sabitleri

Gereken: python3, numpy, scipy, pillow.  Çalıştırma:  python3 scripts/can_textures.py
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'media-source')
PUB = os.path.join(ROOT, 'public')

PRODUCTS = [('seftali', 'seftali-4-gorunum.jpg', 25), ('limon', 'limon-4-gorunum.jpg', 51)]
# Görsellerde soldan sağa sıra: ÖN, ARKA, SAĞ, SOL. Atlas sırası dönüş yönüne göre:
# 0° ÖN, 90° SAĞ, 180° ARKA, 270° SOL.
SLOT_FROM_IMAGE = [0, 2, 1, 3]
SCALE = 2.0      # hd atlas: kaynak pikselin 2 katı
SD_SCALE = 0.62  # sd atlas: hd'nin oranı
PAD = 6


def row_edges(d, x0, x1):
    out = {}
    for y in range(40, 905):
        r = d[y, x0 - 20:x1 + 21]
        idx = np.where(r > 25)[0]
        if len(idx) < 8:
            continue
        L, R = idx[0], idx[-1]

        def cross(i, step):
            k = min(3, (R - L) // 2)
            t = r[i + k * step] / 2
            j = i
            while 0 < j < len(r) - 1 and r[j] > t:
                j -= step
            v0, v1 = r[j], r[j + step]
            return j + (t - v0) / (v1 - v0 + 1e-6) * step

        out[y] = (cross(L, 1) + x0 - 20, cross(R, -1) + x0 - 20)
    return out


def find_cans(img):
    d = (255 - img).max(2)
    m = d[500] > 40
    segs, start = [], None
    for x in range(img.shape[1]):
        if m[x] and start is None:
            start = x
        if not m[x] and start is not None:
            if x - start > 50:
                segs.append((start, x - 1))
            start = None
    cans = []
    for x0, x1 in segs:
        e = row_edges(d, x0, x1)
        ys = np.array(sorted(e))
        cans.append(dict(ys=ys, xl=np.array([e[y][0] for y in ys]), xr=np.array([e[y][1] for y in ys])))
    return cans


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def rgb2hsv(a):
    a = a / 255.0
    mx, mn = a.max(-1), a.min(-1)
    d = mx - mn + 1e-9
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 0, d / (mx + 1e-9), 0)
    return h, s, mx


def main():
    images = {}
    cans = {}
    for key, fname, _ in PRODUCTS:
        img = np.asarray(Image.open(os.path.join(SRC, fname)).convert('RGB')).astype(np.float64)
        images[key] = img
        cans[key] = find_cans(img)
        assert len(cans[key]) == 4, (key, len(cans[key]))

    # --- ortak kutu formu: iki ön görünümün profili --------------------------------
    T = np.linspace(0, 1, 2001)
    profiles, heights, ratios = [], [], []
    for key, _, _ in PRODUCTS:
        c = cans[key][0]
        top, bot = c['ys'][0] - 0.5, c['ys'][-1] + 0.5
        H = bot - top
        W = np.median(c['xr'] - c['xl'])
        profiles.append(np.interp(T, (c['ys'] - top) / H, (c['xr'] - c['xl']) / 2 / W))
        heights.append(H)
        ratios.append(H / W)
    hw = np.mean(profiles, 0)
    ratio = float(np.mean(ratios))
    OH = int(round(np.mean(heights) * SCALE))
    body_w = OH / ratio
    OW = int(np.ceil(body_w)) + 2 * PAD
    OW += OW % 2
    cx = OW / 2

    alpha = np.zeros((OH, OW))
    X = np.arange(OW) + 0.5
    ss = 4
    for s in range(ss):
        tt = (np.arange(OH) + (s + 0.5) / ss) / OH
        h = (np.interp(tt, T, hw, left=0, right=0) * body_w)[:, None]
        cov = np.clip(h - np.abs(X[None, :] - cx) + 0.5, 0, 1)
        cov[h[:, 0] < 1.0] = 0
        alpha += cov / ss

    # --- görünümleri hizala -------------------------------------------------------
    aligned = {}
    for key, _, _ in PRODUCTS:
        img = images[key]
        for i, c in enumerate(cans[key]):
            ys, xl, xr = c['ys'], ndi.gaussian_filter1d(c['xl'], 2.0), ndi.gaussian_filter1d(c['xr'], 2.0)
            top, bot = ys[0] - 0.5, ys[-1] + 0.5
            body = (ys > ys[0] + 90) & (ys < ys[-1] - 60)
            centre = np.polyfit(ys[body], (xl[body] + xr[body]) / 2, 1)  # hafif eğikliği düzeltir
            sc = np.median((xr - xl)[body]) / body_w
            sy = top + (np.arange(OH) + 0.5) / OH * (bot - top) - 0.5
            SX = np.polyval(centre, sy)[:, None] + (X[None, :] - cx) * sc - 0.5
            SX = np.clip(SX, (np.interp(sy, ys, xl) + 0.9)[:, None], (np.interp(sy, ys, xr) - 0.9)[:, None])
            SY = np.repeat(sy[:, None], OW, 1)
            out = np.stack([ndi.map_coordinates(img[..., ch], [SY, SX], order=3, mode='nearest') for ch in range(3)], -1)
            out = np.clip(out, 0, 255)
            blur = ndi.gaussian_filter(out, (1.1, 1.1, 0))
            out = np.clip(out + 0.45 * (out - blur), 0, 255)  # yeniden örneklemenin yumuşaklığını dengeler
            aligned[(key, SLOT_FROM_IMAGE[i])] = out

    # --- ışık profili --------------------------------------------------------------
    light = np.zeros((8, OW, 4), np.uint8)
    for p, (key, _, hue) in enumerate(PRODUCTS):
        raw = {}
        for slot in range(4):
            rgb = aligned[(key, slot)]
            h, s, v = rgb2hsv(rgb)
            band = np.zeros((OH, OW), bool)
            band[int(0.12 * OH):int(0.94 * OH)] = True
            m = band & (alpha > 0.99) & (np.abs(h - hue) < 9) & (s > 0.55) & (v > 0.55)
            prof = np.full((OW, 3), np.nan)
            cnt = m.sum(0)
            for x in range(OW):
                if cnt[x] > 40:
                    prof[x] = np.median(rgb[m[:, x], x], 0)
            xs = np.arange(OW)
            for ch in range(3):
                ok = ~np.isnan(prof[:, ch])
                prof[:, ch] = np.interp(xs, xs[ok], prof[ok, ch])
            raw[slot] = ndi.gaussian_filter1d(prof, 2.0, axis=0)
        c0, c1 = int(OW * 0.60), int(OW * 0.70)
        base = np.median(np.concatenate([raw[s][c0:c1] for s in range(4)]), 0)
        for slot in range(4):
            prof = raw[slot]
            Lx, Sx = np.zeros(OW), np.zeros(OW)
            for x in range(OW):
                ok = prof[x] < 249
                if ok.sum() < 2:
                    ok = np.array([False, True, True])
                A = np.stack([base[ok], np.ones(ok.sum())], 1)
                sol, *_ = np.linalg.lstsq(A, prof[x][ok], rcond=None)
                Lx[x], Sx[x] = sol
            Lx = ndi.gaussian_filter1d(np.clip(Lx, 0.25, 1.45), 1.5)
            Sx = ndi.gaussian_filter1d(np.clip(Sx, 0, 99), 1.5)
            light[p * 4 + slot, :, 0] = np.clip(np.round(Lx / 1.5 * 255), 0, 255)
            light[p * 4 + slot, :, 1] = np.clip(np.round(Sx / 100 * 255), 0, 255)
            light[p * 4 + slot, :, 3] = 255
    os.makedirs(os.path.join(PUB, 'can'), exist_ok=True)
    os.makedirs(os.path.join(PUB, 'img'), exist_ok=True)
    Image.fromarray(light, 'RGBA').save(os.path.join(PUB, 'can', 'isik.png'), optimize=True)

    # --- atlaslar ----------------------------------------------------------------
    a8 = np.round(alpha * 255).astype(np.uint8)
    for key, _, _ in PRODUCTS:
        cells = [np.dstack([np.round(aligned[(key, s)]).astype(np.uint8), a8]) for s in range(4)]
        atlas = Image.fromarray(np.concatenate(cells, 1), 'RGBA')
        atlas.save(os.path.join(PUB, 'can', f'{key}-hd.webp'), quality=88, alpha_quality=100, method=6, exact=True)
        sd = atlas.resize((int(round(atlas.width * SD_SCALE)), int(round(atlas.height * SD_SCALE))), Image.LANCZOS)
        sd.save(os.path.join(PUB, 'can', f'{key}-sd.webp'), quality=86, alpha_quality=100, method=6, exact=True)
        # Tek görünümler: WebGL gelmeden önceki ilk kare ve WebGL'siz tarayıcılar için.
        # Ön görünüm tam çözünürlükte, çünkü açılış karesinde büyük gösteriliyor.
        for s, name in enumerate(['on', 'sag', 'arka', 'sol']):
            cell = Image.fromarray(cells[s], 'RGBA')
            if s:
                cell = cell.resize((OW // 2, OH // 2), Image.LANCZOS)
            cell.save(os.path.join(PUB, 'img', f'{key}-{name}.webp'), quality=86, alpha_quality=100, method=6, exact=True)

    meta = dict(
        cellW=OW, cellH=OH, bodyHalfUV=(body_w / 2) / OW, aspect=OW / OH, bodyRatio=ratio,
    )
    with open(os.path.join(ROOT, 'lib', 'can-meta.ts'), 'w') as f:
        f.write('// scripts/can_textures.py tarafından üretildi — elle düzenlemeyin.\n')
        f.write('export const CAN_META = ' + json.dumps(meta, indent=2) + ' as const\n')
    print(json.dumps(meta, indent=2))


if __name__ == '__main__':
    main()
