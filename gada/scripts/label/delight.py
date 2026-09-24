from PIL import Image
import numpy as np
from scipy.ndimage import median_filter, gaussian_filter1d

CFG = {
 'lemon': dict(base=(245,207,5), rows=(94,866)),
 'peach': dict(base=(245,108,4), rows=(98,873)),
}
CANS = {'lemon':[(67,367),(438,731),(805,1097),(1175,1465)],
        'peach':[(69,366),(441,732),(807,1094),(1178,1462)]}

def silhouette(a, x0, x1):
    notwhite = (a.min(2) < 235) | ((a.max(2)-a.min(2))>25)
    H = a.shape[0]
    L = np.full(H, np.nan); R = np.full(H, np.nan)
    for y in range(H):
        xs = np.where(notwhite[y, x0-25:x1+25])[0]
        if len(xs) > 20:
            L[y] = xs.min()+x0-25; R[y] = xs.max()+x0-25+1
    return L, R

def bg_mask(p, base, tol=0.06):
    base = np.array(base, float)
    br = (base[1]-base[2])/(base[0]-base[2])
    den = p[...,0]-p[...,2]
    ratio = (p[...,1]-p[...,2])/np.maximum(den,1)
    return (den > 50) & (np.abs(ratio-br) < tol)

def fit_ds(med, base):
    # med = d*base + s  -> least squares
    A = np.stack([np.array(base,float), np.ones(3)],1)
    sol, *_ = np.linalg.lstsq(A, med, rcond=None)
    return sol

def run(name):
    cfg = CFG[name]; base = np.array(cfg['base'], float)
    a = np.asarray(Image.open(f'{name}.jpg').convert('RGB')).astype(float)
    y0, y1 = cfg['rows']
    res = []
    for vi,(x0,x1) in enumerate(CANS[name]):
        L, R = silhouette(a, x0, x1)
        body = slice(300, 700)
        cx = (np.nanmedian(L[body])+np.nanmedian(R[body]))/2 - 0.5
        r  = (np.nanmedian(R[body])-np.nanmedian(L[body]))/2
        xa, xb = int(cx-r)+1, int(cx+r)
        sub = a[y0+70:y1-40, xa:xb]
        m = bg_mask(sub, base)
        W = xb-xa
        d = np.full(W, np.nan); s = np.full(W, np.nan)
        for i in range(W):
            px = sub[m[:,i], i]
            if len(px) >= 40:
                d[i], s[i] = fit_ds(np.median(px,0), base)
        ok = ~np.isnan(d)
        idx = np.arange(W)
        d = np.interp(idx, idx[ok], d[ok]); s = np.interp(idx, idx[ok], s[ok])
        d = gaussian_filter1d(median_filter(d, 9, mode='nearest'), 2)
        s = gaussian_filter1d(median_filter(s, 9, mode='nearest'), 2)
        corr = a.copy()
        corr[:, xa:xb] = (a[:, xa:xb] - s[None,:,None]) / np.maximum(d[None,:,None], 0.2)
        # row pass on central band
        cb = slice(int(cx-0.45*r), int(cx+0.45*r))
        dr = np.ones(a.shape[0]); sr = np.zeros(a.shape[0])
        for y in range(y0, y1+1):
            px = corr[y, cb]; mm = bg_mask(px, base)
            if mm.sum() >= 25:
                dr[y], sr[y] = fit_ds(np.median(px[mm],0), base)
            else:
                dr[y], sr[y] = np.nan, np.nan
        rows = np.arange(a.shape[0]); ok = ~np.isnan(dr)
        dr = np.interp(rows, rows[ok], dr[ok]); sr = np.interp(rows, rows[ok], sr[ok])
        dr = gaussian_filter1d(median_filter(dr, 7, mode='nearest'), 1.5)
        sr = gaussian_filter1d(median_filter(sr, 7, mode='nearest'), 1.5)
        corr = np.clip(corr, 0, 255)
        res.append(dict(cx=cx, r=r, L=L, R=R, d=d, s=s, xa=xa, dr=dr, sr=sr, corr=corr))
        dd = d[[int(W*f) for f in (0.02,0.1,0.25,0.5,0.75,0.9,0.98)]]
        ss = s[[int(W*f) for f in (0.02,0.1,0.25,0.5,0.75,0.9,0.98)]]
        print(f'{name} v{vi} cx={cx:.1f} r={r:.1f} d@', np.round(dd,2), 's@', np.round(ss,0))
        print(f'   row d top..', np.round(dr[y0:y0+70:7],2), ' bottom..', np.round(dr[y1-40:y1+1:5],2))
    return a, res

if __name__ == '__main__':
    import pickle
    for n in ['lemon','peach']:
        a, res = run(n)
        out = a.copy()
        for rr in res:
            xa = int(rr['cx']-rr['r'])+1; xb = int(rr['cx']+rr['r'])
            out[:, xa:xb] = rr['corr'][:, xa:xb]
        Image.fromarray(out.astype(np.uint8)).save(f'{n}_delit.png')
        pickle.dump(res, open(f'{n}_res.pkl','wb'))
