"""
Paylaşım görseli (1200x630): gerçek kutu görünümleri + marka adı.
Yazı tipi olarak Archivo'yu Google Fonts'tan indirir.
Çalıştırma: python3 scripts/og_image.py   (önce scripts/can_textures.py)
"""
import io
import os
import re
import urllib.request

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def archivo(wdth, wght):
    css_url = f'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@{wdth},{wght}'
    req = urllib.request.Request(css_url, headers={'User-Agent': 'Mozilla/5.0'})
    css = urllib.request.urlopen(req).read().decode()
    ttf = re.search(r'url\((https://[^)]+\.ttf)\)', css).group(1)
    return urllib.request.urlopen(ttf).read()


def main():
    W, H = 1200, 630
    img = Image.new('RGB', (W, H), (247, 231, 216))
    bold = archivo(62.5, 800)
    semi = archivo(100, 600)

    # arka plandaki büyük yazı, sitedeki açılışla aynı
    d = ImageDraw.Draw(img)
    big = ImageFont.truetype(io.BytesIO(bold), 430)
    tb = d.textbbox((0, 0), 'GADA', font=big)
    d.text(((W - (tb[2] - tb[0])) / 2 - tb[0], (H - (tb[3] - tb[1])) / 2 - tb[1] + 10), 'GADA', font=big, fill=(244, 213, 186))

    cans = []
    for name in ['seftali', 'limon']:
        c = Image.open(os.path.join(ROOT, 'public', 'img', f'{name}-on.webp')).convert('RGBA')
        h = 520
        cans.append(c.resize((round(c.width * h / c.height), h), Image.LANCZOS))
    cw = cans[0].width
    gap = 34
    x0 = (W - (2 * cw + gap)) // 2
    y0 = (H - 520) // 2 + 8
    for i, c in enumerate(cans):
        x = x0 + i * (cw + gap)
        shadow = Image.new('L', (W, H), 0)
        ImageDraw.Draw(shadow).ellipse((x - 20, y0 + 500, x + cw + 20, y0 + 532), fill=110)
        shadow = shadow.filter(ImageFilter.GaussianBlur(12))
        img.paste((120, 70, 40), (0, 0), shadow)
        img.paste(c, (x, y0), c)

    small = ImageFont.truetype(io.BytesIO(semi), 19)
    d = ImageDraw.Draw(img)
    d.text((48, 40), 'G A D A', font=small, fill=(21, 35, 26))
    d.text((48, H - 58), 'ŞEFTALİ  ·  LİMON  —  330 ML', font=small, fill=(21, 35, 26))
    tb = d.textbbox((0, 0), 'BAYBURT / TÜRKİYE', font=small)
    d.text((W - 48 - (tb[2] - tb[0]), H - 58), 'BAYBURT / TÜRKİYE', font=small, fill=(21, 35, 26))

    out = os.path.join(ROOT, 'app', 'opengraph-image.jpg')
    img.save(out, quality=88, optimize=True, progressive=True)
    img.save(os.path.join(ROOT, 'app', 'twitter-image.jpg'), quality=88, optimize=True, progressive=True)
    print('yazıldı', out)


if __name__ == '__main__':
    main()
