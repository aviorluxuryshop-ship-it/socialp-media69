import sys, json, subprocess
import numpy as np
from PIL import Image, ImageFilter
from build_texture import PX_PER_DEG
name = sys.argv[1]; src = sys.argv[2]
lay = json.load(open(f'{name}_layout.json'))
base = {'lemon': (245,207,5), 'peach': (245,108,4)}[name]
img = np.asarray(Image.open(src).convert('RGB')).astype(float)
W = img.shape[1]
d = np.sqrt(((img - np.array(base,float))**2).sum(2))
cnt = (d > 40).sum(0).astype(float)
# widen: a seam column should sit in the middle of an empty run
sm = np.convolve(np.concatenate([cnt[-40:], cnt, cnt[:40]]), np.ones(81), 'valid')
seam = int(np.argmin(sm))
rolled = np.roll(img, -seam, axis=1)
frontU = ((0 - seam) % W) / W
print(name, 'seam col', seam, 'content there', int(sm[seam]), 'frontU', round(frontU,4))
out = Image.fromarray(np.clip(rolled,0,255).astype(np.uint8))
out = out.filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))
out.save(f'{name}_label_final.png')
out.save(f'{name}-label.webp', quality=90, method=6)
out.save(f'{name}-label.jpg', quality=88, optimize=True, progressive=True)
small = out.resize((1024, round(out.height*1024/W)), Image.LANCZOS)
small.save(f'{name}-label-1k.webp', quality=88, method=6)
lay['frontU'] = frontU; lay['width'] = W; lay['height'] = out.height
json.dump(lay, open(f'{name}_layout.json','w'))
