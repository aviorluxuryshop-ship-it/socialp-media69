#!/usr/bin/env python3
"""Standalone GLB inspector (no dependencies except numpy/Pillow for texture sizes).

    python3 stadyum/blender/validate_glb.py stadyum/public/models/tupras.glb
Prints: nodes, triangle counts, materials, textures, accessor-based bounding box (glTF Y-up).
"""
import io
import json
import struct
import sys

import numpy as np


def main(path):
    b = open(path, 'rb').read()
    magic, ver, length = struct.unpack('<4sII', b[:12])
    assert magic == b'glTF' and ver == 2, 'not a glb v2'
    off = 12
    js, binchunk = None, None
    while off < len(b):
        clen, ctype = struct.unpack('<I4s', b[off:off + 8])
        data = b[off + 8: off + 8 + clen]
        if ctype == b'JSON':
            js = json.loads(data.decode())
        elif ctype.startswith(b'BIN'):
            binchunk = data
        off += 8 + clen
    print('file: %.2f MB   glTF %s   generator: %s' % (len(b) / 1e6, js['asset']['version'], js['asset'].get('generator')))
    print('extensions used:', js.get('extensionsUsed'))
    mn = np.array([1e9] * 3); mx = np.array([-1e9] * 3)
    total_tris = 0
    print('\nnodes -> mesh primitives')
    for n in js['nodes']:
        extra = ''
        if 'mesh' in n:
            m = js['meshes'][n['mesh']]
            tris = 0
            parts = []
            for p in m['primitives']:
                acc = js['accessors'][p['indices']]
                tris += acc['count'] // 3
                pos = js['accessors'][p['attributes']['POSITION']]
                mn = np.minimum(mn, pos['min']); mx = np.maximum(mx, pos['max'])
                parts.append(js['materials'][p['material']]['name'])
            total_tris += tris
            extra = '%7d tris  [%s]' % (tris, ', '.join(parts))
        print('  %-18s %s %s' % (n.get('name'), {k: v for k, v in n.items() if k in ('translation', 'rotation', 'scale')}, extra))
    print('\ntotal triangles:', total_tris)
    print('bbox min', np.round(mn, 2), 'max', np.round(mx, 2), 'size', np.round(mx - mn, 2))
    print('(glTF Y-up: X = pitch width, Y = height, Z = pitch length; north = -Z)')
    print('\nmaterials:')
    for m in js['materials']:
        pbr = m.get('pbrMetallicRoughness', {})
        print('  %-14s base=%s rough=%s metal=%s tex=%s doubleSided=%s' % (
            m['name'], [round(c, 3) for c in pbr.get('baseColorFactor', [1, 1, 1, 1])], pbr.get('roughnessFactor'),
            pbr.get('metallicFactor'), 'baseColorTexture' in pbr, m.get('doubleSided', False)))
    print('\ntextures:')
    try:
        from PIL import Image
        for i, im in enumerate(js.get('images', [])):
            bv = js['bufferViews'][im['bufferView']]
            raw = binchunk[bv.get('byteOffset', 0): bv.get('byteOffset', 0) + bv['byteLength']]
            img = Image.open(io.BytesIO(raw))
            print('  image %d %-12s %s %dx%d %.0f KB' % (i, im.get('name'), im.get('mimeType'), img.width, img.height, len(raw) / 1e3))
    except ImportError:
        print('  (Pillow missing)')
    nverts = 0
    for m in js['meshes']:
        for p in m['primitives']:
            nverts += js['accessors'][p['attributes']['POSITION']]['count']
    print('\nvertices (sum over primitives): %d' % nverts)
    print('\nsamplers:', js.get('samplers'))


if __name__ == '__main__':
    main(sys.argv[1])
