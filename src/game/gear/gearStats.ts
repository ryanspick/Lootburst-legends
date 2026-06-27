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
  weapon:  '⚔️ WEAPON',
  trinket: '💫 TRINKET',
  relic:   '🛡️ RELIC',
}

export interface HeroGearBonuses { atk: number; hp: number; def: number }
export interface RunGearBonuses {
  critChanceBonus: number
  critMultBonus: number
  goldMultBonus: number
  spdMultBonus: number
  lifeStealBonus: number
}

export function getGearSlot(gearId: string): GearSlot | null {
  return GEAR_STATS[gearId]?.slot ?? null
}

export function computeHeroGearBonuses(gearIds: string[]): HeroGearBonuses {
  const b = { atk: 0, hp: 0, def: 0 }
  for (const id of gearIds) {
    const s = GEAR_STATS[id]; if (!s) continue
    if (s.atk) b.atk += s.atk
    if (s.hp)  b.hp  += s.hp
    if (s.def) b.def += s.def
  }
  return b
}

export function computeRunGearBonuses(gearIds: string[]): RunGearBonuses {
  const b = { critChanceBonus: 0, critMultBonus: 0, goldMultBonus: 0, spdMultBonus: 0, lifeStealBonus: 0 }
  for (const id of gearIds) {
    const s = GEAR_STATS[id]; if (!s) continue
    if (s.critChanceBonus) b.critChanceBonus += s.critChanceBonus
    if (s.critMultBonus)   b.critMultBonus   += s.critMultBonus
    if (s.goldMultBonus)   b.goldMultBonus   += s.goldMultBonus
    if (s.spdMultBonus)    b.spdMultBonus    += s.spdMultBonus
    if (s.lifeStealBonus)  b.lifeStealBonus  += s.lifeStealBonus
  }
  return b
}

export function computeSquadPower(
  heroIds: string[],
  heroesData: { heroes: Array<{ id: string }> },
  equippedGearIds: string[],
): number {
  let power = 0
  for (let i = 0; i < heroIds.length; i++) {
    const idx = heroesData.heroes.findIndex(h => h.id === heroIds[i])
    if (idx === -1) continue
    const baseHp  = 1000 + idx * 80
    const baseAtk = 105  + idx * 15
    const baseDef = 32
    const gear = computeHeroGearBonuses(equippedGearIds)
    power += Math.round((baseAtk + gear.atk) * 8 + (baseHp + gear.hp) * 0.3 + (baseDef + gear.def) * 4)
  }
  return power
}

export function getGearStatLine(gearId: string): string {
  const s = GEAR_STATS[gearId]
  if (!s) return ''
  const parts: string[] = []
  if (s.atk)              parts.push(`ATK +${s.atk}`)
  if (s.hp)               parts.push(`HP +${s.hp}`)
  if (s.def)              parts.push(`DEF +${s.def}`)
  if (s.critChanceBonus)  parts.push(`CRIT +${Math.round(s.critChanceBonus * 100)}%`)
  if (s.critMultBonus)    parts.push(`×+${s.critMultBonus.toFixed(1)} MULT`)
  if (s.goldMultBonus)    parts.push(`GOLD +${Math.round(s.goldMultBonus * 100)}%`)
  if (s.spdMultBonus)     parts.push(`SPD +${Math.round(s.spdMultBonus * 100)}%`)
  if (s.lifeStealBonus)   parts.push(`LEECH +${Math.round(s.lifeStealBonus * 100)}%`)
  return parts.join(' · ')
}
