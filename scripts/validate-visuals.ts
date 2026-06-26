#!/usr/bin/env tsx
/**
 * Visual asset validator — runs at CI or pre-commit.
 * Checks every entity in the visual JSON files has:
 *   - required fields (id, displayName, rarity, palette)
 *   - valid rarity value
 *   - sprite file OR placeholder in public/assets/
 * Prints a summary table and exits 1 if errors found.
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..')
const PUBLIC = join(ROOT, 'public/assets/pixel')

const VALID_RARITIES = new Set(['common','uncommon','rare','epic','legendary','mythic'])
const VALID_ELEMENTS = new Set(['fire','ice','void','poison','earth','arcane','machine','nature','light','dark'])

interface Report {
  entity: string
  group: string
  issues: string[]
}

const reports: Report[] = []
let totalChecked = 0

function check(group: string, entities: unknown[]) {
  for (const raw of entities) {
    const e = raw as Record<string, unknown>
    totalChecked++
    const issues: string[] = []

    if (!e.id || typeof e.id !== 'string') issues.push('missing id')
    if (!e.displayName || typeof e.displayName !== 'string') issues.push('missing displayName')
    if (!e.rarity || !VALID_RARITIES.has(e.rarity as string)) issues.push(`invalid rarity: ${e.rarity}`)
    if (!Array.isArray(e.palette) || (e.palette as unknown[]).length === 0) issues.push('missing palette')
    if (e.element && !VALID_ELEMENTS.has(e.element as string)) issues.push(`unknown element: ${e.element}`)

    // Check sprite file exists (optional — just warn, not error)
    if (e.id) {
      const expectedPng = join(PUBLIC, 'generated', `${e.id}.png`)
      const hasSprite = existsSync(expectedPng)
      if (!hasSprite) issues.push(`[warn] no sprite at pixel/generated/${e.id}.png`)
    }

    if (issues.length > 0) {
      reports.push({ entity: String(e.id ?? '???'), group, issues })
    }
  }
}

function load(relPath: string): unknown {
  try {
    return JSON.parse(readFileSync(join(ROOT, relPath), 'utf8'))
  } catch {
    console.error(`❌  Cannot read ${relPath}`)
    process.exit(1)
  }
}

// ─── Load and check all visual JSONs ─────────────────────────────────────────

const heroes  = (load('src/data/art/heroes.visual.json') as { heroes: unknown[]  }).heroes
const enemies = (load('src/data/art/enemies.visual.json') as { enemies: unknown[] }).enemies
const bosses  = (load('src/data/art/bosses.visual.json') as { bosses: unknown[]  }).bosses
const gear    = (load('src/data/art/gear.visual.json') as { gear: unknown[]      }).gear
const pets    = (load('src/data/art/pets.visual.json') as { pets: unknown[]      }).pets
const mounts  = (load('src/data/art/mounts.visual.json') as { mounts: unknown[] }).mounts

check('Heroes',  heroes)
check('Enemies', enemies)
check('Bosses',  bosses)
check('Gear',    gear)
check('Pets',    pets)
check('Mounts',  mounts)

// ─── Print report ─────────────────────────────────────────────────────────────

const errors   = reports.filter(r => r.issues.some(i => !i.startsWith('[warn]')))
const warnings = reports.filter(r => r.issues.every(i => i.startsWith('[warn]')))

console.log(`\n📋  Visual asset validation — ${totalChecked} entities checked\n`)

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅  All entities valid.\n')
  process.exit(0)
}

for (const r of errors) {
  console.log(`❌  [${r.group}] ${r.entity}`)
  r.issues.filter(i => !i.startsWith('[warn]')).forEach(i => console.log(`    • ${i}`))
}

for (const r of warnings) {
  console.log(`⚠️   [${r.group}] ${r.entity}`)
  r.issues.forEach(i => console.log(`    • ${i}`))
}

console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)\n`)

if (errors.length > 0) process.exit(1)
