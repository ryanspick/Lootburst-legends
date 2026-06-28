export interface RiftTier {
  level: number
  label: string
  name: string
  enemyMult: number    // multiplied onto run difficulty
  rewardMult: number   // super-linear: roughly enemyMult^2.5
  color: string
  unlockAfterRifts: number
}

export const RIFT_TIERS: readonly RiftTier[] = [
  { level: 1, label: 'I',   name: 'NORMAL',   enemyMult: 1.0, rewardMult:   1, color: '#44aaff', unlockAfterRifts:   0 },
  { level: 2, label: 'II',  name: 'HARD',     enemyMult: 1.6, rewardMult:   5, color: '#44dd88', unlockAfterRifts:  15 },
  { level: 3, label: 'III', name: 'BRUTAL',   enemyMult: 2.8, rewardMult:  18, color: '#ffaa00', unlockAfterRifts:  40 },
  { level: 4, label: 'IV',  name: 'INFERNAL', enemyMult: 4.5, rewardMult:  55, color: '#ff5544', unlockAfterRifts:  80 },
  { level: 5, label: 'V',   name: 'VOID',     enemyMult: 7.0, rewardMult: 150, color: '#cc44ff', unlockAfterRifts: 175 },
]

export function getRiftTier(level: number): RiftTier {
  return RIFT_TIERS[Math.max(1, Math.min(5, level)) - 1]
}

export function getUnlockedTiers(totalRifts: number): RiftTier[] {
  return RIFT_TIERS.filter(t => t.unlockAfterRifts <= totalRifts)
}
