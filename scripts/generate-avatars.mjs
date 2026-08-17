// One-off asset generation: renders a fixed, curated set of Avataaars SVGs
// to public/avatars/ so the app never needs the dicebear packages at
// runtime — avatars are just static files, matching every other image asset
// in this project. Re-run with `node scripts/generate-avatars.mjs` if the
// palette needs to change; the AVATAR_COUNT here must match lib/avatar.ts.
import { createAvatar } from '@dicebear/core'
import * as avataaars from '@dicebear/avataaars'
import { mkdirSync, writeFileSync } from 'fs'

const AVATAR_COUNT = 30
const outDir = new URL('../public/avatars/', import.meta.url)
mkdirSync(outDir, { recursive: true })

for (let i = 1; i <= AVATAR_COUNT; i++) {
  const id = String(i).padStart(2, '0')
  const svg = createAvatar(avataaars, { seed: `icesco-delegate-${id}`, size: 128 }).toString()
  writeFileSync(new URL(`avatar-${id}.svg`, outDir), svg)
}

console.log(`Generated ${AVATAR_COUNT} avatars in public/avatars/`)
