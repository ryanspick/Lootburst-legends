export interface RiftTier {
  level: number
  label: string
  name: string
  enemyMult: number    // multiplied onto run difficulty
  rewardMult: number   // super-linear: roughly enemyMult^2.5
  color: string
  unlockAfterRifts: number
  mystery?: boolean
  teaser?: string
}

export const MAX_PLAYABLE_RIFT_TIER = 5

export const RIFT_TIERS: readonly RiftTier[] = [
  { level: 1, label: 'I',   name: 'NORMAL',   enemyMult: 1.0, rewardMult:  1.0, color: '#44aaff', unlockAfterRifts:  0 },
  { level: 2, label: 'II',  name: 'HARD',     enemyMult: 1.4, rewardMult:  3.2, color: '#44dd88', unlockAfterRifts:  4 },
  { level: 3, label: 'III', name: 'BRUTAL',   enemyMult: 2.2, rewardMult:  9.0, color: '#ffaa00', unlockAfterRifts: 14 },
  { level: 4, label: 'IV',  name: 'INFERNAL', enemyMult: 3.4, rewardMult: 27.0, color: '#ff5544', unlockAfterRifts: 35 },
  { level: 5, label: 'V',   name: 'VOID',     enemyMult: 5.2, rewardMult: 78.0, color: '#cc44ff', unlockAfterRifts: 75 },
  {
    level: 6,
    label: '???',
    name: 'UNKNOWN',
    enemyMult: 0,
    rewardMult: 0,
    color: '#88f7ff',
    unlockAfterRifts: Number.POSITIVE_INFINITY,
    mystery: true,
    teaser: 'Signal locked beyond Rift V',
  },
]

export function getRiftTier(level: number): RiftTier {
  return RIFT_TIERS[Math.max(1, Math.min(MAX_PLAYABLE_RIFT_TIER, level)) - 1]
}

export function getPlayableRiftTiers(): RiftTier[] {
  return RIFT_TIERS.filter(t => !t.mystery)
}

export function getVisibleRiftTiers(): RiftTier[] {
  return [...RIFT_TIERS]
}

export function getUnlockedTiers(totalRifts: number): RiftTier[] {
  return getPlayableRiftTiers().filter(t => t.unlockAfterRifts <= totalRifts)
}
