#!/usr/bin/env python3
"""Sample SRTM 30 m elevations on two grids around the stadium (raw data, not committed).
Usage: python3 -I scripts/fetch_dem.py .raw     (opentopodata: 100 points/request, 1 req/s)"""
import json, math, time, urllib.request, sys, os, ssl
RAW = sys.argv[1] if len(sys.argv) > 1 else '.raw'
os.makedirs(os.path.join(RAW, 'dem'), exist_ok=True)
lat0, lon0 = 41.03917, 28.9945
mlat = 110574.0; mlon = 111320.0 * math.cos(math.radians(lat0))
cafile = os.environ.get('SSL_CERT_FILE')
ctx = ssl.create_default_context(cafile=cafile) if cafile else ssl.create_default_context()
def grid(name, half_w, half_h, step):
    nx = int(2 * half_w / step) + 1; ny = int(2 * half_h / step) + 1
    pts = [(lat0 + (-half_h + j * step) / mlat, lon0 + (-half_w + i * step) / mlon) for j in range(ny) for i in range(nx)]
    out = os.path.join(RAW, 'dem', name + '.json')
    data = json.load(open(out)) if os.path.exists(out) else {'nx': nx, 'ny': ny, 'step': step, 'half_w': half_w, 'half_h': half_h, 'elev': [None] * len(pts)}
    for k in range(0, len(pts), 100):
        if all(e is not None for e in data['elev'][k:k + 100]):
            continue
        url = 'https://api.opentopodata.org/v1/srtm30m?locations=' + '|'.join(f'{a:.6f},{b:.6f}' for a, b in pts[k:k + 100])
        for _ in range(5):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'terrain-grid/1.0'}), timeout=60, context=ctx) as r:
                    res = json.load(r)
                if res.get('status') == 'OK':
                    for q, rr in enumerate(res['results']):
                        data['elev'][k + q] = rr['elevation']
                    break
            except Exception as e:
                print('retry', e, flush=True)
            time.sleep(3)
        json.dump(data, open(out, 'w'))
        print(name, k, len(pts), flush=True)
        time.sleep(1.15)
grid('near', 1600, 1600, 40)
grid('far100', 8000, 6000, 100)
