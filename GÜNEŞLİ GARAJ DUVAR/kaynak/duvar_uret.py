"""Güneşli Garaj duvar giydirme (6000 x 4200 mm) baskı dosyası üretici.

Arka plan: CMYK raster (zengin siyah tonlar, karbon fiber paneller, kırmızı ışıltılar)
Logo + kırmızı çizgiler: orijinal PDF'ten alınan VEKTÖR yollar (sonsuz keskinlik).

Kullanım: python3 -I gen.py <logo.pdf> <out_dir> <ppi> [--variants A,B] [--scales 10,1]
"""
import io, math, os, sys, time
import numpy as np
import pikepdf
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

# ----------------------------------------------------------------------------
# Geometri (mm, net/trim koordinatları, y yukarı, orijin sol-alt)
# ----------------------------------------------------------------------------
TRIM_W, TRIM_H = 6000.0, 4200.0
BLEED = 50.0                      # her kenardan 5 cm taşma payı
FULL_W, FULL_H = TRIM_W + 2 * BLEED, TRIM_H + 2 * BLEED

RED_RGB = np.array([1.0, 0.0, 0.0], np.float32)     # -> CMYK 0/100/100/0 (logo kırmızısı)
RED_CMYK = (0.0, 1.0, 1.0, 0.0)

# Köşe panelleri: sol-üst ve sağ-alt (merkeze göre nokta simetrik)
SLOPE_VEC = np.array([1800.0, 1050.0])
SLOPE_VEC /= np.linalg.norm(SLOPE_VEC)
PANELS = [
    # (P0, yön) -> d>0 panel içi
    (np.array([0.0, 3150.0]), SLOPE_VEC),
    (np.array([6000.0, 1050.0]), -SLOPE_VEC),
]
MAIN_W = 24.0      # ana kırmızı çizgi kalınlığı (mm)
THIN_W = 8.0       # ince kırmızı çizgi
THIN_OFF = 70.0    # panel içine kayıklık
SILVER_OFF = -160.0
SILVER_W = 5.0
GRAIN = 0.0012


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def screen(base, col, amt):
    """base (...,3), col (3,), amt (...)"""
    return 1.0 - (1.0 - base) * (1.0 - col[None, None, :] * amt[..., None])


def carbon(x, y, s=10.0):
    """2x2 twill karbon fiber dokusu, 0..1"""
    u = x / s
    v = y / s
    i = np.floor(u)
    j = np.floor(v)
    fu = u - i
    fv = v - j
    k = np.mod(i + j, 4.0)
    horiz = k < 2.0
    tube_h = np.sqrt(np.sin(np.pi * fv))
    tube_v = np.sqrt(np.sin(np.pi * fu))
    along_h = (k + fu) / 2.0
    along_v = (k - 2.0 + fv) / 2.0
    end_h = 1.0 - 0.30 * np.abs(2.0 * along_h - 1.0) ** 6
    end_v = 1.0 - 0.30 * np.abs(2.0 * along_v - 1.0) ** 6
    # lif çizgileri (ince parlak çizgiler)
    fib_h = 1.0 + 0.07 * np.sin(2 * np.pi * fv * 6.0)
    fib_v = 1.0 + 0.07 * np.sin(2 * np.pi * fu * 6.0)
    val = np.where(horiz, 1.00 * tube_h * end_h * fib_h, 0.58 * tube_v * end_v * fib_v)
    return val.astype(np.float32)


def rgb_to_cmyk(rgb):
    """Tasarım RGB'sini kontrollü CMYK'ya çevirir: tam GCR + koyu bölgelerde zengin siyah,
    toplam mürekkep limiti %290."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    k = 1.0 - mx
    den = np.maximum(mx, 1e-6)
    c0 = (mx - r) / den
    m0 = (mx - g) / den
    y0 = (mx - b) / den
    rich = smoothstep(0.72, 1.0, k)
    c = np.maximum(c0, 0.50 * rich)
    m = np.maximum(m0, 0.40 * rich)
    y = np.maximum(y0, 0.40 * rich)
    tot = c + m + y + k
    lim = 2.90
    over = tot > lim
    sc = np.where(over, (lim - k) / np.maximum(c + m + y, 1e-6), 1.0)
    c, m, y = c * sc, m * sc, y * sc
    return np.stack([c, m, y, k], -1)


def cmyk_to_rgb_preview(cmyk):
    c, m, y, k = [cmyk[..., i] for i in range(4)]
    return np.stack([(1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k)], -1)


def band(d, d0, w, ppmm):
    """kenar yumuşatmalı şerit kaplaması"""
    return np.clip((w / 2.0 - np.abs(d - d0)) * ppmm + 0.5, 0.0, 1.0)


def render_strip(X, Y, ppmm, rng):
    """X: (1,W) mm, Y: (h,1) mm -> RGB float32 (h,W,3)"""
    h, W = Y.shape[0], X.shape[1]
    Xf = np.broadcast_to(X, (h, W))
    Yf = np.broadcast_to(Y, (h, W))

    # 1) radyal zemin
    cx, cy, rx, ry = 3000.0, 2350.0, 3700.0, 2700.0
    rn = np.sqrt(((Xf - cx) / rx) ** 2 + ((Yf - cy) / ry) ** 2)
    L = 0.016 + 0.092 * (1.0 - smoothstep(0.0, 1.15, rn)) ** 1.6

    # 2) çok hafif çapraz ışık huzmesi (sol-üst -> sağ-alt), merkezden geçen
    dvec = np.array([1800.0, -1050.0]); dvec /= np.linalg.norm(dvec)
    dist = (Xf - 3000.0) * (-dvec[1]) + (Yf - 2300.0) * dvec[0]
    L = L + 0.020 * np.exp(-(dist / 650.0) ** 2) * (1.0 - smoothstep(0.3, 1.2, rn))

    # 3) hafif büyük fasetler (araç gövdesi yüzeyleri gibi)
    f1 = (Xf - 0.0) * (-SLOPE_VEC[1]) + (Yf - 2300.0) * SLOPE_VEC[0]   # sol tarafta yatay bant
    L = L + 0.010 * smoothstep(-6, 6, f1 + 900.0) * (1 - smoothstep(-6, 6, f1 + 300.0)) * (1 - smoothstep(0.5, 1.2, rn))

    rgb = np.repeat(L[..., None], 3, axis=-1).astype(np.float32)

    red_glow = np.zeros((h, W), np.float32)
    for (P0, D) in PANELS:
        d = (Xf - P0[0]) * (-D[1]) + (Yf - P0[1]) * D[0]
        t = (Xf - P0[0]) * D[0] + (Yf - P0[1]) * D[1]
        inside = smoothstep(-0.5 / ppmm, 0.5 / ppmm, d - MAIN_W / 2.0)
        if inside.max() > 0:
            cf = carbon(Xf, Yf, 10.0)
            light = 0.45 + 0.75 * np.exp(-np.maximum(d, 0) / 420.0)
            Lp = (0.022 + 0.085 * cf) * light
            # kenarda ince koyu oluk (derinlik)
            groove = band(d, MAIN_W / 2.0 + 9.0, 10.0, ppmm)
            Lp = Lp * (1.0 - 0.75 * groove)
            panel_rgb = np.repeat(Lp[..., None], 3, axis=-1)
            rgb = rgb * (1.0 - inside[..., None]) + panel_rgb * inside[..., None]
        # dış tarafta hafif gölge (panel yükseltisi hissi)
        shadow = np.exp(-np.maximum(-d, 0) / 90.0) * (d < 0)
        rgb = rgb * (1.0 - 0.45 * shadow[..., None])
        # gümüş/krom ince çizgi (ortada parlak, uçlara sönen)
        fade = np.sin(np.clip(t / 2083.0, 0, 1) * np.pi) ** 1.5
        sil = band(d, SILVER_OFF, SILVER_W, ppmm) * fade
        rgb = rgb * (1 - sil[..., None]) + (0.42 * sil)[..., None]
        sil2 = band(d, SILVER_OFF - 28.0, 2.5, ppmm) * fade * 0.6
        rgb = rgb * (1 - sil2[..., None]) + (0.30 * sil2)[..., None]
        # kırmızı ışıltı
        red_glow += 0.55 * np.exp(-(d / 38.0) ** 2) + 0.09 * np.exp(-(d / 170.0) ** 2) \
            + 0.25 * np.exp(-((d - THIN_OFF) / 20.0) ** 2)

    rgb = screen(rgb, RED_RGB, np.clip(red_glow, 0, 1))

    # kırmızı çizgilerin raster karşılığı (vektörün altında aynı geometri)
    for (P0, D) in PANELS:
        d = (Xf - P0[0]) * (-D[1]) + (Yf - P0[1]) * D[0]
        cov = np.maximum(band(d, 0.0, MAIN_W, ppmm), band(d, THIN_OFF, THIN_W, ppmm))
        rgb = rgb * (1 - cov[..., None]) + RED_RGB[None, None, :] * cov[..., None]

    # 4) vinyet
    vig = 1.0 - 0.40 * smoothstep(0.55, 1.30, rn)
    rgb = rgb * vig[..., None]

    # 5) ince gren (bantlanmayı önler)
    rgb = rgb + rng.normal(0.0, GRAIN, size=(h, W, 1)).astype(np.float32)
    return np.clip(rgb, 0.0, 1.0)


def render_background(ppi, preview_px=None, seed=7):
    ppmm = ppi / 25.4
    W = int(round(FULL_W * ppmm))
    H = int(round(FULL_H * ppmm))
    print(f"arka plan {W} x {H} px @ {ppi} ppi (1:1)", flush=True)
    out = np.empty((H, W, 4), np.uint8)
    X = (-BLEED + (np.arange(W, dtype=np.float32) + 0.5) / ppmm)[None, :]
    rng = np.random.default_rng(seed)
    strip = max(64, int(4_000_000 // W))
    t0 = time.time()
    for r0 in range(0, H, strip):
        r1 = min(H, r0 + strip)
        Y = (TRIM_H + BLEED - (np.arange(r0, r1, dtype=np.float32) + 0.5) / ppmm)[:, None]
        rgb = render_strip(X, Y, ppmm, rng)
        cmyk = rgb_to_cmyk(rgb)
        out[r0:r1] = np.round(cmyk * 255.0).astype(np.uint8)
        if (r0 // strip) % 10 == 0:
            print(f"  satır {r1}/{H}  {time.time() - t0:.0f}s", flush=True)
    return out


# ----------------------------------------------------------------------------
# Logo (vektör) – orijinal yollar, siyah -> beyaz
# ----------------------------------------------------------------------------
def extract_logo(path):
    pdf = pikepdf.open(path)
    pg = pdf.pages[0]
    objs = []
    cur = None
    ops = []
    pts = []
    for operands, op in pikepdf.parse_content_stream(pg):
        o = str(op)
        if o == 'scn':
            cur = tuple(float(x) for x in operands)
        elif o in ('m', 'l', 'c', 'h'):
            ops.append((o, [float(x) for x in operands]))
            vals = [float(x) for x in operands]
            pts += list(zip(vals[0::2], vals[1::2]))
        elif o in ('f', 'f*'):
            xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
            objs.append(dict(color=cur, fill=o, ops=ops, bbox=(min(xs), min(ys), max(xs), max(ys))))
            ops = []; pts = []
    return objs


def recolor(col):
    c, m, y, k = col
    if abs(c - 0.502) < 0.01 and abs(k - 1) < 0.01:   # zengin siyah -> beyaz
        return (0.0, 0.0, 0.0, 0.0)
    if c == 0 and m == 0 and y == 0 and k == 1:        # PLAST siyahı -> beyaz
        return (0.0, 0.0, 0.0, 0.0)
    return col                                         # kırmızı / mavi aynen


def group_stream(objs):
    parts = []
    for ob in objs:
        c, m, y, k = recolor(ob['color'])
        parts.append(f"{c:.4f} {m:.4f} {y:.4f} {k:.4f} k")
        for o, v in ob['ops']:
            parts.append(' '.join(f"{a:.4f}" for a in v) + (' ' if v else '') + o)
        parts.append(ob['fill'])
    bb = (min(o['bbox'][0] for o in objs), min(o['bbox'][1] for o in objs),
          max(o['bbox'][2] for o in objs), max(o['bbox'][3] for o in objs))
    return '\n'.join(parts).encode(), bb


# ----------------------------------------------------------------------------
# Yerleşim
# ----------------------------------------------------------------------------
def layout(variant, gg_bb, abs_bb):
    """döndürür: [(grup, ölçek mm/pt, tx, ty)], ekstra vektör şekiller"""
    gw, gh = gg_bb[2] - gg_bb[0], gg_bb[3] - gg_bb[1]
    aw, ah = abs_bb[2] - abs_bb[0], abs_bb[3] - abs_bb[1]
    place = []
    shapes = []
    if variant == 'A':
        GG_W, ABS_W = 3500.0, 1900.0
        s_g = GG_W / gw; s_a = ABS_W / aw
        H_g, H_a = gh * s_g, ah * s_a
        gap1, gap2 = 200.0, 200.0
        total = H_g + gap1 + gap2 + H_a
        top = 2260.0 + total / 2.0
        gy0 = top - H_g
        div_y = gy0 - gap1
        ay0 = div_y - gap2 - H_a
        place.append(('GG', s_g, 3000.0 - GG_W / 2 - s_g * gg_bb[0], gy0 - s_g * gg_bb[1]))
        place.append(('ABS', s_a, 3000.0 - ABS_W / 2 - s_a * abs_bb[0], ay0 - s_a * abs_bb[1]))
        shapes.append(taper(3000.0 - 1250.0, 3000.0 + 1250.0, div_y, 9.0))
    else:
        GG_W = 3700.0
        s_g = GG_W / gw
        H_g = gh * s_g
        gy0 = 2300.0 - H_g / 2.0 + 60.0
        place.append(('GG', s_g, 3000.0 - GG_W / 2 - s_g * gg_bb[0], gy0 - s_g * gg_bb[1]))
        shapes.append(taper(3000.0 - 1300.0, 3000.0 + 1300.0, gy0 - 230.0, 9.0))
    # "LUXURY CAR DESIGN" yanlarına kırmızı sivrilen çizgiler
    _, s_g, tx, ty = place[0]
    lux_x0, lux_x1, lux_y0, lux_y1 = 590.0, 1738.0, 503.0, 558.0
    yc = ty + s_g * (lux_y0 + lux_y1) / 2.0
    thick = s_g * 6.0
    gap = s_g * 45.0
    ln = s_g * 290.0
    xl = tx + s_g * lux_x0 - gap
    xr = tx + s_g * lux_x1 + gap
    shapes.append(half_taper(xl, xl - ln, yc, thick))
    shapes.append(half_taper(xr, xr + ln, yc, thick))
    return place, shapes


def taper(x0, x1, y, t):
    xm = (x0 + x1) / 2.0
    return [(x0, y), (xm, y + t / 2), (x1, y), (xm, y - t / 2)]


def half_taper(x_thick, x_point, y, t):
    return [(x_thick, y + t / 2), (x_point, y), (x_thick, y - t / 2)]


def panel_line_polys():
    polys = []
    big = 9000.0
    for (P0, D) in PANELS:
        N = np.array([-D[1], D[0]])
        for off, w in ((0.0, MAIN_W), (THIN_OFF, THIN_W)):
            c0 = P0 + N * off - D * big
            c1 = P0 + N * off + D * big
            polys.append([tuple(c0 + N * w / 2), tuple(c1 + N * w / 2), tuple(c1 - N * w / 2), tuple(c0 - N * w / 2)])
    return polys


def poly_ops(poly):
    s = [f"{poly[0][0]:.3f} {poly[0][1]:.3f} m"]
    s += [f"{x:.3f} {y:.3f} l" for x, y in poly[1:]]
    s.append("h f")
    return '\n'.join(s)


def build_pdf(out_path, jpeg_bytes, img_w, img_h, logo_groups, place, shapes, scale_div, title):
    """scale_div=10 -> 1:10 ölçek; 1 -> 1:1"""
    pdf = pikepdf.new()
    f = 72.0 / 25.4 / scale_div          # mm -> pt
    pw, ph = FULL_W * f, FULL_H * f
    page = pdf.add_blank_page(page_size=(pw, ph))
    page.MediaBox = pikepdf.Array([0, 0, pw, ph])
    page.BleedBox = pikepdf.Array([0, 0, pw, ph])
    page.TrimBox = pikepdf.Array([BLEED * f, BLEED * f, (BLEED + TRIM_W) * f, (BLEED + TRIM_H) * f])
    page.CropBox = pikepdf.Array([0, 0, pw, ph])

    img = pikepdf.Stream(pdf, jpeg_bytes)
    img.Type = pikepdf.Name.XObject
    img.Subtype = pikepdf.Name.Image
    img.Width = img_w
    img.Height = img_h
    img.ColorSpace = pikepdf.Name.DeviceCMYK
    img.BitsPerComponent = 8
    img.Filter = pikepdf.Name.DCTDecode
    img.Decode = pikepdf.Array([1, 0, 1, 0, 1, 0, 1, 0])   # Adobe ters CMYK JPEG
    img.Interpolate = True

    xobjs = pikepdf.Dictionary(Im0=img)
    for name, (stream, bb) in logo_groups.items():
        fx = pikepdf.Stream(pdf, stream)
        fx.Type = pikepdf.Name.XObject
        fx.Subtype = pikepdf.Name.Form
        fx.BBox = pikepdf.Array([bb[0] - 2, bb[1] - 2, bb[2] + 2, bb[3] + 2])
        fx.Resources = pikepdf.Dictionary()
        xobjs['/Fm' + name] = fx
    page.Resources = pikepdf.Dictionary(XObject=xobjs)

    c = []
    c.append(f"q {f:.6f} 0 0 {f:.6f} {BLEED * f:.4f} {BLEED * f:.4f} cm")   # -> net mm koordinatları
    c.append(f"{-BLEED} {-BLEED} {FULL_W} {FULL_H} re W n")
    c.append(f"q {FULL_W} 0 0 {FULL_H} {-BLEED} {-BLEED} cm /Im0 Do Q")
    c.append("%.1f %.1f %.1f %.1f k" % RED_CMYK)
    for poly in panel_line_polys():
        c.append(poly_ops(poly))
    for poly in shapes:
        c.append(poly_ops(poly))
    for name, s, tx, ty in place:
        c.append(f"q {s:.6f} 0 0 {s:.6f} {tx:.4f} {ty:.4f} cm /Fm{name} Do Q")
    c.append("Q")
    page.Contents = pdf.make_stream('\n'.join(c).encode())
    with pdf.open_metadata() as meta:
        meta['dc:title'] = title
    pdf.docinfo['/Title'] = title
    pdf.docinfo['/Creator'] = 'Güneşli Garaj duvar giydirme'
    pdf.save(out_path, compress_streams=True)


def main():
    logo_path, out_dir, ppi = sys.argv[1], sys.argv[2], float(sys.argv[3])
    variants = ['A', 'B']
    scales = [10]
    quality = 90
    for a in sys.argv[4:]:
        if a.startswith('--variants='):
            variants = a.split('=')[1].split(',')
        if a.startswith('--scales='):
            scales = [int(v) for v in a.split('=')[1].split(',')]
        if a.startswith('--q='):
            quality = int(a.split('=')[1])
    os.makedirs(out_dir, exist_ok=True)

    objs = extract_logo(logo_path)
    gg = [o for o in objs if o['bbox'][1] > 450]
    ab = [o for o in objs if o['bbox'][1] <= 450]
    groups = {'GG': group_stream(gg), 'ABS': group_stream(ab)}
    print('GG bbox', groups['GG'][1], 'ABS bbox', groups['ABS'][1])

    bg = render_background(ppi)
    H, W = bg.shape[:2]
    t0 = time.time()
    buf = io.BytesIO()
    Image.fromarray(bg, 'CMYK').save(buf, 'JPEG', quality=quality, optimize=True, dpi=(ppi, ppi))
    jpeg = buf.getvalue()
    print(f"JPEG {len(jpeg) / 1e6:.1f} MB ({time.time() - t0:.0f}s)")
    del bg

    names = {'A': 'GunesliGaraj+ABSPlast', 'B': 'GunesliGaraj'}
    for v in variants:
        place, shapes = layout(v, groups['GG'][1], groups['ABS'][1])
        used = {n: groups[n] for n, *_ in place}
        for sd in scales:
            tag = 'OLCEK-1-10' if sd == 10 else 'OLCEK-1-1'
            fn = os.path.join(out_dir, f"{names[v]}_Duvar_600x420cm_{tag}.pdf")
            build_pdf(fn, jpeg, W, H, used, place, shapes, sd,
                      f"Güneşli Garaj Duvar Giydirme 600x420 cm ({tag})")
            print('yazıldı', fn, f"{os.path.getsize(fn) / 1e6:.1f} MB")


if __name__ == '__main__':
    main()
