"""Re-set the peach front flavour line whose first letters the source render smeared.

Same words, same position, cap height, width, slope and silver finish as the
render; only the broken glyphs are replaced by clean ones.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

FONT = 'fonts/FiraSansCondensed-Bold.ttf'
BASE = np.array((245,108,4), float)
LINES = [  # text, left, right, cap top, baseline (at left end)
    ('ŞEFTALİ VE ÇAY', 1666, 2002, 1205, 1238),
    ('AROMALI İÇECEK', 1664, 2021, 1269, 1301),
]
SLOPE = 3/120.0  # baseline drops ~3px per 120px in the render

def render_line(text, left, right, cap_top, baseline, S=6):
    ft = ImageFont.truetype(FONT, 400)
    cap = ft.getbbox('H')  # (x0,y0,x1,y1) of a cap
    cap_h = cap[3]-cap[1]
    bb = ft.getbbox(text)
    W = bb[2]-bb[0] + 40; H = 700
    m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
    oy = 150 - cap[1]  # put cap top at y=150
    d.text((20-bb[0], oy), text, font=ft, fill=255)
    arr = np.asarray(m)
    cols = np.where(arr.max(0) > 0)[0]
    arr = arr[:, cols.min():cols.max()+1]
    # scale: cap height -> target, width -> target
    tgt_cap = baseline - cap_top + 1; tgt_w = right - left + 1
    sy = tgt_cap / cap_h; sx = tgt_w / arr.shape[1]
    out = Image.fromarray(arr).resize((tgt_w, int(round(arr.shape[0]*sy))), Image.LANCZOS)
    top_off = int(round(150*sy))  # rows above cap top in scaled image
    return np.asarray(out).astype(float)/255.0, top_off, sx/sy

import sys
SRC, DST = sys.argv[1], sys.argv[2]

def main():
    img = np.asarray(Image.open(SRC).convert('RGB')).astype(float)
    # clear the old lines (area holds only this text on flat orange)
    y0, y1, x0, x1 = 1186, 1312, 1650, 2032
    # fill the cleared box by diffusing its border inward so it meets the
    # surrounding print without a visible edge
    box = img[y0-1:y1+1, x0-1:x1+1].copy()
    box[1:-1, 1:-1] = BASE
    for _ in range(1500):
        box[1:-1, 1:-1] = 0.25*(box[:-2,1:-1]+box[2:,1:-1]+box[1:-1,:-2]+box[1:-1,2:])
    img[y0:y1, x0:x1] = box[1:-1, 1:-1]
    for (text, left, right, cap_top, baseline) in LINES:
        a, top_off, ratio = render_line(text, left, right, cap_top, baseline)
        print(text, 'width/height stretch vs font', round(ratio,3))
        h, w = a.shape
        yy = cap_top - top_off
        for x in range(w):
            dy = int(round((x - 100) * SLOPE))
            col = a[:, x]
            ys = np.arange(h) + yy + dy
            ok = (ys >= 0) & (ys < img.shape[0])
            ys = ys[ok]; al = col[ok]
            # silver: light at the cap top, deeper toward the baseline, warm cast
            t = np.clip((ys - cap_top) / (baseline - cap_top), 0, 1.25)
            top = np.array((236, 224, 214)); bot = np.array((176, 164, 156))
            silver = top*(1-t[:,None]) + bot*t[:,None]
            # thin darker rim like the printed edge
            cur = img[ys, left + x]
            img[ys, left + x] = cur*(1-al[:,None]) + silver*al[:,None]
    # soft edge to match the render's sharpness
    Image.fromarray(np.clip(img,0,255).astype(np.uint8)).save(DST)

main()
