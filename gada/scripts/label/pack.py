import pickle, sys, json
import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, zoom
from build_texture import PX_PER_DEG

def squeeze(p, s):
    if s == 1: return dict(p)
    img = zoom(p['img'], (1, s, 1), order=3)
    m = zoom(p['mask'].astype(float), (1, s), order=1) > 0.5
    return dict(img=np.clip(img,0,255), mask=m, a0=p['a0']*s, a1=p['a0']*s + m.shape[1]/PX_PER_DEG)

def collide(pa, ca, pb, cb, dil):
    sa = int(round((ca + pa['a0'])*PX_PER_DEG)); sb = int(round((cb + pb['a0'])*PX_PER_DEG))
    ma = pa[dil]
    lo = max(sa, sb); hi = min(sa+ma.shape[1], sb+pb['mask'].shape[1])
    if hi <= lo: return False
    return bool((ma[:, lo-sa:hi-sa] & pb['mask'][:, lo-sb:hi-sb]).any())

def layout(panels, gap_deg):
    g = int(round(gap_deg*PX_PER_DEG))
    for p in panels: p['dil'] = binary_dilation(p['mask'], iterations=g)
    order = [0, 2, 1, 3]
    cen = {0: 0.0}; prev = 0
    for k in order[1:]:
        c = cen[prev] + 10
        while any(collide(panels[j], cen[j], panels[k], c, 'dil') for j in cen): c += 0.25
        cen[k] = c; prev = k
    D = 10.0
    while collide(panels[3], 0.0, panels[0], D, 'dil'): D += 0.25
    total = cen[3] + D
    return cen, total

def solve(name, gap_deg=2.5):
    base, H, panels = pickle.load(open(f'{name}_panels.pkl','rb'))
    best = None
    for s in np.arange(1.0, 0.69, -0.01):
        ps = [panels[0]] + [squeeze(p, s) for p in panels[1:]]
        cen, total = layout(ps, gap_deg)
        print(f'{name} s={s:.2f} total={total:.1f}')
        if total <= 360:
            best = (s, ps, cen, total); break
    s, ps, cen, total = best
    # spread the slack evenly over the four gaps
    slack = 360 - total
    order = [0, 2, 1, 3]
    for i, k in enumerate(order): cen[k] += slack * i / 4
    return base, H, ps, cen, s

def compose(name, base, H, ps, cen):
    W = 2048
    canvas = np.tile(np.array(base, float), (H, W, 1))
    from scipy.ndimage import gaussian_filter
    for k, p in enumerate(ps):
        alpha = binary_dilation(p['mask'], iterations=10).astype(float)
        alpha = gaussian_filter(alpha, 4)
        start = int(round((cen[k] + p['a0'])*PX_PER_DEG))
        cols = (start + np.arange(p['img'].shape[1])) % W
        canvas[:, cols] = canvas[:, cols]*(1-alpha[...,None]) + p['img']*alpha[...,None]
    return canvas

if __name__ == '__main__':
    name = sys.argv[1]
    base, H, ps, cen, s = solve(name)
    tex = compose(name, base, H, ps, cen)
    # put the seam in the middle of the gap between left panel and front
    print('centers', cen, 'squeeze', s)
    Image.fromarray(tex.astype(np.uint8)).save(f'{name}_label_raw.png')
    json.dump({'centers': cen, 'squeeze': s, 'H': H}, open(f'{name}_layout.json','w'))
