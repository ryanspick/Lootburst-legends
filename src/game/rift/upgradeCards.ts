import type { UpgradeCard, RiftRunState } from './riftTypes'

export const UPGRADE_CARDS: UpgradeCard[] = [

  // ── UNCOMMON ────────────────────────────────────────────────────────────────

  {
    id: 'gold_fever',
    title: 'Gold Fever',
    description: 'Enemies hemorrhage gold. +60% drop value.',
    icon: '💰',
    rarity: 'uncommon',
    apply: (s: RiftRunState) => { s.goldMult *= 1.6 },
  },
  {
    id: 'jawbreaker_rush',
    title: 'Jawbreaker Rush',
    description: 'Sugar-crash overclock. Squad attacks 40% faster.',
    icon: '🍬',
    rarity: 'uncommon',
    apply: (s: RiftRunState) => { s.spdMult *= 1.4 },
  },
  {
    id: 'candy_shield',
    title: 'Candy Shell',
    description: 'Crystallized sugar armor. Squad takes 45% less damage.',
    icon: '🛡️',
    rarity: 'uncommon',
    apply: (s: RiftRunState) => { s.defMult *= 1.45 },
  },
  {
    id: 'sweet_dreams',
    title: 'Sweet Dreams',
    description: 'Every hit drains candy-energy from enemies. +12% lifesteal.',
    icon: '💉',
    rarity: 'uncommon',
    apply: (s: RiftRunState) => { s.lifeSteal = Math.min(0.5, s.lifeSteal + 0.12) },
  },
  {
    id: 'loot_magnet',
    title: 'Loot Magnet',
    description: 'Gold can\'t resist the squad. It literally sprints over. +30% gold.',
    icon: '🧲',
    rarity: 'uncommon',
    apply: (s: RiftRunState) => { s.goldMult *= 1.3 },
  },
  {
    id: 'slime_splitter',
    title: 'Slime Splitter',
    description: 'On kill: the corpse detonates in a gooey AoE. +25% AoE chance.',
    icon: '💥',
    rarity: 'uncommon',
    apply: (s: RiftRunState) => { s.aoeChance = Math.min(1, s.aoeChance + 0.25) },
  },
  {
    id: 'sugar_strike',
    title: 'Sugar Strike',
    description: 'Pure attack candy. Squad deals 30% more damage.',
    icon: '⚡',
    rarity: 'uncommon',
    apply: (s: RiftRunState) => { s.atkMult *= 1.3 },
  },

  // ── RARE ────────────────────────────────────────────────────────────────────

  {
    id: 'blade_orbit',
    title: 'Blade Orbit',
    description: 'Enchanted blades ring the squad, slashing anything nearby. +35% AoE.',
    icon: '⚔️',
    rarity: 'rare',
    apply: (s: RiftRunState) => { s.aoeChance = Math.min(1, s.aoeChance + 0.35) },
  },
  {
    id: 'crit_confetti',
    title: 'Crit Confetti',
    description: 'Crits explode in rainbow confetti and deal obscene damage. +25% crit / ×1.75 crit dmg.',
    icon: '🎊',
    rarity: 'rare',
    apply: (s: RiftRunState) => {
      s.critChance = Math.min(0.8, s.critChance + 0.25)
      s.critMult += 0.75
    },
  },
  {
    id: 'boss_biter',
    title: 'Boss Biter',
    description: 'Squad gets unreasonably angry at bosses. +45% attack damage.',
    icon: '😤',
    rarity: 'rare',
    apply: (s: RiftRunState) => { s.atkMult *= 1.45 },
  },
  {
    id: 'void_echo',
    title: 'Void Echo',
    description: 'Every 5th strike fires a shadow clone hit. +40% effective damage.',
    icon: '👻',
    rarity: 'rare',
    apply: (s: RiftRunState) => { s.atkMult *= 1.4 },
  },
  {
    id: 'tiny_meteor',
    title: 'Tiny Meteor',
    description: 'Miniature space rocks fall constantly. Surprisingly lethal. +35% ATK.',
    icon: '☄️',
    rarity: 'rare',
    apply: (s: RiftRunState) => { s.atkMult *= 1.35 },
  },
  {
    id: 'emergency_bubble',
    title: 'Emergency Bubble',
    description: 'Giant soap bubble wraps the squad. Enemies bounce off. +55% DEF.',
    icon: '🫧',
    rarity: 'rare',
    apply: (s: RiftRunState) => { s.defMult *= 1.55 },
  },
  {
    id: 'chest_magnet',
    title: 'Chest Magnet',
    description: 'Loot chests fly open and fling gold at the squad. +50% gold.',
    icon: '📦',
    rarity: 'rare',
    apply: (s: RiftRunState) => { s.goldMult *= 1.5 },
  },
  {
    id: 'ultimate_battery',
    title: 'Ultimate Battery',
    description: 'Charges ultimate meters faster. Squad hits harder, smarter. +25% ATK / SPD.',
    icon: '🔋',
    rarity: 'rare',
    apply: (s: RiftRunState) => { s.atkMult *= 1.25; s.spdMult *= 1.25 },
  },
  {
    id: 'glass_cannon',
    title: 'Glass Cannon',
    description: 'Reckless offense. +70% ATK. −15% DEF. No regrets.',
    icon: '💣',
    rarity: 'rare',
    apply: (s: RiftRunState) => { s.atkMult *= 1.7; s.defMult *= 0.85 },
  },

  // ── EPIC ────────────────────────────────────────────────────────────────────

  {
    id: 'lifesteal_bite',
    title: 'Life Drain',
    description: 'Vampiric strikes. Squad heals 20% of all damage dealt.',
    icon: '🩸',
    rarity: 'epic',
    apply: (s: RiftRunState) => { s.lifeSteal = Math.min(0.5, s.lifeSteal + 0.20) },
  },
  {
    id: 'candy_cyclone',
    title: 'Candy Cyclone',
    description: 'A vortex of shredding candy shards. +40% AoE, +20% ATK.',
    icon: '🌀',
    rarity: 'epic',
    apply: (s: RiftRunState) => {
      s.aoeChance = Math.min(1, s.aoeChance + 0.40)
      s.atkMult *= 1.20
    },
  },
  {
    id: 'double_loot',
    title: 'Double Loot',
    description: 'Economy collapses in the squad\'s favor. Every enemy drops double gold.',
    icon: '✌️',
    rarity: 'epic',
    apply: (s: RiftRunState) => { s.goldMult *= 2.0 },
  },
  {
    id: 'berserker_jam',
    title: 'Berserker Jam',
    description: 'The lower the HP, the harder the hit. +50% ATK / +30% SPD.',
    icon: '🔥',
    rarity: 'epic',
    apply: (s: RiftRunState) => { s.atkMult *= 1.5; s.spdMult *= 1.3 },
  },
  {
    id: 'crit_storm',
    title: 'Crit Storm',
    description: 'Crits trigger crits. +35% crit chance / ×2.0 crit damage.',
    icon: '⚡',
    rarity: 'epic',
    apply: (s: RiftRunState) => {
      s.critChance = Math.min(0.8, s.critChance + 0.35)
      s.critMult += 1.0
    },
  },

  // ── LEGENDARY ───────────────────────────────────────────────────────────────

  {
    id: 'prismatic_core',
    title: 'Prismatic Core',
    description: 'All elements in harmony. Every stat +20%. Hits cycle through rainbow damage.',
    icon: '🌈',
    rarity: 'legendary',
    apply: (s: RiftRunState) => {
      s.atkMult *= 1.20
      s.defMult *= 1.20
      s.spdMult *= 1.20
      s.critChance = Math.min(0.8, s.critChance + 0.15)
      s.critMult += 0.5
      s.goldMult *= 1.20
    },
  },
  {
    id: 'rainbow_overload',
    title: 'Rainbow Overload',
    description: 'SYSTEM OVERLOAD. Everything is on fire. Everything is candy. +35% ATK / CRIT / AoE.',
    icon: '🌟',
    rarity: 'legendary',
    apply: (s: RiftRunState) => {
      s.atkMult *= 1.35
      s.critChance = Math.min(0.8, s.critChance + 0.20)
      s.critMult += 0.75
      s.aoeChance = Math.min(1, s.aoeChance + 0.35)
    },
  },
  {
    id: 'sugar_rush_omega',
    title: 'Sugar Rush Ω',
    description: 'Unreasonable candy in the bloodstream. Physics optional. +50% SPD / +30% ATK / +25% crit.',
    icon: '💎',
    rarity: 'legendary',
    apply: (s: RiftRunState) => {
      s.spdMult *= 1.5
      s.atkMult *= 1.3
      s.critChance = Math.min(0.8, s.critChance + 0.25)
      s.critMult += 0.5
    },
  },
]

// Rarity weights: uncommon=8, rare=4, epic=2, legendary=1
const RARITY_WEIGHT: Record<string, number> = {
  uncommon: 8,
  rare: 4,
  epic: 2,
  legendary: 1,
}

export function rollUpgradeCards(count = 3, excludeIds: string[] = []): UpgradeCard[] {
  const pool = UPGRADE_CARDS.filter(c => !excludeIds.includes(c.id))

  // Weighted shuffle
  const weighted = pool.flatMap(c =>
    Array(RARITY_WEIGHT[c.rarity] ?? 1).fill(c) as UpgradeCard[]
  )
  const seen = new Set<string>()
  const result: UpgradeCard[] = []
  const shuffled = [...weighted].sort(() => Math.random() - 0.5)

  for (const card of shuffled) {
    if (!seen.has(card.id)) {
      seen.add(card.id)
      result.push(card)
      if (result.length === count) break
    }
  }

  return result
}
