export interface Vec2 { x: number; y: number }

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  life: number      // remaining ms
  maxLife: number
  gravity: number
  shrink: number    // size multiplier per second
  twinkle: boolean
}

export interface EmitterOptions {
  count?: number
  speedMin?: number
  speedMax?: number
  sizeMin?: number
  sizeMax?: number
  lifeMin?: number
  lifeMax?: number
  gravity?: number
  colors?: string[]
  spread?: number          // angle spread in radians (default: full circle = Math.PI * 2)
  direction?: number       // base angle in radians (default: up = -Math.PI / 2)
  shrinkRate?: number      // 0–1 size reduction per second
  twinkle?: boolean
}

export type EmitterName =
  | 'hitSpark'
  | 'coinBurst'
  | 'gemScatter'
  | 'explosion'
  | 'poisonBubbles'
  | 'freezeCrack'
  | 'shieldBoing'
  | 'goldBeam'
  | 'rainbowMythicBurst'
  | 'chestVolcano'
  | 'capsuleCrack'
  | 'upgradeCardSparkle'
  | 'slashArc'
  | 'projectileTrail'
  | 'critPop'

export interface RarityBeamOptions {
  position: Vec2
  durationMs?: number
  onComplete?: () => void
}

export interface RarityRevealOptions {
  rarity: string
  position: Vec2
  rewardType: 'hero' | 'gear' | 'pet' | 'mount' | 'generic'
  rewardName: string
  iconAssetId?: string
  mode: 'inline_loot' | 'reward_card' | 'capsule_reveal' | 'boss_chest' | 'fullscreen_mythic'
  onComplete?: () => void
}
