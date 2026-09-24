// Türkiye sınırını Natural Earth 1:50m verisinden (world-atlas) SVG yoluna çevirir
// ve lib/turkey.ts dosyasını yazar. Tek seferlik bir üreteçtir:
//
//   npm i --no-save world-atlas@2 topojson-client@3 && node scripts/turkey-map.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { feature } from 'topojson-client'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const topo = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/world-atlas/countries-50m.json'), 'utf8'))
const tr = feature(topo, topo.objects.countries).features.find((f) => f.id === '792')

const K = Math.cos((39 * Math.PI) / 180)
const LON0 = 25.5
const LAT1 = 42.3
const S = 60
const project = ([lon, lat]) => [(lon - LON0) * K * S, (LAT1 - lat) * S]

let d = ''
let maxX = 0
let maxY = 0
for (const poly of tr.geometry.coordinates) {
  for (const ring of poly) {
    const pts = ring.map(project)
    let area = 0
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i]
      const [x2, y2] = pts[(i + 1) % pts.length]
      area += x1 * y2 - x2 * y1
    }
    if (Math.abs(area) / 2 < 40) continue // çok küçük adalar
    const out = []
    for (const p of pts) {
      const q = out[out.length - 1]
      if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 1.2) out.push(p)
    }
    d += 'M' + out.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z'
    for (const [x, y] of out) {
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
}

const bayburt = { lat: 40.2552, lon: 40.2249 }
const [bx, by] = project([bayburt.lon, bayburt.lat])
const file = `// scripts/turkey-map.mjs tarafından üretildi (Natural Earth 1:50m, world-atlas) — elle düzenlemeyin.
// Eşdikdörtgen izdüşüm, 39° enlemde boylam düzeltmesi; 1° enlem = ${S} birim.
export const TURKEY = {
  width: ${Math.ceil(maxX + 2)},
  height: ${Math.ceil(maxY + 2)},
  bayburt: { x: ${bx.toFixed(1)}, y: ${by.toFixed(1)}, lat: ${bayburt.lat}, lon: ${bayburt.lon} },
  path: '${d}',
} as const
`
fs.writeFileSync(path.join(root, 'lib/turkey.ts'), file)
console.log('lib/turkey.ts yazıldı', d.length, 'karakter')
