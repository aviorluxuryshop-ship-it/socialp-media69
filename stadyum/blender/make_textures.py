#!/usr/bin/env python3
"""Bakes the textures for the Tupras Stadyumu GLB (system python3: numpy + Pillow).

    python3 stadyum/blender/make_textures.py [--out DIR] [--roof-size 4096] [--only roof,pitch,...]

Outputs (JPEG): roof_top.jpg, pitch.jpg, seats.jpg, glass.jpg

Roof top = planar top-down map of the world x/z plane (+-TEX_X by +-TEX_Z m, north
= top row, west = left column): white membrane cushions (72 radial panels x 3
concentric cushions, thin seams, soft AO) + the lettering "BESIKTAS" (north end,
following the ring curvature), "Tupras" (both long sides, letter tops pointing
outward) and a generic black eagle silhouette (south end). No club crest and no
Tupras logo mark.
"""
import argparse
import math
import os
import sys
import time

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ringlib as RL  # noqa: E402

FONT_URLS = {
    'Montserrat-ExtraBold.ttf': 'https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-ExtraBold.ttf',
}


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def find_font(cache_dir):
    cands = [os.path.join(cache_dir, 'Montserrat-ExtraBold.ttf'),
             os.path.join(HERE, '..', '.qa', 'blender', 'cache', 'Montserrat-ExtraBold.ttf')]
    for c in cands:
        if os.path.exists(c):
            return c
    try:  # best effort download (OFL licensed font)
        import urllib.request
        os.makedirs(cache_dir, exist_ok=True)
        dst = os.path.join(cache_dir, 'Montserrat-ExtraBold.ttf')
        urllib.request.urlretrieve(FONT_URLS['Montserrat-ExtraBold.ttf'], dst)
        return dst
    except Exception as e:  # noqa: BLE001
        print('font download failed:', e)
    for c in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
              '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf']:
        if os.path.exists(c):
            return c
    raise SystemExit('no usable bold font found')


# ----------------------------------------------------------------------------
# lettering + eagle mask (uniform px/m canvas, later squashed to the square map)
# ----------------------------------------------------------------------------
def bez(p0, p1, p2, p3, n=24):
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2, p3 = map(np.array, (p0, p1, p2, p3))
    return ((1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3).tolist()


def eagle_mask(scale_m_per_unit, px_per_m, ss=4):
    """Generic eagle silhouette (own vector shape): returns an 'L' mask. Head is left light."""
    k = scale_m_per_unit * px_per_m * ss
    Wt, Ht = int(60 * k), int(32 * k)
    cx, cy = Wt / 2, 14 * k
    img = Image.new('L', (Wt, Ht), 0)
    d = ImageDraw.Draw(img)

    def P(pts, mx=1):
        return [(cx + mx * x * k, cy + y * k) for x, y in pts]

    # right wing: arched leading edge, then fingered trailing edge (feather tips point down/outwards)
    lead = bez((2.0, -5.5), (8, -11.5), (19, -10.5), (26.5, -2.0), 28)
    tips = [(27.6, 6.0), (25.0, 3.4), (25.4, 9.8), (22.2, 4.6), (21.4, 11.2), (18.6, 5.2), (17.2, 11.6), (14.6, 5.6),
            (12.8, 10.6), (10.4, 5.8), (8.6, 8.8), (6.4, 6.2), (3.4, 6.6)]
    wing = lead + tips
    for mx in (1, -1):
        d.polygon(P(wing, mx), fill=255)
    body = bez((0, -8.6), (3.6, -6.5), (3.4, 2), (2.6, 7)) + [(4.6, 14.5), (1.6, 12.6), (0, 15.5), (-1.6, 12.6), (-4.6, 14.5), (-2.6, 7)] \
        + bez((-2.6, 7), (-3.4, 2), (-3.6, -6.5), (0, -8.6))
    d.polygon(P(body), fill=255)
    # light head, dark beak
    th = np.linspace(0, 2 * math.pi, 40)
    d.polygon(P([(2.2 * math.cos(a), -9.8 + 2.6 * math.sin(a)) for a in th]), fill=70)
    d.polygon(P([(-0.9, -8.6), (0.9, -8.6), (0, -6.2)]), fill=255)
    w, h = Wt // ss, Ht // ss
    return img.resize((w, h), Image.LANCZOS), (cx / ss, cy / ss)


def lettering_mask(font_path, W, Hc, k):
    """Text + eagle mask on a uniform canvas: W x Hc px, k px/m. Row 0 = north (-z)."""
    mask = Image.new('L', (W, Hc), 0)
    ring = RL.Ring(RL.PANEL_D_REF)
    X, Z = RL.TEX_X, RL.TEX_Z

    def px(x):
        return (x + X) * k

    def py(z):
        return (z + Z) * k

    def text_on_ring(text, d_text, t_anchor, em_m, track_m, baseline_shift=0.35):
        font = ImageFont.truetype(font_path, int(round(em_m * k)))
        cap = -font.getbbox('H', anchor='ls')[1]
        ts, x, z, nx, nz, cum = RL.polyline(ring, d_text, 48)
        s_anchor = float(np.interp(t_anchor % ring.P, ts, cum))
        adv = [font.getlength(ch) / k for ch in text]
        total = sum(adv) + track_m * (len(text) - 1)
        s = s_anchor - total / 2
        for ch, a in zip(text, adv):
            sc = (s + a / 2) % cum[-1]
            gx, gz = np.interp(sc, cum, x), np.interp(sc, cum, z)
            gnx, gnz = np.interp(sc, cum, nx), np.interp(sc, cum, nz)
            n = math.hypot(gnx, gnz)
            gnx, gnz = gnx / n, gnz / n
            tw, th = int(a * k * 2 + 40), int(em_m * k * 2.2)
            tile = Image.new('L', (tw, th), 0)
            ImageDraw.Draw(tile).text((tw / 2, th / 2 + cap / 2), ch, font=font, fill=255, anchor='ms')
            ang = math.degrees(math.atan2(-gnx, -gnz))      # CCW degrees: glyph "up" -> outward normal
            rot = tile.rotate(ang, resample=Image.BICUBIC, expand=True)
            mask.paste(255, (int(round(px(gx) - rot.width / 2)), int(round(py(gz) - rot.height / 2))), rot)
            s += a + track_m

    # clockwise ring param: t=0 east, P/4 south, P/2 west, 3P/4 north
    P = ring.P
    text_on_ring('BEŞİKTAŞ', 27.5, 0.75 * P, 12.6, 3.0)
    text_on_ring('Tüpraş', 26.0, 0.0, 12.6, 5.2)          # east: reads top-to-bottom, tops outward
    text_on_ring('Tüpraş', 26.0, 0.5 * P, 12.6, 5.2)      # west: reads bottom-to-top
    # south end: generic eagle (head towards the pitch = up/north)
    em, (ex, ey) = eagle_mask(0.80, k)
    mask.paste(255, (int(px(0) - ex), int(py(RL.B + 27.0) - ey)), em)
    return mask


# ----------------------------------------------------------------------------
# roof top
# ----------------------------------------------------------------------------
def make_roof(size, font_path, out):
    t0 = time.time()
    W = H = size
    X, Z = RL.TEX_X, RL.TEX_Z
    ring = RL.Ring(RL.PANEL_D_REF)
    Lp = ring.P / RL.N_PANELS
    span = RL.ROOF_DOUT - RL.ROOF_DIN
    xs = ((np.arange(W) + 0.5) / W * 2 - 1) * X
    h = np.zeros((H, W), np.float32)
    e = np.zeros((H, W), np.float32)         # distance (m) to nearest cushion seam
    er = np.zeros((H, W), np.float32)        # distance to nearest radial seam
    dmap = np.zeros((H, W), np.float32)
    step = 256
    for r0 in range(0, H, step):
        rows = np.arange(r0, min(H, r0 + step))
        zs = ((rows + 0.5) / H * 2 - 1) * Z
        gx, gz = np.meshgrid(xs, zs)
        t, d, sc = ring.locate(gx, gz)
        pu = (t / Lp) % 1.0
        ud = (d - RL.ROOF_DIN) / span
        pv = (ud * RL.N_CUSHIONS) % 1.0
        h[rows] = RL.pillow(pu, pv)
        dr = np.minimum(pu, 1 - pu) * Lp * sc
        dc = np.minimum(pv, 1 - pv) * span / RL.N_CUSHIONS
        er[rows] = dr
        e[rows] = np.minimum(dr, dc)
        dmap[rows] = d
    print('  roof fields %.1fs' % (time.time() - t0))
    inside = (dmap >= RL.ROOF_DIN) & (dmap <= RL.ROOF_DOUT)

    # baked directional "pillow" shading (light from SW-up) + AO towards the seams
    mpp_x, mpp_z = 2 * X / W, 2 * Z / H
    gzs, gxs = np.gradient(h * RL.PILLOW_AMP, mpp_z, mpp_x)
    lx, lz = 0.55, -0.45                      # light coming from the east / south-ish in top view
    lam = np.clip(-(gxs * lx + gzs * lz) * 2.2, -0.08, 0.08)
    ao = 0.060 * np.exp(-e / 1.1) + 0.025 * np.exp(-e / 3.2)
    ud_all = np.clip((dmap - RL.ROOF_DIN) / span, 0, 1)
    ao = ao + 0.050 * (1 - ud_all) ** 2                      # broad soft shadow towards the inner opening
    shade = 1.0 - ao + lam
    del gxs, gzs, lam

    aa = 0.05
    line_r = 1.0 - smoothstep(0.07, 0.07 + aa * 1.6, er)          # radial seams
    uc = ((dmap - RL.ROOF_DIN) / span * RL.N_CUSHIONS) % 1.0
    dcon = np.minimum(uc, 1 - uc) * span / RL.N_CUSHIONS
    line_c = 1.0 - smoothstep(0.06, 0.06 + aa * 1.6, dcon)         # concentric seams
    del er, e, h

    base = np.array([247, 248, 250], np.float32)
    seam_col = np.array([150, 158, 171], np.float32)
    img = np.empty((H, W, 3), np.float32)
    img[:] = base
    img *= shade[..., None]
    cool = np.clip(ao * 3.0, 0, 0.6)                      # shadowed fabric turns slightly blue-grey
    img[..., 0] *= (1 - 0.35 * cool)
    img[..., 1] *= (1 - 0.18 * cool)
    del cool, ud_all
    # soft low-frequency soiling / fabric variation
    rng = np.random.default_rng(7)
    noise = Image.fromarray((rng.random((96, 96)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
    noise = (np.asarray(noise, np.float32) / 255 - 0.5) * 0.028
    img *= (1.0 + noise)[..., None]
    del noise, shade
    a_line = np.maximum(line_r * 0.72, line_c * 0.34)[..., None]
    img = img * (1 - a_line) + seam_col * a_line
    del line_r, line_c, dcon
    # inner edge: soft shadow under the steel ring; outer 0.9 m = rim bead (grey frame)
    inner = (1.0 - smoothstep(RL.ROOF_DIN, RL.ROOF_DIN + 1.6, dmap)) * 0.20
    img *= (1 - inner)[..., None]
    rim = smoothstep(RL.ROOF_DOUT - 0.95, RL.ROOF_DOUT - 0.85, dmap)[..., None]
    img = img * (1 - rim) + np.array([203, 208, 216], np.float32) * rim
    rimline = (1.0 - smoothstep(0.03, 0.10, np.abs(dmap - (RL.ROOF_DOUT - 0.90))))[..., None] * 0.7
    img = img * (1 - rimline) + np.array([150, 156, 166], np.float32) * rimline
    # outside the roof ring: neutral fill (avoid light/dark bleeding in mip levels)
    out_col = np.where((dmap < RL.ROOF_DIN)[..., None], np.array([196, 200, 208], np.float32),
                       np.array([203, 208, 216], np.float32))
    img = np.where(inside[..., None], img, out_col)
    del dmap, inside, a_line, rim, rimline, inner

    # lettering (drawn uniform-scale, then squashed to the square map)
    k = W / (2 * X)
    Hc = int(round(2 * Z * k))
    mask = lettering_mask(font_path, W, Hc, k).resize((W, H), Image.LANCZOS)
    m = (np.asarray(mask, np.float32) / 255.0)[..., None] * 0.94
    ink = np.array([22, 23, 28], np.float32)
    img = img * (1 - m) + (ink * (0.80 + 0.20 * (img / 250.0))) * m
    Image.fromarray(np.clip(img + 0.5, 0, 255).astype(np.uint8)).save(out, quality=90, subsampling=0, optimize=True)
    print('  roof_top %s  %.1fs  %.2f MB' % (out, time.time() - t0, os.path.getsize(out) / 1e6))


# ----------------------------------------------------------------------------
# pitch / seats / glass
# ----------------------------------------------------------------------------
def make_pitch(out):
    s = 20                                           # px per metre on the working canvas
    W, H = int(RL.PITCH_W * s), int(RL.PITCH_L * s)
    y = np.arange(H)[:, None]
    stripes = 15
    band = (np.floor(y / (H / stripes)).astype(int) % 2)
    c0 = np.array([50, 121, 59], np.float32)
    c1 = np.array([58, 138, 67], np.float32)
    img = np.where(band[..., None] == 1, c1, c0) * np.ones((H, W, 1), np.float32)
    rng = np.random.default_rng(3)
    n = Image.fromarray((rng.random((H // 6, W // 6)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
    img *= (1 + (np.asarray(n, np.float32) / 255 - 0.5) * 0.07)[..., None]
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    g = ImageDraw.Draw(im)
    col = (240, 242, 238)
    lw = int(0.13 * s)
    m = 0.4 * s

    def rect(x0, y0, x1, y1):
        g.rectangle([x0, y0, x1, y1], outline=col, width=lw)

    rect(m, m, W - m, H - m)
    g.line([m, H / 2, W - m, H / 2], fill=col, width=lw)
    cx, cy = W / 2, H / 2
    g.ellipse([cx - 9.15 * s, cy - 9.15 * s, cx + 9.15 * s, cy + 9.15 * s], outline=col, width=lw)
    g.ellipse([cx - 0.25 * s, cy - 0.25 * s, cx + 0.25 * s, cy + 0.25 * s], fill=col)
    for top in (True, False):
        sgn = 1 if top else -1
        y0 = m if top else H - m
        for w, dd in ((40.32, 16.5), (18.32, 5.5)):
            x0 = (W - w * s) / 2
            ya, yb = (y0, y0 + sgn * dd * s)
            rect(x0, min(ya, yb), x0 + w * s, max(ya, yb))
        spot = y0 + sgn * 11 * s
        g.ellipse([cx - 0.25 * s, spot - 0.25 * s, cx + 0.25 * s, spot + 0.25 * s], fill=col)
        # penalty arc (outside the box only)
        arc = Image.new('L', (W, H), 0)
        ImageDraw.Draw(arc).ellipse([cx - 9.15 * s, spot - 9.15 * s, cx + 9.15 * s, spot + 9.15 * s], outline=255, width=lw)
        cut = Image.new('L', (W, H), 0)
        yline = y0 + sgn * 16.5 * s
        ImageDraw.Draw(cut).rectangle([0, yline, W, H] if top else [0, 0, W, yline], fill=255)
        arcm = np.minimum(np.asarray(arc), np.asarray(cut))
        im.paste(Image.new('RGB', (W, H), col), (0, 0), Image.fromarray(arcm))
    for (px_, py_, a0) in ((m, m, 0), (W - m, m, 90), (W - m, H - m, 180), (m, H - m, 270)):
        g.arc([px_ - s, py_ - s, px_ + s, py_ + s], a0, a0 + 90, fill=col, width=lw)
    im = im.resize((1024, 2048), Image.LANCZOS)
    im.save(out, quality=90, optimize=True)
    print('  pitch', out, os.path.getsize(out) / 1e3, 'KB')


def make_seats(out):
    s = 8
    W = H = 256
    im = Image.new('RGB', (W, H), (58, 61, 68))
    g = ImageDraw.Draw(im)
    for i in range(4):
        x0 = i * 64 + 6
        g.rounded_rectangle([x0, 14, x0 + 52, 120], radius=10, fill=(24, 26, 31))          # seat back
        g.rounded_rectangle([x0 + 6, 20, x0 + 46, 70], radius=7, fill=(38, 41, 48))
        g.rounded_rectangle([x0, 126, x0 + 52, 236], radius=10, fill=(29, 31, 37))        # seat cushion
        g.rounded_rectangle([x0 + 5, 132, x0 + 47, 150], radius=6, fill=(50, 54, 62))
    g.rectangle([0, 244, W, 256], fill=(82, 85, 92))                                        # step edge
    im.save(out, quality=92)


def make_glass(out):
    W, H = 128, 256
    y = np.linspace(0, 1, H)[:, None]
    top = np.array([34, 46, 60], np.float32)
    bot = np.array([14, 20, 28], np.float32)
    img = (top * (1 - y) + bot * y)[:, None, :] * np.ones((1, W, 1), np.float32)
    img = np.asarray(img, np.float32)
    # mullions (bay edges + middle) and transoms
    for x0, w in ((0, 3), (W - 3, 3), (W // 2 - 1, 2)):
        img[:, x0:x0 + w] = (66, 72, 80)
    for y0 in (0, int(H * 0.68), H - 4):
        img[y0:y0 + 4, :] = (66, 72, 80)
    Image.fromarray(img.astype(np.uint8)).save(out, quality=92)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=os.path.join(HERE, 'build', 'tex'))
    ap.add_argument('--roof-size', type=int, default=4096)
    ap.add_argument('--only', default='roof,pitch,seats,glass')
    ap.add_argument('--font', default=None)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    only = set(a.only.split(','))
    font = a.font or find_font(os.path.join(a.out, '..', 'cache'))
    print('font:', font)
    if 'pitch' in only:
        make_pitch(os.path.join(a.out, 'pitch.jpg'))
    if 'seats' in only:
        make_seats(os.path.join(a.out, 'seats.jpg'))
    if 'glass' in only:
        make_glass(os.path.join(a.out, 'glass.jpg'))
    if 'roof' in only:
        make_roof(a.roof_size, font, os.path.join(a.out, 'roof_top.jpg'))


if __name__ == '__main__':
    main()
