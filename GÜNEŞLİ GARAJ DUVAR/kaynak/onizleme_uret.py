"""Baskı PDF'inden önizleme + ölçülü sunum görseli üretir.
python3 -I preview.py <pdf> <onizleme.jpg> <olculu.jpg> <başlık>"""
import sys
import pymupdf
from PIL import Image, ImageDraw, ImageFont

pdf_path, out_prev, out_dim, title = sys.argv[1:5]
doc = pymupdf.open(pdf_path)
page = doc[0]
trim = page.trimbox
# trim alanını 3000 px genişlikte render et
zoom = 3000 / trim.width
pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=trim, colorspace=pymupdf.csRGB)
img = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
img.save(out_prev, quality=92, dpi=(150, 150))

# ölçülü sunum
W, H = img.size
art_w = 2400
art = img.resize((art_w, round(H * art_w / W)), Image.LANCZOS)
aw, ah = art.size
ml, mt, mr, mb = 170, 170, 230, 230
canvas = Image.new('RGB', (ml + aw + mr, mt + ah + mb), (245, 245, 243))
canvas.paste(art, (ml, mt))
d = ImageDraw.Draw(canvas)
f_dim = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 46)
f_t = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 40)
f_s = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Medium.otf' if False else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 28)
ink = (30, 30, 30)
red = (220, 20, 30)


def arrow_h(y, x0, x1, label):
    d.line([(x0, y), (x1, y)], fill=ink, width=3)
    for x, s in ((x0, 1), (x1, -1)):
        d.polygon([(x, y), (x + s * 26, y - 11), (x + s * 26, y + 11)], fill=ink)
    d.line([(x0, y - 30), (x0, y + 30)], fill=ink, width=3)
    d.line([(x1, y - 30), (x1, y + 30)], fill=ink, width=3)
    tw = d.textlength(label, font=f_dim)
    cx = (x0 + x1) / 2
    d.rectangle([cx - tw / 2 - 22, y - 34, cx + tw / 2 + 22, y + 34], fill=(245, 245, 243))
    d.text((cx - tw / 2, y - 29), label, font=f_dim, fill=ink)


def arrow_v(x, y0, y1, label):
    d.line([(x, y0), (x, y1)], fill=ink, width=3)
    for y, s in ((y0, 1), (y1, -1)):
        d.polygon([(x, y), (x - 11, y + s * 26), (x + 11, y + s * 26)], fill=ink)
    d.line([(x - 30, y0), (x + 30, y0)], fill=ink, width=3)
    d.line([(x - 30, y1), (x + 30, y1)], fill=ink, width=3)
    txt = Image.new('RGBA', (400, 80), (0, 0, 0, 0))
    td = ImageDraw.Draw(txt)
    tw = td.textlength(label, font=f_dim)
    td.rectangle([200 - tw / 2 - 22, 6, 200 + tw / 2 + 22, 74], fill=(245, 245, 243, 255))
    td.text((200 - tw / 2, 11), label, font=f_dim, fill=ink)
    txt = txt.rotate(90, expand=True)
    cy = (y0 + y1) / 2
    canvas.paste(txt, (int(x - 40), int(cy - 200)), txt)


arrow_h(mt - 85, ml, ml + aw, '600 cm')
arrow_v(ml + aw + 95, mt, mt + ah, '420 cm')
d.rectangle([ml - 1, mt - 1, ml + aw, mt + ah], outline=(120, 120, 120), width=2)
d.text((ml, mt + ah + 60), title, font=f_t, fill=ink)
d.rectangle([ml, mt + ah + 120, ml + 90, mt + ah + 126], fill=red)
d.text((ml, mt + ah + 145),
       'Baskı dosyası: 1:10 ölçekli vektörel PDF (CMYK) · Net 600 × 420 cm + her kenarda 5 cm taşma payı',
       font=f_s, fill=(70, 70, 70))
canvas.save(out_dim, quality=92, dpi=(150, 150))
print('ok', img.size, canvas.size)
