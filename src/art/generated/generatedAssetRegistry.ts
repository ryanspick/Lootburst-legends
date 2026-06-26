import heroesData from '@/data/art/heroes.visual.json'
import bossesData from '@/data/art/bosses.visual.json'
import enemiesData from '@/data/art/enemies.visual.json'
import gearData from '@/data/art/gear.visual.json'
import petsData from '@/data/art/pets.visual.json'
import type { Rarity } from '@/constants/palette'
import {
  generateHeroSprite,
  generateEnemySprite,
  generateBossSprite,
  generateGearIcon,
  generatePetSprite,
  generateCapsuleSprite,
  generateChestSprite,
} from './generateSprite'

const _cache = new Map<string, string>()

function gen(id: string): string | null {
  // Hero
  const hero = heroesData.heroes.find(h => h.id === id)
  if (hero) {
    return generateHeroSprite({
      id: hero.id,
      rarity: hero.rarity as Rarity,
      element: hero.element,
      role: hero.role,
      tags: hero.tags,
    })
  }

  // Boss
  const boss = bossesData.bosses.find(b => b.id === id)
  if (boss) {
    return generateBossSprite({
      id: boss.id,
      element: boss.element,
      tags: boss.tags,
      spriteSize: boss.spriteSize,
    })
  }

  // Enemy
  const enemy = enemiesData.enemies.find(e => e.id === id)
  if (enemy) {
    return generateEnemySprite({
      id: enemy.id,
      element: enemy.element,
      tags: enemy.tags,
      tier: enemy.tier,
    })
  }

  // Gear
  const gear = gearData.gear.find(g => g.id === id)
  if (gear) {
    return generateGearIcon({
      id: gear.id,
      rarity: gear.rarity as Rarity,
      slot: gear.slot,
      element: gear.tags?.find(t => ['fire','ice','storm','nature','shadow','void','holy','machine','gold'].includes(t)),
    })
  }

  // Pet
  const pet = petsData.pets.find(p => p.id === id)
  if (pet) {
    return generatePetSprite({
      id: pet.id,
      rarity: pet.rarity as Rarity,
      tags: [pet.id],
    })
  }

  // Capsule / chest by convention
  if (id.startsWith('capsule_')) {
    const rarity = id.replace('capsule_', '') as Rarity
    return generateCapsuleSprite(rarity)
  }
  if (id.startsWith('chest_')) {
    const parts = id.split('_')
    const rarity = parts[1] as Rarity
    const state = (parts[2] ?? 'closed') as 'closed' | 'open' | 'cracked'
    return generateChestSprite(rarity, state)
  }

  return null
}

export function getGeneratedSprite(id: string): string | null {
  if (_cache.has(id)) return _cache.get(id)!
  try {
    const url = gen(id)
    if (url) _cache.set(id, url)
    return url
  } catch (e) {
    if (import.meta.env.DEV) console.warn(`[GeneratedAsset] Failed to generate ${id}:`, e)
    return null
  }
}

export function preGenerateAll(): void {
  const ids = [
    ...heroesData.heroes.map(h => h.id),
    ...bossesData.bosses.map(b => b.id),
    ...enemiesData.enemies.map(e => e.id),
    ...gearData.gear.map(g => g.id),
    ...petsData.pets.map(p => p.id),
  ]
  const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']
  rarities.forEach(r => {
    ids.push(`capsule_${r}`)
    ids.push(`chest_${r}_closed`)
  })
  for (const id of ids) {
    if (!_cache.has(id)) getGeneratedSprite(id)
  }
}

export function getGeneratedSpriteSync(id: string): string | null {
  return getGeneratedSprite(id)
}

export function clearGeneratedCache(): void {
  _cache.clear()
}
