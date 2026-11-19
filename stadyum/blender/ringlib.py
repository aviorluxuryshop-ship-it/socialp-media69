"""Shared layout maths for the Tupras Stadyumu generator.

Pure numpy (no bpy, no PIL) so that both the Blender build script and the
texture generator import exactly the same geometry.

Coordinate convention in this file = the website's three.js world
(x = pitch width, z = pitch length, y = up; north = -z, south = +z).
The Blender script converts to Blender's Z-up at mesh-creation time.

The stadium is described by a family of rounded rectangles ("offset curves"):
the bowl line (d = 0) is the pitch rectangle (68 x 105 m) with rounded corners
(radius R); every other line is that curve pushed outwards by d metres. This is
exactly how stadyum/src/scene/geometry.js builds the procedural stadium.
"""
import numpy as np

# ---- numbers copied from stadyum/src/data/sections.js (LAYOUT) --------------
A, B, R = 34.0, 52.5, 12.0           # bowl half-width, half-length, corner radius
PITCH_W, PITCH_L = 68.0, 105.0
PITCH_Y = 0.45
ROW_RISE = 0.5
TIER_LOW = dict(d0=5.0, d1=20.0, y0=1.2, y1=10.2)
TIER_MID = dict(d0=20.0, d1=25.0, y0=10.2, y1=14.2)   # concourse / loca band
TIER_UP = dict(d0=25.0, d1=44.0, y0=14.2, y1=30.2)
FACADE_D, FACADE_H = 46.0, 36.0
ROOF_DIN, ROOF_YIN, ROOF_DOUT, ROOF_YOUT = 10.0, 26.0, 47.0, 36.0

# ---- roof panel layout (shared by geometry and the baked texture) -----------
N_PANELS = 72                         # radial panels around the ring
PANEL_D_REF = 28.0                    # offset at which the panels are equally wide
N_CUSHIONS = 3                        # concentric cushions per radial panel
# roof-top texture: planar top-down, covers +-TEX_X by +-TEX_Z metres
TEX_X = A + ROOF_DOUT + 2.0           # 83
TEX_Z = B + ROOF_DOUT + 2.0           # 101.5


def roof_u(d):
    return (np.asarray(d, float) - ROOF_DIN) / (ROOF_DOUT - ROOF_DIN)


def roof_top_y(d):
    """Top surface of the roof (m). Slightly domed, rises outwards. Same end
    heights as the procedural roof (yIn ~26, yOut = 36)."""
    u = roof_u(d)
    f = u + 0.10 * np.sin(np.pi * u)
    return 26.4 + 9.6 * f


def roof_thick(d):
    return 0.80 + 0.60 * roof_u(d)


def roof_under_y(d):
    return roof_top_y(d) - roof_thick(d)


class Ring:
    """Clockwise (seen from above, x right / z down) rounded-rectangle family.

    The parameter t is the arc length measured on the offset line d_ref,
    starting at the east-centre point (a, 0) and running south first.
    t = 0 east centre, P/4 south centre, P/2 west centre, 3P/4 north centre.
    """

    def __init__(self, d_ref=0.0, a=A, b=B, r=R):
        self.a, self.b, self.r, self.d_ref = a, b, r, d_ref
        lz = b - r
        lx = 2.0 * (a - r)
        la = 0.5 * np.pi * (r + d_ref)
        self.lens = np.array([lz, la, lx, la, 2 * lz, la, lx, la, lz])
        self.cum = np.concatenate([[0.0], np.cumsum(self.lens)])
        self.P = float(self.cum[-1])

    # --- forward: t, d -> x, z, nx, nz -------------------------------------
    def point(self, t, d):
        a, b, r = self.a, self.b, self.r
        t = np.mod(np.asarray(t, float), self.P)
        d = np.asarray(d, float)
        t, d = np.broadcast_arrays(t, d)
        idx = np.clip(np.searchsorted(self.cum, t, side='right') - 1, 0, 8)
        u = (t - self.cum[idx]) / self.lens[idx]
        th = np.zeros_like(t)
        px = np.zeros_like(t); pz = np.zeros_like(t)
        nx = np.zeros_like(t); nz = np.zeros_like(t)
        arcs = {1: (a - r, b - r, 0.0), 3: (-(a - r), b - r, 0.5 * np.pi),
                5: (-(a - r), -(b - r), np.pi), 7: (a - r, -(b - r), 1.5 * np.pi)}
        for k in range(9):
            m = idx == k
            if not m.any():
                continue
            uu = u[m]
            if k in (0, 8):
                z0 = 0.0 if k == 0 else -(b - r)
                px[m] = a; pz[m] = z0 + uu * (b - r); nx[m] = 1.0; nz[m] = 0.0
            elif k == 2:
                px[m] = (a - r) - uu * 2 * (a - r); pz[m] = b; nx[m] = 0.0; nz[m] = 1.0
            elif k == 4:
                px[m] = -a; pz[m] = (b - r) - uu * 2 * (b - r); nx[m] = -1.0; nz[m] = 0.0
            elif k == 6:
                px[m] = -(a - r) + uu * 2 * (a - r); pz[m] = -b; nx[m] = 0.0; nz[m] = -1.0
            else:
                cx, cz, th0 = arcs[k]
                ang = th0 + uu * 0.5 * np.pi
                nx[m] = np.cos(ang); nz[m] = np.sin(ang)
                px[m] = cx + r * nx[m]; pz[m] = cz + r * nz[m]
        return px + nx * d, pz + nz * d, nx, nz

    def samples(self, arc_seg=12, extra=None):
        """Sorted parameter samples: piece boundaries + arc subdivisions (+ extra)."""
        ts = []
        for k in range(9):
            t0, t1 = self.cum[k], self.cum[k + 1]
            n = arc_seg if k in (1, 3, 5, 7) else 1
            ts.extend(t0 + (t1 - t0) * np.arange(n) / n)
        if extra is not None:
            ts.extend(np.mod(np.asarray(extra, float), self.P).tolist())
        ts = np.unique(np.round(np.array(ts), 6))
        return ts[ts < self.P - 1e-6]

    # --- inverse (texture baking): x, z -> t, d (points outside the bowl line)
    def locate(self, x, z):
        a, b, r = self.a, self.b, self.r
        ax, az = np.abs(x), np.abs(z)
        qx, qz = ax - (a - r), az - (b - r)
        corner = (qx > 0) & (qz > 0)
        ew = (qx > 0) & (qz <= 0)
        ns = (qx <= 0) & (qz > 0)
        d = np.where(corner, np.hypot(np.maximum(qx, 0), np.maximum(qz, 0)) - r,
                     np.where(ew, ax - a, np.where(ns, az - b, np.maximum(qx - r, qz - r))))
        t = np.zeros_like(d)
        cum = self.cum
        # east / west straights
        te = np.where(z >= 0, z, self.P + z)
        tw = cum[4] + ((b - r) - z)
        t = np.where(ew, np.where(x >= 0, te, tw), t)
        # south / north straights
        ts_ = cum[2] + ((a - r) - x)
        tn = cum[6] + (x + (a - r))
        t = np.where(ns, np.where(z >= 0, ts_, tn), t)
        # corners
        cxs = np.where(x >= 0, a - r, -(a - r))
        czs = np.where(z >= 0, b - r, -(b - r))
        phi = np.mod(np.arctan2(z - czs, x - cxs), 2 * np.pi)
        k = np.minimum(np.floor(phi / (0.5 * np.pi)), 3).astype(int)
        base = np.array([cum[1], cum[3], cum[5], cum[7]])[k]
        tc = base + (phi - k * 0.5 * np.pi) * (r + self.d_ref)
        t = np.where(corner, tc, t)
        # perimeter-local scale of the panel width at offset d
        scale = np.where(corner, (r + d) / (r + self.d_ref), 1.0)
        return t, d, scale

    def offset_length(self, d):
        return 4 * (self.b - self.r) + 4 * (self.a - self.r) + 2 * np.pi * (self.r + d)


def polyline(ring, d, n_arc=24):
    """Dense closed polyline of the offset curve d: (x, z, nx, nz, cumulative length)."""
    ts = ring.samples(n_arc)
    ts = np.append(ts, ring.P)
    x, z, nx, nz = ring.point(ts, d)
    seg = np.hypot(np.diff(x), np.diff(z))
    cum = np.concatenate([[0.0], np.cumsum(seg)])
    return ts, x, z, nx, nz, cum


# ---- pillow (cushion) height profile, shared by mesh displacement + baked AO --
PILLOW_AMP = 0.30                     # metres of bulge at the centre of a cushion
PILLOW_POW = 0.7


def pillow(pu, pv):
    """0 at the seams, 1 at the cushion centre (pu, pv in 0..1 inside a cushion)."""
    s = np.clip(np.sin(np.pi * np.asarray(pu, float)) * np.sin(np.pi * np.asarray(pv, float)), 0.0, 1.0)
    return s ** PILLOW_POW
