import { RARITY_COLOURS, type Rarity } from './palette'
export type { Rarity } from './palette'

export type BeamType = 'none' | 'white_pop' | 'green_beam' | 'blue_beam' | 'purple_spiral' | 'gold_beam' | 'rainbow_beam'
export type ShakePreset = 'none' | 'small' | 'medium' | 'heavy' | 'mythic'
export type RevealMode = 'inline_loot' | 'reward_card' | 'capsule_reveal' | 'boss_chest' | 'fullscreen_mythic'

export interface RarityConfig {
  rarity: Rarity
  primary: string
  secondary: string
  glow: string
  beamType: BeamType
  shakePreset: ShakePreset
  hitstopMs: number
  particleCount: number
  revealDurationMs: number
  slowMotionFactor: number
  screenDarken: boolean
  soundEvent: string
  hapticEvent: 'light' | 'medium' | 'heavy' | 'double'
  borderAnimation: 'none' | 'pulse' | 'spin' | 'shimmer' | 'rainbow'
}

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common: {
    rarity: 'common',
    ...RARITY_COLOURS.common,
    beamType: 'white_pop',
    shakePreset: 'none',
    hitstopMs: 25,
    particleCount: 20,
    revealDurationMs: 600,
    slowMotionFactor: 1,
    screenDarken: false,
    soundEvent: 'rarity_common_pop',
    hapticEvent: 'light',
    borderAnimation: 'none',
  },
  uncommon: {
    rarity: 'uncommon',
    ...RARITY_COLOURS.uncommon,
    beamType: 'green_beam',
    shakePreset: 'none',
    hitstopMs: 25,
    particleCount: 40,
    revealDurationMs: 800,
    slowMotionFactor: 1,
    screenDarken: false,
    soundEvent: 'rarity_uncommon_pop',
    hapticEvent: 'light',
    borderAnimation: 'pulse',
  },
  rare: {
    rarity: 'rare',
    ...RARITY_COLOURS.rare,
    beamType: 'blue_beam',
    shakePreset: 'small',
    hitstopMs: 65,
    particleCount: 80,
    revealDurationMs: 1200,
    slowMotionFactor: 1,
    screenDarken: false,
    soundEvent: 'rarity_rare_bell',
    hapticEvent: 'medium',
    borderAnimation: 'shimmer',
  },
  epic: {
    rarity: 'epic',
    ...RARITY_COLOURS.epic,
    beamType: 'purple_spiral',
    shakePreset: 'medium',
    hitstopMs: 65,
    particleCount: 150,
    revealDurationMs: 1800,
    slowMotionFactor: 1,
    screenDarken: false,
    soundEvent: 'rarity_epic_bass',
    hapticEvent: 'medium',
    borderAnimation: 'spin',
  },
  legendary: {
    rarity: 'legendary',
    ...RARITY_COLOURS.legendary,
    beamType: 'gold_beam',
    shakePreset: 'heavy',
    hitstopMs: 350,
    particleCount: 300,
    revealDurationMs: 3000,
    slowMotionFactor: 0.25,
    screenDarken: false,
    soundEvent: 'rarity_legendary_choir',
    hapticEvent: 'heavy',
    borderAnimation: 'shimmer',
  },
  mythic: {
    rarity: 'mythic',
    ...RARITY_COLOURS.mythic,
    beamType: 'rainbow_beam',
    shakePreset: 'mythic',
    hitstopMs: 700,
    particleCount: 700,
    revealDurationMs: 5000,
    slowMotionFactor: 0,
    screenDarken: true,
    soundEvent: 'rarity_mythic_impact',
    hapticEvent: 'double',
    borderAnimation: 'rainbow',
  },
}

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']

export function rarityIndex(r: Rarity): number {
  return RARITY_ORDER.indexOf(r)
}

export function highestRarity(rarities: Rarity[]): Rarity {
  return rarities.reduce((best, r) => rarityIndex(r) > rarityIndex(best) ? r : best, 'common')
}
