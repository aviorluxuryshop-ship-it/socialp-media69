"""Compare geometry-only renders of the locked views taken at two times of day.
Usage: python3 -I scripts/compare_views.py <dir> 1100 2200"""
import sys
import numpy as np
from PIL import Image
d, ta, tb = sys.argv[1], sys.argv[2], sys.argv[3]
ok = True
for v in ['ustten', 'dis', 'uzun', 'kale', 'vip', 'cati', 'bogaz']:
    a = np.asarray(Image.open(f'{d}/{v}_{ta}.png').convert('RGB')).astype(int)
    b = np.asarray(Image.open(f'{d}/{v}_{tb}.png').convert('RGB')).astype(int)
    a[:60] = 0
    b[:60] = 0  # the time box differs by design
    diff = np.abs(a - b).max(axis=2)
    frac = (diff > 2).mean()
    print(f'{v:7s} differing pixels: {frac * 100:.3f}%  max diff {diff.max()}')
    ok &= frac < 0.002
print('IDENTICAL GEOMETRY' if ok else 'MISMATCH')
sys.exit(0 if ok else 1)
