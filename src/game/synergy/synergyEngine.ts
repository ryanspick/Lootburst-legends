export interface Synergy {
  id: string
  label: string
  description: string
  icon: string
  color: string
  tier: 1 | 2 | 3
  active: boolean
  count: number
  required: number
}

export interface SynergyRule {
  id: string
  label: string
  icon: string
  color: string
  description: (count: number) => string
  tiers: Array<{ required: number; tier: 1 | 2 | 3 }>
  match: (elements: string[], roles: string[]) => number
}

const SYNERGY_RULES: SynergyRule[] = [
  {
    id: 'inferno',
    label: 'Inferno',
    icon: '🔥',
    color: '#ff6644',
    description: (n) => n >= 3
      ? 'Fire attacks leave burning DoT. +40% fire damage.'
      : 'Fire attacks ignite enemies. +20% fire damage.',
    tiers: [{ required: 2, tier: 1 }, { required: 3, tier: 2 }],
    match: (elements) => elements.filter(e => e === 'fire').length,
  },
  {
    id: 'permafrost',
    label: 'Permafrost',
    icon: '❄️',
    color: '#88eeff',
    description: (n) => n >= 3
      ? 'Ice attacks freeze. Frozen enemies take ×2 crit damage.'
      : 'Ice attacks chill. Squad gains +25% DEF.',
    tiers: [{ required: 2, tier: 1 }, { required: 3, tier: 2 }],
    match: (elements) => elements.filter(e => e === 'ice').length,
  },
  {
    id: 'voidpact',
    label: 'Void Pact',
    icon: '🌑',
    color: '#cc44ff',
    description: (n) => n >= 3
      ? 'Shadow attacks drain 25% of damage as HP. Immune to DoT.'
      : 'Shadow attacks drain 12% of damage as HP.',
    tiers: [{ required: 2, tier: 1 }, { required: 3, tier: 2 }],
    match: (elements) => elements.filter(e => e === 'shadow').length,
  },
  {
    id: 'overclock',
    label: 'Overclock',
    icon: '⚙️',
    color: '#00ffcc',
    description: (n) => n >= 3
      ? 'Machine squad attacks 50% faster. Ultimates charge instantly on kill.'
      : 'Machine squad attacks 25% faster.',
    tiers: [{ required: 2, tier: 1 }, { required: 3, tier: 2 }],
    match: (elements) => elements.filter(e => e === 'machine').length,
  },
  {
    id: 'gaia',
    label: 'Gaia',
    icon: '🌿',
    color: '#44ff88',
    description: (n) => n >= 3
      ? 'Nature heals 3% HP per second. +35% AoE on nature skills.'
      : 'Nature heals 1.5% HP per second.',
    tiers: [{ required: 2, tier: 1 }, { required: 3, tier: 2 }],
    match: (elements) => elements.filter(e => e === 'nature').length,
  },
  {
    id: 'thunderstrike',
    label: 'Thunderstrike',
    icon: '⚡',
    color: '#ffee00',
    description: (n) => n >= 3
      ? 'Storm attacks chain to 2 nearby enemies. +30% crit damage.'
      : 'Storm attacks have +15% crit chance.',
    tiers: [{ required: 2, tier: 1 }, { required: 3, tier: 2 }],
    match: (elements) => elements.filter(e => e === 'storm').length,
  },
  {
    id: 'gold_rush',
    label: 'Gold Rush',
    icon: '💰',
    color: '#ffd700',
    description: () => 'Gold squad: +80% gold drops. Kills have 20% chance to drop bonus gems.',
    tiers: [{ required: 2, tier: 2 }],
    match: (elements) => elements.filter(e => e === 'gold').length,
  },
  {
    id: 'fortress',
    label: 'Fortress',
    icon: '🛡',
    color: '#aaaacc',
    description: () => 'Tank + Healer duo: healer output ×1.6. Tank takes 30% less damage.',
    tiers: [{ required: 2, tier: 2 }],
    match: (_, roles) =>
      (roles.includes('tank') ? 1 : 0) + (roles.includes('healer') ? 1 : 0),
  },
  {
    id: 'deathblow',
    label: 'Deathblow',
    icon: '💀',
    color: '#ff2244',
    description: () => 'Assassin + Caster: first hit each fight is always a crit. +25% damage.',
    tiers: [{ required: 2, tier: 2 }],
    match: (_, roles) =>
      (roles.includes('assassin') ? 1 : 0) + (roles.includes('caster') ? 1 : 0),
  },
  {
    id: 'dark_flame',
    label: 'Dark Flame',
    icon: '🔮',
    color: '#ff44aa',
    description: () => 'Fire + Shadow combo: +30% damage. Lifesteal +10%. Enemies burn and bleed.',
    tiers: [{ required: 2, tier: 3 }],
    match: (elements) => {
      const hasFire = elements.includes('fire')
      const hasShadow = elements.includes('shadow')
      return hasFire && hasShadow ? 2 : 0
    },
  },
]

export interface HeroSynergyInput {
  element: string
  role: string
}

export function computeSynergies(heroes: HeroSynergyInput[]): Synergy[] {
  const elements = heroes.map(h => h.element)
  const roles = heroes.map(h => h.role)
  const result: Synergy[] = []

  for (const rule of SYNERGY_RULES) {
    const count = rule.match(elements, roles)
    if (count === 0) continue

    const matchedTier = [...rule.tiers]
      .sort((a, b) => b.required - a.required)
      .find(t => count >= t.required)

    const lowestReq = rule.tiers.reduce((min, t) => Math.min(min, t.required), Infinity)

    result.push({
      id: rule.id,
      label: rule.label,
      icon: rule.icon,
      color: rule.color,
      description: rule.description(count),
      tier: matchedTier?.tier ?? 1,
      active: !!matchedTier,
      count,
      required: lowestReq,
    })
  }

  return result.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1
    return b.tier - a.tier
  })
}
