import type { Rarity } from '@/constants/palette'

export type CosmeticType = 'trail' | 'frame' | 'capsule'

export interface CosmeticDef {
  id: string
  displayName: string
  description: string
  type: CosmeticType
  rarity: Rarity
  icon: string
  trailColor?: string
  free?: boolean
}

export const COSMETICS: CosmeticDef[] = [
  // ── TRAILS ──────────────────────────────────────────────────────────────
  {
    id: 'trail_default',
    displayName: 'Classic Sparkle',
    description: 'A timeless trail of golden sparks.',
    type: 'trail', rarity: 'common', icon: '⭐',
    trailColor: '#ffd700', free: true,
  },
  {
    id: 'trail_frost',
    displayName: 'Frost Trail',
    description: 'Icy crystals mark every step.',
    type: 'trail', rarity: 'uncommon', icon: '❄️',
    trailColor: '#88eeff', free: true,
  },
  {
    id: 'trail_ember',
    displayName: 'Ember Drift',
    description: 'Smoldering embers drift in your wake.',
    type: 'trail', rarity: 'uncommon', icon: '🔥',
    trailColor: '#ff6644',
  },
  {
    id: 'trail_void',
    displayName: 'Void Step',
    description: 'Dark energy curls through the air.',
    type: 'trail', rarity: 'rare', icon: '🌌',
    trailColor: '#cc44ff',
  },
  {
    id: 'trail_rainbow',
    displayName: 'Rainbow Rush',
    description: 'Pure chromatic chaos. Very anime.',
    type: 'trail', rarity: 'epic', icon: '🌈',
    trailColor: '#ff44ff',
  },
  {
    id: 'trail_cosmic',
    displayName: 'Cosmic Stardust',
    description: 'Leave a trail of actual stardust. Physics unclear.',
    type: 'trail', rarity: 'legendary', icon: '✨',
    trailColor: '#ffffff',
  },

  // ── FRAMES ──────────────────────────────────────────────────────────────
  {
    id: 'frame_default',
    displayName: 'Pixel Frame',
    description: 'The classic hero border.',
    type: 'frame', rarity: 'common', icon: '🎮',
    free: true,
  },
  {
    id: 'frame_silver',
    displayName: 'Silver Filigree',
    description: 'Elegant silver detailing.',
    type: 'frame', rarity: 'uncommon', icon: '🥈',
    free: true,
  },
  {
    id: 'frame_gold',
    displayName: 'Gold Filigree',
    description: 'A luxurious golden border.',
    type: 'frame', rarity: 'rare', icon: '🥇',
  },
  {
    id: 'frame_neon',
    displayName: 'Neon Pulse',
    description: 'Electric glow that beats like a heart.',
    type: 'frame', rarity: 'epic', icon: '💫',
  },
  {
    id: 'frame_mythic',
    displayName: 'Mythic Crown',
    description: 'A rainbow border only the strongest earn.',
    type: 'frame', rarity: 'legendary', icon: '👑',
  },

  // ── CAPSULE SKINS ────────────────────────────────────────────────────────
  {
    id: 'capsule_classic',
    displayName: 'Classic Capsule',
    description: 'The original candy-coated capsule.',
    type: 'capsule', rarity: 'common', icon: '💊',
    free: true,
  },
  {
    id: 'capsule_crystal',
    displayName: 'Crystal Capsule',
    description: 'Prismatic crystal that refracts light.',
    type: 'capsule', rarity: 'uncommon', icon: '💎',
  },
  {
    id: 'capsule_dark',
    displayName: 'Shadow Capsule',
    description: 'Ominous. Contains the same heroes.',
    type: 'capsule', rarity: 'rare', icon: '🌑',
  },
  {
    id: 'capsule_divine',
    displayName: 'Divine Capsule',
    description: 'Rumored to improve pull rates. (It does not.)',
    type: 'capsule', rarity: 'legendary', icon: '🌟',
  },
]

export const FREE_COSMETIC_IDS = COSMETICS.filter(c => c.free).map(c => c.id)

export function getCosmeticById(id: string): CosmeticDef | undefined {
  return COSMETICS.find(c => c.id === id)
}
