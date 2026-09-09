/**
 * Bayburt Store — heritage motif generator.
 *
 * The kits themselves are photography, prepared by scripts/prepare-media.mjs.
 * What is drawn here are the line-art textures the collection pages lay behind
 * each story block: the castle's crenellation, the river's current, and the
 * octagonal tile.
 *
 *   npm run assets
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MOTIF_DIR = join(ROOT, 'public', 'images', 'motifs')

const MOTIFS = {
  castle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <g fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round">
    <path d="M 20 380 L 20 200 L 56 200 L 56 236 L 92 236 L 92 176 L 128 176 L 128 236 L 164 236 L 164 200 L 200 200 L 200 380 Z" />
    <path d="M 200 380 L 200 140 L 236 140 L 236 184 L 272 184 L 272 116 L 308 116 L 308 184 L 344 184 L 344 140 L 380 140 L 380 380" />
    <path d="M 60 380 L 60 296 L 108 296 L 108 380" />
    <path d="M 244 380 L 244 264 L 296 264 L 296 380" />
    <path d="M 20 268 L 200 268 M 200 216 L 380 216" />
  </g>
</svg>
`,
  river: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <g fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round">
    <path d="M -20 96 C 60 44 140 148 220 96 C 300 44 380 148 460 96" />
    <path d="M -20 152 C 60 100 140 204 220 152 C 300 100 380 204 460 152" />
    <path d="M -20 208 C 60 156 140 260 220 208 C 300 156 380 260 460 208" />
    <path d="M -20 264 C 60 212 140 316 220 264 C 300 212 380 316 460 264" />
    <path d="M -20 320 C 60 268 140 372 220 320 C 300 268 380 372 460 320" />
  </g>
</svg>
`,
  tile: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <g fill="none" stroke="#FFFFFF" stroke-width="3">
    <path d="M 200 40 L 360 200 L 200 360 L 40 200 Z" />
    <path d="M 200 100 L 300 200 L 200 300 L 100 200 Z" />
    <rect x="128" y="128" width="144" height="144" transform="rotate(45 200 200)" />
    <path d="M 0 200 L 40 200 M 360 200 L 400 200 M 200 0 L 200 40 M 200 360 L 200 400" />
    <path d="M 0 0 L 80 80 M 400 0 L 320 80 M 0 400 L 80 320 M 400 400 L 320 320" />
  </g>
  <circle cx="200" cy="200" r="18" fill="#FFFFFF" />
</svg>
`,
}

mkdirSync(MOTIF_DIR, { recursive: true })
for (const [name, doc] of Object.entries(MOTIFS)) {
  const file = join(MOTIF_DIR, `${name}.svg`)
  writeFileSync(file, doc, 'utf8')
  console.log('wrote', file.replace(`${ROOT}/`, ''))
}
