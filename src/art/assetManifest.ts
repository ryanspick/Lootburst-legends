import type { Rarity } from '@/constants/palette'
import type { AssetEntry } from '@/types/art'

import heroesData from '@/data/art/heroes.visual.json'
import bossesData from '@/data/art/bosses.visual.json'
import enemiesData from '@/data/art/enemies.visual.json'
import gearData from '@/data/art/gear.visual.json'
import petsData from '@/data/art/pets.visual.json'

type AssetMap = Map<string, AssetEntry>

function buildHeroEntries(): AssetEntry[] {
  return heroesData.heroes.map(h => ({
    id: h.id,
    file: `/assets/pixel/heroes/${h.rarity}/${h.id}-idle.png`,
    rarity: h.rarity as Rarity,
    type: 'hero',
    iconFile: `/assets/pixel/heroes/${h.rarity}/${h.id}-icon.png`,
    placeholderFile: `/assets/pixel/generated-placeholders/${h.id}.png`,
  }))
}

function buildBossEntries(): AssetEntry[] {
  return bossesData.bosses.map(b => ({
    id: b.id,
    file: `/assets/pixel/bosses/${b.id}-idle.png`,
    type: 'boss',
    iconFile: `/assets/pixel/bosses/${b.id}-icon.png`,
    placeholderFile: `/assets/pixel/generated-placeholders/${b.id}.png`,
  }))
}

function buildEnemyEntries(): AssetEntry[] {
  return enemiesData.enemies.map(e => ({
    id: e.id,
    file: `/assets/pixel/enemies/${e.id}-idle.png`,
    type: 'enemy',
    placeholderFile: `/assets/pixel/generated-placeholders/${e.id}.png`,
  }))
}

function buildGearEntries(): AssetEntry[] {
  return gearData.gear.map(g => ({
    id: g.id,
    file: `/assets/pixel/gear/${g.slot}s/${g.id}.png`,
    rarity: g.rarity as Rarity,
    type: 'gear',
    iconFile: `/assets/pixel/gear/${g.slot}s/${g.id}.png`,
    placeholderFile: `/assets/pixel/generated-placeholders/${g.id}.png`,
  }))
}

function buildPetEntries(): AssetEntry[] {
  return petsData.pets.map(p => ({
    id: p.id,
    file: `/assets/pixel/pets/${p.id}-idle.png`,
    rarity: p.rarity as Rarity,
    type: 'pet',
    placeholderFile: `/assets/pixel/generated-placeholders/${p.id}.png`,
  }))
}

const _manifest: AssetMap = new Map()

function populate() {
  const all: AssetEntry[] = [
    ...buildHeroEntries(),
    ...buildBossEntries(),
    ...buildEnemyEntries(),
    ...buildGearEntries(),
    ...buildPetEntries(),
  ]
  all.forEach(e => _manifest.set(e.id, e))
}

populate()

export function getManifestEntry(id: string): AssetEntry | undefined {
  return _manifest.get(id)
}

export function getAllEntries(): AssetEntry[] {
  return Array.from(_manifest.values())
}

export function getEntriesByType(type: AssetEntry['type']): AssetEntry[] {
  return getAllEntries().filter(e => e.type === type)
}

export function getEntriesByRarity(rarity: Rarity): AssetEntry[] {
  return getAllEntries().filter(e => e.rarity === rarity)
}
