#!/usr/bin/env python3
"""
Build the compact world data the 3D scene streams in.

Inputs (raw, not committed — see scripts/fetch_osm.sh and scripts/fetch_dem.py):
  RAW/osm/tiles/t_*.osm   OpenStreetMap API extracts around the stadium
  RAW/osm/bridge.osm      extract that contains the 15 Temmuz Şehitler Köprüsü deck
  RAW/dem/near.json       SRTM 30 m samples, 40 m grid, ±1600 m (ENU, around ANCHOR)
  RAW/dem/far100.json     SRTM 30 m samples, 100 m grid, ±8000 × ±6000 m

Outputs (committed, served from public/data):
  world.json      buildings (chunked), roads, green areas, trees, landmarks, frame
  terrain.bin     Int16 decimetres: near grid then far grid
  coast.bin       Int8 signed distance to the OSM coastline (0.25 m units, + = land)

Frame: origin = centre of the OSM football pitch. +X runs along the pitch's long
axis towards the south-east goal (Eski Açık / Dolmabahçe end), +Y is up, +Z points
to the south-west long side (main stand). Units are metres.

Run with:  python3 -I scripts/build_world.py <RAW> public/data
"""
import sys, os, json, math, glob, hashlib
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image, ImageDraw

RAW, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

ANCHOR = (41.03917, 28.9945)          # lat/lon the DEM grids were centred on
PITCH_WAY = '440559216'
STADIUM_SITE_WAY = '1328815936'
ESKI_ACIK_WAY = '489743779'
CHUNK = 200.0

# ---------------------------------------------------------------- parse OSM
nodes, ways, rels = {}, {}, {}
node_tags = {}
files = sorted(glob.glob(os.path.join(RAW, 'osm/tiles/t_*.osm'))) + [os.path.join(RAW, 'osm/bridge.osm')]
for f in files:
    root = ET.parse(f).getroot()
    for n in root.iter('node'):
        nodes[n.get('id')] = (float(n.get('lat')), float(n.get('lon')))
        tg = {t.get('k'): t.get('v') for t in n.findall('tag')}
        if tg:
            node_tags[n.get('id')] = tg
    for w in root.findall('way'):
        ways[w.get('id')] = ([nd.get('ref') for nd in w.findall('nd')], {t.get('k'): t.get('v') for t in w.findall('tag')})
    for r in root.findall('relation'):
        rels[r.get('id')] = ([(m.get('type'), m.get('ref'), m.get('role')) for m in r.findall('member')],
                             {t.get('k'): t.get('v') for t in r.findall('tag')})
print('parsed', len(nodes), 'nodes', len(ways), 'ways', len(rels), 'relations', file=sys.stderr)

# ---------------------------------------------------------------- geodesy
def m_per_deg(lat):
    p = math.radians(lat)
    return (111132.92 - 559.82 * math.cos(2 * p) + 1.175 * math.cos(4 * p),
            111412.84 * math.cos(p) - 93.5 * math.cos(3 * p))

MLAT, MLON = m_per_deg(ANCHOR[0])

def enu_anchor(lat, lon):
    return ((lon - ANCHOR[1]) * MLON, (lat - ANCHOR[0]) * MLAT)

pitch = [enu_anchor(*nodes[r]) for r in ways[PITCH_WAY][0]][:4]
pc = (sum(p[0] for p in pitch) / 4, sum(p[1] for p in pitch) / 4)
# long axis = longer pair of edges, oriented to the SE
edges = [(pitch[(i + 1) % 4][0] - pitch[i][0], pitch[(i + 1) % 4][1] - pitch[i][1]) for i in range(4)]
le = max(edges, key=lambda v: math.hypot(*v))
bearing = math.degrees(math.atan2(le[0], le[1])) % 360
if not (90 <= bearing < 270):
    bearing = (bearing + 180) % 360
ORIGIN = (ANCHOR[0] + pc[1] / MLAT, ANCHOR[1] + pc[0] / MLON)
B = math.radians(bearing)
SB, CB = math.sin(B), math.cos(B)
print('origin', ORIGIN, 'bearing', round(bearing, 2), 'pitch', [round(math.hypot(*e), 1) for e in edges], file=sys.stderr)

def enu(lat, lon):
    """east/north metres from ORIGIN"""
    return ((lon - ORIGIN[1]) * MLON, (lat - ORIGIN[0]) * MLAT)

def to_frame(e, n):
    return (e * SB + n * CB, e * CB - n * SB)

def ll_frame(nid):
    return to_frame(*enu(*nodes[nid]))

# ---------------------------------------------------------------- helpers
def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    a, b = np.array(pts[0]), np.array(pts[-1])
    ab = b - a
    L = np.hypot(*ab)
    P = np.array(pts[1:-1])
    if L < 1e-9:
        d = np.hypot(*(P - a).T)
    else:
        d = np.abs(ab[0] * (P[:, 1] - a[1]) - ab[1] * (P[:, 0] - a[0])) / L
    i = int(np.argmax(d))
    if d[i] > eps:
        left = rdp(pts[:i + 2], eps)
        right = rdp(pts[i + 1:], eps)
        return left[:-1] + right
    return [pts[0], pts[-1]]

def simplify_ring(ring, eps):
    if ring[0] == ring[-1]:
        ring = ring[:-1]
    if len(ring) < 4:
        return ring
    # split at the farthest point from the first to keep a closed ring stable
    a = np.array(ring[0])
    far = int(np.argmax([np.hypot(p[0] - a[0], p[1] - a[1]) for p in ring]))
    r1 = rdp(ring[:far + 1], eps)
    r2 = rdp(ring[far:] + [ring[0]], eps)
    out = r1[:-1] + r2[:-1]
    return out if len(out) >= 3 else ring

def area(ring):
    s = 0.0
    for i in range(len(ring)):
        x1, y1 = ring[i]
        x2, y2 = ring[(i + 1) % len(ring)]
        s += x1 * y2 - x2 * y1
    return s / 2

def centroid(ring):
    xs = [p[0] for p in ring]; ys = [p[1] for p in ring]
    return (sum(xs) / len(xs), sum(ys) / len(ys))

def pip(pt, ring):
    x, y = pt
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]; xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi:
            inside = not inside
        j = i
    return inside

def join_ways(way_ids):
    """Join way node lists into closed rings (for multipolygon members)."""
    segs = [list(ways[w][0]) for w in way_ids if w in ways]
    rings = []
    while segs:
        cur = segs.pop(0)
        changed = True
        while cur[0] != cur[-1] and changed:
            changed = False
            for i, s in enumerate(segs):
                if s[0] == cur[-1]:
                    cur += s[1:]; segs.pop(i); changed = True; break
                if s[-1] == cur[-1]:
                    cur += s[::-1][1:]; segs.pop(i); changed = True; break
                if s[-1] == cur[0]:
                    cur = s[:-1] + cur; segs.pop(i); changed = True; break
                if s[0] == cur[0]:
                    cur = s[::-1][:-1] + cur; segs.pop(i); changed = True; break
        if cur[0] == cur[-1] and len(cur) >= 4:
            rings.append(cur)
    return rings

def ring_frame(refs):
    pts = [ll_frame(r) for r in refs if r in nodes]
    return pts

def rnd(v):
    return round(v, 1)

def hash01(s):
    return int(hashlib.md5(s.encode()).hexdigest()[:8], 16) / 0xffffffff

def parse_len(v):
    if v is None:
        return None
    try:
        return float(v.replace('m', '').replace(',', '.').strip().split(';')[0])
    except ValueError:
        return None

# ---------------------------------------------------------------- stadium site
site = ring_frame(ways[STADIUM_SITE_WAY][0])
eski = ring_frame(ways[ESKI_ACIK_WAY][0])

def in_site(pt):
    return pip(pt, site)

# ---------------------------------------------------------------- buildings
SPECIAL_HEIGHT = {
    '175516451': (24.0, 1),   # Dolmabahçe Sarayı Selamlık
    '263949137': (21.0, 1),   # Harem
    '263949162': (27.0, 1),   # Muayede Salonu (dome added at runtime)
    '175523076': (16.0, 1),   # Resim Müzesi (palace wing)
    '166702635': (148.0, 2),  # Süzer Plaza (Ritz-Carlton) 34 floors
    '180968739': (62.0, 2),   # Swissôtel The Bosphorus
    '498861874': (16.0, 3),   # Bezmialem Valide Sultan (Dolmabahçe) Camii
    '263949143': (27.0, 1),   # Dolmabahçe Saat Kulesi (modelled procedurally)
}
SKIP_BUILDINGS = {'263949143'}        # clock tower: custom model
building_out = []

def building_height(tags, wid):
    h = parse_len(tags.get('height'))
    lv = parse_len(tags.get('building:levels'))
    mh = parse_len(tags.get('min_height')) or 0.0
    if wid in SPECIAL_HEIGHT:
        return SPECIAL_HEIGHT[wid][0], mh
    if h:
        return h, mh
    if lv:
        return lv * 3.2 + 1.2, mh
    t = tags.get('building')
    r = hash01(wid)
    if t in ('house', 'detached'):
        return 7 + 4 * r, mh
    if t in ('mosque',):
        return 12 + 4 * r, mh
    if t in ('school', 'university', 'public', 'hospital'):
        return 12 + 8 * r, mh
    if t in ('roof', 'kiosk', 'shed', 'garage', 'hut', 'container'):
        return 3 + 2 * r, mh
    # dense Istanbul fabric: 4–7 storey apartment blocks
    return 13 + 10 * r, mh

def building_kind(tags, wid, h):
    if wid in SPECIAL_HEIGHT:
        return SPECIAL_HEIGHT[wid][1]
    b = tags.get('building')
    if b == 'mosque' or (tags.get('amenity') == 'place_of_worship' and tags.get('religion') == 'muslim'):
        return 3
    if b == 'palace' or tags.get('historic') in ('building', 'castle', 'palace'):
        return 1
    if h >= 45:
        return 2
    return 0

def add_building(rings, tags, wid):
    if tags.get('building') in ('construction', 'no', 'ruins', 'roof') or 'building:part' in tags:
        return
    if wid in SKIP_BUILDINGS:
        return
    for refs in rings:
        ring = ring_frame(refs)
        if len(ring) < 4:
            continue
        ring = simplify_ring(ring, 0.6)
        if len(ring) < 3:
            continue
        a = area(ring)
        if abs(a) < 12:
            continue
        if a < 0:          # counter-clockwise in frame (x right, z down) == positive shoelace
            ring = ring[::-1]
        c = centroid(ring)
        if in_site(c):
            continue
        h, mh = building_height(tags, wid)
        kind = building_kind(tags, wid, h)
        building_out.append({'c': c, 'h': h, 'mh': mh, 'k': kind, 'r': ring, 'id': wid,
                             'v': int(hash01(wid + 'v') * 8), 'n': tags.get('name')})

for wid, (refs, tags) in ways.items():
    if 'building' in tags and refs and refs[0] == refs[-1]:
        add_building([refs], tags, wid)
for rid, (members, tags) in rels.items():
    if 'building' in tags and tags.get('type') == 'multipolygon':
        outers = [m[1] for m in members if m[0] == 'way' and m[2] in ('outer', '')]
        rings = join_ways(outers)
        add_building(rings, tags, 'r' + rid)
print('buildings', len(building_out), file=sys.stderr)

# ---------------------------------------------------------------- roads
ROAD_W = {'motorway': 22, 'trunk': 18, 'primary': 13, 'primary_link': 7, 'secondary': 10,
          'secondary_link': 6, 'tertiary': 8, 'tertiary_link': 6, 'residential': 6.5,
          'living_street': 5, 'unclassified': 6, 'service': 4, 'pedestrian': 6,
          'footway': 2.4, 'steps': 2.4, 'busway': 7}
ROAD_CLASS = {'motorway': 0, 'trunk': 0, 'primary': 1, 'primary_link': 1, 'secondary': 2,
              'secondary_link': 2, 'tertiary': 2, 'tertiary_link': 2, 'residential': 3,
              'living_street': 3, 'unclassified': 3, 'service': 4, 'pedestrian': 5,
              'footway': 6, 'steps': 6, 'busway': 1}
roads = []
for wid, (refs, tags) in ways.items():
    hw = tags.get('highway')
    if hw not in ROAD_W:
        continue
    if tags.get('tunnel') in ('yes', 'building_passage') or tags.get('area') == 'yes':
        continue
    pts = [ll_frame(r) for r in refs if r in nodes]
    if len(pts) < 2:
        continue
    pts = rdp(pts, 0.8)
    w = ROAD_W[hw]
    lanes = parse_len(tags.get('lanes'))
    if lanes and ROAD_CLASS[hw] <= 2:
        w = max(w * 0.6, lanes * 3.3 + 1.0)
    roads.append({'c': ROAD_CLASS[hw], 'w': round(w, 1), 'p': pts, 'lit': tags.get('lit') == 'yes' or ROAD_CLASS[hw] <= 2,
                  'br': tags.get('bridge') is not None})
print('roads', len(roads), file=sys.stderr)

# ---------------------------------------------------------------- green / areas
AREA_CLASS = []
def area_class(tags):
    if tags.get('leisure') in ('park', 'garden') or tags.get('landuse') in ('grass', 'flowerbed', 'village_green', 'meadow'):
        return 1
    if tags.get('landuse') == 'forest' or tags.get('natural') in ('wood', 'scrub'):
        return 2
    if tags.get('landuse') == 'cemetery' or tags.get('amenity') == 'grave_yard':
        return 3
    if tags.get('leisure') == 'pitch':
        return 4
    if tags.get('leisure') == 'swimming_pool' or tags.get('natural') == 'water':
        return 5
    if (tags.get('highway') == 'pedestrian' and tags.get('area') == 'yes') or tags.get('place') == 'square':
        return 6
    if tags.get('amenity') == 'parking':
        return 7
    return None

areas = []
def add_area(rings, tags, wid):
    c = area_class(tags)
    if c is None:
        return
    for refs in rings:
        ring = ring_frame(refs)
        if len(ring) < 4:
            continue
        ring = simplify_ring(ring, 0.8)
        if len(ring) < 3 or abs(area(ring)) < 20:
            continue
        if wid == PITCH_WAY:
            continue
        cen = centroid(ring)
        if c == 4 and in_site(cen):
            continue
        areas.append({'c': c, 'r': ring, 'a': abs(area(ring))})

for wid, (refs, tags) in ways.items():
    if refs and refs[0] == refs[-1] and 'building' not in tags:
        add_area([refs], tags, wid)
for rid, (members, tags) in rels.items():
    if tags.get('type') == 'multipolygon' and 'building' not in tags:
        outers = [m[1] for m in members if m[0] == 'way' and m[2] in ('outer', '')]
        add_area(join_ways(outers), tags, 'r' + rid)
areas.sort(key=lambda a: -a['a'])
print('areas', len(areas), file=sys.stderr)

# ---------------------------------------------------------------- trees
trees = []
for nid, tg in node_tags.items():
    if tg.get('natural') == 'tree':
        x, z = ll_frame(nid)
        trees.append((x, z))
for wid, (refs, tags) in ways.items():
    if tags.get('natural') == 'tree_row':
        pts = [ll_frame(r) for r in refs if r in nodes]
        for i in range(len(pts) - 1):
            (x1, z1), (x2, z2) = pts[i], pts[i + 1]
            L = math.hypot(x2 - x1, z2 - z1)
            n = max(1, int(L / 9))
            for k in range(n):
                t = k / n
                trees.append((x1 + (x2 - x1) * t, z1 + (z2 - z1) * t))
print('trees', len(trees), file=sys.stderr)

# ---------------------------------------------------------------- coastline (ENU around ORIGIN)
coast_ways = [refs for refs, tags in ways.values() if tags.get('natural') == 'coastline']
chains = join_ways_lines = None
def chain_lines(lines):
    lines = [list(l) for l in lines]
    out = []
    while lines:
        cur = lines.pop(0)
        changed = True
        while changed and cur[0] != cur[-1]:
            changed = False
            for i, s in enumerate(lines):
                if s[0] == cur[-1]:
                    cur += s[1:]; lines.pop(i); changed = True; break
                if s[-1] == cur[0]:
                    cur = s[:-1] + cur; lines.pop(i); changed = True; break
        out.append(cur)
    return out
coast_chains = chain_lines(coast_ways)
coast_enu = [[enu(*nodes[r]) for r in ch if r in nodes] for ch in coast_chains]
coast_enu = [c for c in coast_enu if len(c) >= 2]
print('coast chains', len(coast_enu), [len(c) for c in coast_enu], file=sys.stderr)

# OSM data rectangle (ENU about ORIGIN), shrunk a little so every coast chain crosses it cleanly
lat_min, lat_max, lon_min, lon_max = 41.026, 41.050, 28.984, 29.030
e0, n0 = enu(lat_min, lon_min)
e1, n1 = enu(lat_max, lon_max)
RECT = (e0 + 20, n0 + 20, e1 - 20, n1 - 20)

def clip_polyline(pts, rect):
    """Return pieces of the polyline inside rect, with exact entry/exit points on the border."""
    x0, y0, x1, y1 = rect
    def inside(p):
        return x0 <= p[0] <= x1 and y0 <= p[1] <= y1
    def seg_clip(a, b):
        # Liang–Barsky
        dx, dy = b[0] - a[0], b[1] - a[1]
        t0, t1 = 0.0, 1.0
        for p, q in ((-dx, a[0] - x0), (dx, x1 - a[0]), (-dy, a[1] - y0), (dy, y1 - a[1])):
            if abs(p) < 1e-12:
                if q < 0:
                    return None
            else:
                t = q / p
                if p < 0:
                    if t > t1: return None
                    t0 = max(t0, t)
                else:
                    if t < t0: return None
                    t1 = min(t1, t)
        return (a[0] + dx * t0, a[1] + dy * t0), (a[0] + dx * t1, a[1] + dy * t1), t0, t1
    pieces, cur = [], None
    for i in range(len(pts) - 1):
        r = seg_clip(pts[i], pts[i + 1])
        if r is None:
            if cur: pieces.append(cur); cur = None
            continue
        pa, pb, t0, t1 = r
        if cur is None:
            cur = [pa]
        cur.append(pb)
        if t1 < 1.0:
            pieces.append(cur); cur = None
    if cur: pieces.append(cur)
    return pieces

pieces = []
for c in coast_enu:
    for p in clip_polyline(c, RECT):
        if len(p) >= 2:
            pieces.append(p)

def border_pos(p):
    """CCW perimeter parameter of a point on the rect border (x right, y up)."""
    x0, y0, x1, y1 = RECT
    W, H = x1 - x0, y1 - y0
    x, y = p
    if abs(y - y0) < 1e-6: return x - x0
    if abs(x - x1) < 1e-6: return W + (y - y0)
    if abs(y - y1) < 1e-6: return W + H + (x1 - x)
    return 2 * W + H + (y1 - y)

def border_point(t):
    x0, y0, x1, y1 = RECT
    W, H = x1 - x0, y1 - y0
    P = 2 * (W + H)
    t %= P
    if t < W: return (x0 + t, y0)
    if t < W + H: return (x1, y0 + t - W)
    if t < 2 * W + H: return (x1 - (t - W - H), y1)
    return (x0, y1 - (t - 2 * W - H))

x0r, y0r, x1r, y1r = RECT
PERIM = 2 * ((x1r - x0r) + (y1r - y0r))
open_pieces = [p for p in pieces if not (abs(p[0][0] - p[-1][0]) < 1e-6 and abs(p[0][1] - p[-1][1]) < 1e-6)]
closed_pieces = [p for p in pieces if p not in open_pieces]
land = []
used = [False] * len(open_pieces)
for si in range(len(open_pieces)):
    if used[si]:
        continue
    poly = []
    i = si
    guard = 0
    while True:
        guard += 1
        if guard > 100: break
        used[i] = True
        poly += open_pieces[i]
        exit_t = border_pos(open_pieces[i][-1])
        # next entry CCW from exit
        best, bestd = None, 1e18
        for j, p in enumerate(open_pieces):
            d = (border_pos(p[0]) - exit_t) % PERIM
            if d < bestd:
                best, bestd = j, d
        # add corners passed
        corners = [(x0r, y0r), (x1r, y0r), (x1r, y1r), (x0r, y1r)]
        cps = sorted(((border_pos(c) - exit_t) % PERIM, c) for c in corners)
        for d, c in cps:
            if 0 < d < bestd:
                poly.append(c)
        if best == si:
            break
        if used[best]:
            break
        i = best
    land.append(poly)
land += closed_pieces
print('land polygons', len(land), [len(l) for l in land], file=sys.stderr)

# signed-distance raster (5 m) over RECT
RES = 5.0
gw = int((x1r - x0r) / RES) + 1
gh = int((y1r - y0r) / RES) + 1
scale = 1.0 / RES
mask_img = Image.new('L', (gw, gh), 0)
dr = ImageDraw.Draw(mask_img)
for poly in land:
    dr.polygon([((x - x0r) * scale, (y - y0r) * scale) for x, y in poly], fill=255)
mask = np.array(mask_img) > 127          # [row=y, col=x]
segs = []
for c in coast_enu:
    for i in range(len(c) - 1):
        segs.append((c[i][0], c[i][1], c[i + 1][0], c[i + 1][1]))
segs = np.array(segs, dtype=np.float64)
MAXD = 31.0
dist = np.full((gh, gw), MAXD, dtype=np.float64)
TILE = 32
for ty in range(0, gh, TILE):
    for tx in range(0, gw, TILE):
        cx0, cy0 = x0r + tx * RES, y0r + ty * RES
        cx1, cy1 = cx0 + TILE * RES, cy0 + TILE * RES
        sx0 = np.minimum(segs[:, 0], segs[:, 2]); sx1 = np.maximum(segs[:, 0], segs[:, 2])
        sy0 = np.minimum(segs[:, 1], segs[:, 3]); sy1 = np.maximum(segs[:, 1], segs[:, 3])
        sel = (sx1 > cx0 - MAXD) & (sx0 < cx1 + MAXD) & (sy1 > cy0 - MAXD) & (sy0 < cy1 + MAXD)
        if not sel.any():
            continue
        S = segs[sel]
        ys = y0r + np.arange(ty, min(ty + TILE, gh)) * RES
        xs = x0r + np.arange(tx, min(tx + TILE, gw)) * RES
        X, Y = np.meshgrid(xs, ys)
        P = np.stack([X.ravel(), Y.ravel()], 1)
        ax, ay, bx, by = S[:, 0], S[:, 1], S[:, 2], S[:, 3]
        abx, aby = bx - ax, by - ay
        L2 = abx * abx + aby * aby + 1e-12
        t = ((P[:, 0:1] - ax) * abx + (P[:, 1:2] - ay) * aby) / L2
        t = np.clip(t, 0, 1)
        dx = P[:, 0:1] - (ax + t * abx)
        dy = P[:, 1:2] - (ay + t * aby)
        d = np.sqrt(dx * dx + dy * dy).min(1)
        dist[ty:ty + len(ys), tx:tx + len(xs)] = np.minimum(MAXD, d.reshape(len(ys), len(xs)))
sdf = np.where(mask, dist, -dist)
sdf_q = np.clip(np.round(sdf * 4), -127, 127).astype(np.int8)
sdf_q.tofile(os.path.join(OUT, 'coast.bin'))
print('coast sdf', gw, gh, 'land fraction', round(mask.mean(), 3), file=sys.stderr)

# ---------------------------------------------------------------- terrain grids
def load_dem(name):
    d = json.load(open(os.path.join(RAW, 'dem', name + '.json')))
    a = np.array([v if v is not None else 0 for v in d['elev']], dtype=np.float64).reshape(d['ny'], d['nx'])
    # grid origin in ENU-about-ORIGIN
    ae, an = enu(*ANCHOR)
    return {'nx': d['nx'], 'ny': d['ny'], 'step': d['step'], 'e0': ae - d['half_w'], 'n0': an - d['half_h'], 'a': a}

near = load_dem('near')
far = load_dem('far100')
def blur(a, k=1):
    out = a.copy()
    for _ in range(k):
        p = np.pad(out, 1, mode='edge')
        out = (p[:-2, :-2] + 2 * p[:-2, 1:-1] + p[:-2, 2:] + 2 * p[1:-1, :-2] + 4 * p[1:-1, 1:-1] +
               2 * p[1:-1, 2:] + p[2:, :-2] + 2 * p[2:, 1:-1] + p[2:, 2:]) / 16
    return out
# SRTM is a surface model: soften building/tree bumps, but keep water at 0
near_a = blur(np.maximum(near['a'], 0), 1)
far_a = np.maximum(far['a'], -1)
far_land = far['a'] > 0.5
far_a = np.where(far_land, blur(np.maximum(far_a, 0), 1), -12)
near_q = np.clip(np.round(near_a * 10), -32768, 32767).astype(np.int16)
far_q = np.clip(np.round(far_a * 10), -32768, 32767).astype(np.int16)
with open(os.path.join(OUT, 'terrain.bin'), 'wb') as fh:
    fh.write(near_q.tobytes())
    fh.write(far_q.tobytes())

# ---------------------------------------------------------------- landmarks
def way_centroid_frame(wid):
    return centroid(ring_frame(ways[wid][0]))

landmarks = {
    'clockTower': {'p': way_centroid_frame('263949143'), 'h': 27.0},
    'dolmabahceMosque': {'p': way_centroid_frame('498861874'), 'r': simplify_ring(ring_frame(ways['498861874'][0]), 0.5)},
    'muayedeSalonu': {'p': way_centroid_frame('263949162')},
    'suzerPlaza': {'p': way_centroid_frame('166702635')},
}
# Bosphorus bridge deck end points
bw = ways['227607788'][0]
landmarks['bridge'] = {'a': ll_frame(bw[0]), 'b': ll_frame(bw[-1]), 'deck': 64.0, 'tower': 165.0}
# Mihrimah Sultan (Üsküdar) — prominent on the Asian shore
for wid, (refs, tags) in ways.items():
    if tags.get('name') == 'Mihrimah Sultan Camii' and refs:
        landmarks['mihrimahMosque'] = {'p': centroid(ring_frame(refs))}

# ---------------------------------------------------------------- chunk + write
def r2(pts):
    return [v for p in pts for v in (rnd(p[0]), rnd(p[1]))]

chunks = {}
for b in building_out:
    key = f"{math.floor(b['c'][0] / CHUNK)},{math.floor(b['c'][1] / CHUNK)}"
    chunks.setdefault(key, []).append([b['k'], round(b['h'], 1), round(b['mh'], 1), b['v'], r2(b['r'])])

tree_chunks = {}
for x, z in trees:
    key = f"{math.floor(x / CHUNK)},{math.floor(z / CHUNK)}"
    tree_chunks.setdefault(key, []).extend([rnd(x), rnd(z)])

world = {
    'meta': {
        'origin': [round(ORIGIN[0], 7), round(ORIGIN[1], 7)],
        'bearing': round(bearing, 3),
        'mlat': round(MLAT, 3), 'mlon': round(MLON, 3),
        'chunk': CHUNK,
        'attribution': '© OpenStreetMap contributors (ODbL) · SRTM 1 Arc-Second Global (NASA/USGS)',
    },
    'terrain': {
        'near': {'nx': near['nx'], 'ny': near['ny'], 'step': near['step'], 'e0': round(near['e0'], 2), 'n0': round(near['n0'], 2)},
        'far': {'nx': far['nx'], 'ny': far['ny'], 'step': far['step'], 'e0': round(far['e0'], 2), 'n0': round(far['n0'], 2)},
        'coast': {'nx': gw, 'ny': gh, 'res': RES, 'e0': round(x0r, 2), 'n0': round(y0r, 2), 'units': 0.25},
    },
    'site': r2(site),
    'eskiAcik': r2(simplify_ring(eski, 0.3)),
    'buildings': chunks,
    'trees': tree_chunks,
    'roads': [[r['c'], r['w'], 1 if r['lit'] else 0, 1 if r['br'] else 0, r2(r['p'])] for r in roads],
    'areas': [[a['c'], r2(a['r'])] for a in areas],
    'landmarks': {k: {kk: (r2([vv])[:2] if isinstance(vv, tuple) else (r2(vv) if isinstance(vv, list) else vv)) for kk, vv in v.items()} for k, v in landmarks.items()},
}
with open(os.path.join(OUT, 'world.json'), 'w') as fh:
    json.dump(world, fh, separators=(',', ':'), ensure_ascii=False)
print('world.json', os.path.getsize(os.path.join(OUT, 'world.json')) // 1024, 'KB', file=sys.stderr)
