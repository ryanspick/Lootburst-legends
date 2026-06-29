export type GearSlot = 'weapon' | 'trinket' | 'relic'

export interface GearStatBonus {
  slot: GearSlot
  // Applied to hero entity at run start
  atk?: number
  hp?: number
  def?: number
  // Applied to run-level multipliers (additive, stacked across all heroes)
  critChanceBonus?: number
  critMultBonus?: number
  goldMultBonus?: number
  spdMultBonus?: number
  lifeStealBonus?: number
}

export const GEAR_STATS: Record<string, GearStatBonus> = {
  // ── Weapons ──────────────────────────────────────────────────────────
  'gear_squeaky_doom_hammer': { slot: 'weapon', atk: 35 },
  'gear_crystal_spike':       { slot: 'weapon', atk: 28, critChanceBonus: 0.06 },
  'gear_void_shard':          { slot: 'weapon', atk: 50, critMultBonus: 0.30 },
  'gear_cosmos_fragment':     { slot: 'weapon', atk: 85, critChanceBonus: 0.10, spdMultBonus: 0.08 },

  // ── Trinkets ─────────────────────────────────────────────────────────
  'gear_lucky_frog_coin':     { slot: 'trinket', goldMultBonus: 0.25 },
  'gear_storm_band':          { slot: 'trinket', spdMultBonus: 0.18 },
  'gear_boss_tooth_necklace': { slot: 'trinket', atk: 20, critChanceBonus: 0.08 },
  'gear_chaos_rune':          { slot: 'trinket', critChanceBonus: 0.12, critMultBonus: 0.50 },

  // ── Relics ───────────────────────────────────────────────────────────
  'gear_glitter_boots':       { slot: 'relic', hp: 80,  spdMultBonus: 0.08 },
  'gear_meteor_lunchbox':     { slot: 'relic', hp: 120, def: 8 },
  'gear_bubblegum_shield':    { slot: 'relic', def: 22 },
  'gear_tiny_dragon_plush':   { slot: 'relic', hp: 100, lifeStealBonus: 0.05 },
  'gear_infernal_core':       { slot: 'relic', hp: 200, def: 15 },
  'gear_cursed_party_hat':    { slot: 'relic', hp: 180, critChanceBonus: 0.10 },
}

export const GEAR_SLOT_LABEL: Record<GearSlot, string> = {
  weapon:  'WEAPON',
  trinket: 'TRINKET',
  relic:   'RELIC',
}

export interface HeroGearBonuses { atk: number; hp: number; def: number }
export interface RunGearBonuses {
  critChanceBonus: number
  critMultBonus: number
  goldMultBonus: number
  spdMultBonus: number
  lifeStealBonus: number
}

export interface GearInstanceLike {
  id: string
  stars?: number
  equippedHeroId?: string
}

export const MAX_GEAR_STARS = 5
const GEAR_STAR_STAT_GAIN = 0.18

export function getGearSlot(gearId: string): GearSlot | null {
  return GEAR_STATS[gearId]?.slot ?? null
}

export function normalizeGearStars(stars = 0): number {
  if (!Number.isFinite(stars)) return 0
  return Math.max(0, Math.min(MAX_GEAR_STARS, Math.floor(stars)))
}

export function getGearStarMultiplier(stars = 0): number {
  return 1 + normalizeGearStars(stars) * GEAR_STAR_STAT_GAIN
}

function scaleFlatStat(value: number | undefined, stars?: number): number {
  if (!value) return 0
  return Math.max(1, Math.round(value * getGearStarMultiplier(stars)))
}

function scalePercentStat(value: number | undefined, stars?: number): number {
  if (!value) return 0
  return value * getGearStarMultiplier(stars)
}

export function computeHeroGearBonusesFromGear(gearItems: GearInstanceLike[]): HeroGearBonuses {
  const b = { atk: 0, hp: 0, def: 0 }
  for (const gear of gearItems) {
    const s = GEAR_STATS[gear.id]; if (!s) continue
    b.atk += scaleFlatStat(s.atk, gear.stars)
    b.hp  += scaleFlatStat(s.hp, gear.stars)
    b.def += scaleFlatStat(s.def, gear.stars)
  }
  return b
}

export function computeHeroGearBonuses(gearIds: string[]): HeroGearBonuses {
  return computeHeroGearBonusesFromGear(gearIds.map(id => ({ id })))
}

export function computeRunGearBonusesFromGear(gearItems: GearInstanceLike[]): RunGearBonuses {
  const b = { critChanceBonus: 0, critMultBonus: 0, goldMultBonus: 0, spdMultBonus: 0, lifeStealBonus: 0 }
  for (const gear of gearItems) {
    const s = GEAR_STATS[gear.id]; if (!s) continue
    b.critChanceBonus += scalePercentStat(s.critChanceBonus, gear.stars)
    b.critMultBonus   += scalePercentStat(s.critMultBonus, gear.stars)
    b.goldMultBonus   += scalePercentStat(s.goldMultBonus, gear.stars)
    b.spdMultBonus    += scalePercentStat(s.spdMultBonus, gear.stars)
    b.lifeStealBonus  += scalePercentStat(s.lifeStealBonus, gear.stars)
  }
  return b
}

export function computeRunGearBonuses(gearIds: string[]): RunGearBonuses {
  return computeRunGearBonusesFromGear(gearIds.map(id => ({ id })))
}

export function computeSquadPower(
  heroIds: string[],
  heroesData: { heroes: Array<{ id: string }> },
  equippedGear: Array<string | GearInstanceLike>,
  heroLevels?: number[],
): number {
  const gearItems = equippedGear.map(gear =>
    typeof gear === 'string' ? { id: gear } : gear
  )
  const hasHeroScopedGear = gearItems.some(gear => Boolean(gear.equippedHeroId))
  let power = 0
  for (let i = 0; i < heroIds.length; i++) {
    const idx = heroesData.heroes.findIndex(h => h.id === heroIds[i])
    if (idx === -1) continue
    const baseHp  = 1000 + idx * 80
    const baseAtk = 105  + idx * 15
    const baseDef = 32
    const gear = computeHeroGearBonusesFromGear(
      hasHeroScopedGear ? gearItems.filter(item => item.equippedHeroId === heroIds[i]) : gearItems
    )
    const levelMult = 1 + ((heroLevels?.[i] ?? 1) - 1) * 0.05
    power += Math.round(((baseAtk + gear.atk) * 8 + (baseHp + gear.hp) * 0.3 + (baseDef + gear.def) * 4) * levelMult)
  }
  return power
}

export function getGearPowerScore(gear: GearInstanceLike): number {
  const s = GEAR_STATS[gear.id]
  if (!s) return 0
  const flatScore =
    scaleFlatStat(s.atk, gear.stars) * 8 +
    scaleFlatStat(s.hp, gear.stars) * 0.3 +
    scaleFlatStat(s.def, gear.stars) * 5
  const runScore =
    scalePercentStat(s.critChanceBonus, gear.stars) * 1100 +
    scalePercentStat(s.critMultBonus, gear.stars) * 420 +
    scalePercentStat(s.goldMultBonus, gear.stars) * 180 +
    scalePercentStat(s.spdMultBonus, gear.stars) * 620 +
    scalePercentStat(s.lifeStealBonus, gear.stars) * 900
  return Math.round(flatScore + runScore + normalizeGearStars(gear.stars) * 35)
}

export function getGearStatLine(gearId: string, stars = 0): string {
  const s = GEAR_STATS[gearId]
  if (!s) return ''
  const parts: string[] = []
  if (s.atk)              parts.push(`ATK +${scaleFlatStat(s.atk, stars)}`)
  if (s.hp)               parts.push(`HP +${scaleFlatStat(s.hp, stars)}`)
  if (s.def)              parts.push(`DEF +${scaleFlatStat(s.def, stars)}`)
  if (s.critChanceBonus)  parts.push(`CRIT +${Math.round(scalePercentStat(s.critChanceBonus, stars) * 100)}%`)
  if (s.critMultBonus)    parts.push(`CRIT DMG +${Math.round(scalePercentStat(s.critMultBonus, stars) * 100)}%`)
  if (s.goldMultBonus)    parts.push(`GOLD +${Math.round(scalePercentStat(s.goldMultBonus, stars) * 100)}%`)
  if (s.spdMultBonus)     parts.push(`SPD +${Math.round(scalePercentStat(s.spdMultBonus, stars) * 100)}%`)
  if (s.lifeStealBonus)   parts.push(`LEECH +${Math.round(scalePercentStat(s.lifeStealBonus, stars) * 100)}%`)
  return parts.join(' | ')
}
