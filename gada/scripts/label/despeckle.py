"""Remove low-contrast smudges left by the renders' shading at panel edges.

A printed element is either strongly different from the can colour or
connected to something that is; a faint isolated blotch is neither.
"""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import label, binary_dilation, find_objects

name, src, dst = sys.argv[1:4]
base = np.array({'lemon': (245,207,5), 'peach': (245,108,4)}[name], float)
img = np.asarray(Image.open(src).convert('RGB')).astype(float)
d = np.sqrt(((img-base)**2).sum(2))
lab, n = label(d > 22)
removed = 0
kill = np.zeros(d.shape, bool)
for i, sl in enumerate(find_objects(lab), 1):
    comp = lab[sl] == i
    area = comp.sum()
    peak = d[sl][comp].max()
    if peak < 62 and 250 <= area < 6000:
        kill[sl] |= comp; removed += 1
kill = binary_dilation(kill, iterations=9)
# diffuse-fill the killed pixels from their surroundings
out = img.copy()
out[kill] = base
for _ in range(400):
    blur = out.copy()
    blur[1:-1,1:-1] = 0.25*(out[:-2,1:-1]+out[2:,1:-1]+out[1:-1,:-2]+out[1:-1,2:])
    out[kill] = blur[kill]
print(name, 'components', n, 'removed', removed, 'px', int(kill.sum()))
Image.fromarray(np.clip(out,0,255).astype(np.uint8)).save(dst)
Image.fromarray((kill*255).astype(np.uint8)).save(f'{name}_killmask.png')
