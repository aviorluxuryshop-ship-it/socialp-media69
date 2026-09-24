"""Unwrap the four GADA can views into one 360° label texture.

Each view is an (almost) orthographic render of a cylinder, so a label point
at angle a from the view axis sits at x = cx + r(y)·sin(a). The renders were
generated independently and do not agree with each other geometrically, so
instead of stitching whole views the script lifts only each view's own
central panel, masks its artwork, and packs the four panels around the
circumference so that no two pieces of artwork collide in 2D.
"""
import json, pickle, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import map_coordinates, binary_dilation, gaussian_filter, binary_closing, binary_fill_holes, binary_opening
from delight import CFG, run

PX_PER_DEG = 2048/360.0
# first photo row that can hold print per view (front, back, right, left);
# above it the render only has shoulder highlights
TOPCUT = {'lemon': [200, 148, 200, 200], 'peach': [200, 148, 200, 200]}
R_REF = 150.0

# usable angular window per view (relative to view axis), chosen to exclude
# the edge bleed of neighbouring artwork measured in measure step
WINDOWS = {
 'lemon': [(-72, 73), (-54, 59), (-40, 51), (-45, 55)],
 'peach': [(-73, 73), (-54, 59), (-48, 57), (-46, 57)],
}

def unwrap(view, a0, a1, y0, y1, H):
    corr = view['corr']; L = view['L']; R = view['R']
    W = int(round((a1-a0)*PX_PER_DEG))
    ang = np.radians(a0 + (np.arange(W)+0.5)/PX_PER_DEG)
    rows = y0 + (np.arange(H)+0.5)/H*(y1-y0+1) - 0.5
    ri = np.clip(np.round(rows).astype(int), 0, len(L)-1)
    cx = (L[ri]+R[ri])/2 - 0.5
    rr = (R[ri]-L[ri])/2
    X = cx[:,None] + rr[:,None]*np.sin(ang)[None,:]
    Y = np.repeat(rows[:,None], W, 1)
    out = np.stack([map_coordinates(corr[...,c], [Y, X], order=3, mode='nearest') for c in range(3)], -1)
    return np.clip(out, 0, 255)

def content_mask(img, base, thr=48):
    d = np.sqrt(((img-np.array(base,float))**2).sum(-1))
    return d > thr

def build(name):
    a, views = run(name)
    base = CFG[name]['base']; y0, y1 = CFG[name]['rows']
    H = int(round((y1-y0+1) * PX_PER_DEG * 180/np.pi / R_REF))
    panels = []
    for vi, (a0, a1) in enumerate(WINDOWS[name]):
        img = unwrap(views[vi], a0, a1, y0, y1, H)
        m = content_mask(img, base)
        # artwork never reaches the shoulder or the bottom taper; the render's
        # highlights there are not print, so they are kept out of the mask
        top = int((TOPCUT[name][vi] - y0) / (y1 - y0 + 1) * H); bot = int((858 - y0) / (y1 - y0 + 1) * H)
        m[:top] = False; m[bot:] = False
        edge = int(2.0 * PX_PER_DEG); m[:, :edge] = False; m[:, -edge:] = False
        m = m & (gaussian_filter(m.astype(float), 2) > 0.12)
        m = binary_closing(m, iterations=6)
        m = binary_fill_holes(m)
        m = binary_opening(m, iterations=2)
        panels.append(dict(img=img, mask=m, a0=a0, a1=a1))
    return base, H, panels

def overlaps(pa, ca, pb, cb, gap_px):
    """Do dilated masks of panel a (centred at ca deg) and b (cb deg) collide?"""
    ma = binary_dilation(pa['mask'], iterations=gap_px) if 'dil' not in pa else pa['dil']
    sa = int(round((ca + pa['a0'])*PX_PER_DEG)); sb = int(round((cb + pb['a0'])*PX_PER_DEG))
    lo = max(sa, sb); hi = min(sa+ma.shape[1], sb+pb['mask'].shape[1])
    if hi <= lo: return 0
    return int((ma[:, lo-sa:hi-sa] & pb['mask'][:, lo-sb:hi-sb]).sum())

def pack(panels, gap_deg=2.0):
    gap_px = int(round(gap_deg*PX_PER_DEG))
    for p in panels: p['dil'] = binary_dilation(p['mask'], iterations=gap_px)
    order = [0, 2, 1, 3]  # front, right, back, left going round
    centers = {0: 0.0}
    prev = 0
    for k in order[1:]:
        c = centers[prev] + 20
        while any(overlaps(panels[j], centers[j], panels[k], c, gap_px) for j in centers):
            c += 0.25
        centers[k] = c; prev = k
    # closing gap: left panel against front placed at 360
    c_close = centers[3]
    need = 0.0
    while overlaps(panels[3], centers[3], panels[0], 360 - need, gap_px):
        need -= 0.25
    slack = need  # >=0 means room to spare
    # find how far the front copy could come in before colliding
    s = 0.0
    while not overlaps(panels[3], centers[3], panels[0], 360 - s - 0.25, gap_px) and s < 180:
        s += 0.25
    return centers, s

if __name__ == '__main__':
    name = sys.argv[1]
    base, H, panels = build(name)
    centers, spare = pack(panels)
    print(name, 'H', H, 'centers', {k: round(v,2) for k,v in centers.items()}, 'spare deg', spare)
    pickle.dump((base, H, panels), open(f'{name}_panels.pkl','wb'))
