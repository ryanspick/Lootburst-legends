import type { UpgradeBuild, UpgradeCard, RiftRunState } from './riftTypes'

function boostMaxHp(s: RiftRunState, pct: number): void {
  for (const hero of s.heroes) {
    const prevMax = hero.maxHp
    hero.maxHp = Math.round(hero.maxHp * (1 + pct))
    if (hero.alive) {
      hero.hp = Math.min(hero.maxHp, Math.round(hero.hp + (hero.maxHp - prevMax)))
    }
  }
}

function improveAoeSplash(s: RiftRunState, amount: number): void {
  s.aoeSplashMult = Math.min(0.72, s.aoeSplashMult + amount)
}

function faster(current: number, factor: number): number {
  return Math.max(0.45, current * factor)
}

function getAppliedBuildCount(s: RiftRunState, build: UpgradeBuild): number {
  return s.appliedUpgrades.filter(id => UPGRADE_CARDS.find(card => card.id === id)?.build === build).length
}

function hasAppliedBuild(s: RiftRunState, build: UpgradeBuild): boolean {
  return getAppliedBuildCount(s, build) > 0
}

export const UPGRADE_CARDS: UpgradeCard[] = [

  // UNCOMMON

  {
    id: 'gold_fever',
    title: 'Gold Fever',
    description: 'Enemies drop +60% gold. Starts the economy build.',
    icon: 'upgrade_gold_fever',
    rarity: 'uncommon',
    build: 'Economy',
    synergy: 'Stacks with loot cards and cash-out runs.',
    apply: s => { s.goldMult *= 1.6 },
  },
  {
    id: 'jawbreaker_rush',
    title: 'Jawbreaker Rush',
    description: 'Squad attacks 40% faster.',
    icon: 'upgrade_jawbreaker_rush',
    rarity: 'uncommon',
    build: 'Barrage',
    synergy: 'Best with basic, crit, and lifesteal picks.',
    apply: s => { s.spdMult *= 1.4 },
  },
  {
    id: 'candy_shield',
    title: 'Candy Shell',
    description: 'Squad takes 45% less damage.',
    icon: 'upgrade_candy_shield',
    rarity: 'uncommon',
    build: 'Guard',
    synergy: 'Pairs with drain builds for long endless pushes.',
    apply: s => { s.defMult *= 1.45 },
  },
  {
    id: 'sweet_dreams',
    title: 'Sweet Dreams',
    description: 'Every hit heals the attacker for +12% damage dealt.',
    icon: 'upgrade_sweet_dreams',
    rarity: 'uncommon',
    build: 'Drain',
    synergy: 'More hits means more healing.',
    apply: s => { s.lifeSteal = Math.min(0.5, s.lifeSteal + 0.12) },
  },
  {
    id: 'loot_magnet',
    title: 'Loot Magnet',
    description: 'Gold sprints toward the squad. +30% gold.',
    icon: 'upgrade_loot_magnet',
    rarity: 'uncommon',
    build: 'Economy',
    synergy: 'Turns fast clear builds into richer runs.',
    apply: s => { s.goldMult *= 1.3 },
  },
  {
    id: 'slime_splitter',
    title: 'Slime Splitter',
    description: 'Hits gain +25% AoE chance.',
    icon: 'upgrade_slime_splitter',
    rarity: 'uncommon',
    build: 'AoE',
    synergy: 'Needs splash damage picks to scale hard.',
    apply: s => { s.aoeChance = Math.min(1, s.aoeChance + 0.25) },
  },
  {
    id: 'sugar_strike',
    title: 'Sugar Strike',
    description: 'Squad deals 30% more damage.',
    icon: 'upgrade_sugar_strike',
    rarity: 'uncommon',
    build: 'Power',
    synergy: 'Simple, flexible, and always useful.',
    apply: s => { s.atkMult *= 1.3 },
  },
  {
    id: 'quick_hands',
    title: 'Quick Hands',
    description: 'Basics hit +25% harder and recharge 15% faster.',
    icon: 'upgrade_quick_hands',
    rarity: 'uncommon',
    build: 'Barrage',
    synergy: 'Excellent with crit and lifesteal.',
    apply: s => {
      s.basicDamageMult *= 1.25
      s.basicCooldownMult = faster(s.basicCooldownMult, 0.85)
    },
  },
  {
    id: 'spark_practice',
    title: 'Spark Practice',
    description: 'Skills hit +20% harder and recharge 10% faster.',
    icon: 'upgrade_spark_practice',
    rarity: 'uncommon',
    build: 'Skill',
    synergy: 'Feeds skill-loop builds.',
    apply: s => {
      s.skillDamageMult *= 1.20
      s.skillCooldownMult = faster(s.skillCooldownMult, 0.90)
    },
  },
  {
    id: 'ult_primer',
    title: 'Ult Primer',
    description: 'Ultimates recharge 18% faster.',
    icon: 'upgrade_ult_primer',
    rarity: 'uncommon',
    build: 'Ultimate',
    synergy: 'Gets ultimate builds online early.',
    apply: s => { s.ultimateCooldownMult = faster(s.ultimateCooldownMult, 0.82) },
  },

  // RARE

  {
    id: 'blade_orbit',
    title: 'Blade Orbit',
    description: 'Enchanted blades ring the squad. +35% AoE chance.',
    icon: 'upgrade_blade_orbit',
    rarity: 'rare',
    build: 'AoE',
    synergy: 'Turns all attack lanes into wave clear.',
    apply: s => { s.aoeChance = Math.min(1, s.aoeChance + 0.35) },
  },
  {
    id: 'crit_confetti',
    title: 'Crit Confetti',
    description: '+25% crit chance and +75% crit damage.',
    icon: 'upgrade_crit_confetti',
    rarity: 'rare',
    build: 'Crit',
    synergy: 'Best with barrage and speed picks.',
    apply: s => {
      s.critChance = Math.min(0.8, s.critChance + 0.25)
      s.critMult += 0.75
    },
  },
  {
    id: 'boss_biter',
    title: 'Boss Biter',
    description: 'Squad gets unreasonably angry. +45% damage.',
    icon: 'upgrade_boss_biter',
    rarity: 'rare',
    build: 'Power',
    synergy: 'Keeps boss timers honest.',
    apply: s => { s.atkMult *= 1.45 },
  },
  {
    id: 'void_echo',
    title: 'Void Echo',
    description: 'Shadow clone strikes add +40% effective damage.',
    icon: 'upgrade_void_echo',
    rarity: 'rare',
    build: 'Barrage',
    synergy: 'Loves speed, basics, and crit.',
    apply: s => { s.atkMult *= 1.4 },
  },
  {
    id: 'tiny_meteor',
    title: 'Tiny Meteor',
    description: 'Mini meteors fall constantly. +35% damage.',
    icon: 'upgrade_tiny_meteor',
    rarity: 'rare',
    build: 'Power',
    synergy: 'A stable bridge into any build.',
    apply: s => { s.atkMult *= 1.35 },
  },
  {
    id: 'emergency_bubble',
    title: 'Emergency Bubble',
    description: 'A giant bubble wraps the squad. +55% defense.',
    icon: 'upgrade_emergency_bubble',
    rarity: 'rare',
    build: 'Guard',
    synergy: 'Buys time for ultimate and economy builds.',
    apply: s => { s.defMult *= 1.55 },
  },
  {
    id: 'chest_magnet',
    title: 'Chest Magnet',
    description: 'Loot chests fling gold at the squad. +50% gold.',
    icon: 'upgrade_chest_magnet',
    rarity: 'rare',
    build: 'Economy',
    synergy: 'Stronger the longer you survive.',
    apply: s => { s.goldMult *= 1.5 },
  },
  {
    id: 'ultimate_battery',
    title: 'Ultimate Battery',
    description: '+25% damage, +25% speed, and ultimates recharge 10% faster.',
    icon: 'upgrade_ultimate_battery',
    rarity: 'rare',
    build: 'Ultimate',
    synergy: 'Smooths the path into ult spam.',
    apply: s => {
      s.atkMult *= 1.25
      s.spdMult *= 1.25
      s.ultimateCooldownMult = faster(s.ultimateCooldownMult, 0.90)
    },
  },
  {
    id: 'glass_cannon',
    title: 'Glass Cannon',
    description: 'Reckless offense. +70% damage, -15% defense.',
    icon: 'upgrade_glass_cannon',
    rarity: 'rare',
    build: 'Power',
    synergy: 'Risky with crit, safer with guard.',
    apply: s => { s.atkMult *= 1.7; s.defMult *= 0.85 },
  },
  {
    id: 'ricochet_lessons',
    title: 'Ricochet Lessons',
    description: 'Basics gain +20% damage and +15% AoE chance.',
    icon: 'upgrade_ricochet_lessons',
    rarity: 'rare',
    build: 'Barrage',
    synergy: 'Lets basic builds clear packs.',
    apply: s => {
      s.basicDamageMult *= 1.20
      s.aoeChance = Math.min(1, s.aoeChance + 0.15)
    },
  },
  {
    id: 'spell_echo',
    title: 'Spell Echo',
    description: 'Skills hit +30% harder and recharge 15% faster.',
    icon: 'upgrade_spell_echo',
    rarity: 'rare',
    build: 'Skill',
    synergy: 'Core skill-loop card.',
    apply: s => {
      s.skillDamageMult *= 1.30
      s.skillCooldownMult = faster(s.skillCooldownMult, 0.85)
    },
  },
  {
    id: 'splash_math',
    title: 'Splash Math',
    description: '+20% AoE chance and stronger splash hits.',
    icon: 'upgrade_splash_math',
    rarity: 'rare',
    build: 'AoE',
    synergy: 'Makes existing AoE picks matter more.',
    apply: s => {
      s.aoeChance = Math.min(1, s.aoeChance + 0.20)
      improveAoeSplash(s, 0.08)
    },
  },
  {
    id: 'rally_ward',
    title: 'Rally Ward',
    description: '+18% max HP and +20% defense.',
    icon: 'upgrade_rally_ward',
    rarity: 'rare',
    build: 'Guard',
    synergy: 'Protects scaling builds through bad waves.',
    apply: s => {
      boostMaxHp(s, 0.18)
      s.defMult *= 1.20
    },
  },
  {
    id: 'crit_compass',
    title: 'Crit Compass',
    description: '+18% crit chance and +15% basic damage.',
    icon: 'upgrade_crit_compass',
    rarity: 'rare',
    build: 'Crit',
    synergy: 'Points barrage builds toward crit.',
    apply: s => {
      s.critChance = Math.min(0.8, s.critChance + 0.18)
      s.basicDamageMult *= 1.15
    },
  },

  // EPIC

  {
    id: 'lifesteal_bite',
    title: 'Life Drain',
    description: 'Squad heals 20% of all damage dealt.',
    icon: 'upgrade_lifesteal_bite',
    rarity: 'epic',
    build: 'Drain',
    synergy: 'Scales with every damage lane.',
    apply: s => { s.lifeSteal = Math.min(0.5, s.lifeSteal + 0.20) },
  },
  {
    id: 'candy_cyclone',
    title: 'Candy Cyclone',
    description: '+40% AoE chance, +20% damage, and stronger splash.',
    icon: 'upgrade_candy_cyclone',
    rarity: 'epic',
    build: 'AoE',
    synergy: 'The classic wave-melter.',
    apply: s => {
      s.aoeChance = Math.min(1, s.aoeChance + 0.40)
      s.atkMult *= 1.20
      improveAoeSplash(s, 0.08)
    },
  },
  {
    id: 'double_loot',
    title: 'Double Loot',
    description: 'Economy collapses in your favor. Gold drops double.',
    icon: 'upgrade_double_loot',
    rarity: 'epic',
    build: 'Economy',
    synergy: 'Cash out huge after endless streaks.',
    apply: s => { s.goldMult *= 2.0 },
  },
  {
    id: 'berserker_jam',
    title: 'Berserker Jam',
    description: '+50% damage and +30% speed.',
    icon: 'upgrade_berserker_jam',
    rarity: 'epic',
    build: 'Barrage',
    synergy: 'Great with drain if things get spicy.',
    apply: s => { s.atkMult *= 1.5; s.spdMult *= 1.3 },
  },
  {
    id: 'crit_storm',
    title: 'Crit Storm',
    description: '+35% crit chance and +100% crit damage.',
    icon: 'upgrade_crit_storm',
    rarity: 'epic',
    build: 'Crit',
    synergy: 'The centerpiece crit card.',
    apply: s => {
      s.critChance = Math.min(0.8, s.critChance + 0.35)
      s.critMult += 1.0
    },
  },
  {
    id: 'skillstorm_engine',
    title: 'Skillstorm Engine',
    description: 'Skills hit +35% harder, recharge 30% faster, and gain +20% AoE.',
    icon: 'upgrade_skillstorm_engine',
    rarity: 'epic',
    build: 'Skill',
    synergy: 'Makes casters and supports feel active.',
    apply: s => {
      s.skillDamageMult *= 1.35
      s.skillCooldownMult = faster(s.skillCooldownMult, 0.70)
      s.aoeChance = Math.min(1, s.aoeChance + 0.20)
    },
  },
  {
    id: 'ultimate_reactor',
    title: 'Ultimate Reactor',
    description: 'Ultimates hit +40% harder and recharge 35% faster.',
    icon: 'upgrade_ultimate_reactor',
    rarity: 'epic',
    build: 'Ultimate',
    synergy: 'The core ultimate-spam payoff.',
    apply: s => {
      s.ultimateDamageMult *= 1.40
      s.ultimateCooldownMult = faster(s.ultimateCooldownMult, 0.65)
    },
  },
  {
    id: 'hemomancer_loop',
    title: 'Hemomancer Loop',
    description: '+18% lifesteal and +20% skill damage.',
    icon: 'upgrade_hemomancer_loop',
    rarity: 'epic',
    build: 'Drain',
    synergy: 'Skill builds become sustain builds.',
    apply: s => {
      s.lifeSteal = Math.min(0.5, s.lifeSteal + 0.18)
      s.skillDamageMult *= 1.20
    },
  },
  {
    id: 'shrapnel_galaxy',
    title: 'Shrapnel Galaxy',
    description: '+35% AoE chance, +10% crit, and much stronger splash.',
    icon: 'upgrade_shrapnel_galaxy',
    rarity: 'epic',
    build: 'AoE',
    synergy: 'Connects AoE and crit builds.',
    apply: s => {
      s.aoeChance = Math.min(1, s.aoeChance + 0.35)
      s.critChance = Math.min(0.8, s.critChance + 0.10)
      improveAoeSplash(s, 0.15)
    },
  },
  {
    id: 'payday_engine',
    title: 'Payday Engine',
    description: '+70% gold and basics recharge 10% faster.',
    icon: 'upgrade_payday_engine',
    rarity: 'epic',
    build: 'Economy',
    synergy: 'Lets economy builds keep fighting pace.',
    apply: s => {
      s.goldMult *= 1.7
      s.basicCooldownMult = faster(s.basicCooldownMult, 0.90)
    },
  },

  // COMBO PAYOFFS

  {
    id: 'crit_barrage_jackpot',
    title: 'Crit Jackpot',
    description: 'Basics hit harder and crits explode. Barrage picks double the payout.',
    icon: 'upgrade_crit_barrage_jackpot',
    rarity: 'epic',
    build: 'Crit',
    combo: ['Barrage'],
    synergy: 'Barrage + Crit: fast hits become jackpot crit chains.',
    apply: s => {
      const ready = hasAppliedBuild(s, 'Barrage')
      s.basicDamageMult *= ready ? 1.55 : 1.25
      s.critChance = Math.min(0.8, s.critChance + (ready ? 0.22 : 0.12))
      s.critMult += ready ? 1.25 : 0.55
      s.spdMult *= ready ? 1.16 : 1.06
    },
  },
  {
    id: 'vampire_cyclone',
    title: 'Vampire Cyclone',
    description: 'Splash hits and healing surge. AoE picks unlock the full drain loop.',
    icon: 'upgrade_vampire_cyclone',
    rarity: 'epic',
    build: 'Drain',
    combo: ['AoE'],
    synergy: 'AoE + Drain: wave clear turns into sustain.',
    apply: s => {
      const ready = hasAppliedBuild(s, 'AoE')
      s.lifeSteal = Math.min(0.5, s.lifeSteal + (ready ? 0.22 : 0.12))
      s.aoeChance = Math.min(1, s.aoeChance + (ready ? 0.28 : 0.14))
      improveAoeSplash(s, ready ? 0.18 : 0.08)
    },
  },
  {
    id: 'arcane_relay',
    title: 'Arcane Relay',
    description: 'Skills and ultimates feed each other. Ultimate picks overclock the loop.',
    icon: 'upgrade_arcane_relay',
    rarity: 'legendary',
    build: 'Skill',
    combo: ['Ultimate'],
    synergy: 'Skill + Ultimate: cooldowns collapse into a caster engine.',
    apply: s => {
      const ready = hasAppliedBuild(s, 'Ultimate')
      s.skillDamageMult *= ready ? 1.55 : 1.30
      s.ultimateDamageMult *= ready ? 1.42 : 1.18
      s.skillCooldownMult = faster(s.skillCooldownMult, ready ? 0.65 : 0.82)
      s.ultimateCooldownMult = faster(s.ultimateCooldownMult, ready ? 0.70 : 0.86)
    },
  },
  {
    id: 'golden_onslaught',
    title: 'Golden Onslaught',
    description: 'Gold turns into damage. Power or Barrage picks make it hit much harder.',
    icon: 'upgrade_golden_onslaught',
    rarity: 'epic',
    build: 'Economy',
    combo: ['Power'],
    synergy: 'Economy + Power: farming no longer costs tempo.',
    apply: s => {
      const ready = hasAppliedBuild(s, 'Power') || hasAppliedBuild(s, 'Barrage')
      s.goldMult *= ready ? 1.85 : 1.45
      s.atkMult *= ready ? 1.35 : 1.15
      if (hasAppliedBuild(s, 'Barrage')) s.basicDamageMult *= 1.20
    },
  },
  {
    id: 'unkillable_compound',
    title: 'Unkillable Compound',
    description: 'Max HP, defense, and healing spike together. Drain picks complete the wall.',
    icon: 'upgrade_unkillable_compound',
    rarity: 'legendary',
    build: 'Guard',
    combo: ['Drain'],
    synergy: 'Guard + Drain: a defensive shell that heals through pressure.',
    apply: s => {
      const ready = hasAppliedBuild(s, 'Drain')
      boostMaxHp(s, ready ? 0.32 : 0.20)
      s.defMult *= ready ? 1.45 : 1.25
      s.lifeSteal = Math.min(0.5, s.lifeSteal + (ready ? 0.18 : 0.08))
    },
  },

  // LEGENDARY

  {
    id: 'prismatic_core',
    title: 'Prismatic Core',
    description: 'Every stat +20%, +15% crit, +50% crit damage, +20% gold.',
    icon: 'upgrade_prismatic_core',
    rarity: 'legendary',
    build: 'Rainbow',
    synergy: 'Keeps any build open.',
    apply: s => {
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
    description: '+35% damage, +20% crit, +75% crit damage, +35% AoE.',
    icon: 'upgrade_rainbow_overload',
    rarity: 'legendary',
    build: 'Rainbow',
    synergy: 'Power, crit, and AoE in one loud package.',
    apply: s => {
      s.atkMult *= 1.35
      s.critChance = Math.min(0.8, s.critChance + 0.20)
      s.critMult += 0.75
      s.aoeChance = Math.min(1, s.aoeChance + 0.35)
    },
  },
  {
    id: 'sugar_rush_omega',
    title: 'Sugar Rush Omega',
    description: '+50% speed, +30% damage, +25% crit, +50% crit damage.',
    icon: 'upgrade_sugar_rush_omega',
    rarity: 'legendary',
    build: 'Barrage',
    synergy: 'The premium fast-hit payoff.',
    apply: s => {
      s.spdMult *= 1.5
      s.atkMult *= 1.3
      s.critChance = Math.min(0.8, s.critChance + 0.25)
      s.critMult += 0.5
    },
  },
  {
    id: 'infinite_combo',
    title: 'Infinite Combo',
    description: 'Basics +35%, skills +25%, and both recharge 20% faster.',
    icon: 'upgrade_infinite_combo',
    rarity: 'legendary',
    build: 'Barrage',
    synergy: 'Turns fast teams into a combo engine.',
    apply: s => {
      s.basicDamageMult *= 1.35
      s.skillDamageMult *= 1.25
      s.basicCooldownMult = faster(s.basicCooldownMult, 0.80)
      s.skillCooldownMult = faster(s.skillCooldownMult, 0.80)
    },
  },
  {
    id: 'singularity_bloom',
    title: 'Singularity Bloom',
    description: 'Ultimates +35%, +30% AoE, and splash damage blooms wider.',
    icon: 'upgrade_singularity_bloom',
    rarity: 'legendary',
    build: 'Ultimate',
    synergy: 'Ultimate builds become wave-clear builds.',
    apply: s => {
      s.ultimateDamageMult *= 1.35
      s.aoeChance = Math.min(1, s.aoeChance + 0.30)
      improveAoeSplash(s, 0.18)
    },
  },
  {
    id: 'immortal_engine',
    title: 'Immortal Engine',
    description: '+25% max HP, +30% defense, +12% lifesteal.',
    icon: 'upgrade_immortal_engine',
    rarity: 'legendary',
    build: 'Guard',
    synergy: 'A defensive anchor for endless mode.',
    apply: s => {
      boostMaxHp(s, 0.25)
      s.defMult *= 1.30
      s.lifeSteal = Math.min(0.5, s.lifeSteal + 0.12)
    },
  },
]

export const UPGRADE_BUILD_ORDER: UpgradeBuild[] = [
  'Barrage',
  'Skill',
  'Ultimate',
  'Crit',
  'AoE',
  'Guard',
  'Drain',
  'Economy',
  'Power',
  'Rainbow',
]

export interface UpgradeBuildSummary {
  total: number
  primaryBuild: UpgradeBuild | null
  counts: Record<UpgradeBuild, number>
  activeBuilds: UpgradeBuild[]
}

function emptyBuildCounts(): Record<UpgradeBuild, number> {
  return UPGRADE_BUILD_ORDER.reduce((counts, build) => {
    counts[build] = 0
    return counts
  }, {} as Record<UpgradeBuild, number>)
}

export function getUpgradeBuildCounts(upgradeIds: string[]): Record<UpgradeBuild, number> {
  const counts = emptyBuildCounts()
  for (const id of upgradeIds) {
    const card = UPGRADE_CARDS.find(c => c.id === id)
    if (card) counts[card.build] += 1
  }
  return counts
}

export function getUpgradeBuildSummary(upgradeIds: string[]): UpgradeBuildSummary {
  const counts = getUpgradeBuildCounts(upgradeIds)
  const activeBuilds = UPGRADE_BUILD_ORDER
    .filter(build => counts[build] > 0)
    .sort((a, b) => counts[b] - counts[a] || UPGRADE_BUILD_ORDER.indexOf(a) - UPGRADE_BUILD_ORDER.indexOf(b))
  const total = UPGRADE_BUILD_ORDER.reduce((sum, build) => sum + counts[build], 0)

  return {
    total,
    primaryBuild: activeBuilds[0] ?? null,
    counts,
    activeBuilds,
  }
}

export function isUpgradeComboReady(card: UpgradeCard, upgradeIds: string[]): boolean {
  if (!card.combo?.length) return false
  const counts = getUpgradeBuildCounts(upgradeIds)
  return card.combo.every(build => counts[build] > 0)
}

const RARITY_WEIGHT: Record<string, number> = {
  uncommon: 8,
  rare: 4,
  epic: 2,
  legendary: 1,
}

export function rollUpgradeCards(count = 4, excludeIds: string[] = []): UpgradeCard[] {
  const pool = UPGRADE_CARDS.filter(c => !excludeIds.includes(c.id))
  if (pool.length <= count) return [...pool]

  const weighted = pool.flatMap(c => {
    const baseWeight = RARITY_WEIGHT[c.rarity] ?? 1
    const payoffBoost = isUpgradeComboReady(c, excludeIds) ? 4 : 1
    return Array(baseWeight * payoffBoost).fill(c) as UpgradeCard[]
  })
  const shuffled = [...weighted].sort(() => Math.random() - 0.5)
  const result: UpgradeCard[] = []
  const seen = new Set<string>()
  const seenBuilds = new Set<UpgradeBuild>()

  const take = (card: UpgradeCard) => {
    seen.add(card.id)
    seenBuilds.add(card.build)
    result.push(card)
  }

  for (const card of shuffled) {
    if (seen.has(card.id) || seenBuilds.has(card.build)) continue
    take(card)
    if (result.length === count) return result
  }

  for (const card of shuffled) {
    if (seen.has(card.id)) continue
    take(card)
    if (result.length === count) return result
  }

  return result
}
