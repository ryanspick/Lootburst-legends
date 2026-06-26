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
  { level: 1, label: 'I',   name: 'NORMAL',   enemyMult: 1.0, rewardMult:  1, color: '#44aaff', unlockAfterRifts:  0 },
  { level: 2, label: 'II',  name: 'HARD',     enemyMult: 1.4, rewardMult:  3, color: '#44dd88', unlockAfterRifts:  3 },
  { level: 3, label: 'III', name: 'BRUTAL',   enemyMult: 2.1, rewardMult:  8, color: '#ffaa00', unlockAfterRifts:  8 },
  { level: 4, label: 'IV',  name: 'INFERNAL', enemyMult: 3.2, rewardMult: 22, color: '#ff5544', unlockAfterRifts: 15 },
  { level: 5, label: 'V',   name: 'VOID',     enemyMult: 5.0, rewardMult: 60, color: '#cc44ff', unlockAfterRifts: 25 },
]

export function getRiftTier(level: number): RiftTier {
  return RIFT_TIERS[Math.max(1, Math.min(5, level)) - 1]
}

export function getUnlockedTiers(totalRifts: number): RiftTier[] {
  return RIFT_TIERS.filter(t => t.unlockAfterRifts <= totalRifts)
}
