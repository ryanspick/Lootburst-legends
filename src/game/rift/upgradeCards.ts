import type { UpgradeCard, RiftRunState } from './riftTypes'

export const UPGRADE_CARDS: UpgradeCard[] = [
  {
    id: 'blade_orbit',
    title: 'Blade Orbit',
    description: 'Blades circle your squad, dealing AoE damage.',
    icon: '⚔️',
    rarity: 'rare',
    apply: (s: RiftRunState) => { s.aoeChance = Math.min(1, s.aoeChance + 0.3) },
  },
  {
    id: 'gold_fever',
    title: 'Gold Fever',
    description: 'Enemies drop 50% more gold.',
    icon: '💰',
    rarity: 'uncommon',
    apply: (s: RiftRunState) => { s.goldMult *= 1.5 },
  },
  {
    id: 'tiny_meteor',
    title: 'Tiny Meteor',
    description: 'Random meteors crash down every few seconds.',
    icon: '☄️',
    rarity: 'rare',
    apply: (s: RiftRunState) => { s.atkMult *= 1.25 },
  },
  {
    id: 'candy_shield',
    title: 'Candy Shield',
    description: 'Heroes gain a damage-absorbing sugar shell.',
    icon: '🛡️',
    rarity: 'uncommon',
    apply: (s: RiftRunState) => { s.defMult *= 1.4 },
  },
  {
    id: 'lifesteal_bite',
    title: 'Life Drain',
    description: 'Attacks heal the squad for 15% of damage dealt.',
    icon: '🩸',
    rarity: 'epic',
    apply: (s: RiftRunState) => { s.lifeSteal = Math.min(0.5, s.lifeSteal + 0.15) },
  },
  {
    id: 'crit_candy',
    title: 'Crit Candy',
    description: 'Critical hit chance +20%, crit damage +50%.',
    icon: '🍬',
    rarity: 'rare',
    apply: (s: RiftRunState) => { s.critChance = Math.min(0.8, s.critChance + 0.2); s.critMult += 0.5 },
  },
  {
    id: 'speed_mushroom',
    title: 'Speed Mushroom',
    description: 'All heroes attack 30% faster.',
    icon: '🍄',
    rarity: 'uncommon',
    apply: (s: RiftRunState) => { s.spdMult *= 1.3 },
  },
  {
    id: 'void_echo',
    title: 'Void Echo',
    description: 'Every 5th attack fires a second phantom strike.',
    icon: '👻',
    rarity: 'epic',
    apply: (s: RiftRunState) => { s.atkMult *= 1.35 },
  },
  {
    id: 'golden_loot_magnet',
    title: 'Loot Magnet',
    description: 'Loot rushes to squad instantly. Gold +25%.',
    icon: '🧲',
    rarity: 'uncommon',
    apply: (s: RiftRunState) => { s.goldMult *= 1.25 },
  },
  {
    id: 'prismatic_core',
    title: 'Prismatic Core',
    description: 'All stats +15%. Rainbow damage on boss hits.',
    icon: '🌈',
    rarity: 'legendary',
    apply: (s: RiftRunState) => {
      s.atkMult *= 1.15
      s.defMult *= 1.15
      s.spdMult *= 1.15
      s.critChance = Math.min(0.8, s.critChance + 0.1)
    },
  },
]

export function rollUpgradeCards(count = 3, excludeIds: string[] = []): UpgradeCard[] {
  const pool = UPGRADE_CARDS.filter(c => !excludeIds.includes(c.id))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}
