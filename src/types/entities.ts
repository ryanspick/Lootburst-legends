import type { Rarity } from '@/constants/palette'

export type HeroRole = 'tank' | 'healer' | 'ranged' | 'caster' | 'assassin' | 'support'
export type Element = 'fire' | 'ice' | 'poison' | 'holy' | 'shadow' | 'storm' | 'machine' | 'nature' | 'gold' | 'void'

export interface HeroDefinition {
  id: string
  displayName: string
  rarity: Rarity
  role: HeroRole
  element: Element
  stars: number
  maxStars: number
  animationProfile: string
  vfxProfile: string
  soundProfile: string
  tags: string[]
  spritePrompt?: string
  silhouetteNotes?: string
  palette?: string[]
  passiveDescription?: string
  ultimateDescription?: string
}

export interface EnemyDefinition {
  id: string
  displayName: string
  element: Element
  tier: 'normal' | 'elite' | 'boss'
  spriteSize: number
  animationProfile: string
  vfxProfile: string
  tags: string[]
}

export interface BossDefinition {
  id: string
  displayName: string
  element: Element
  spriteSize: 128 | 192
  phases: number
  deathStyle: string
  animationProfile: string
  vfxProfile: string
  entranceStyle: string
  tags: string[]
}

export interface GearDefinition {
  id: string
  displayName: string
  rarity: Rarity
  slot: 'weapon' | 'armor' | 'charm' | 'boots' | 'relic' | 'toy'
  element?: Element
  spritePrompt?: string
  tags: string[]
}

export interface PetDefinition {
  id: string
  displayName: string
  rarity: Rarity
  animationProfile: string
  combatEffect: string
  menuEffect: string
}

export interface MountDefinition {
  id: string
  displayName: string
  rarity: Rarity
  animationProfile: string
  scenes: Array<'hub' | 'profile' | 'run_intro' | 'run_outro'>
}

export interface ZoneDefinition {
  id: string
  displayName: string
  layers: {
    far: string
    mid: string
    near: string
    particles: string
  }
  palette: string[]
  ambientVfx: string[]
}
