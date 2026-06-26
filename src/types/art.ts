import type { Rarity } from '@/constants/palette'

export interface AnimationClipDefinition {
  id: string
  assetId: string
  file: string
  frameWidth: number
  frameHeight: number
  frameCount: number
  fps: number
  loop: boolean
  pingPong?: boolean
  anchorX?: number
  anchorY?: number
  scale?: number
  eventFrames?: Record<number, string>
  nextClip?: string
}

export interface ParticleField {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  ax: number
  ay: number
  rotation: number
  rotationSpeed: number
  ageMs: number
  lifetimeMs: number
  startScale: number
  endScale: number
  startAlpha: number
  endAlpha: number
  color: string
  colors?: string[]
  spriteId?: string
  shape: 'circle' | 'square' | 'star' | 'diamond' | 'pixel'
  gravity: number
  blendMode: 'normal' | 'add' | 'screen'
  zIndex: number
}

export interface RarityRevealOptions {
  rarity: Rarity
  position: { x: number; y: number }
  rewardType: 'hero' | 'gear' | 'pet' | 'mount' | 'cosmetic' | 'currency'
  rewardName: string
  iconAssetId: string
  mode: 'inline_loot' | 'reward_card' | 'capsule_reveal' | 'boss_chest' | 'fullscreen_mythic'
  onComplete?: () => void
}

export interface AssetEntry {
  id: string
  file: string
  rarity?: Rarity
  type: 'hero' | 'enemy' | 'boss' | 'gear' | 'pet' | 'mount' | 'vfx' | 'ui' | 'background'
  clips?: AnimationClipDefinition[]
  iconFile?: string
  placeholderFile?: string
}

export interface VisualMetadata {
  id: string
  displayName: string
  rarity: Rarity
  element?: string
  role?: string
  tags?: string[]
  silhouetteNotes?: string
  palette?: string[]
  spritePrompt?: string
  animationProfile?: string
  vfxProfile?: string
  soundProfile?: string
  rewardProfile?: string
}
