// SPDX-FileCopyrightText: 2026 Johannes Homann
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Generates initials avatars for the seed roster into seed/assets/avatare/.
 * Deterministic per person (color from a fixed palette by index). Replace any
 * file with a real photo of the same name to override.
 *
 *   npx tsx scripts/generate-avatars.ts
 */
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { SEED_USERS } from '../seed/content/users'

const OUT = path.resolve(process.cwd(), 'seed', 'assets', 'avatare')
mkdirSync(OUT, { recursive: true })

// Muted, platform-adjacent duotones: [background, initials]
const PALETTE: [string, string][] = [
  ['#dfe7dc', '#3c5148'], ['#e9ddd2', '#7a4a2b'], ['#d9e2ea', '#2f4a63'],
  ['#ece3d3', '#8a6a1f'], ['#e3dbe8', '#5b4468'], ['#d8e7e4', '#2e5f57'],
  ['#f0dede', '#7c3a3a'], ['#e0e4d2', '#586436'],
]

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

for (const [i, u] of SEED_USERS.entries()) {
  if (!u.avatar) continue
  const initials = `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase()
  const [bg, fg] = PALETTE[i % PALETTE.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <rect width="512" height="512" fill="${bg}"/>
    <circle cx="416" cy="96" r="150" fill="${fg}" opacity="0.08"/>
    <circle cx="80" cy="440" r="120" fill="${fg}" opacity="0.06"/>
    <text x="256" y="256" text-anchor="middle" dominant-baseline="central"
      font-family="Helvetica, Arial, sans-serif" font-size="200" font-weight="600"
      fill="${fg}" letter-spacing="6">${esc(initials)}</text>
  </svg>`
  const file = path.join(OUT, u.avatar)
  await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(file)
  console.log(`avatar + ${u.avatar} (${initials})`)
}
console.log('Done.')
